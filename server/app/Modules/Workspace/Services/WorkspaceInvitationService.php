<?php

namespace App\Modules\Workspace\Services;

use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\WorkspaceInvitation;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
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
        return rtrim((string) config('app.url'), '/') . '/accept-invite?' . http_build_query([
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
            return $this->refreshInvitationForSending(
                invitation: $invitation,
                role: $role,
                invitedByUserId: $invitedByUserId,
                message: $message,
                tokenHash: $tokenHash,
                expiresAt: $expiresAt
            );
        }

        return WorkspaceInvitation::query()->create([
            'workspace_id' => $workspace->id,
            'email' => $email,
            'role_id' => $role->id,
            'invited_by_user_id' => $invitedByUserId,
            'accepted_by_user_id' => null,
            'status' => 'pending',
            'token_hash' => $tokenHash,
            'message' => $message,
            'expires_at' => $expiresAt,
            'sent_at' => null,
            'accepted_at' => null,
            'revoked_at' => null,
        ]);
    }

    public function refreshInvitationForSending(
        WorkspaceInvitation $invitation,
        Role $role,
        int $invitedByUserId,
        ?string $message,
        string $tokenHash,
        Carbon $expiresAt
    ): WorkspaceInvitation {
        $invitation->role_id = $role->id;
        $invitation->invited_by_user_id = $invitedByUserId;
        $invitation->accepted_by_user_id = null;
        $invitation->status = 'pending';
        $invitation->token_hash = $tokenHash;
        $invitation->message = $message;
        $invitation->expires_at = $expiresAt;
        $invitation->sent_at = null;
        $invitation->accepted_at = null;
        $invitation->revoked_at = null;
        $invitation->save();

        return $invitation;
    }

    public function markInvitationSent(WorkspaceInvitation $invitation): WorkspaceInvitation
    {
        $invitation->sent_at = now();
        $invitation->save();

        return $invitation;
    }

    public function tokenMatches(WorkspaceInvitation $invitation, string $plainToken): bool
    {
        return hash_equals((string) $invitation->token_hash, $this->hashToken($plainToken));
    }

    public function isExpired(WorkspaceInvitation $invitation): bool
    {
        return $invitation->expires_at !== null && now()->greaterThan($invitation->expires_at);
    }

    public function normalizeInvitationStatus(WorkspaceInvitation $invitation): WorkspaceInvitation
    {
        if ($invitation->status === 'pending' && $this->isExpired($invitation)) {
            $invitation->status = 'expired';
            $invitation->save();
        }

        return $invitation;
    }

    /**
     * @param Collection<int, WorkspaceInvitation> $invitations
     * @return Collection<int, WorkspaceInvitation>
     */
    public function normalizeInvitationStatuses(Collection $invitations): Collection
    {
        return $invitations->map(fn(WorkspaceInvitation $invitation) => $this->normalizeInvitationStatus($invitation));
    }

    public function serializeInvitation(WorkspaceInvitation $invitation): array
    {
        $invitation->loadMissing([
            'inviter:id,name,email',
            'workspace:id,name',
        ]);

        if ($invitation->role_id !== null && ! $invitation->relationLoaded('role')) {
            $invitation->setRelation(
                'role',
                Role::query()
                    ->withoutGlobalScopes()
                    ->select(['id', 'workspace_id', 'name', 'slug'])
                    ->find($invitation->role_id)
            );
        }

        return [
            'id' => (int) $invitation->id,
            'workspace_id' => (int) $invitation->workspace_id,
            'workspace' => $invitation->workspace ? [
                'id' => (int) $invitation->workspace->id,
                'name' => (string) $invitation->workspace->name,
            ] : null,
            'email' => (string) $invitation->email,
            'role_id' => $invitation->role_id !== null ? (int) $invitation->role_id : null,
            'role' => $invitation->role ? [
                'id' => (int) $invitation->role->id,
                'name' => (string) $invitation->role->name,
                'slug' => (string) $invitation->role->slug,
            ] : null,
            'invited_by_user_id' => (int) $invitation->invited_by_user_id,
            'inviter' => $invitation->inviter ? [
                'id' => (int) $invitation->inviter->id,
                'name' => (string) $invitation->inviter->name,
                'email' => (string) $invitation->inviter->email,
            ] : null,
            'accepted_by_user_id' => $invitation->accepted_by_user_id !== null ? (int) $invitation->accepted_by_user_id : null,
            'status' => (string) $invitation->status,
            'message' => $invitation->message !== null ? (string) $invitation->message : null,
            'expires_at' => $invitation->expires_at?->toISOString(),
            'sent_at' => $invitation->sent_at?->toISOString(),
            'accepted_at' => $invitation->accepted_at?->toISOString(),
            'revoked_at' => $invitation->revoked_at?->toISOString(),
            'created_at' => $invitation->created_at?->toISOString(),
            'updated_at' => $invitation->updated_at?->toISOString(),
        ];
    }

    /**
     * @param Collection<int, WorkspaceInvitation> $invitations
     * @return array<int, array<string, mixed>>
     */
    public function serializeInvitations(Collection $invitations): array
    {
        return $invitations
            ->map(fn(WorkspaceInvitation $invitation) => $this->serializeInvitation($invitation))
            ->values()
            ->all();
    }
}
