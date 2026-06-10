<?php

namespace App\Modules\Courses\Actions;

use App\Models\User;
use App\Modules\Courses\Services\CourseService;

class DeleteCourse
{
    public function __construct(
        private readonly CourseService $courseService
    ) {}

    public function execute(int $courseId, User $actor): void
    {
        $workspace = $this->courseService->currentWorkspace();
        $course = $this->courseService->resolveCourse($workspace, $courseId, true);

        $this->courseService->deleteCourse($course, $actor);
    }
}
