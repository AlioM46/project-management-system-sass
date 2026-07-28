<?php

namespace App\Modules\Leads\Services;

use App\Modules\Leads\Services\Contracts\MessagingProvider;
use App\Modules\Leads\Services\DataTransferObjects\MessageDeliveryResult;

class MessagingService
{
    public function __construct(
        private readonly MessagingProvider $provider
    ) {}

    public function sendTemplate(
        string $recipientPhone,
        string $templateKey,
        array $templateData,
        array $context = []
    ): MessageDeliveryResult {
        return $this->provider->sendTemplate($recipientPhone, $templateKey, $templateData, $context);
    }

    public function providerName(): string
    {
        return (string) config('messaging.default_provider', 'whatsapp');
    }
}
