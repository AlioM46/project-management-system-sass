<?php

namespace App\Modules\Workspace;

use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class WorkspaceServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->scoped(WorkspaceContextService::class, function () {
            return new WorkspaceContextService();
        });
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
