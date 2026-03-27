<?php

use App\Models\User;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

it('lists the user workspaces with a simple summary payload', function () {
    $makeUser = fn (string $name, string $email) => User::query()->create([
        'name' => $name,
        'email' => $email,
        'password' => Hash::make('password123'),
        'email_verified_at' => now(),
    ]);

    $user = $makeUser('Ali Omar', 'ali@example.com');
    $memberOwner = $makeUser('Sara Owner', 'sara@example.com');
    $extraMember = $makeUser('Extra Member', 'extra@example.com');
    $outsider = $makeUser('Outside User', 'outside@example.com');

    $ownedWorkspace = Workspace::query()->create([
        'name' => 'Owned Workspace',
        'created_by_user_id' => $user->id,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $ownedWorkspace->id,
        'user_id' => $user->id,
        'role_id' => null,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $ownedWorkspace->id,
        'user_id' => $extraMember->id,
        'role_id' => null,
    ]);

    $memberWorkspace = Workspace::query()->create([
        'name' => 'Member Workspace',
        'created_by_user_id' => $memberOwner->id,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $memberWorkspace->id,
        'user_id' => $memberOwner->id,
        'role_id' => null,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $memberWorkspace->id,
        'user_id' => $user->id,
        'role_id' => null,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $memberWorkspace->id,
        'user_id' => $extraMember->id,
        'role_id' => null,
    ]);

    $hiddenWorkspace = Workspace::query()->create([
        'name' => 'Hidden Workspace',
        'created_by_user_id' => $outsider->id,
    ]);

    Workspace_Members::query()->create([
        'workspace_id' => $hiddenWorkspace->id,
        'user_id' => $outsider->id,
        'role_id' => null,
    ]);

    $response = $this->withToken(JWTAuth::fromUser($user))
        ->getJson('/api/workspaces');

    $response->assertOk()
        ->assertJsonPath('data.count', 2)
        ->assertJsonCount(2, 'data.workspaces');

    $workspaces = collect($response->json('data.workspaces'))->keyBy('name');

    expect($workspaces->has('Hidden Workspace'))->toBeFalse();

    $ownedWorkspaceData = $workspaces->get('Owned Workspace');

    expect($ownedWorkspaceData)->not->toBeNull()
        ->and($ownedWorkspaceData['id'])->toBe($ownedWorkspace->id)
        ->and($ownedWorkspaceData['members_count'])->toBe(2)
        ->and(array_keys($ownedWorkspaceData))->toEqualCanonicalizing(['id', 'name', 'members_count']);

    $memberWorkspaceData = $workspaces->get('Member Workspace');

    expect($memberWorkspaceData)->not->toBeNull()
        ->and($memberWorkspaceData['id'])->toBe($memberWorkspace->id)
        ->and($memberWorkspaceData['members_count'])->toBe(3)
        ->and(array_keys($memberWorkspaceData))->toEqualCanonicalizing(['id', 'name', 'members_count']);
});
