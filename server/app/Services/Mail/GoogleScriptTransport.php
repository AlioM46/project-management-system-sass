<?php

namespace App\Services\Mail;

use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\MessageConverter;

class GoogleScriptTransport extends AbstractTransport
{
    public function __construct(
        protected string $endpoint
    ) {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());

        $to = collect($email->getTo())->map(fn (Address $address) => $address->getAddress())->implode(',');
        $subject = $email->getSubject() ?? '';
        $html = $email->getHtmlBody() ?? $email->getTextBody() ?? '';

        Http::timeout(15)->asJson()->post($this->endpoint, [
            'to' => $to,
            'subject' => $subject,
            'html' => (string) $html,
        ]);
    }

    public function __toString(): string
    {
        return 'google_script';
    }
}
