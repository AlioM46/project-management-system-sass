<?php

namespace App\Modules\Comments\Services;

use App\Modules\Comments\Model\Comment;
use App\Modules\Comments\Model\CommentAttachment;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class CommentAttachmentService
{
    public function upload(Comment $comment, array $attachments): void
    {
        foreach ($attachments as $attachment) {
            if (! $attachment instanceof UploadedFile) {
                continue;
            }

            $path = $attachment->store('attachments/'.$comment->lead_id, 'public');

            $comment->attachments()->create([
                'filename' => basename($path),
                'original_name' => $attachment->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $attachment->getMimeType(),
                'size' => $attachment->getSize(),
            ]);
        }
    }

    public function delete(CommentAttachment $attachment): void
    {
        Storage::disk('public')->delete($attachment->path);
        $attachment->delete();
    }

    public function deleteAll(Comment $comment): void
    {
        foreach ($comment->attachments as $attachment) {
            $this->delete($attachment);
        }
    }

    public function sync(Comment $comment, array $attachments): void
    {
        $this->deleteAll($comment);
        $this->upload($comment, $attachments);
    }
}
