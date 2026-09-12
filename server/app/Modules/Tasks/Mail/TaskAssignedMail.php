<?php

declare(strict_types=1);

namespace App\Modules\Tasks\Mail;

use App\Models\User;
use App\Modules\Tasks\Model\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskAssignedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public Task $task,
        public User $assignee,
        public User $actor
    ) {}

    public function build(): self
    {
        $this->task->loadMissing(['project', 'workspace']);
        
        $frontendUrl = config('app.frontend_url', config('app.url', 'http://localhost:3000'));
        $taskUrl = rtrim((string) $frontendUrl, '/') . '/dashboard/tasks?taskId=' . $this->task->id;

        return $this->subject("You were assigned to: {$this->task->title}")
            ->view('emails.tasks.assigned')
            ->with([
                'task' => $this->task,
                'assignee' => $this->assignee,
                'actor' => $this->actor,
                'projectName' => $this->task->project?->name ?? 'General',
                'workspaceName' => $this->task->workspace?->name ?? 'Workspace',
                'taskUrl' => $taskUrl,
            ]);
    }
}

