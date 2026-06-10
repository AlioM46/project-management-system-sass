<?php

namespace App\Modules\Leads\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Actions\AddLeadAssignees;
use App\Modules\Leads\Actions\GetLeadAssignees;
use App\Modules\Leads\Actions\RemoveLeadAssignees;
use App\Modules\Leads\Actions\ReplaceLeadAssignees;
use App\Modules\Leads\Http\Requests\ManageLeadAssigneesRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

class LeadAssigneesController extends Controller
{
    public function add(int $leadId, ManageLeadAssigneesRequest $request, AddLeadAssignees $action): JsonResponse
    {
        $validated = $request->validated();

        return ApiResponse::success(
            message: 'Lead assignees added successfully.',
            data: ['lead' => $action->execute($leadId, $validated['user_ids'], $request->user())]
        );
    }

    public function remove(int $leadId, ManageLeadAssigneesRequest $request, RemoveLeadAssignees $action): JsonResponse
    {
        $validated = $request->validated();

        return ApiResponse::success(
            message: 'Lead assignees removed successfully.',
            data: ['lead' => $action->execute($leadId, $validated['user_ids'], $request->user())]
        );
    }

    public function replace(int $leadId, ManageLeadAssigneesRequest $request, ReplaceLeadAssignees $action): JsonResponse
    {
        $validated = $request->validated();

        return ApiResponse::success(
            message: 'Lead assignees updated successfully.',
            data: ['lead' => $action->execute($leadId, $validated['user_ids'], $request->user())]
        );
    }

    public function index(int $leadId, GetLeadAssignees $action): JsonResponse
    {
        $assignees = $action->execute($leadId);

        return ApiResponse::success(
            message: 'Lead assignees retrieved successfully.',
            data: [
                'count' => $assignees->count(),
                'assignees' => $assignees,
            ]
        );
    }
}
