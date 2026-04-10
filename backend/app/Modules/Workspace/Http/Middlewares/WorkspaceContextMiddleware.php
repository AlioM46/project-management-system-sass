<?php

namespace App\Modules\Workspace\Http\Middlewares;

use App\Modules\Workspace\Services\WorkspaceContextService;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class WorkspaceContextMiddleware
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService
    ) {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            throw new AuthenticationException('Unauthenticated.');
        }

        $this->workspaceContextService->resolveFromRequest($request, $user);

        $request->attributes->set('workspace_id', $this->workspaceContextService->currentWorkspaceId());
        $request->attributes->set('member_id', $this->workspaceContextService->currentMemberId());
        $request->attributes->set('role_id', $this->workspaceContextService->currentRoleId());
        $request->attributes->set('workspace_context', $this->workspaceContextService->context());

        return $next($request);
    }
}
