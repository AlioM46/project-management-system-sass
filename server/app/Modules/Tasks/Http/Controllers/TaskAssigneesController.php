<?php

namespace App\Modules\Tasks\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Tasks\Actions\AddAssignees;
use App\Modules\Tasks\Actions\GetAssignees;
use App\Modules\Tasks\Actions\RemoveAssignees;
use App\Modules\Tasks\Actions\ReplaceAssignees;
use App\Modules\Tasks\Http\Requests\ManageAssigneesRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

class TaskAssigneesController extends Controller
{
    public function add(int $taskId, ManageAssigneesRequest $request, AddAssignees $action): JsonResponse
    {
        $validated = $request->validated();

        return ApiResponse::success(
            message: 'Task assignees added successfully.',
            data: [
                'task' => $action->execute($taskId, $validated['user_ids'], $request->user()),
            ]
        );
    }

    public function remove(int $taskId, ManageAssigneesRequest $request, RemoveAssignees $action): JsonResponse
    {
        $validated = $request->validated();

        return ApiResponse::success(
            message: 'Task assignees removed successfully.',
            data: [
                'task' => $action->execute($taskId, $validated['user_ids'], $request->user()),
            ]
        );
    }

    public function replace(int $taskId, ManageAssigneesRequest $request, ReplaceAssignees $action): JsonResponse
    {
        $validated = $request->validated();

        return ApiResponse::success(
            message: 'Task assignees updated successfully.',
            data: [
                'task' => $action->execute($taskId, $validated['user_ids'], $request->user()),
            ]
        );
    }

    public function index(int $taskId, GetAssignees $action): JsonResponse
    {
        $assignees = $action->execute($taskId);

        return ApiResponse::success(
            message: 'Task assignees retrieved successfully.',
            data: [
                'count' => $assignees->count(),
                'assignees' => $assignees,
            ]
        );
    }
}
