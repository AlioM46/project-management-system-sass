<?php

use App\Modules\Audit\AuditServiceProvider;
use App\Modules\Auth\AuthServiceProvider;
use App\Modules\Chat\ChatServiceProvider;
use App\Modules\Comments\CommentsServiceProvider;
use App\Modules\Notifications\NotificationsServiceProvider;
use App\Modules\Courses\CoursesServiceProvider;
use App\Modules\RolesPermissions\RolesPermissionsServiceProvider;
use App\Modules\Leads\LeadsServiceProvider;
use App\Modules\Workspace\WorkspaceServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    AuthServiceProvider::class,
    AuditServiceProvider::class,
    CoursesServiceProvider::class,
    RolesPermissionsServiceProvider::class,
    LeadsServiceProvider::class,
    WorkspaceServiceProvider::class,
    CommentsServiceProvider::class,
    NotificationsServiceProvider::class,
    ChatServiceProvider::class,

];
