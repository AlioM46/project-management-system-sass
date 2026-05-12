<?php

namespace App\Modules\Notifications\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Notifications\Events\NotificationRead;
use App\Modules\Notifications\Events\NotificationReadAll;
use App\Modules\Notifications\Model\Notification;
use App\Modules\Workspace\Services\WorkspaceContextService;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

class NotificationsController extends Controller
{
    public function __construct(
        private readonly WorkspaceContextService $contextService
    ) {}

    public function index(): JsonResponse
    {
        $data = Notification::query()
            ->where('workspace_id', $this->contextService->currentWorkspaceId())
            ->where('user_id', auth()->id())
            ->latest()
            ->get()
            ->toArray();

        return ApiResponse::success('notifications retrieved successfully', $data);
    }

    public function markAsRead(int $id): JsonResponse
    {
        $workspaceId = $this->contextService->currentWorkspaceId();

        $notification = Notification::query()
            ->where('id', $id)
            ->where('workspace_id', $workspaceId)
            ->where('user_id', auth()->id())
            ->first();

        if (! $notification) {
            return ApiResponse::error(
                'Notification not found',
                'NOT_FOUND',
                [],
                404
            );
        }

        if ($notification->read_at) {
            return ApiResponse::success(
                'Notification already marked as read'
            );
        }

        $notification->update([
            'read_at' => now(),
        ]);

        event(new NotificationRead($notification->fresh()));

        return ApiResponse::success(
            'Notification marked as read successfully'
        );
    }

    public function markAllAsRead(): JsonResponse
    {
        $userId = auth()->id();
        $workspaceId = $this->contextService->currentWorkspaceId();

        if (! $workspaceId) {
            return ApiResponse::error(
                'Workspace context not found',
                'WORKSPACE_CONTEXT_NOT_FOUND',
                [],
                400
            );
        }

        $query = Notification::query()
            ->where('workspace_id', $workspaceId)
            ->where('user_id', $userId)
            ->whereNull('read_at');

        $count = $query->count();

        if ($count === 0) {
            return ApiResponse::success(
                'No unread notifications found'
            );
        }

        $readAt = now();

        $query->update([
            'read_at' => $readAt,
        ]);

        event(new NotificationReadAll($userId, $workspaceId, $readAt));

        return ApiResponse::success(
            'All notifications marked as read successfully'
        );
    }
}
