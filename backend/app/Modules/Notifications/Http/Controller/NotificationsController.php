<?php

namespace App\Modules\Notifications\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Shared\Http\ApiResponse;

class NotificationController extends Controller
{
    public function index()
    {

        $data = Notification::where('workspace_id', auth()->user()->workspace_id)
            ->where('user_id', auth()->id())
            ->latest()
            ->get();

        return ApiResponse::success("notifications retrieved successfully", $data);
    }

    public function markAsRead($id)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $notification->update([
            'read_at' => now()
        ]);

        return ApiResponse::success("notification marked as read successfully");
    }

    public function markAllAsRead()
    {
        Notification::where('user_id', auth()->id())
            ->update(['read_at' => now()]);

        return ApiResponse::success("all notifications marked as read successfully");
    }
}
