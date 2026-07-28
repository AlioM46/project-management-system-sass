<?php

namespace App\Modules\Leads\Services;

use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditMetadataKey;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Courses\Model\Stage;
use App\Modules\Leads\Jobs\ProcessStudentEnrollment;
use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Model\Student;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Services\NotificationService;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Support\Facades\DB;

class StudentLifecycleService
{
    public function __construct(
        private readonly AuditLogger $auditLogger,
        private readonly LeadHistoryService $leadHistoryService,
        private readonly NotificationService $notificationService
    ) {}

    public function createFromSuccessfulLead(Lead $lead): ?Student
    {
        $lead->loadMissing(['workspace', 'assignments', 'creator']);

        $stage = Stage::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $lead->workspace_id)
            ->whereKey($lead->stage_id)
            ->first();

        if (! $stage?->is_success) {
            return null;
        }

        $student = DB::transaction(function () use ($lead): Student {
            $existingStudent = Student::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->where('workspace_id', $lead->workspace_id)
                ->where('lead_id', $lead->id)
                ->first();

            if ($existingStudent !== null) {
                return $existingStudent;
            }

            $student = Student::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->create([
                    'workspace_id' => $lead->workspace_id,
                    'lead_id' => $lead->id,
                    'student_code' => $this->generateStudentCode($lead->workspace_id),
                    'academic_status' => 'active',
                ]);

            $this->auditLogger->record(
                workspace: $lead->workspace,
                action: AuditAction::StudentCreated,
                targetType: AuditTargetType::Student,
                targetId: $student->id,
                newValues: [
                    'lead_id' => $lead->id,
                    'student_code' => $student->student_code,
                    'academic_status' => $student->academic_status,
                ],
                metadata: [
                    AuditMetadataKey::LeadId->value => $lead->id,
                    AuditMetadataKey::StudentId->value => $student->id,
                ]
            );

            $this->auditLogger->record(
                workspace: $lead->workspace,
                action: AuditAction::LeadConvertedToStudent,
                targetType: AuditTargetType::Lead,
                targetId: $lead->id,
                newValues: [
                    'student_id' => $student->id,
                    'student_code' => $student->student_code,
                ],
                metadata: [
                    AuditMetadataKey::LeadId->value => $lead->id,
                    AuditMetadataKey::StudentId->value => $student->id,
                    AuditMetadataKey::CourseId->value => $lead->course_id,
                    AuditMetadataKey::StageId->value => $lead->stage_id,
                ]
            );

            if ($lead->creator !== null) {
                $this->leadHistoryService->record(
                    $lead,
                    'lead_converted_to_student',
                    null,
                    [
                        'student_id' => $student->id,
                        'student_code' => $student->student_code,
                    ],
                    $lead->creator
                );
            }

            $this->notifyStakeholders($lead, $student);

            return $student;
        });

        if ($student->wasRecentlyCreated) {
            ProcessStudentEnrollment::dispatch($student->id, $lead->id, $lead->workspace_id)->afterCommit();
        }

        return $student;
    }

    private function notifyStakeholders(Lead $lead, Student $student): void
    {
        $recipientIds = collect([$lead->created_by_user_id])
            ->merge($lead->assignments()->pluck('user_id'))
            ->filter()
            ->unique()
            ->map(fn ($id): int => (int) $id);

        foreach ($recipientIds as $userId) {
            $this->notificationService->send(
                $lead->workspace_id,
                $userId,
                NotificationType::LEAD_CONVERTED,
                [
                    'lead_id' => $lead->id,
                    'student_id' => $student->id,
                    'student_code' => $student->student_code,
                    'course_id' => $lead->course_id,
                    'message' => sprintf('%s converted into student %s.', $lead->title, $student->student_code),
                ]
            );

            $this->notificationService->send(
                $lead->workspace_id,
                $userId,
                NotificationType::STUDENT_CREATED,
                [
                    'lead_id' => $lead->id,
                    'student_id' => $student->id,
                    'student_code' => $student->student_code,
                    'message' => sprintf('Student %s is now active in the academy CRM.', $student->student_code),
                ]
            );
        }
    }

    private function generateStudentCode(int $workspaceId): string
    {
        $sequence = Student::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspaceId)
            ->count() + 1;

        return sprintf(
            'HYPRO-%s-%04d',
            now()->format('Y'),
            $sequence
        );
    }
}
