<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Workspace Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
    <h2>You have been invited to join {{ $workspaceName }}</h2>

    <p>Hello {{ $inviteeEmail }},</p>

    <p>
        {{ $inviterName }} invited you to join the workspace
        <strong>{{ $workspaceName }}</strong>
        as <strong>{{ $roleName }}</strong>.
    </p>

    @if(!empty($messageBody))
        <p><strong>Message:</strong> {{ $messageBody }}</p>
    @endif

    <p>
        <a href="{{ $acceptUrl }}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 6px;">
            Accept Invitation
        </a>
    </p>

    <p>This invitation expires at {{ $expiresAt->toDateTimeString() }}.</p>

    <p>If you did not expect this invite, you can ignore this email.</p>
</body>
</html>
