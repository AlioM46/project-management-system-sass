<?php

namespace App\Modules\Comments\Actions\Comments;

use App\Modules\Comments\Http\Requests\CreateCommentRequest;
use App\Modules\Comments\Services\CommentService;
use App\Modules\Leads\Model\Lead;

class CreateCommentAction
{
    public function __construct(private CommentService $service) {}

    public function execute(CreateCommentRequest $request)
    {
        $lead = Lead::findOrFail($request->lead_id);
        $validated = $request->validated();

        return $this->service->createWithAttachments(
            $lead,
            $request->user(),
            $validated['content'],
            $validated['attachments'] ?? [],
            $validated['parent_id'] ?? null
        );
    }
}
