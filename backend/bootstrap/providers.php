<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Modules\Auth\AuthServiceProvider::class,
    App\Modules\Projects\ProjectsServiceProvider::class,
    App\Modules\RolesPermissions\RolesPermissionsServiceProvider::class,
    App\Modules\Workspace\WorkspaceServiceProvider::class,
];
