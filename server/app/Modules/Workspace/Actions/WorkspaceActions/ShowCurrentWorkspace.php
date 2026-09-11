<?php

namespace App\Modules\Workspace\Actions\WorkspaceActions;

use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Services\WorkspaceContextService;

class ShowCurrentWorkspace
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService
    ) {}

    public function execute(): array
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        $workspace->load([
            'owner:id,name,email',
            'subscription.plan',
        ])->loadCount('members');

        $sub = $workspace->subscription;
        $isSubscribed = (bool) ($sub && $sub->isActive() && $sub->plan && $sub->plan->slug !== \App\Modules\Billing\Model\Plan::SLUG_FREE);

        $workspaceData = $workspace->toArray();
        $workspaceData['is_subscribed'] = $isSubscribed;
        $workspaceData['plan_name'] = $isSubscribed ? $sub->plan->name : 'Free';
        $workspaceData['plan_slug'] = $isSubscribed ? $sub->plan->slug : 'free';

        return ['workspace' => $workspaceData];
    }
}
