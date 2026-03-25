<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Changed</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f7fb; font-family: Arial, Helvetica, sans-serif; color: #1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="padding: 36px 40px; background: linear-gradient(135deg, #14532d, #15803d); color: #ffffff;">
                            <p style="margin: 0 0 10px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">
                                {{ config('app.name') }}
                            </p>
                            <h1 style="margin: 0; font-size: 28px; line-height: 1.2; font-weight: 700;">
                                Your password was changed
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 36px 40px 16px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
                                Hello {{ $user->name }},
                            </p>

                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
                                This is a confirmation that the password for your account has just been changed.
                            </p>

                            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #4b5563;">
                                If you made this change, no further action is required.
                            </p>

                            <p style="margin: 0 0 24px; padding: 14px 16px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; font-size: 14px; line-height: 1.7; color: #991b1b;">
                                If you did not change your password, reset it immediately and review your account access.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 24px 40px 36px; color: #6b7280; font-size: 13px; line-height: 1.7;">
                            This message was sent automatically. Please do not reply to this email.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
