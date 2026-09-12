<?php

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeRoleAuditUser(string $email): User
{
    return User::query()->create([
        'name' => 'Role Audit User',
        'username' => str_replace(['@', '.'], '', $email),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('records role created audit log through the API', function () {
    $user = makeRoleAuditUser('role-audit@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Role WS'], $user);

    $proPlan = \App\Modules\Billing\Model\Plan::query()->create([
        'name' => 'Pro',
        'slug' => 'pro',
        'price_monthly_cents' => 1500,
        'price_yearly_cents' => 15000,
        'max_members' => 25,
        'max_projects' => null,
        'max_tasks_per_project' => null,
        'max_storage_bytes' => 21474836480,
        'max_file_size_bytes' => 104857600,
        'max_custom_roles' => 10,
        'has_audit_logs' => true,
        'has_advanced_analytics' => true,
        'has_data_export' => true,
        'has_priority_support' => false,
    ]);

    \App\Modules\Billing\Model\Subscription::query()->create([
        'workspace_id' => $workspace->id,
        'plan_id' => $proPlan->id,
        'status' => 'active',
    ]);

    Permission::query()->count();

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/roles-permissions/roles', [
            'name' => 'Support',
            'slug' => 'support',
        ]);

    $response->assertCreated();

    $roleId = $response->json('data.role.id');

    expect(AuditLog::query()
        ->where('workspace_id', $workspace->id)
        ->where('actor_user_id', $user->id)
        ->where('event_type', AuditAction::RoleCreated->value)
        ->where('target_id', $roleId)
        ->exists())->toBeTrue();
});

