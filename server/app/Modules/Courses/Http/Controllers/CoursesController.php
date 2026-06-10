<?php

namespace App\Modules\Courses\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Courses\Actions\CreateCourse;
use App\Modules\Courses\Actions\DeleteCourse;
use App\Modules\Courses\Actions\GetCourse;
use App\Modules\Courses\Actions\ListCourses;
use App\Modules\Courses\Actions\RestoreCourse;
use App\Modules\Courses\Actions\UpdateCourse;
use App\Modules\Courses\Http\Requests\ListCoursesRequest;
use App\Modules\Courses\Http\Requests\ShowCourseRequest;
use App\Modules\Courses\Http\Requests\StoreCourseRequest;
use App\Modules\Courses\Http\Requests\UpdateCourseRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CoursesController extends Controller
{
    public function create(StoreCourseRequest $request, CreateCourse $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Course created successfully.',
            data: [
                'course' => $action->execute($request->validated(), $request->user()),
            ],
            status: Response::HTTP_CREATED
        );
    }

    public function index(ListCoursesRequest $request, ListCourses $action): JsonResponse
    {
        $filters = $request->validated();

        if ($request->has('include_deleted')) {
            $filters['include_deleted'] = $request->boolean('include_deleted');
        }

        $courses = $action->execute($filters);

        return ApiResponse::success(
            message: 'Courses retrieved successfully.',
            data: [
                'count' => $courses->count(),
                'courses' => $courses,
            ]
        );
    }

    public function show(int $courseId, ShowCourseRequest $request, GetCourse $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Course retrieved successfully.',
            data: [
                'course' => $action->execute($courseId, $request->boolean('include_deleted')),
            ]
        );
    }

    public function update(int $courseId, UpdateCourseRequest $request, UpdateCourse $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Course updated successfully.',
            data: [
                'course' => $action->execute($courseId, $request->validated(), $request->user()),
            ]
        );
    }

    public function delete(int $courseId, Request $request, DeleteCourse $action): Response
    {
        $action->execute($courseId, $request->user());

        return response()->noContent();
    }

    public function restore(int $courseId, Request $request, RestoreCourse $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Course restored successfully.',
            data: [
                'course' => $action->execute($courseId, $request->user()),
            ]
        );
    }
}
