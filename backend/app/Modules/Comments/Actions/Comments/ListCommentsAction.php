<?php
namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Services\CommentService;
use Illuminate\Database\Eloquent\Collection;
class ListCommentsAction
{
    public function __construct(
        private CommentService $service
    ) {
    }

    public function execute(int $taskId): Collection
    {
        return $this->service->listByTask($taskId);
    }
}