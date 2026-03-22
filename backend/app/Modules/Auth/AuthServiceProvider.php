<?php

namespace App\Modules\Auth;

use App\Modules\Auth\Events\UserRegistered;
use App\Modules\Auth\Listeners\SendVerificationEmail;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/Database/Migrations');
        Event::listen(UserRegistered::class, SendVerificationEmail::class);
        $this->mapApiRoutes();
    }

    /**
     * Map API routes for the module.
     */
    protected function mapApiRoutes(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/Http/routes.php');
    }
}
