<?php

namespace App\Modules\Comments\Services;

use App\Modules\Comments\Model\Comment;
use App\Modules\Comments\Model\CommentAttachment;
use App\Modules\Comments\Support\CommentAttachmentStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CommentAttachmentService
{
    /**
     * Upload and create attachment records for a comment.
     *
     * @param  array  $attachments  Array of UploadedFile objects
     */
    public function upload(Comment $comment, array $attachments): void
    {
        $diskName = CommentAttachmentStorage::diskName();

        foreach ($attachments as $attachment) {
            if (!$attachment instanceof UploadedFile) {
                continue;
            }

            $fileName = uniqid() . '.' . $attachment->getClientOriginalExtension();
            try {
                $path = Storage::disk($diskName)->putFileAs(
                    'attachments/' . $comment->task_id,
                    $attachment,
                    $fileName
                );

                if (!$path) {
                    throw new \Exception('Upload failed for file');
                }

                CommentAttachment::create([
                    'comment_id' => $comment->id,
                    'object_key' => $path,
                    'original_name' => $attachment->getClientOriginalName(),
                    'file_type' => $attachment->getMimeType(),
                    'file_size' => $attachment->getSize(),
                ]);
            }
            catch (\Throwable $e) {
                logger()->error('Comment attachment upload failed', [
                    'error' => $e->getMessage(),
                    'comment_id' => $comment->id,
                    'disk' => $diskName,
                ]);

                throw $e;
            }
        }
    }

    /**
     * Delete a single attachment.
     */
    public function delete(CommentAttachment $attachment): void
    {
        Storage::disk(CommentAttachmentStorage::diskName())->delete($attachment->object_key);
        $attachment->delete();
    }

    /**
     * Delete all attachments for a comment.
     *
     * @param Comment $comment
     */
    public function deleteAll(Comment $comment): void
    {
        foreach ($comment->attachments as $attachment) {
            $this->delete($attachment);
        }
    }

    /**
     * Synchronize attachments for a comment.
     *
     * @param Comment $comment
     * @param array $attachments Mixed array of IDs (int|string) and new files (UploadedFile)
     */
    public function sync(Comment $comment, array $attachments): void
    {
        $requestedIds = [];
        $newFiles = [];

        foreach ($attachments as $item) {
            if ($item instanceof UploadedFile) {
                $newFiles[] = $item;
            }
            elseif (is_numeric($item)) {
                $requestedIds[] = (int)$item;
            }
        }

        // 1. Remove attachments that are no longer requested
        $comment->loadMissing('attachments');
        foreach ($comment->attachments as $existing) {
            if (!in_array($existing->id, $requestedIds, true)) {
                $this->delete($existing);
            }
        }

        // 2. Upload new files
        if (!empty($newFiles)) {
            $this->upload($comment, $newFiles);
        }
    }
}
