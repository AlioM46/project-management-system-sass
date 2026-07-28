<?php

namespace App\Modules\Leads\Services;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditMetadataKey;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use App\Modules\Leads\Exceptions\LeadsException;
use App\Modules\Leads\Model\Lead;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class LeadService
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly LeadAssignmentService $leadAssignmentService,
        private readonly LeadHistoryService $leadHistoryService,
        private readonly AuditLogger $auditLogger,
        private readonly NotificationService $notificationService
    ) {}

    public function currentWorkspace(): Workspace
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        return $workspace;
    }

    public function createLead(Workspace $workspace, array $data, User $actor): Lead
    {
        $course = $this->resolveCourse($workspace, (int) $data['course_id']);
        $stage = array_key_exists('stage_id', $data)
            ? $this->resolveStageForCourse($workspace, $course, (int) $data['stage_id'])
            : $this->resolveDefaultStageForCourse($workspace, $course);
        $assigneeIds = $data['assignee_ids'] ?? [];

        return DB::transaction(function () use ($workspace, $course, $stage, $data, $assigneeIds, $actor): Lead {
            $lead = Lead::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->create([
                    'workspace_id' => $workspace->id,
                    'course_id' => $course->id,
                    'stage_id' => $stage->id,
                    'title' => trim((string) $data['title']),
                    'description' => $this->normalizeNullableString($data['description'] ?? null),
                    'phone' => $this->normalizeNullableString($data['phone'] ?? null),
                    'source' => $this->normalizeSource($data['source'] ?? 'website'),
                    'lost_reason' => $this->normalizeNullableString($data['lost_reason'] ?? null),
                    'created_by_user_id' => $actor->id,
                ]);

            $this->auditLogger->record(
                workspace: $workspace,
                action: AuditAction::LeadCreated,
                targetType: AuditTargetType::Lead,
                targetId: $lead->id,
                actor: $actor,
                newValues: [
                    'course_id' => $course->id,
                    'stage_id' => $stage->id,
                    'title' => $lead->title,
                    'phone' => $lead->phone,
                    'source' => $lead->source,
                ],
                metadata: [
                    AuditMetadataKey::CourseId->value => $course->id,
                    AuditMetadataKey::StageId->value => $stage->id,
                ]
            );

            $this->leadHistoryService->record($lead, 'lead_created', null, ['stage_id' => $stage->id], $actor);

            if ($assigneeIds !== []) {
                $lead = $this->leadAssignmentService->replaceAssignees($lead, $assigneeIds, $actor);
            }

            return $this->loadLeadRelations($lead->fresh());
        });
    }

    public function getLead(Workspace $workspace, int $leadId): Lead
    {
        return $this->resolveLead($workspace, $leadId);
    }

    public function listLeads(Workspace $workspace, array $filters = []): LengthAwarePaginator
    {
        $query = $this->leadQueryForWorkspace($workspace)
            ->with($this->leadRelations());

        if (!empty($filters['course_id'])) {
            $query->where('course_id', (int) $filters['course_id']);
        }

        if (!empty($filters['stage_id'])) {
            $query->where('stage_id', (int) $filters['stage_id']);
        }

        if (!empty($filters['assignee_id'])) {
            $query->whereHas('assignments', function (Builder $builder) use ($filters): void {
                $builder->where('user_id', (int) $filters['assignee_id']);
            });
        }

        $query->orderBy($this->resolveSortBy($filters['sort_by'] ?? null), $this->resolveSortDirection($filters['sort_dir'] ?? null))
            ->orderByDesc('id');

        return $query->paginate(
            max(1, min(100, (int) ($filters['per_page'] ?? 15))),
            ['*'],
            'page',
            max(1, (int) ($filters['page'] ?? 1))
        );
    }

    public function updateLead(Lead $lead, array $data, User $actor): Lead
    {
        $this->guardLeadActive($lead);
        $this->authorizeLeadUpdate($lead, $actor);

        $oldValues = [];
        $newValues = [];
        $oldStageId = $lead->stage_id;

        if (array_key_exists('title', $data)) {
            $title = trim((string) $data['title']);
            if ($title !== $lead->title) {
                $oldValues['title'] = $lead->title;
                $newValues['title'] = $title;
                $lead->title = $title;
            }
        }

        foreach (['description', 'phone', 'source', 'lost_reason'] as $field) {
            if (array_key_exists($field, $data)) {
                $value = $field === 'source'
                    ? $this->normalizeSource($data[$field])
                    : $this->normalizeNullableString($data[$field]);

                if ($value !== $lead->{$field}) {
                    $oldValues[$field] = $lead->{$field};
                    $newValues[$field] = $value;
                    $lead->{$field} = $value;
                }
            }
        }

        $course = $lead->course;
        if (array_key_exists('course_id', $data)) {
            $course = $this->resolveCourse($lead->workspace, (int) $data['course_id']);
            if ((int) $course->id !== (int) $lead->course_id) {
                $oldValues['course_id'] = $lead->course_id;
                $newValues['course_id'] = $course->id;
                $lead->course_id = $course->id;
            }
        }

        if (array_key_exists('stage_id', $data)) {
            $stage = $this->resolveStageForCourse($lead->workspace, $course, (int) $data['stage_id']);
            if ((int) $stage->id !== (int) $lead->stage_id) {
                $oldValues['stage_id'] = $lead->stage_id;
                $newValues['stage_id'] = $stage->id;
                $lead->stage_id = $stage->id;
            }
        }

        if ($oldValues === []) {
            return $this->loadLeadRelations($lead->fresh());
        }

        return DB::transaction(function () use ($lead, $oldValues, $newValues, $oldStageId, $actor): Lead {
            $lead->save();

            $auditAction = isset($newValues['stage_id']) ? AuditAction::LeadStageChanged : AuditAction::LeadUpdated;

            $this->auditLogger->record(
                workspace: $lead->workspace,
                action: $auditAction,
                targetType: AuditTargetType::Lead,
                targetId: $lead->id,
                actor: $actor,
                oldValues: $oldValues,
                newValues: $newValues,
                metadata: [
                    AuditMetadataKey::CourseId->value => $lead->course_id,
                    AuditMetadataKey::StageId->value => $lead->stage_id,
                ]
            );

            if (isset($newValues['stage_id'])) {
                $this->leadHistoryService->record(
                    $lead,
                    'stage_changed',
                    ['stage_id' => $oldStageId],
                    ['stage_id' => $lead->stage_id],
                    $actor
                );
            }

            $this->notifyLeadUpdateRecipients($lead, $actor, $newValues);

            return $this->loadLeadRelations($lead->fresh());
        });
    }

    public function deleteLead(Lead $lead, User $actor): void
    {
        if ($lead->trashed()) {
            throw LeadsException::leadAlreadyDeleted($lead->id, $lead->workspace_id);
        }

        DB::transaction(function () use ($lead, $actor): void {
            $lead->delete();

            $this->auditLogger->record(
                workspace: $lead->workspace,
                action: AuditAction::LeadDeleted,
                targetType: AuditTargetType::Lead,
                targetId: $lead->id,
                actor: $actor,
                oldValues: ['deleted_at' => null],
                newValues: ['deleted_at' => optional($lead->deleted_at)->toISOString()],
                metadata: [
                    AuditMetadataKey::CourseId->value => $lead->course_id,
                    AuditMetadataKey::StageId->value => $lead->stage_id,
                ]
            );
        });
    }

    public function resolveLead(Workspace $workspace, int $leadId, bool $includeDeleted = false): Lead
    {
        $lead = $this->leadQueryForWorkspace($workspace, $includeDeleted)
            ->with($this->leadRelations())
            ->whereKey($leadId)
            ->first();

        if ($lead === null) {
            throw LeadsException::leadNotFound($leadId, $workspace->id);
        }

        return $lead;
    }

    public function resolveActiveLead(Workspace $workspace, int $leadId): Lead
    {
        $lead = $this->resolveLead($workspace, $leadId, true);
        $this->guardLeadActive($lead);

        return $lead;
    }

    public function leadQueryForWorkspace(Workspace $workspace, bool $includeDeleted = false): Builder
    {
        $query = Lead::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id);

        if ($includeDeleted) {
            $query->withTrashed();
        }

        return $query;
    }

    public function allowedTransitions(Lead $lead): array
    {
        return $lead->course->stages()
            ->get(['id', 'name', 'position', 'is_success'])
            ->map(fn (Stage $stage): array => [
                'stage_id' => $stage->id,
                'name' => $stage->name,
                'position' => $stage->position,
                'is_success' => $stage->is_success,
                'is_current' => (int) $stage->id === (int) $lead->stage_id,
            ])
            ->all();
    }

    private function resolveCourse(Workspace $workspace, int $courseId): Course
    {
        $course = Course::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id)
            ->whereKey($courseId)
            ->first();

        if ($course === null) {
            throw LeadsException::courseNotFound($courseId, $workspace->id);
        }

        return $course;
    }

    private function resolveStageForCourse(Workspace $workspace, Course $course, int $stageId): Stage
    {
        $stage = Stage::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id)
            ->whereKey($stageId)
            ->first();

        if ($stage === null) {
            throw LeadsException::stageNotFound($stageId, $workspace->id);
        }

        if ((int) $stage->course_id !== (int) $course->id) {
            throw LeadsException::stageCourseMismatch($stage->id, $course->id);
        }

        return $stage;
    }

    private function resolveDefaultStageForCourse(Workspace $workspace, Course $course): Stage
    {
        $stage = Stage::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id)
            ->where('course_id', $course->id)
            ->orderBy('position')
            ->orderBy('id')
            ->first();

        if ($stage === null) {
            throw LeadsException::stageNotFound(0, $workspace->id);
        }

        return $stage;
    }

    private function guardLeadActive(Lead $lead): void
    {
        if ($lead->trashed()) {
            throw LeadsException::leadDeletedImmutable($lead->id, $lead->workspace_id);
        }
    }

    private function authorizeLeadUpdate(Lead $lead, User $actor): void
    {
        if ($this->workspaceContextService->isOwnerOrAdmin()) {
            return;
        }

        if ((int) $lead->created_by_user_id === (int) $actor->id) {
            return;
        }

        $assigneeIds = $lead->assignees()->pluck('users.id')->map(fn ($id): int => (int) $id)->all();
        if (in_array((int) $actor->id, $assigneeIds, true)) {
            return;
        }

        throw LeadsException::unauthorizedToUpdateLead($lead->id, $actor->id);
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : $trimmed;
    }

    private function normalizeSource(mixed $source): string
    {
        $normalized = strtolower(trim((string) $source));

        return $normalized === '' ? 'website' : $normalized;
    }

    private function resolveSortBy(mixed $sortBy): string
    {
        return in_array($sortBy, ['created_at', 'updated_at', 'title'], true) ? (string) $sortBy : 'updated_at';
    }

    private function resolveSortDirection(mixed $sortDir): string
    {
        return in_array($sortDir, ['asc', 'desc'], true) ? (string) $sortDir : 'desc';
    }

    private function loadLeadRelations(?Lead $lead): Lead
    {
        return $lead->load($this->leadRelations());
    }

    private function leadRelations(): array
    {
        return [
            'course',
            'stage',
            'creator',
            'student',
            'assignees' => fn ($query) => $query->orderBy('name'),
        ];
    }

    private function notifyLeadUpdateRecipients(Lead $lead, User $actor, array $changes): void
    {
        $recipientIds = collect([$lead->created_by_user_id])
            ->merge($lead->assignments()->pluck('user_id'))
            ->filter()
            ->unique()
            ->reject(fn ($userId): bool => (int) $userId === (int) $actor->id);

        if ($recipientIds->isEmpty()) {
            return;
        }

        $message = isset($changes['stage_id'])
            ? sprintf('Lead %s moved to a new stage.', $lead->title)
            : sprintf('Lead %s was updated.', $lead->title);

        foreach ($recipientIds as $userId) {
            $this->notificationService->send(
                $lead->workspace_id,
                (int) $userId,
                NotificationType::LEAD_UPDATED,
                [
                    'lead_id' => $lead->id,
                    'course_id' => $lead->course_id,
                    'stage_id' => $lead->stage_id,
                    'changes' => $changes,
                    'message' => $message,
                ]
            );
        }
    }
}
