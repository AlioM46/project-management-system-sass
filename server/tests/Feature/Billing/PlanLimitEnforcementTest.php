<?php

declare(strict_types=1);

use App\Models\User;
use App\Modules\Billing\Actions\AssignPlanAction;
use App\Modules\Billing\Database\Seeders\PlanSeeder;
use App\Modules\Billing\Exceptions\PlanLimitExceededException;
use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Services\PlanLimitService;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function makeBillingTestUser(string $name, string $email): User
{
    return User::query()->create([
        'name' => $name,
        'username' => strtolower(str_replace([' ', '.'], '', $name)) . rand(100, 999),
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);
}

it('enforces member limit on free plan and allows on pro plan', function (): void {
    Mail::fake();
    $this->seed(PlanSeeder::class);

    $owner = makeBillingTestUser('Billing Owner', 'billing-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Limit Test Workspace'], $owner);

    $memberRole = Role::query()
        ->withoutGlobalScope(WorkspaceTenantScope::class)
        ->where('workspace_id', $workspace->id)
        ->where('name', 'Member')
        ->firstOrFail();

    // Owner is member #1. Add 4 more members to reach free plan limit (5 total)
    for ($i = 2; $i <= 5; $i++) {
        $u = makeBillingTestUser("Member {$i}", "member{$i}@example.com");
        Workspace_Members::query()->create([
            'workspace_id' => $workspace->id,
            'user_id' => $u->id,
            'role_id' => $memberRole->id,
            'joined_at' => now(),
        ]);
    }

    // Now workspace has 5 members. Attempting to invite a 6th member should fail with 403
    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/workspaces/members/send-invite', [
            'email' => 'member6@example.com',
            'role_id' => $memberRole->id,
        ]);

    $response->assertStatus(403)
        ->assertJsonPath('success', false)
        ->assertJsonPath('error.code', 'PLAN_LIMIT_MEMBERS_EXCEEDED');

    // Upgrade workspace to Pro plan
    app(AssignPlanAction::class)->execute($workspace, Plan::SLUG_PRO);

    // Now inviting 6th member should succeed
    $responsePro = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/workspaces/members/send-invite', [
            'email' => 'member6@example.com',
            'role_id' => $memberRole->id,
        ]);

    $responsePro->assertStatus(202)
        ->assertJsonPath('success', true);
});

it('enforces project limit on free plan and allows unlimited on pro plan', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeBillingTestUser('Project Owner', 'proj-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Project Limit Workspace'], $owner);

    // Create 3 projects via API (Free plan max is 3)
    for ($i = 1; $i <= 3; $i++) {
        $resp = $this->withToken(JWTAuth::fromUser($owner))
            ->withHeader('X-Workspace-Id', (string) $workspace->id)
            ->postJson('/api/projects', [
                'name' => "Project {$i}",
                'description' => "Test project {$i}",
            ]);

        $resp->assertStatus(201);
    }

    // Attempting to create 4th project should fail with 403
    $resp4 = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/projects', [
            'name' => 'Project 4',
            'description' => 'Should fail on free plan',
        ]);

    $resp4->assertStatus(403)
        ->assertJsonPath('success', false)
        ->assertJsonPath('error.code', 'PLAN_LIMIT_PROJECTS_EXCEEDED');

    // Upgrade to Pro plan
    app(AssignPlanAction::class)->execute($workspace, Plan::SLUG_PRO);

    // Creating 4th project should now succeed
    $respPro = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/projects', [
            'name' => 'Project 4',
            'description' => 'Succeeds on pro plan',
        ]);

    $respPro->assertStatus(201)
        ->assertJsonPath('success', true);
});

