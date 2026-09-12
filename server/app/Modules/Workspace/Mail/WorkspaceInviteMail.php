<?php

declare(strict_types=1);

namespace App\Modules\Workspace\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class WorkspaceInviteMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $workspaceName,
        public string $roleName,
        public string $inviteeEmail,
        public string $inviterName,
        public string $acceptUrl,
        public Carbon $expiresAt,
        public ?string $message = null
    ) {}

    public function build(): self
    {
        return $this->subject('You are invited to join a workspace')
            ->view('emails.workspace.invite')
            ->with([
                'workspaceName' => $this->workspaceName,
                'roleName' => $this->roleName,
                'inviteeEmail' => $this->inviteeEmail,
                'inviterName' => $this->inviterName,
                'acceptUrl' => $this->acceptUrl,
                'expiresAt' => $this->expiresAt,
                'messageBody' => $this->message,
            ]);
    }
}
