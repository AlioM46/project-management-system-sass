<?php

namespace App\Modules\Chat\Support;

class MessageAttachmentStorage
{
    public static function diskName(): string
    {
        // if filesystems.disks.r2.bucket is Filled (not null or white spaces), use "R2" else use "public" 
        return filled(config('filesystems.disks.r2.bucket')) ? 'r2' : 'public';
    }
}
