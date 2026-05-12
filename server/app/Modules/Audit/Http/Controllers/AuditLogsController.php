<?php

namespace App\Modules\Audit\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Audit\Actions\ExportAuditLogs;
use App\Modules\Audit\Actions\ListAuditLogs;
use App\Modules\Audit\Http\Requests\ListAuditLogsRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogsController extends Controller
{
    public function index(ListAuditLogsRequest $request, ListAuditLogs $action): JsonResponse
    {
        $auditLogs = $action->execute($request->validated());

        return ApiResponse::success(
            message: 'Audit logs retrieved successfully.',
            data: [
                'count' => count($auditLogs->items()),
                'audit_logs' => $auditLogs->items(),
            ],
            meta: [
                'pagination' => [
                    'current_page' => $auditLogs->currentPage(),
                    'last_page' => $auditLogs->lastPage(),
                    'per_page' => $auditLogs->perPage(),
                    'total' => $auditLogs->total(),
                ],
            ]
        );
    }

    public function export(ListAuditLogsRequest $request, ExportAuditLogs $action): StreamedResponse
    {
        return $action->execute($request->validated(), $request->user());
    }
}
