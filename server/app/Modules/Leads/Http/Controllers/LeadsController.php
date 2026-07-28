<?php

namespace App\Modules\Leads\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Actions\CreateLead;
use App\Modules\Leads\Actions\DeleteLead;
use App\Modules\Leads\Actions\GetAllowedStageTransitionsAction;
use App\Modules\Leads\Actions\GetLead;
use App\Modules\Leads\Actions\ListLeads;
use App\Modules\Leads\Actions\UpdateLead;
use App\Modules\Leads\Http\Requests\CreateLeadRequest;
use App\Modules\Leads\Http\Requests\ListLeadsRequest;
use App\Modules\Leads\Http\Requests\UpdateLeadRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LeadsController extends Controller
{
    public function create(CreateLeadRequest $request, CreateLead $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Lead created successfully.',
            data: ['lead' => $action->execute($request->validated(), $request->user())],
            status: Response::HTTP_CREATED
        );
    }

    public function index(ListLeadsRequest $request, ListLeads $action): JsonResponse
    {
        $leads = $action->execute($request->validated());

        return ApiResponse::success(
            message: 'Leads retrieved successfully.',
            data: [
                'count' => count($leads->items()),
                'leads' => $leads->items(),
            ],
            meta: [
                'pagination' => [
                    'current_page' => $leads->currentPage(),
                    'last_page' => $leads->lastPage(),
                    'per_page' => $leads->perPage(),
                    'total' => $leads->total(),
                ],
            ]
        );
    }

    public function show(int $leadId, GetLead $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Lead retrieved successfully.',
            data: ['lead' => $action->execute($leadId)]
        );
    }

    public function update(int $leadId, UpdateLeadRequest $request, UpdateLead $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Lead updated successfully.',
            data: ['lead' => $action->execute($leadId, $request->validated(), $request->user())]
        );
    }

    public function delete(int $leadId, Request $request, DeleteLead $action): Response
    {
        $action->execute($leadId, $request->user());

        return response()->noContent();
    }

    public function allowedTransitions(int $leadId, GetAllowedStageTransitionsAction $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Allowed transitions retrieved successfully.',
            data: $action->execute($leadId)
        );
    }
}
