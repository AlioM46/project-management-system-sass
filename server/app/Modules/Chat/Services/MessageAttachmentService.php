<?php

namespace App\Modules\Chat\Services;

use App\Modules\Chat\Model\Message;
use App\Modules\Chat\Model\MessageAttachment;
use App\Modules\Chat\Support\MessageAttachmentStorage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class MessageAttachmentService
{


    public static function delete(MessageAttachment $attachment): void
    {
        try {
            Storage::disk(MessageAttachmentStorage::diskName())->delete($attachment->object_key);
            // $attachment->delete();
        } catch (\Throwable $e) {
            logger()->error('Chat attachment delete failed', [
                'error' => $e->getMessage(),
                'attachment_id' => $attachment->id,
                'disk' => MessageAttachmentStorage::diskName(),
            ]);

            throw $e;
        }
    }

    /**
     * Upload and create attachment records for a message.
     *
     * @param  array  $attachments  Array of UploadedFile objects
     */
    public function upload(Message $message, array $attachments): void
    {
        // $attachments => array of "files"

        $diskName = MessageAttachmentStorage::diskName();

        foreach ($attachments as $attachment) {
            if (!$attachment instanceof UploadedFile) {
                continue;
            }

            $fileName = uniqid() . '.' . $attachment->getClientOriginalExtension();
            try {


                $path = Storage::disk($diskName)->putFileAs(
                    'chat_attachments/' . $message->conversation_id,
                    $attachment,
                    $fileName
                );

                if (!$path) {
                    throw new \Exception('Upload failed for chat file');
                }

                MessageAttachment::create([
                    'message_id' => $message->id,
                    'object_key' => $path,
                    'original_name' => $attachment->getClientOriginalName(),
                    'file_type' => $attachment->getMimeType(),
                    'file_size' => $attachment->getSize(),
                ]);
            } catch (\Throwable $e) {
                logger()->error('Chat attachment upload failed', [
                    'error' => $e->getMessage(),
                    'message_id' => $message->id,
                    'disk' => $diskName,
                ]);

                throw $e;
            }
        }
    }
}
