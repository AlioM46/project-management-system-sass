<?php

namespace App\Modules\Leads\Services\DataTransferObjects;

class MessageDeliveryResult
{
    public function __construct(
        public readonly bool $successful,
        public readonly ?string $providerMessageId = null,
        public readonly ?array $responsePayload = null,
        public readonly ?string $errorMessage = null
    ) {}
}
