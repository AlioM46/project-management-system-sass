<?php

namespace App\Modules\Leads\Observers;

use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditMetadataKey;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Leads\Model\Student;

class StudentObserver
{
    public function __construct(
        private readonly AuditLogger $auditLogger
    ) {}

    public function updated(Student $student): void
    {
        if (! $student->wasChanged('academic_status')) {
            return;
        }

        $this->auditLogger->record(
            workspace: $student->workspace,
            action: AuditAction::StudentStatusUpdated,
            targetType: AuditTargetType::Student,
            targetId: $student->id,
            oldValues: ['academic_status' => $student->getOriginal('academic_status')],
            newValues: ['academic_status' => $student->academic_status],
            metadata: [
                AuditMetadataKey::LeadId->value => $student->lead_id,
                AuditMetadataKey::StudentId->value => $student->id,
            ]
        );
    }
}
