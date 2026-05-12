<?php

namespace App\Modules\Audit;

use App\Modules\Audit\Model\AuditLog;
use App\Modules\Comments\Model\Comment;
use App\Modules\Projects\Model\Project;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Tasks\Model\Task;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Model\WorkspaceInvitation;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AuditServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Relation::morphMap([
            'workspace' => Workspace::class,
            'project' => Project::class,
            'task' => Task::class,
            'comment' => Comment::class,
            'workspace_member' => Workspace_Members::class,
            'workspace_invitation' => WorkspaceInvitation::class,
            'role' => Role::class,
            'audit_log' => AuditLog::class,
        ]);

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
