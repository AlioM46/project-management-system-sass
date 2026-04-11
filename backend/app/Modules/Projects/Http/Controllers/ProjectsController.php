<?php

namespace App\Modules\Projects\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Projects\Actions\CreateProject;
use App\Modules\Projects\Actions\DeleteProject;
use App\Modules\Projects\Actions\GetProject;
use App\Modules\Projects\Actions\ListProjects;
use App\Modules\Projects\Actions\RestoreProject;
use App\Modules\Projects\Actions\UpdateProject;
use App\Modules\Projects\Http\Requests\CreateProjectRequest;
use App\Modules\Projects\Http\Requests\ListProjectsRequest;
use App\Modules\Projects\Http\Requests\ShowProjectRequest;
use App\Modules\Projects\Http\Requests\UpdateProjectRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class ProjectsController extends Controller
{
    public function create(CreateProjectRequest $request, CreateProject $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Project created successfully.',
            data: [
                'project' => $action->execute($request->validated(), $request->user()),
            ],
            status: 201
        );
    }

    public function index(ListProjectsRequest $request, ListProjects $action): JsonResponse
    {
        $filters = $request->validated();

        if ($request->has('include_deleted')) {
            $filters['include_deleted'] = $request->boolean('include_deleted');
        }

        $projects = $action->execute($filters);

        return ApiResponse::success(
            message: 'Projects retrieved successfully.',
            data: [
                'count' => $projects->count(),
                'projects' => $projects,
            ]
        );
    }

    public function show(int $projectId, ShowProjectRequest $request, GetProject $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Project retrieved successfully.',
            data: [
                'project' => $action->execute($projectId, $request->boolean('include_deleted')),
            ]
        );
    }

    public function update(int $projectId, UpdateProjectRequest $request, UpdateProject $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Project updated successfully.',
            data: [
                'project' => $action->execute($projectId, $request->validated()),
            ]
        );
    }

    public function delete(int $projectId, DeleteProject $action): Response
    {
        $action->execute($projectId);

        return response()->noContent();
    }

    public function restore(int $projectId, RestoreProject $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Project restored successfully.',
            data: [
                'project' => $action->execute($projectId),
            ]
        );
    }
}
