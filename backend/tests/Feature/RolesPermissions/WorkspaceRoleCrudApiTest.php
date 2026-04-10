<?php

use App\Models\User;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeWorkspaceRoleCrudUser(string $email, string $name = 'Role API User'): User
{
    return User::query()->create([
        'name' => $name,
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

function createWorkspaceRoleCrudWorkspace(User $user, string $name = 'RBAC Workspace'): Workspace
{
    return app(CreateWorkspace::class)->execute(['name' => $name], $user);
}

function findWorkspaceRoleBySlug(int $workspaceId, string $slug): Role
{
    return Role::query()
        ->withoutGlobalScopes()
        ->where('workspace_id', $workspaceId)
        ->where('slug', $slug)
        ->firstOrFail();
}

function attachWorkspaceRoleToUser(Workspace $workspace, User $user, string $roleSlug): Workspace_Members
{
    $role = findWorkspaceRoleBySlug($workspace->id, $roleSlug);

    return Workspace_Members::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->create([
            'workspace_id' => $workspace->id,
            'user_id' => $user->id,
            'role_id' => $role->id,
            'joined_at' => now(),
        ]);
}

it('creates and shows a custom workspace role', function () {
    $owner = makeWorkspaceRoleCrudUser('custom-role-owner@example.com');
    $workspace = createWorkspaceRoleCrudWorkspace($owner);

    $createResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/roles-permissions/roles', [
            'name' => 'Project Lead',
            'description' => 'Owns project execution.',
        ]);

    $createResponse->assertCreated()
        ->assertJsonPath('data.role.name', 'Project Lead')
        ->assertJsonPath('data.role.slug', 'project-lead')
        ->assertJsonPath('data.role.is_system', false)
        ->assertJsonPath('data.role.is_editable', true)
        ->assertJsonPath('data.role.is_deletable', true)
        ->assertJsonPath('data.role.member_count', 0);

    $roleId = $createResponse->json('data.role.id');

    $showResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson("/api/roles-permissions/roles/{$roleId}");

    $showResponse->assertOk()
        ->assertJsonPath('data.role.id', $roleId)
        ->assertJsonPath('data.role.slug', 'project-lead')
        ->assertJsonPath('data.role.permissions', []);
});

it('rejects reserved system names and slugs for custom roles', function () {
    $owner = makeWorkspaceRoleCrudUser('reserved-role-owner@example.com');
    $workspace = createWorkspaceRoleCrudWorkspace($owner);

    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/roles-permissions/roles', [
            'name' => 'Owner',
            'slug' => 'owner',
        ]);

    $response->assertStatus(422)
        ->assertJsonPath('error.code', 'VALIDATION_ERROR')
        ->assertJsonPath('error.meta.errors.name.0', 'The selected role name is reserved.')
        ->assertJsonPath('error.meta.errors.slug.0', 'The selected role slug is reserved.');
});

it('updates only custom roles and rejects built-in role updates', function () {
    $owner = makeWorkspaceRoleCrudUser('update-role-owner@example.com');
    $workspace = createWorkspaceRoleCrudWorkspace($owner);

    $customRole = Role::query()
        ->withoutGlobalScopes()
        ->create([
            'workspace_id' => $workspace->id,
            'name' => 'QA Lead',
            'slug' => 'qa-lead',
            'description' => 'Owns QA delivery.',
            'is_system' => false,
            'is_editable' => true,
            'is_deletable' => true,
        ]);

    $updateResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson("/api/roles-permissions/roles/{$customRole->id}", [
            'name' => 'QA Manager',
            'slug' => 'qa-manager',
        ]);

    $updateResponse->assertOk()
        ->assertJsonPath('data.role.name', 'QA Manager')
        ->assertJsonPath('data.role.slug', 'qa-manager');

    $ownerRole = findWorkspaceRoleBySlug($workspace->id, 'owner');

    $blockedResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->patchJson("/api/roles-permissions/roles/{$ownerRole->id}", [
            'name' => 'New Owner Name',
        ]);

    $blockedResponse->assertStatus(422)
        ->assertJsonPath('error.code', 'ROLE_SYSTEM_NOT_EDITABLE');
});

