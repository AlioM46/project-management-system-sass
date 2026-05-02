<?php

namespace App\Modules\Audit\Actions;

use App\Modules\Audit\Services\AuditLogService;
use Illuminate\Pagination\LengthAwarePaginator;

class ListAuditLogs
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {}

    public function execute(array $filters = []): LengthAwarePaginator
    {
        return $this->auditLogService->listForWorkspace(
            $this->auditLogService->currentWorkspace(),
            $filters
        );
    }
}
