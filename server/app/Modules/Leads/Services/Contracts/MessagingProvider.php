<?php

namespace App\Modules\Leads\Services\Contracts;

use App\Modules\Leads\Services\DataTransferObjects\MessageDeliveryResult;

interface MessagingProvider
{
    public function sendTemplate(
        string $recipientPhone,
        string $templateKey,
        array $templateData,
        array $context = []
    ): MessageDeliveryResult;
}
