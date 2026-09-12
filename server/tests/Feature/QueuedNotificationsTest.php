<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Auth\Events\UserRegistered;
use App\Modules\Auth\Mail\EmailVerificationMail;
use App\Modules\Auth\Mail\PasswordChangedMail;
use App\Modules\Auth\Mail\WelcomeRegisteredMail;
use App\Modules\Comments\Mail\MentionNotificationMail;
use App\Modules\Comments\Services\MentionService;
use App\Modules\Tasks\Mail\TaskAssignedMail;
use App\Modules\Tasks\Model\Task;
use App\Modules\Workspace\Mail\WorkspaceInviteMail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;

it('ensures all mailables implement ShouldQueue', function () {
    $mailables = [
        EmailVerificationMail::class,
        PasswordChangedMail::class,
        WorkspaceInviteMail::class,
        WelcomeRegisteredMail::class,
        TaskAssignedMail::class,
        MentionNotificationMail::class,
    ];

    foreach ($mailables as $mailableClass) {
        $reflection = new ReflectionClass($mailableClass);
        expect($reflection->implementsInterface(ShouldQueue::class))
            ->toBeTrue("{$mailableClass} must implement ShouldQueue");
    }
});

it('queues welcome email when UserRegistered event is dispatched', function () {
    Mail::fake();

    $user = new User();
    $user->id = 999;
    $user->name = 'John Doe';
    $user->email = 'john.doe@example.com';
    $user->username = 'johndoe';

    event(new UserRegistered($user));

    Mail::assertQueued(WelcomeRegisteredMail::class, function ($mail) use ($user) {
        return $mail->hasTo($user->email);
    });
});

it('renders task assigned email view without errors', function () {
    $assignee = new User(['name' => 'Alice', 'email' => 'alice@example.com']);
    $actor = new User(['name' => 'Bob', 'email' => 'bob@example.com']);
    $task = new Task(['id' => 1, 'title' => 'Implement Search', 'status' => 'in_progress']);

    $mailable = new TaskAssignedMail($task, $assignee, $actor);
    $html = $mailable->render();

    expect($html)
        ->toContain('You have been assigned a task')
        ->toContain('Implement Search')
        ->toContain('Bob');
});

it('renders mention notification email view without errors', function () {
    $mentioned = new User(['name' => 'Alice', 'email' => 'alice@example.com']);
    $actor = new User(['name' => 'Bob', 'email' => 'bob@example.com']);

    $mailable = new MentionNotificationMail(
        mentionedUser: $mentioned,
        mentionedBy: $actor,
        sourceType: 'comment',
        sourceExcerpt: 'Hey @alice check this out!'
    );
    $html = $mailable->render();

    expect($html)
        ->toContain('Bob mentioned you')
        ->toContain('Hey @alice check this out!');
});

it('renders welcome registered email view without errors', function () {
    $user = new User(['name' => 'Alice', 'email' => 'alice@example.com']);

    $mailable = new WelcomeRegisteredMail($user);
    $html = $mailable->render();

    expect($html)
        ->toContain('Welcome aboard, Alice!')
        ->toContain('Go to Your Dashboard');
});

