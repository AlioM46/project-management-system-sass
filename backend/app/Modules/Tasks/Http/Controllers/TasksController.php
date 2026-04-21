<?php

namespace App\Modules\Tasks\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Tasks\Actions\CreateTask;
use App\Modules\Tasks\Actions\DeleteTask;
use App\Modules\Tasks\Actions\GetTask;
use App\Modules\Tasks\Actions\ListTasks;
use App\Modules\Tasks\Actions\UpdateTask;
use App\Modules\Tasks\Http\Requests\CreateTaskRequest;
use App\Modules\Tasks\Http\Requests\ListTasksRequest;
use App\Modules\Tasks\Http\Requests\UpdateTaskRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class   TasksController extends Controller
{
    public function create(CreateTaskRequest $request, CreateTask $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Task created successfully.',
            data: [
                'task' => $action->execute($request->validated(), $request->user()),
            ],
            status: 201
        );
    }

    public function index(ListTasksRequest $request, ListTasks $action): JsonResponse
    {
        $tasks = $action->execute($request->validated());

        return ApiResponse::success(
            message: 'Tasks retrieved successfully.',
            data: [
                'count' => count($tasks->items()),
                'tasks' => $tasks->items(),
            ],
            meta: [
                'pagination' => [
                    'current_page' => $tasks->currentPage(),
                    'last_page' => $tasks->lastPage(),
                    'per_page' => $tasks->perPage(),
                    'total' => $tasks->total(),
                ],
            ]
        );
    }

    public function show(int $taskId, GetTask $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Task retrieved successfully.',
            data: [
                'task' => $action->execute($taskId),
            ]
        );
    }

    public function update(int $taskId, UpdateTaskRequest $request, UpdateTask $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Task updated successfully.',
            data: [
                'task' => $action->execute($taskId, $request->validated(), $request->user()),
            ]
        );
    }

    public function delete(int $taskId, Request $request, DeleteTask $action): Response
    {
        $action->execute($taskId, $request->user());

        return response()->noContent();
    }
}