it('deletes custom roles only when they are not assigned', function () {
    $owner = makeWorkspaceRoleCrudUser('delete-role-owner@example.com');
    $workspace = createWorkspaceRoleCrudWorkspace($owner);
    $assignee = makeWorkspaceRoleCrudUser('assignee@example.com', 'Assignee User');

    $customRole = Role::query()
        ->withoutGlobalScopes()
        ->create([
            'workspace_id' => $workspace->id,
            'name' => 'Support Lead',
            'slug' => 'support-lead',
            'description' => null,
            'is_system' => false,
            'is_editable' => true,
            'is_deletable' => true,
        ]);

    attachWorkspaceRoleToUser($workspace, $assignee, 'support-lead');

    $blockedResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->deleteJson("/api/roles-permissions/roles/{$customRole->id}");

    $blockedResponse->assertStatus(409)
        ->assertJsonPath('error.code', 'ROLE_STILL_ASSIGNED');

    Workspace_Members::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->where('workspace_id', $workspace->id)
        ->where('role_id', $customRole->id)
        ->delete();

    $deleteResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->deleteJson("/api/roles-permissions/roles/{$customRole->id}");

    $deleteResponse->assertOk()
        ->assertJsonPath('data.role.slug', 'support-lead');

    $ownerRole = findWorkspaceRoleBySlug($workspace->id, 'owner');

    $systemDeleteResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->deleteJson("/api/roles-permissions/roles/{$ownerRole->id}");

    $systemDeleteResponse->assertStatus(422)
        ->assertJsonPath('error.code', 'ROLE_SYSTEM_NOT_DELETABLE');
});

it('updates permissions for a custom role and rejects invalid keys', function () {
    $owner = makeWorkspaceRoleCrudUser('permissions-role-owner@example.com');
    $workspace = createWorkspaceRoleCrudWorkspace($owner);

    $customRole = Role::query()
        ->withoutGlobalScopes()
        ->create([
            'workspace_id' => $workspace->id,
            'name' => 'Reporter',
            'slug' => 'reporter',
            'description' => null,
            'is_system' => false,
            'is_editable' => true,
            'is_deletable' => true,
        ]);

    $successResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->putJson("/api/roles-permissions/roles/{$customRole->id}/permissions", [
            'permissions' => ['report.view', 'report.export'],
        ]);

    $successResponse->assertOk()
        ->assertJsonPath('data.role.permissions.0.key', 'report.export')
        ->assertJsonPath('data.role.permissions.1.key', 'report.view');

    $invalidResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->putJson("/api/roles-permissions/roles/{$customRole->id}/permissions", [
            'permissions' => ['report.view', 'does.not.exist'],
        ]);

    $invalidResponse->assertStatus(422)
        ->assertJsonPath('error.code', 'ROLE_INVALID_PERMISSIONS');
});

it('enforces workspace scoping for role access and permission updates', function () {
    $owner = makeWorkspaceRoleCrudUser('scoped-role-owner@example.com');
    $workspaceA = createWorkspaceRoleCrudWorkspace($owner, 'Workspace A');
    $workspaceB = createWorkspaceRoleCrudWorkspace($owner, 'Workspace B');

    $roleInWorkspaceB = Role::query()
        ->withoutGlobalScopes()
        ->create([
            'workspace_id' => $workspaceB->id,
            'name' => 'Finance Lead',
            'slug' => 'finance-lead',
            'description' => null,
            'is_system' => false,
            'is_editable' => true,
            'is_deletable' => true,
        ]);

    $showResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspaceA->id)
        ->getJson("/api/roles-permissions/roles/{$roleInWorkspaceB->id}");

    $showResponse->assertStatus(404)
        ->assertJsonPath('error.code', 'ROLE_NOT_FOUND');

    $permissionsResponse = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspaceA->id)
        ->putJson("/api/roles-permissions/roles/{$roleInWorkspaceB->id}/permissions", [
            'permissions' => ['task.view'],
        ]);

    $permissionsResponse->assertStatus(404)
        ->assertJsonPath('error.code', 'ROLE_NOT_FOUND');
});

it('blocks permission escalation when a non-owner assigns permissions they do not have', function () {
    $owner = makeWorkspaceRoleCrudUser('rbac-owner@example.com');
    $admin = makeWorkspaceRoleCrudUser('rbac-admin@example.com', 'Admin User');
    $workspace = createWorkspaceRoleCrudWorkspace($owner);

    attachWorkspaceRoleToUser($workspace, $admin, 'admin');

    $customRole = Role::query()
        ->withoutGlobalScopes()
        ->create([
            'workspace_id' => $workspace->id,
            'name' => 'Ops Lead',
            'slug' => 'ops-lead',
            'description' => null,
            'is_system' => false,
            'is_editable' => true,
            'is_deletable' => true,
        ]);

    $response = $this->withToken(JWTAuth::fromUser($admin))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->putJson("/api/roles-permissions/roles/{$customRole->id}/permissions", [
            'permissions' => ['workspace.delete'],
        ]);

    $response->assertStatus(403)
        ->assertJsonPath('error.code', 'ROLE_PERMISSION_GRANT_FORBIDDEN');
});
