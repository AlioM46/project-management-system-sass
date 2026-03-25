<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Temporary Reset Password</title>
    <style>
        :root {
            color-scheme: light;
            --bg: #f4efe6;
            --panel: #fffaf2;
            --line: #d7c8b5;
            --ink: #24180f;
            --muted: #6b5a49;
            --accent: #ad4e1a;
            --accent-dark: #7d3510;
            --danger: #a61b1b;
            --success: #17633f;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: Georgia, "Times New Roman", serif;
            background:
                radial-gradient(circle at top left, rgba(173, 78, 26, 0.18), transparent 28rem),
                linear-gradient(135deg, #f9f4ec 0%, var(--bg) 55%, #eadcc8 100%);
            color: var(--ink);
            display: grid;
            place-items: center;
            padding: 24px;
        }

        .card {
            width: min(100%, 560px);
            background: rgba(255, 250, 242, 0.94);
            border: 1px solid var(--line);
            border-radius: 24px;
            box-shadow: 0 24px 70px rgba(36, 24, 15, 0.12);
            padding: 32px;
        }

        h1 {
            margin: 0 0 10px;
            font-size: clamp(2rem, 4vw, 2.8rem);
            line-height: 1;
            letter-spacing: -0.03em;
        }

        p {
            margin: 0 0 20px;
            color: var(--muted);
            line-height: 1.6;
        }

        .badge {
            display: inline-block;
            margin-bottom: 16px;
            padding: 6px 10px;
            border-radius: 999px;
            background: rgba(173, 78, 26, 0.12);
            color: var(--accent-dark);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        .grid {
            display: grid;
            gap: 14px;
        }

        label {
            display: grid;
            gap: 8px;
            font-size: 14px;
            font-weight: 700;
        }

        input {
            width: 100%;
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 14px 16px;
            font: inherit;
            color: var(--ink);
            background: #fffdf9;
        }

        input[readonly] {
            background: #f8f0e6;
            color: var(--muted);
        }

        button {
            margin-top: 10px;
            border: 0;
            border-radius: 14px;
            padding: 14px 18px;
            font: inherit;
            font-weight: 700;
            color: #fffaf2;
            background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
            cursor: pointer;
        }

        button:disabled {
            opacity: 0.7;
            cursor: wait;
        }

        .status {
            margin-top: 18px;
            padding: 14px 16px;
            border-radius: 14px;
            display: none;
            line-height: 1.5;
        }

        .status.visible {
            display: block;
        }

        .status.success {
            background: rgba(23, 99, 63, 0.1);
            color: var(--success);
            border: 1px solid rgba(23, 99, 63, 0.2);
        }

        .status.error {
            background: rgba(166, 27, 27, 0.08);
            color: var(--danger);
            border: 1px solid rgba(166, 27, 27, 0.16);
        }
    </style>
</head>

<body>
    <main class="card">
        <div class="badge">Temporary Page</div>
        <h1>Reset Password</h1>
        <p>This is a temporary local testing page for the password reset flow. It uses the token from the reset link and
            submits to the API endpoint directly.</p>

        <form id="reset-password-form" class="grid">
            <label>
                Email
                <input type="email" id="email" name="email" value="{{ $email }}" readonly>
            </label>

            <label>
                Token
                <input type="text" id="plain_token" name="plain_token" value="{{ $token }}" readonly>
            </label>

            <label>
                New Password
                <input type="password" id="password" name="password" placeholder="Enter your new password" required>
            </label>

            <label>
                Confirm New Password
                <input type="password" id="password_confirmation" name="password_confirmation"
                    placeholder="Repeat your new password" required>
            </label>

            <button type="submit" id="submit-button">Reset Password</button>
        </form>

        <div id="status" class="status"></div>
    </main>

    <script>
        const form = document.getElementById('reset-password-form');
        const submitButton = document.getElementById('submit-button');
        const statusBox = document.getElementById('status');

        function showStatus(type, message) {
            statusBox.className = 'status visible ' + type;
            statusBox.textContent = message;
        }

        form.addEventListener('submit', async function (event) {
            event.preventDefault();
            submitButton.disabled = true;
            showStatus('success', 'Submitting request...');

            const payload = {
                email: document.getElementById('email').value,
                plain_token: document.getElementById('plain_token').value,
                password: document.getElementById('password').value,
                password_confirmation: document.getElementById('password_confirmation').value,
            };

            try {
                const response = await fetch('/api/auth/password/reset-password', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (!response.ok) {
                    const message = data?.error?.message || 'Reset password failed.';
                    showStatus('error', message);
                    return;
                }

                showStatus('success', data?.message || 'Password reset successful.');
                form.reset();
                document.getElementById('email').value = payload.email;
                document.getElementById('plain_token').value = payload.plain_token;
            } catch (error) {
                showStatus('error', 'Could not reach the reset password endpoint.');
            } finally {
                submitButton.disabled = false;
            }
        });
    </script>
</body>

</html>