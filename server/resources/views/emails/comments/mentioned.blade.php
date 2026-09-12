<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You were mentioned</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="padding: 36px 40px; background: linear-gradient(135deg, #0f172a, #7c3aed); color: #ffffff;">
                            <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">
                                {{ config('app.name', 'Taskflow') }} Notification
                            </p>
                            <h1 style="margin: 0; font-size: 24px; line-height: 1.3; font-weight: 700;">
                                {{ $mentionedBy->name }} mentioned you
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 36px 40px 24px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
                                Hi <strong>{{ $mentionedUser->name }}</strong>,
                            </p>

                            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4b5563;">
                                You were mentioned in <strong>{{ $contextTitle }}</strong>:
                            </p>

                            <!-- Excerpt Quote Box -->
                            <div style="margin: 0 0 24px; padding: 18px 20px; background-color: #faf5ff; border-left: 4px solid #9333ea; border-radius: 0 12px 12px 0;">
                                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151; font-style: italic;">
                                    "{{ $sourceExcerpt }}"
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                <tr>
                                    <td>
                                        <a
                                            href="{{ $actionUrl }}"
                                            style="display: inline-block; padding: 12px 28px; border-radius: 10px; background-color: #7c3aed; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600;"
                                        >
                                            View in Conversation &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                                You received this notification because your username was @mentioned.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8;">
                            &copy; {{ date('Y') }} {{ config('app.name', 'Taskflow') }}. All rights reserved.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>

