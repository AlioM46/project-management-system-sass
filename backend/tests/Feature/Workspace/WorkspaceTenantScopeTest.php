<?php

use App\Models\User;
use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

it('scopes role queries to the current workspace automatically', function () {
    $makeUser = fn (string $name, string $email) => User::query()->create([
        'name' => $name,
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);

    $user = $makeUser('Ali Omar', 'ali@example.com');

    $workspaceA = Workspace::query()->create([
        'name' => 'Workspace A',
        'created_by_user_id' => $user->id,
    ]);

    $workspaceB = Workspace::query()->create([
        'name' => 'Workspace B',
        'created_by_user_id' => $user->id,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $workspaceA->id,
        'user_id' => $user->id,
        'role_id' => null,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $workspaceB->id,
        'user_id' => $user->id,
        'role_id' => null,
    ]);

    Role::query()->create([
        'workspace_id' => $workspaceA->id,
        'name' => 'Manager',
        'description' => 'Workspace A role',
        'is_system' => false,
    ]);

    Role::query()->withoutGlobalScope(WorkspaceTenantScope::class)->create([
        'workspace_id' => $workspaceB->id,
        'name' => 'Developer',
        'description' => 'Workspace B role',
        'is_system' => false,
    ]);

    $request = Request::create('/api/roles-permissions/roles', 'GET');
    $request->headers->set(WorkspaceContextService::HEADER_NAME, (string) $workspaceA->id);

    app(WorkspaceContextService::class)->resolveFromRequest($request, $user);

    $roles = Role::query()->pluck('name')->all();

    expect($roles)->toBe(['Manager']);
});

it('fails closed when querying a scoped model without workspace context', function () {
    $user = User::query()->create([
        'name' => 'Ali Omar',
        'email' => 'ali@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);

    $workspace = Workspace::query()->create([
        'name' => 'Workspace A',
        'created_by_user_id' => $user->id,
    ]);

    Role::query()->withoutGlobalScope(WorkspaceTenantScope::class)->create([
        'workspace_id' => $workspace->id,
        'name' => 'Manager',
        'description' => 'Scoped role',
        'is_system' => false,
    ]);

    try {
        Role::query()->get();

        $this->fail('Expected workspace context exception was not thrown.');
    } catch (WorkspaceContextException $exception) {
        expect($exception->errorCode)->toBe('WORKSPACE_CONTEXT_REQUIRED')
            ->and($exception->getMessage())->toBe('Workspace context is required to access Role.');
    }
});

it('auto-fills workspace_id from the active workspace context when creating roles', function () {
    $user = User::query()->create([
        'name' => 'Ali Omar',
        'email' => 'ali@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);

    $workspace = Workspace::query()->create([
        'name' => 'Workspace A',
        'created_by_user_id' => $user->id,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $workspace->id,
        'user_id' => $user->id,
        'role_id' => null,
    ]);

    $request = Request::create('/api/roles-permissions/roles', 'POST');
    $request->headers->set(WorkspaceContextService::HEADER_NAME, (string) $workspace->id);

    app(WorkspaceContextService::class)->resolveFromRequest($request, $user);

    $role = Role::query()->create([
        'name' => 'Manager',
        'description' => 'Workspace scoped role',
        'is_system' => false,
    ]);

    expect($role->workspace_id)->toBe($workspace->id);
});

it('rejects creating a role with a mismatched workspace_id', function () {
    $user = User::query()->create([
        'name' => 'Ali Omar',
        'email' => 'ali@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);

    $workspaceA = Workspace::query()->create([
        'name' => 'Workspace A',
        'created_by_user_id' => $user->id,
    ]);

    $workspaceB = Workspace::query()->create([
        'name' => 'Workspace B',
        'created_by_user_id' => $user->id,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $workspaceA->id,
        'user_id' => $user->id,
        'role_id' => null,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $workspaceB->id,
        'user_id' => $user->id,
        'role_id' => null,
    ]);

    $request = Request::create('/api/roles-permissions/roles', 'POST');
    $request->headers->set(WorkspaceContextService::HEADER_NAME, (string) $workspaceA->id);

    app(WorkspaceContextService::class)->resolveFromRequest($request, $user);

    try {
        Role::query()->create([
            'workspace_id' => $workspaceB->id,
            'name' => 'Manager',
            'description' => 'Wrong workspace role',
            'is_system' => false,
        ]);

        $this->fail('Expected workspace mismatch exception was not thrown.');
    } catch (WorkspaceContextException $exception) {
        expect($exception->errorCode)->toBe('WORKSPACE_CONTEXT_MISMATCH')
            ->and($exception->getMessage())->toBe('The provided workspace_id does not match the active workspace context.');
    }
});

it('allows unscoped permission queries because permissions are global', function () {
    Permission::query()->create([
        'key' => 'custom.roles.view',
        'name' => 'View custom roles',
        'description' => 'Can view custom roles',
    ]);

    Permission::query()->create([
        'key' => 'custom.roles.create',
        'name' => 'Create custom roles',
        'description' => 'Can create custom roles',
    ]);

    expect(Permission::query()->pluck('key')->all())
        ->toContain('custom.roles.view', 'custom.roles.create');
});

it('allows explicit bypass of the workspace scope for internal queries', function () {
    $user = User::query()->create([
        'name' => 'Ali Omar',
        'email' => 'ali@example.com',
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);

    $workspace = Workspace::query()->create([
        'name' => 'Internal Workspace',
        'created_by_user_id' => $user->id,
    ]);

    Role::query()->withoutGlobalScope(WorkspaceTenantScope::class)->create([
        'workspace_id' => $workspace->id,
        'name' => 'Internal Role',
        'description' => 'Used by system code',
        'is_system' => false,
    ]);

    $roles = Role::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->pluck('name')
        ->all();

    expect($roles)->toBe(['Internal Role']);
});
