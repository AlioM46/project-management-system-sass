<?php

namespace App\Modules\Leads\Services\Providers;

use App\Modules\Leads\Services\Contracts\MessagingProvider;
use App\Modules\Leads\Services\DataTransferObjects\MessageDeliveryResult;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class WhatsAppProvider implements MessagingProvider
{
    public function __construct(
        private readonly array $config = []
    ) {}

    public function sendTemplate(
        string $recipientPhone,
        string $templateKey,
        array $templateData,
        array $context = []
    ): MessageDeliveryResult {
        if ($this->useFakeTransport()) {
            $payload = [
                'to' => $recipientPhone,
                'template' => $templateKey,
                'variables' => $templateData,
                'context' => $context,
            ];

            Log::info('crm.whatsapp.fake_send', $payload);

            return new MessageDeliveryResult(
                successful: true,
                providerMessageId: 'fake-'.uniqid(),
                responsePayload: ['mode' => 'fake', 'payload' => $payload]
            );
        }

        try {
            $response = Http::withToken((string) ($this->config['token'] ?? ''))
                ->acceptJson()
                ->post((string) $this->config['endpoint'], [
                    'to' => $recipientPhone,
                    'template' => $templateKey,
                    'variables' => $templateData,
                    'context' => $context,
                ]);

            if ($response->failed()) {
                return new MessageDeliveryResult(
                    successful: false,
                    responsePayload: $response->json(),
                    errorMessage: $response->body()
                );
            }

            $json = $response->json();

            return new MessageDeliveryResult(
                successful: true,
                providerMessageId: data_get($json, 'message_id') ?? data_get($json, 'id'),
                responsePayload: $json
            );
        } catch (Throwable $throwable) {
            return new MessageDeliveryResult(
                successful: false,
                errorMessage: $throwable->getMessage()
            );
        }
    }

    private function useFakeTransport(): bool
    {
        return (bool) ($this->config['fake'] ?? true)
            || empty($this->config['endpoint'])
            || empty($this->config['token']);
    }
}
