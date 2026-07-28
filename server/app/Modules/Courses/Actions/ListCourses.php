<?php

namespace App\Modules\Courses\Actions;

use App\Modules\Courses\Services\CourseService;
use Illuminate\Database\Eloquent\Collection;

class ListCourses
{
    public function __construct(
        private readonly CourseService $courseService
    ) {}

    public function execute(array $filters = []): Collection
    {
        return $this->courseService->listCourses(
            $this->courseService->currentWorkspace(),
            $filters
        );
    }
}
