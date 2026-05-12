<?php

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Support\Facades\DB;

class RestoreWorkspace
{
    public function __construct(
        private readonly AuditLogger $auditLogger
    ) {}

    public function execute(int $workspaceId, User $user): array
    {
        // find(id): by default, it does not return deleted_at != null records,
        // so we need to use withTrashed() to include them in the search
        $workspace = Workspace::withTrashed()->find($workspaceId);

        if ($workspace === null) {
            throw WorkspaceContextException::workspaceNotFound($workspaceId);
        }

        if (! $workspace->isManagedBy($user->id)) {
            throw WorkspaceContextException::workspaceNotManagedByUser($user->name, $workspace->id);
        }

        if (! $workspace->trashed()) {
            throw WorkspaceContextException::workspaceNotArchived($workspace->id);
        }

        $deletedAt = $workspace->deleted_at?->toISOString();

        DB::transaction(function () use ($workspace, $user, $deletedAt): void {
            $workspace->restore();

            $this->auditLogger->record(
                workspace: $workspace,
                action: AuditAction::WorkspaceRestored,
                targetType: AuditTargetType::Workspace,
                targetId: $workspace->id,
                actor: $user,
                oldValues: ['deleted_at' => $deletedAt],
                newValues: ['deleted_at' => null]
            );
        });

        $workspace = $workspace->fresh();
        $workspace->load([
            'owner:id,name,email',
        ])->loadCount('members');

        return ['workspace' => $workspace];
    }
}
