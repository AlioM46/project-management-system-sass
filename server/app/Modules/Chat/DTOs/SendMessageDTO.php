<?php

declare(strict_types=1);

namespace App\Modules\Chat\DTOs;

final class SendMessageDTO
{
    public function __construct(
        public int $conversationId,
        public int $userId,
        public ?string $body = null,
        public ?int $replyId = null,
        public array $attachments = [],
    ) {
    }
}
