<?php

use App\Modules\Auth\AuthServiceProvider;
use App\Modules\Comments\CommentsServiceProvider;
use App\Modules\Projects\ProjectsServiceProvider;
use App\Modules\RolesPermissions\RolesPermissionsServiceProvider;
use App\Modules\Tasks\TasksServiceProvider;
use App\Modules\Workspace\WorkspaceServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    AuthServiceProvider::class,
    ProjectsServiceProvider::class,
    RolesPermissionsServiceProvider::class,
    TasksServiceProvider::class,
    WorkspaceServiceProvider::class,
    CommentsServiceProvider::class,
];
