<?php

declare(strict_types=1);

namespace App\Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Actions\AssignPlanAction;
use App\Modules\Billing\Actions\GetSubscriptionSummaryAction;
use App\Modules\Billing\Http\Requests\AssignPlanRequest;
use App\Modules\Billing\Http\Resources\SubscriptionResource;
use App\Modules\Billing\Model\Subscription;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    /**
     * Get active plan and live usage meters for the current workspace.
     */
    public function show(
        Request $request,
        GetSubscriptionSummaryAction $action,
        WorkspaceContextService $workspaceContext
    ): JsonResponse {
        $workspace = $workspaceContext->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        $data = $action->execute($workspace);

        return ApiResponse::success(
            message: 'Subscription details retrieved successfully.',
            data: (new SubscriptionResource($data))->resolve()
        );
    }

    /**
     * Assign or update a workspace plan (Admin/Owner only).
     */
    public function assign(
        AssignPlanRequest $request,
        AssignPlanAction $action,
        WorkspaceContextService $workspaceContext
    ): JsonResponse {
        $workspace = $workspaceContext->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        if (!$workspaceContext->isOwnerOrAdmin()) {
            throw WorkspaceContextException::workspaceNotManagedByUser(
                username: $request->user()?->name ?? 'Current User',
                workspaceId: (int) $workspace->id
            );
        }

        $data = $action->execute(
            workspace: $workspace,
            planSlug: (string) $request->validated('plan_slug'),
            billingInterval: (string) ($request->validated('billing_interval') ?? Subscription::INTERVAL_MONTHLY),
            status: (string) ($request->validated('status') ?? Subscription::STATUS_ACTIVE)
        );

        return ApiResponse::success(
            message: 'Plan assigned successfully.',
            data: (new SubscriptionResource($data))->resolve()
        );
    }

    /**
     * Cancel the active workspace subscription (Admin/Owner only).
     */
    public function cancel(
        Request $request,
        \App\Modules\Billing\Actions\CancelSubscriptionAction $action,
        WorkspaceContextService $workspaceContext
    ): JsonResponse {
        $workspace = $workspaceContext->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        if (!$workspaceContext->isOwnerOrAdmin()) {
            throw WorkspaceContextException::workspaceNotManagedByUser(
                username: $request->user()?->name ?? 'Current User',
                workspaceId: (int) $workspace->id
            );
        }

        $immediately = filter_var($request->input('immediately', false), FILTER_VALIDATE_BOOLEAN);
        $data = $action->execute($workspace, immediately: $immediately);

        return ApiResponse::success(
            message: 'Subscription canceled successfully.',
            data: (new SubscriptionResource($data))->resolve()
        );
    }

    /**
     * Resume a canceled subscription before the period ends (Admin/Owner only).
     */
    public function resume(
        Request $request,
        \App\Modules\Billing\Actions\ResumeSubscriptionAction $action,
        WorkspaceContextService $workspaceContext
    ): JsonResponse {
        $workspace = $workspaceContext->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        if (!$workspaceContext->isOwnerOrAdmin()) {
            throw WorkspaceContextException::workspaceNotManagedByUser(
                username: $request->user()?->name ?? 'Current User',
                workspaceId: (int) $workspace->id
            );
        }

        $data = $action->execute($workspace);

        return ApiResponse::success(
            message: 'Subscription resumed successfully.',
            data: (new SubscriptionResource($data))->resolve()
        );
    }
}