it('enforces feature gates correctly', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeBillingTestUser('Feature Owner', 'feature-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Feature Workspace'], $owner);

    $bouncer = app(PlanLimitService::class);

    // Free plan does not have audit logs
    expect(fn () => $bouncer->enforceFeatureGate($workspace, 'has_audit_logs', 'Audit Logs'))
        ->toThrow(PlanLimitExceededException::class);

    // Free plan does not have advanced analytics
    expect(fn () => $bouncer->enforceFeatureGate($workspace, 'has_advanced_analytics', 'Advanced Analytics'))
        ->toThrow(PlanLimitExceededException::class);

    // Upgrade to Pro
    app(AssignPlanAction::class)->execute($workspace, Plan::SLUG_PRO);

    // Pro plan has audit logs and advanced analytics
    $bouncer->enforceFeatureGate($workspace, 'has_audit_logs', 'Audit Logs');
    $bouncer->enforceFeatureGate($workspace, 'has_advanced_analytics', 'Advanced Analytics');

    // Pro plan still does not have priority support (Enterprise only)
    expect(fn () => $bouncer->enforceFeatureGate($workspace, 'has_priority_support', 'Priority Support'))
        ->toThrow(PlanLimitExceededException::class);
});

it('blocks csv export on free plan and allows on pro plan', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeBillingTestUser('CSV Owner', 'csv-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'CSV Export Workspace'], $owner);

    // Attempt to export audit logs on Free plan -> should fail with 403 PLAN_FEATURE_NOT_INCLUDED
    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->getJson('/api/audit-logs/export');

    $response->assertStatus(403)
        ->assertJsonPath('success', false)
        ->assertJsonPath('error.code', 'PLAN_FEATURE_NOT_INCLUDED');

    // Upgrade to Pro plan
    app(AssignPlanAction::class)->execute($workspace, Plan::SLUG_PRO);

    // Exporting CSV on Pro plan should succeed
    $responsePro = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->get('/api/audit-logs/export');

    $responsePro->assertOk()
        ->assertHeader('content-type', 'text/csv; charset=UTF-8');
});

it('blocks custom role creation on free plan and allows on pro plan', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeBillingTestUser('Role Owner', 'role-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Role Limit Workspace'], $owner);

    // Free plan allows 0 custom roles -> should fail with 403
    $response = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/roles-permissions/roles', [
            'name' => 'QA Engineer',
            'slug' => 'qa-engineer',
            'description' => 'Custom QA role',
        ]);

    $response->assertStatus(403)
        ->assertJsonPath('success', false)
        ->assertJsonPath('error.code', 'PLAN_LIMIT_CUSTOM_ROLES_EXCEEDED');

    // Upgrade to Pro
    app(AssignPlanAction::class)->execute($workspace, Plan::SLUG_PRO);

    // Should now succeed
    $responsePro = $this->withToken(JWTAuth::fromUser($owner))
        ->withHeader('X-Workspace-Id', (string) $workspace->id)
        ->postJson('/api/roles-permissions/roles', [
            'name' => 'QA Engineer',
            'slug' => 'qa-engineer',
            'description' => 'Custom QA role',
        ]);

    $responsePro->assertStatus(201)
        ->assertJsonPath('success', true);
});

it('enforces max file upload size limit and storage limit', function (): void {
    $this->seed(PlanSeeder::class);

    $owner = makeBillingTestUser('Storage Owner', 'storage-owner@example.com');
    $workspace = app(CreateWorkspace::class)->execute(['name' => 'Storage Limit Workspace'], $owner);

    $bouncer = app(PlanLimitService::class);

    // Free plan max file size is 10 MB. 15 MB should throw
    $fifteenMbInBytes = 15 * 1024 * 1024;
    expect(fn () => $bouncer->enforceMaxFileSize($workspace, $fifteenMbInBytes))
        ->toThrow(PlanLimitExceededException::class);

    // 5 MB should be allowed on Free plan
    $fiveMbInBytes = 5 * 1024 * 1024;
    $bouncer->enforceMaxFileSize($workspace, $fiveMbInBytes);

    // Free plan storage is 500 MB. Exceeding 500 MB should throw
    $sixHundredMbInBytes = 600 * 1024 * 1024;
    expect(fn () => $bouncer->enforceStorageLimit($workspace, $sixHundredMbInBytes))
        ->toThrow(PlanLimitExceededException::class);

    // Upgrade to Pro (100 MB file limit, 20 GB storage)
    app(AssignPlanAction::class)->execute($workspace, Plan::SLUG_PRO);

    // 15 MB file is now allowed on Pro
    $bouncer->enforceMaxFileSize($workspace, $fifteenMbInBytes);

    // 600 MB storage is now allowed on Pro (under 20,480 MB)
    $bouncer->enforceStorageLimit($workspace, $sixHundredMbInBytes);
});


