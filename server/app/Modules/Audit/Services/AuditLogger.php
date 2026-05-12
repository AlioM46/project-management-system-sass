<?php

namespace App\Modules\Audit\Services;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Http\Request;

class AuditLogger
{
    /**
     * Store one audit event after the business operation has succeeded.
     *
     * Call this inside the same DB transaction as the state change. If the
     * business operation rolls back, the audit row rolls back with it.
     */
    public function record(
        Workspace $workspace,
        AuditAction $action,
        AuditTargetType $targetType,
        ?int $targetId,
        ?User $actor = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null,
        ?Request $request = null
    ): AuditLog {
        $request ??= request();

        return AuditLog::query()->create([
            'workspace_id' => $workspace->id,
            'actor_user_id' => $actor?->id,
            'event_type' => $action->value,
            'target_type' => $targetType->value,
            'target_id' => $targetId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => $metadata,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'occurred_at' => now(),
        ]);
    }
}
