<?php

declare(strict_types=1);

namespace App\Modules\Trash;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class TrashServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->mapApiRoutes();
    }

    protected function mapApiRoutes(): void
    {
        Route::prefix('api')
            ->middleware('api')
            ->group(__DIR__ . '/Http/routes.php');
    }
}

