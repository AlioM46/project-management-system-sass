<?php

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Support\Facades\DB;

class UpdateCurrentWorkspace
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly AuditLogger $auditLogger
    ) {}

    public function execute(array $data, User $actor): array
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        if ($data !== []) {
            $oldValues = [
                'name' => $workspace->name,
            ];

            $workspace->fill($data);

            if ($workspace->isDirty()) {
                $newValues = [
                    'name' => $workspace->name,
                ];

                DB::transaction(function () use ($workspace, $actor, $oldValues, $newValues): void {
                    $workspace->save();

                    $this->auditLogger->record(
                        workspace: $workspace,
                        action: AuditAction::WorkspaceUpdated,
                        targetType: AuditTargetType::Workspace,
                        targetId: $workspace->id,
                        actor: $actor,
                        oldValues: $oldValues,
                        newValues: $newValues
                    );
                });
            }
        }

        $workspace->load([
            'owner:id,name,email',
        ])->loadCount('members');

        return ['workspace' => $workspace];
    }
}
