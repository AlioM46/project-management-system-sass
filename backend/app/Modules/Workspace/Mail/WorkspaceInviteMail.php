<?php

namespace App\Modules\Workspace\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Support\Carbon;

class WorkspaceInviteMail extends Mailable
{
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
