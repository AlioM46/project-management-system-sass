<?php

use App\Modules\Leads\Http\Controllers\LeadAssigneesController;
use App\Modules\Leads\Http\Controllers\LeadsController;
use Illuminate\Support\Facades\Route;

Route::prefix('leads')
    ->middleware(['auth:api', 'workspace.context'])
    ->group(function () {
        Route::post('/', [LeadsController::class, 'create'])->middleware('hasPermission:lead.create');
        Route::get('/', [LeadsController::class, 'index'])->middleware('hasPermission:lead.view');
        Route::get('/{leadId}', [LeadsController::class, 'show'])->whereNumber('leadId')->middleware('hasPermission:lead.view');
        Route::match(['put', 'patch'], '/{leadId}', [LeadsController::class, 'update'])->whereNumber('leadId')->middleware('hasPermission:lead.update');
        Route::delete('/{leadId}', [LeadsController::class, 'delete'])->whereNumber('leadId')->middleware('hasPermission:lead.delete');
        Route::get('/{leadId}/allowed-transitions', [LeadsController::class, 'allowedTransitions'])->whereNumber('leadId')->middleware('hasPermission:lead.view');

        Route::post('/{leadId}/assignees', [LeadAssigneesController::class, 'add'])->whereNumber('leadId')->middleware('hasPermission:lead.assign');
        Route::delete('/{leadId}/assignees', [LeadAssigneesController::class, 'remove'])->whereNumber('leadId')->middleware('hasPermission:lead.assign');
        Route::put('/{leadId}/assignees', [LeadAssigneesController::class, 'replace'])->whereNumber('leadId')->middleware('hasPermission:lead.assign');
        Route::get('/{leadId}/assignees', [LeadAssigneesController::class, 'index'])->whereNumber('leadId')->middleware('hasPermission:lead.view');
    });
