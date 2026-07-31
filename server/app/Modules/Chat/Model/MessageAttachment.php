<?php

namespace App\Modules\Chat\Model;

use App\Modules\Chat\Support\MessageAttachmentStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class MessageAttachment extends Model
{
    protected $table = 'message_attachments';

    protected $fillable = [
        'message_id',
        'object_key',
        'original_name',
        'file_type',
        'file_size',
    ];

    protected $appends = [
        'file_name',
        'download_url',
    ];

    public function message(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'message_id');
    }

    public function getFileNameAttribute(): string
    {
        return (string) ($this->original_name ?: basename((string) $this->object_key));
    }

    public function getDownloadUrlAttribute(): ?string
    {
        $disk = Storage::disk(MessageAttachmentStorage::diskName());

        try {
            return $disk->temporaryUrl($this->object_key, now()->addMinutes(10));
        } catch (\Throwable) {
            try {
                return $disk->url($this->object_key);
            } catch (\Throwable) {
                return null;
            }
        }
    }
}
