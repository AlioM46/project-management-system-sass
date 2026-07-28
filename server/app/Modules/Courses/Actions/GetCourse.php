<?php

namespace App\Modules\Courses\Actions;

use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Services\CourseService;

class GetCourse
{
    public function __construct(
        private readonly CourseService $courseService
    ) {}

    public function execute(int $courseId, bool $includeDeleted = false): Course
    {
        return $this->courseService->resolveCourse(
            $this->courseService->currentWorkspace(),
            $courseId,
            $includeDeleted
        );
    }
}
