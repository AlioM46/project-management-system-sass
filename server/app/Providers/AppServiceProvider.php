<?php

declare(strict_types=1);

namespace App\Providers;

use App\Modules\Auth\Events\UserRegistered;
use App\Modules\Auth\Listeners\SendWelcomeEmail;
use App\Services\Mail\GoogleScriptTransport;
use App\Shared\Http\ApiResponse;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Mail::extend('google_script', function (array $config = []) {
            $endpoint = $config['endpoint'] ?? env('GOOGLE_SCRIPT_MAIL_URL', '');
            return new GoogleScriptTransport($endpoint);
        });

        $this->configureRateLimiting();
    }

    /**
     * Configure rate limiting for the application.
     */
    protected function configureRateLimiting(): void
    {
        // 1. General API: 120 req/min for authenticated users (User + Workspace isolation), 60 req/min for guests.
        RateLimiter::for('api', function (Request $request) {
            $user = $request->user('api') ?? $request->user();

            if ($user) {
                $workspaceId = $request->header('X-Workspace-Id') ?? 'default';
                return Limit::perMinute(120)->by("user:{$user->id}:ws:{$workspaceId}");
            }

            return Limit::perMinute(60)->by($request->ip());
        });

        // 2. Strict Auth Login: 5 attempts/min per IP + Identity (login/email) to prevent brute-force.
        RateLimiter::for('auth.login', function (Request $request) {
            $identifier = strtolower(trim((string) ($request->input('login') ?? $request->input('email') ?? '')));
            $throttleKey = 'login:' . $request->ip() . '|' . $identifier;

            return Limit::perMinute(5)
                ->by($throttleKey)
                ->response(function (Request $request, array $headers) {
                    return ApiResponse::error(
                        message: 'Too many login attempts. Please try again in 1 minute.',
                        code: 'TOO_MANY_ATTEMPTS',
                        meta: [
                            'retry_after' => $headers['Retry-After'] ?? 60,
                        ],
                        status: 429
                    );
                });
        });

        // 3. Strict Auth Register: 5 registrations/min per IP to prevent spam bot accounts.
        RateLimiter::for('auth.register', function (Request $request) {
            return Limit::perMinute(5)
                ->by('register:' . $request->ip())
                ->response(function (Request $request, array $headers) {
                    return ApiResponse::error(
                        message: 'Too many registration attempts. Please try again later.',
                        code: 'TOO_MANY_ATTEMPTS',
                        meta: [
                            'retry_after' => $headers['Retry-After'] ?? 60,
                        ],
                        status: 429
                    );
                });
        });

        // 4. Strict Password Reset: 3 requests/min per IP + Email to prevent SMTP exhaustion.
        RateLimiter::for('auth.password', function (Request $request) {
            $email = strtolower(trim((string) $request->input('email', '')));
            $throttleKey = 'pwd:' . $request->ip() . '|' . $email;

            return Limit::perMinute(3)
                ->by($throttleKey)
                ->response(function (Request $request, array $headers) {
                    return ApiResponse::error(
                        message: 'Too many password reset attempts. Please wait before requesting another link.',
                        code: 'TOO_MANY_ATTEMPTS',
                        meta: [
                            'retry_after' => $headers['Retry-After'] ?? 60,
                        ],
                        status: 429
                    );
                });
        });
    }
}
