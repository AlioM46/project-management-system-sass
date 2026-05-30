<?php

namespace App\Modules\Comments\Model;

use App\Modules\Comments\Support\CommentAttachmentStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class CommentAttachment extends Model
{
    protected $table = 'comment_attachments';

    protected $fillable = [
        'comment_id',
        'object_key',
        'original_name',
        'file_type',
        'file_size',
    ];

    protected $appends = [
        'file_name',
        'download_url',
    ];

    public function comment()
    {
        return $this->belongsTo(Comment::class);
    }

    public function getFileNameAttribute(): string
    {
        return (string) ($this->original_name ?: basename((string) $this->object_key));
    }

    public function getDownloadUrlAttribute(): ?string
    {
        $disk = Storage::disk(CommentAttachmentStorage::diskName());

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
