<?php

namespace App\Modules\Audit\Services;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditMetadataKey;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogService
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly AuditLogger $auditLogger
    ) {
    }

    public function currentWorkspace(): Workspace
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        return $workspace;
    }

    public function listForWorkspace(Workspace $workspace, array $filters = []): LengthAwarePaginator
    {
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 15)));

        return $this->queryForWorkspace($workspace, $filters)
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function exportForWorkspace(Workspace $workspace, array $filters, User $actor): StreamedResponse
    {
        $logs = $this->queryForWorkspace($workspace, $filters)->get();

        $this->auditLogger->record(
            workspace: $workspace,
            action: AuditAction::AuditExported,
            targetType: AuditTargetType::AuditLog,
            targetId: null,
            actor: $actor,
            metadata: [
                AuditMetadataKey::Filters->value => $this->exportedFilters($filters),
                AuditMetadataKey::ExportedRowCount->value => $logs->count(),
            ]
        );

        $filename = 'audit-logs-workspace-' . $workspace->id . '-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($logs): void {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, [
                'id',
                'workspace_id',
                'actor_user_id',
                'event_type',
                'target_type',
                'target_id',
                'old_values',
                'new_values',
                'metadata',
                'ip_address',
                'user_agent',
                'occurred_at',
            ]);

            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->id,
                    $log->workspace_id,
                    $log->actor_user_id,
                    $log->event_type,
                    $log->target_type,
                    $log->target_id,
                    json_encode($log->old_values),
                    json_encode($log->new_values),
                    json_encode($log->metadata),
                    $log->ip_address,
                    $log->user_agent,
                    $log->occurred_at?->toISOString(),
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function queryForWorkspace(Workspace $workspace, array $filters = []): Builder
    {
        $query = AuditLog::query()
            ->forWorkspace((int) $workspace->id)
            ->with('actor:id,name,email')
            ->orderByDesc('occurred_at')
            ->orderByDesc('id');

        if (! empty($filters['event_type'])) {
            $query->where('event_type', (string) $filters['event_type']);
        }

        if (! empty($filters['target_type'])) {
            $query->where('target_type', (string) $filters['target_type']);
        }

        if (! empty($filters['target_id'])) {
            $query->where('target_id', (int) $filters['target_id']);
        }

        if (! empty($filters['actor_user_id'])) {
            $query->where('actor_user_id', (int) $filters['actor_user_id']);
        }

        if (! empty($filters['from'])) {
            $query->where('occurred_at', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $query->where('occurred_at', '<=', $filters['to']);
        }

        return $query;
    }

    private function exportedFilters(array $filters): array
    {
        return array_filter(
            $filters,
            fn(mixed $value): bool => $value !== null && $value !== ''
        );
    }
}
