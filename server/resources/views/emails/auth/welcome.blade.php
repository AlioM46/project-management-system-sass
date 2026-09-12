<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{ config('app.name', 'Taskflow') }}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="padding: 36px 40px; background: linear-gradient(135deg, #0f172a, #2563eb); color: #ffffff;">
                            <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">
                                {{ config('app.name', 'Taskflow') }}
                            </p>
                            <h1 style="margin: 0; font-size: 26px; line-height: 1.3; font-weight: 700;">
                                Welcome aboard, {{ $user->name }}! 🎉
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 36px 40px 24px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
                                We're thrilled to have you with us. Your account is ready, and you can now start collaborating with your team, managing projects, and tracking tasks seamlessly.
                            </p>

                            <!-- Highlights Box -->
                            <div style="margin: 20px 0 28px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                                <p style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #0f172a;">
                                    Quick tips to get started:
                                </p>
                                <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #4b5563;">
                                    <li>Create or join a <strong>Workspace</strong></li>
                                    <li>Set up your first <strong>Project</strong> and invite your teammates</li>
                                    <li>Organize tasks using <strong>Kanban boards</strong> and real-time chat</li>
                                </ul>
                            </div>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                <tr>
                                    <td>
                                        <a
                                            href="{{ $dashboardUrl }}"
                                            style="display: inline-block; padding: 14px 32px; border-radius: 10px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600;"
                                        >
                                            Go to Your Dashboard &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                                If you have any questions or feedback, simply reply directly to this email.
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

