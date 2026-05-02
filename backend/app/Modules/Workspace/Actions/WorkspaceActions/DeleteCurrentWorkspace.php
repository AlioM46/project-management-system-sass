<?php

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Support\Facades\DB;

class DeleteCurrentWorkspace
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly AuditLogger $auditLogger
    ) {}

    public function execute(User $user): array
    {
        $currentWorkspace = $this->workspaceContextService->currentWorkspace();

        if ($currentWorkspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        if (! $currentWorkspace->isManagedBy($user->id)) {
            throw WorkspaceContextException::workspaceNotManagedByUser($user->name, $currentWorkspace->id);
        }

        DB::transaction(function () use ($currentWorkspace, $user): void {
            $currentWorkspace->delete();

            $this->auditLogger->record(
                workspace: $currentWorkspace,
                action: AuditAction::WorkspaceDeleted,
                targetType: AuditTargetType::Workspace,
                targetId: $currentWorkspace->id,
                actor: $user,
                oldValues: ['deleted_at' => null],
                newValues: ['deleted_at' => $currentWorkspace->deleted_at?->toISOString()]
            );
        });

        return [
            'workspace' => [
                'id' => $currentWorkspace->id,
                'deleted_at' => $currentWorkspace->deleted_at,
            ],
        ];
    }
}
