<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Task Assigned</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f7fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 620px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="padding: 36px 40px; background: linear-gradient(135deg, #0f172a, #1d4ed8); color: #ffffff;">
                            <p style="margin: 0 0 8px; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">
                                {{ $workspaceName }} &bull; {{ $projectName }}
                            </p>
                            <h1 style="margin: 0; font-size: 24px; line-height: 1.3; font-weight: 700;">
                                You have been assigned a task
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 36px 40px 24px;">
                            <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6;">
                                Hi <strong>{{ $assignee->name }}</strong>,
                            </p>

                            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4b5563;">
                                <strong>{{ $actor->name }}</strong> assigned you to the following task:
                            </p>

                            <!-- Task Card -->
                            <div style="margin: 0 0 24px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
                                <h3 style="margin: 0 0 8px; font-size: 18px; color: #0f172a; font-weight: 600;">
                                    {{ $task->title }}
                                </h3>
                                @if($task->description)
                                    <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.6; color: #64748b;">
                                        {{ \Illuminate\Support\Str::limit($task->description, 160) }}
                                    </p>
                                @endif
                                <div style="display: flex; gap: 12px; font-size: 13px; color: #64748b;">
                                    <span>Status: <strong style="color: #0f172a; text-transform: capitalize;">{{ str_replace('_', ' ', $task->status) }}</strong></span>
                                </div>
                            </div>

                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                                <tr>
                                    <td>
                                        <a
                                            href="{{ $taskUrl }}"
                                            style="display: inline-block; padding: 12px 28px; border-radius: 10px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600;"
                                        >
                                            View Task in Workspace &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #94a3b8;">
                                You received this notification because you are a member of {{ $workspaceName }}.
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

