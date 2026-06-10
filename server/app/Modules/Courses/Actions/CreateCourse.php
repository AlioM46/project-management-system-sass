<?php

namespace App\Modules\Courses\Actions;

use App\Models\User;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Services\CourseService;

class CreateCourse
{
    public function __construct(
        private readonly CourseService $courseService
    ) {}

    public function execute(array $data, User $actor): Course
    {
        return $this->courseService->createCourse(
            $this->courseService->currentWorkspace(),
            $data,
            $actor
        );
    }
}
