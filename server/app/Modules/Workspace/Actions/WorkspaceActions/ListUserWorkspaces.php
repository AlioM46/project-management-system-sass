<?php

declare(strict_types=1);

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Models\User;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;

class ListUserWorkspaces
{
    public function execute(User $user): array
    {
        return Workspace::query()
            ->accessibleTo($user->id)
            ->select('id', 'name', 'created_by_user_id')
            ->withCount('members')
            ->with([
                'subscription.plan',
                'members' => function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->withoutGlobalScope(WorkspaceTenantScope::class)
                        ->with(['role' => function ($roleQuery) {
                            $roleQuery->withoutGlobalScope(WorkspaceTenantScope::class)
                                ->select('id', 'workspace_id', 'name', 'slug');
                        }]);
                },
            ])
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get()
            ->map(function (Workspace $workspace) use ($user): array {
                $myMembership = $workspace->members->first();
                $role = null;

                if ($myMembership?->role) {
                    $role = [
                        'id' => $myMembership->role->id,
                        'name' => $myMembership->role->name,
                        'slug' => $myMembership->role->slug,
                    ];
                } elseif ((int) $workspace->created_by_user_id === (int) $user->id) {
                    $role = [
                        'id' => null,
                        'name' => 'Owner',
                        'slug' => 'owner',
                    ];
                }

                $sub = $workspace->subscription;
                $isSubscribed = (bool) ($sub && $sub->isActive() && $sub->plan && $sub->plan->slug !== \App\Modules\Billing\Model\Plan::SLUG_FREE);

                return [
                    'id' => $workspace->id,
                    'name' => $workspace->name,
                    'members_count' => $workspace->members_count,
                    'role' => $role,
                    'is_subscribed' => $isSubscribed,
                    'plan_name' => $isSubscribed ? $sub->plan->name : 'Free',
                    'plan_slug' => $isSubscribed ? $sub->plan->slug : 'free',
                ];
            })
            ->values()
            ->all();
    }
}

