<?php

declare(strict_types=1);

namespace App\Modules\Billing;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class BillingServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Modules\Billing\Services\PlanLimitService::class);
        $this->app->singleton(\App\Modules\Billing\Services\StripeService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/Database/Migrations');
        $this->mapApiRoutes();
    }

    /**
     * Map API routes for the module.
     */
    protected function mapApiRoutes(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__ . '/Http/routes.php');
    }
}
