<?php

namespace App\Modules\Leads;

use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Model\Student;
use App\Modules\Leads\Observers\StudentObserver;
use App\Modules\Leads\Services\Contracts\MessagingProvider;
use App\Modules\Leads\Services\Providers\WhatsAppProvider;
use App\Modules\Leads\Observers\LeadObserver;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class LeadsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(MessagingProvider::class, function () {
            return new WhatsAppProvider(
                config('messaging.providers.whatsapp', [])
            );
        });
    }

    public function boot(): void
    {
        Lead::observe(LeadObserver::class);
        Student::observe(StudentObserver::class);

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
