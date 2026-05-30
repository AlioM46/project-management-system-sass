<?php

namespace App\Modules\Comments\Support;

class CommentAttachmentStorage
{
    public static function diskName(): string
    {
        return filled(config('filesystems.disks.r2.bucket')) ? 'r2' : 'public';
    }
}
