<?php

declare(strict_types=1);

namespace App\Providers;

use App\Modules\Auth\Events\UserRegistered;
use App\Modules\Auth\Listeners\SendWelcomeEmail;
use App\Services\Mail\GoogleScriptTransport;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
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
    }
}
