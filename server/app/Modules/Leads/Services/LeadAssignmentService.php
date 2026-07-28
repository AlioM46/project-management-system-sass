<?php

namespace App\Modules\Leads\Services;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditMetadataKey;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Leads\Exceptions\LeadsException;
use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Model\LeadAssignment;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class LeadAssignmentService
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
        private readonly NotificationService $notificationService
    ) {}

    public function addAssignees(Lead $lead, array $userIds, User $actor): Lead
    {
        return $this->replaceAssignees($lead, array_values(array_unique(array_merge(
            $lead->assignments()->pluck('user_id')->all(),
            $userIds
        ))), $actor);
    }

    public function removeAssignees(Lead $lead, array $userIds, User $actor): Lead
    {
        $this->guardLeadActive($lead);
        $normalizedUserIds = $this->normalizeUserIds($userIds);

        return DB::transaction(function () use ($lead, $normalizedUserIds, $actor): Lead {
            $userIdsToRemove = $lead->assignments()
                ->whereIn('user_id', $normalizedUserIds)
                ->pluck('user_id')
                ->map(fn ($id): int => (int) $id)
                ->all();

            if ($userIdsToRemove !== []) {
                $lead->assignments()->whereIn('user_id', $userIdsToRemove)->delete();

                foreach ($userIdsToRemove as $userId) {
                    $this->auditLogger->record(
                        workspace: $lead->workspace,
                        action: AuditAction::LeadAssigneeRemoved,
                        targetType: AuditTargetType::Lead,
                        targetId: $lead->id,
                        actor: $actor,
                        oldValues: ['user_id' => $userId],
                        metadata: [AuditMetadataKey::AssigneeUserId->value => $userId]
                    );
                }
            }

            return $this->loadLeadRelations($lead->fresh());
        });
    }

    public function replaceAssignees(Lead $lead, array $userIds, User $actor): Lead
    {
        $this->guardLeadActive($lead);
        $workspace = $lead->workspace()->firstOrFail();
        $normalizedUserIds = $this->normalizeUserIds($userIds);
        $this->guardUsersBelongToWorkspace($workspace, $normalizedUserIds);

        return DB::transaction(function () use ($lead, $normalizedUserIds, $actor): Lead {
            $existingIds = $lead->assignments()->pluck('user_id')->map(fn ($id): int => (int) $id)->all();
            $userIdsToAdd = array_values(array_diff($normalizedUserIds, $existingIds));
            $userIdsToRemove = array_values(array_diff($existingIds, $normalizedUserIds));

            if ($userIdsToRemove !== []) {
                $lead->assignments()->whereIn('user_id', $userIdsToRemove)->delete();
            }

            if ($userIdsToAdd !== []) {
                $timestamp = now();
                $rows = [];

                foreach ($userIdsToAdd as $userId) {
                    $rows[] = [
                        'lead_id' => $lead->id,
                        'user_id' => $userId,
                        'assigned_by_user_id' => $actor->id,
                        'created_at' => $timestamp,
                    ];
                }

                LeadAssignment::query()->insert($rows);
            }

            foreach ($userIdsToRemove as $userId) {
                $this->auditLogger->record(
                    workspace: $lead->workspace,
                    action: AuditAction::LeadAssigneeRemoved,
                    targetType: AuditTargetType::Lead,
                    targetId: $lead->id,
                    actor: $actor,
                    oldValues: ['user_id' => $userId],
                    metadata: [AuditMetadataKey::AssigneeUserId->value => $userId]
                );
            }

            foreach ($userIdsToAdd as $userId) {
                $this->auditLogger->record(
                    workspace: $lead->workspace,
                    action: AuditAction::LeadAssigneeAdded,
                    targetType: AuditTargetType::Lead,
                    targetId: $lead->id,
                    actor: $actor,
                    newValues: ['user_id' => $userId],
                    metadata: [AuditMetadataKey::AssigneeUserId->value => $userId]
                );

                $this->notificationService->send(
                    $lead->workspace_id,
                    $userId,
                    NotificationType::LEAD_ASSIGNED,
                    [
                        'lead_id' => $lead->id,
                        'course_id' => $lead->course_id,
                        'stage_id' => $lead->stage_id,
                        'message' => sprintf('You were assigned to lead %s.', $lead->title),
                    ]
                );
            }

            return $this->loadLeadRelations($lead->fresh());
        });
    }

    public function getAssignees(Lead $lead): Collection
    {
        return $lead->assignees()->orderBy('name')->get();
    }

    private function guardLeadActive(Lead $lead): void
    {
        if ($lead->trashed()) {
            throw LeadsException::leadDeletedImmutable($lead->id, $lead->workspace_id);
        }
    }

    private function guardUsersBelongToWorkspace(Workspace $workspace, array $userIds): void
    {
        if ($userIds === []) {
            return;
        }

        $workspaceUserIds = Workspace_Members::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id)
            ->whereIn('user_id', $userIds)
            ->pluck('user_id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        if (in_array((int) $workspace->created_by_user_id, $userIds, true)) {
            $workspaceUserIds[] = (int) $workspace->created_by_user_id;
        }

        $invalidUserIds = array_values(array_diff($userIds, array_values(array_unique($workspaceUserIds))));

        if ($invalidUserIds !== []) {
            throw LeadsException::userNotInWorkspace($invalidUserIds[0], $workspace->id);
        }
    }

    private function normalizeUserIds(array $userIds): array
    {
        return array_values(array_unique(array_map(
            fn ($userId): int => (int) $userId,
            array_filter($userIds, fn ($userId): bool => $userId !== null && $userId !== '')
        )));
    }

    private function loadLeadRelations(?Lead $lead): Lead
    {
        return $lead->load([
            'course',
            'stage',
            'creator',
            'student',
            'assignees' => fn ($query) => $query->orderBy('name'),
        ]);
    }
}
