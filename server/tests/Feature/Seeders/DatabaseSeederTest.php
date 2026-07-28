<?php

use App\Modules\Comments\Model\Comment;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Model\Student;
use App\Modules\Notifications\Model\Notification;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('seeds a crm-shaped demo dataset', function () {
    $this->seed(DatabaseSeeder::class);

    expect(Workspace::query()->where('name', 'HyPro Automotive Academy')->exists())->toBeTrue()
        ->and(Course::query()->withoutGlobalScope(WorkspaceTenantScope::class)->count())->toBeGreaterThan(0)
        ->and(Stage::query()->withoutGlobalScope(WorkspaceTenantScope::class)->where('is_success', true)->exists())->toBeTrue()
        ->and(Lead::query()->withoutGlobalScope(WorkspaceTenantScope::class)->count())->toBeGreaterThan(0)
        ->and(Student::query()->withoutGlobalScope(WorkspaceTenantScope::class)->count())->toBeGreaterThan(0)
        ->and(Comment::query()->count())->toBeGreaterThan(0)
        ->and(Notification::query()->count())->toBeGreaterThan(0);
});
