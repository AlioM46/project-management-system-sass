<?php

namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Services\CommentService;
use Illuminate\Pagination\LengthAwarePaginator;

class ListCommentsAction
{
    public function __construct(private CommentService $service) {}

    public function execute(int $leadId, array $filters = []): LengthAwarePaginator
    {
        return $this->service->listByLeadPaginated($leadId, $filters);
    }
}
