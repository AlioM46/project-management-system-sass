<?php

declare(strict_types=1);

namespace App\Modules\Comments\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class MentionNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $mentionedUser,
        public User $mentionedBy,
        public string $sourceType,
        public string $sourceExcerpt,
        public ?string $contextTitle = null,
        public ?string $actionUrl = null
    ) {}

    public function build(): self
    {
        $frontendUrl = config('app.frontend_url', config('app.url', 'http://localhost:3000'));
        $targetUrl = $this->actionUrl ?? (rtrim((string) $frontendUrl, '/') . '/dashboard');

        return $this->subject("{$this->mentionedBy->name} mentioned you in {$this->sourceType}")
            ->view('emails.comments.mentioned')
            ->with([
                'mentionedUser' => $this->mentionedUser,
                'mentionedBy' => $this->mentionedBy,
                'sourceType' => $this->sourceType,
                'sourceExcerpt' => $this->sourceExcerpt,
                'contextTitle' => $this->contextTitle ?? 'a discussion',
                'actionUrl' => $targetUrl,
            ]);
    }
}

