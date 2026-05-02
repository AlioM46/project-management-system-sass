<?php

namespace App\Modules\Audit\Actions;

use App\Models\User;
use App\Modules\Audit\Services\AuditLogService;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportAuditLogs
{
    public function __construct(
        private readonly AuditLogService $auditLogService
    ) {}

    public function execute(array $filters, User $actor): StreamedResponse
    {
        return $this->auditLogService->exportForWorkspace(
            $this->auditLogService->currentWorkspace(),
            $filters,
            $actor
        );
    }
}
