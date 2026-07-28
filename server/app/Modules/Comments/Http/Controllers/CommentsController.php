<?php

namespace App\Modules\Comments\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Comments\Actions\Comments\CreateCommentAction;
use App\Modules\Comments\Actions\Comments\DeleteAttachmentAction;
use App\Modules\Comments\Actions\Comments\DeleteCommentAction;
use App\Modules\Comments\Actions\Comments\GetCommentAction;
use App\Modules\Comments\Actions\Comments\ListCommentsAction;
use App\Modules\Comments\Actions\Comments\UpdateCommentAction;
use App\Modules\Comments\Http\Requests\CreateCommentRequest;
use App\Modules\Comments\Http\Requests\UpdateCommentRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CommentsController extends Controller
{
    public function store(CreateCommentRequest $request, CreateCommentAction $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Comment created successfully.',
            data: ['comment' => $action->execute($request)],
            status: Response::HTTP_CREATED
        );
    }

    public function index(int $leadId, ListCommentsAction $action): JsonResponse
    {
        $comments = $action->execute($leadId, request()->only(['page', 'per_page']));

        return ApiResponse::success(
            message: 'Comments retrieved successfully.',
            data: [
                'count' => count($comments->items()),
                'comments' => $comments->items(),
            ],
            meta: [
                'pagination' => [
                    'current_page' => $comments->currentPage(),
                    'last_page' => $comments->lastPage(),
                    'per_page' => $comments->perPage(),
                    'total' => $comments->total(),
                ],
            ]
        );
    }

    public function show(int $commentId, GetCommentAction $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Comment retrieved successfully.',
            data: ['comment' => $action->execute($commentId)]
        );
    }

    public function update(UpdateCommentRequest $request, int $commentId, UpdateCommentAction $action): JsonResponse
    {
        $attachments = null;

        if ($request->hasFile('attachments') || $request->exists('attachments')) {
            $attachments = array_merge(
                $request->file('attachments', []),
                $request->input('attachments', [])
            );
        }

        return ApiResponse::success(
            message: 'Comment updated successfully.',
            data: ['comment' => $action->execute($commentId, request()->user(), $request->validated('content'), $attachments)]
        );
    }

    public function destroy(int $commentId, DeleteCommentAction $action): Response
    {
        $action->execute($commentId, request()->user());

        return response()->noContent();
    }

    public function destroyAttachment(int $attachmentId, DeleteAttachmentAction $action): Response
    {
        $action->execute($attachmentId, request()->user());

        return response()->noContent();
    }
}
