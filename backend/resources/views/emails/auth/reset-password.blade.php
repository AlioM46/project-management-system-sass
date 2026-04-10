<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f7fb; font-family: Arial, Helvetica, sans-serif; color: #1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                    <tr>
                        <td style="padding: 36px 40px; background: linear-gradient(135deg, #0f172a, #1d4ed8); color: #ffffff;">
                            <p style="margin: 0 0 10px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">
                                {{ config('app.name') }}
                            </p>
                            <h1 style="margin: 0; font-size: 28px; line-height: 1.2; font-weight: 700;">
                                Reset your password
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 36px 40px 16px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
                                Hello {{ $user->name }},
                            </p>

                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
                                We received a request to reset the password for your account. Use the button below to choose a new password.
                            </p>

                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                <tr>
                                    <td>
                                        <a
                                            href="{{ $resetUrl }}"
                                            style="display: inline-block; padding: 14px 24px; border-radius: 10px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700;"
                                        >
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #4b5563;">
                                If the button does not work, copy and paste this link into your browser:
                            </p>

                            <p style="margin: 0 0 24px; padding: 14px 16px; background-color: #f8fafc; border: 1px solid #e5e7eb; border-radius: 10px; word-break: break-all; font-size: 14px; line-height: 1.7;">
                                <a href="{{ $resetUrl }}" style="color: #2563eb; text-decoration: none;">{{ $resetUrl }}</a>
                            </p>

                            <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.7; color: #4b5563;">
                                If you did not request a password reset, you can safely ignore this email.
                            </p>

                            <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #4b5563;">
                                For security, only use links from emails you expect from {{ config('app.name') }}.
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
