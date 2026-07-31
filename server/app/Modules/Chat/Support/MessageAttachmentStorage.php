<?php

namespace App\Modules\Chat\Support;

class MessageAttachmentStorage
{
    public static function diskName(): string
    {
        return filled(config('filesystems.disks.r2.bucket')) ? 'r2' : 'public';
    }
}
