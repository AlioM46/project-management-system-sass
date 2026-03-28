<?php

namespace App\Modules\RolesPermissions;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class RolesPermissionsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/Database/Migrations');
        $this->mapApiRoutes();
    }

    protected function mapApiRoutes(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__.'/Http/routes.php');
    }
}
