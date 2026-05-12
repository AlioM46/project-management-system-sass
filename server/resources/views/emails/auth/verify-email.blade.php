<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Verify Email</title>
</head>
<body>
    <h1>Verify your email address</h1>

    <p>Hello {{ $user->name }},</p>

    <p>
        Thank you for registering. Click the link below to verify your email address.
    </p>

    <p>
        <a href="{{ $verificationUrl }}">Verify Email Address</a>
    </p>

    <p>
        This link expires at {{ $expiresAt->toDayDateTimeString() }}.
    </p>

    <p>
        If you did not create this account, you can ignore this email.
    </p>
</body>
</html>
