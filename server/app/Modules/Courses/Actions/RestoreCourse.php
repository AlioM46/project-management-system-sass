<?php

namespace App\Modules\Courses\Actions;

use App\Models\User;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Services\CourseService;

class RestoreCourse
{
    public function __construct(
        private readonly CourseService $courseService
    ) {}

    public function execute(int $courseId, User $actor): Course
    {
        $workspace = $this->courseService->currentWorkspace();
        $course = $this->courseService->resolveCourse($workspace, $courseId, true);

        return $this->courseService->restoreCourse($course, $actor);
    }
}
