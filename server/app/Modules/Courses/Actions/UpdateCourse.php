<?php

namespace App\Modules\Courses\Actions;

use App\Models\User;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Services\CourseService;

class UpdateCourse
{
    public function __construct(
        private readonly CourseService $courseService
    ) {}

    public function execute(int $courseId, array $data, User $actor): Course
    {
        $workspace = $this->courseService->currentWorkspace();
        $course = $this->courseService->resolveCourse($workspace, $courseId, true);

        return $this->courseService->updateCourse($course, $data, $actor);
    }
}
