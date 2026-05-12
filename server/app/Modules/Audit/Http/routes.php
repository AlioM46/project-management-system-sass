<?php

use App\Modules\Audit\Http\Controllers\AuditLogsController;
use Illuminate\Support\Facades\Route;

Route::prefix('audit-logs')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {
        Route::get('/', [AuditLogsController::class, 'index'])
            ->middleware('hasPermission:audit.view');

        Route::get('/export', [AuditLogsController::class, 'export'])
            ->middleware('hasPermission:audit.export');
    });
