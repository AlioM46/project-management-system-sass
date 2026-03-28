<?php

namespace App\Modules\RolesPermissions;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

/**
 * Bootstrap the RolesPermissions module.
 *
 * Responsibilities:
 * - load migrations
 * - register API routes
 */
class RolesPermissionsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    /**
     * Called by Laravel during application boot.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/Database/Migrations');
        $this->mapApiRoutes();
    }

    /**
     * Mount this module under /api.
     *
     * Final URL examples:
     * - /api/roles-permissions/permissions
     * - /api/roles-permissions/roles
     */
    protected function mapApiRoutes(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__ . '/Http/routes.php');
    }
}
