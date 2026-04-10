<?php

namespace App\Modules\Workspace\Services;

use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\WorkspaceInvitation;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class WorkspaceInvitationService
{
    public function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }

    public function generatePlainToken(): string
    {
        return Str::random(64);
    }

    public function hashToken(string $plainToken): string
    {
        return hash('sha256', $plainToken);
    }

    public function defaultExpiryAt(): Carbon
    {
        return now()->addHours(72);
    }

    public function buildAcceptUrl(int $invitationId, string $token): string
    {
        return rtrim((string) config('app.url'), '/').'/api/workspaces/members/accept-invite?'.http_build_query([
            'invitation_id' => $invitationId,
            'token' => $token,
        ], '', '&', PHP_QUERY_RFC3986);
    }

    public function upsertPendingInvitation(
        Workspace $workspace,
        string $email,
        Role $role,
        int $invitedByUserId,
        ?string $message,
        string $tokenHash,
        Carbon $expiresAt
    ): WorkspaceInvitation {
        $invitation = WorkspaceInvitation::query()
            ->where('workspace_id', $workspace->id)
            ->where('email', $email)
            ->where('status', 'pending')
            ->lockForUpdate()
            ->latest('id')
            ->first();

        if ($invitation !== null) {
            $invitation->role_id = $role->id;
            $invitation->invited_by_user_id = $invitedByUserId;
            $invitation->message = $message;
            $invitation->token_hash = $tokenHash;
            $invitation->expires_at = $expiresAt;
            $invitation->sent_at = null;
            $invitation->save();

            return $invitation;
        }

        return WorkspaceInvitation::query()->create([
            'workspace_id' => $workspace->id,
            'email' => $email,
            'role_id' => $role->id,
            'invited_by_user_id' => $invitedByUserId,
            'status' => 'pending',
            'token_hash' => $tokenHash,
            'message' => $message,
            'expires_at' => $expiresAt,
        ]);
    }

    public function tokenMatches(WorkspaceInvitation $invitation, string $plainToken): bool
    {
        return hash_equals($invitation->token_hash, $this->hashToken($plainToken));
    }

    public function isExpired(WorkspaceInvitation $invitation): bool
    {
        return $invitation->expires_at !== null && now()->greaterThan($invitation->expires_at);
    }
}
