<?php

declare(strict_types=1);

namespace App\Modules\Billing\Services;

use App\Modules\Billing\Exceptions\PlanLimitExceededException;
use App\Modules\Billing\Model\Plan;
use App\Modules\Billing\Model\Subscription;
use App\Modules\Projects\Model\Project;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\Tasks\Model\Task;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;

class PlanLimitService
{
    /**
     * Resolve the effective plan for a workspace.
     * Workspaces without an active subscription row automatically fall back to Free.
     */
    public function getEffectivePlan(Workspace $workspace): Plan
    {
        /** @var Subscription|null $subscription */
        $subscription = Subscription::query()
            ->where('workspace_id', $workspace->id)
            ->with('plan')
            ->first();

        if ($subscription?->isActive() && $subscription->plan) {
            return $subscription->plan;
        }

        /** @var Plan|null $freePlan */
        $freePlan = Plan::query()->where('slug', Plan::SLUG_FREE)->first();

        return $freePlan ?? $this->fallbackFreePlan();
    }

    private function fallbackFreePlan(): Plan
    {
        return new Plan([
            'name' => 'Free',
            'slug' => Plan::SLUG_FREE,
            'price_monthly' => 0,
            'max_members' => 5,
            'max_projects' => 3,
            'max_tasks_per_project' => 100,
            'max_storage_mb' => 500,
            'max_file_size_mb' => 10,
            'max_custom_roles' => 0,
            'has_audit_logs' => false,
            'has_advanced_analytics' => false,
            'has_data_export' => false,
            'has_priority_support' => false,
        ]);
    }

    /**
     * Enforce workspace member limit before sending invite or adding member.
     *
     * @throws PlanLimitExceededException
     */
    public function enforceMaxMembers(Workspace $workspace): void
    {
        $plan = $this->getEffectivePlan($workspace);

        if ($plan->isUnlimited('max_members')) {
            return;
        }

        $currentMembersCount = $workspace->members()->count();

        if ($currentMembersCount >= (int) $plan->max_members) {
            throw PlanLimitExceededException::memberLimitReached(
                current: $currentMembersCount,
                max: (int) $plan->max_members
            );
        }
    }

    /**
     * Enforce project creation limit.
     *
     * @throws PlanLimitExceededException
     */
    public function enforceMaxProjects(Workspace $workspace): void
    {
        $plan = $this->getEffectivePlan($workspace);

        if ($plan->isUnlimited('max_projects')) {
            return;
        }

        $currentProjectsCount = Project::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id)
            ->count();

        if ($currentProjectsCount >= (int) $plan->max_projects) {
            throw PlanLimitExceededException::projectLimitReached(
                current: $currentProjectsCount,
                max: (int) $plan->max_projects
            );
        }
    }

    /**
     * Enforce maximum tasks allowed inside a given project.
     *
     * @throws PlanLimitExceededException
     */
    public function enforceMaxTasksPerProject(Project $project): void
    {
        $workspace = $project->workspace ?? Workspace::query()->find($project->workspace_id);

        if (!$workspace) {
            return;
        }

        $plan = $this->getEffectivePlan($workspace);

        if ($plan->isUnlimited('max_tasks_per_project')) {
            return;
        }

        $currentTasksCount = Task::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('project_id', $project->id)
            ->count();

        if ($currentTasksCount >= (int) $plan->max_tasks_per_project) {
            throw PlanLimitExceededException::taskLimitReached(
                current: $currentTasksCount,
                max: (int) $plan->max_tasks_per_project,
                projectName: (string) $project->name
            );
        }
    }

    /**
     * Enforce total workspace storage consumption (in Megabytes).
     *
     * @throws PlanLimitExceededException
     */
    public function enforceStorageLimit(Workspace $workspace, int $incomingBytes = 0): void
    {
        $plan = $this->getEffectivePlan($workspace);

        if ($plan->isUnlimited('max_storage_mb')) {
            return;
        }

        $incomingMb = $incomingBytes / (1024 * 1024);
        $currentUsedMb = $this->calculateWorkspaceStorageMb($workspace);

        if (($currentUsedMb + $incomingMb) > (float) $plan->max_storage_mb) {
            throw PlanLimitExceededException::storageLimitReached(
                currentMb: (int) ceil($currentUsedMb),
                maxMb: (int) $plan->max_storage_mb
            );
        }
    }

    /**
     * Enforce maximum single file upload size (in Megabytes).
     *
     * @throws PlanLimitExceededException
     */
    public function enforceMaxFileSize(Workspace $workspace, int $fileSizeBytes): void
    {
        $plan = $this->getEffectivePlan($workspace);

        if ($plan->isUnlimited('max_file_size_mb')) {
            return;
        }

        $maxBytes = ((int) $plan->max_file_size_mb) * 1024 * 1024;

        if ($fileSizeBytes > $maxBytes) {
            $fileSizeMb = (int) ceil($fileSizeBytes / (1024 * 1024));
            throw PlanLimitExceededException::fileSizeLimitReached(
                fileSizeMb: $fileSizeMb,
                maxFileSizeMb: (int) $plan->max_file_size_mb
            );
        }
    }

    /**
     * Enforce maximum custom roles limit in workspace.
     *
     * @throws PlanLimitExceededException
     */
    public function enforceMaxCustomRoles(Workspace $workspace): void
    {
        $plan = $this->getEffectivePlan($workspace);

        if ($plan->isUnlimited('max_custom_roles')) {
            return;
        }

        $customRolesCount = $workspace->roles()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('is_system', false)
            ->count();

        if ($customRolesCount >= (int) $plan->max_custom_roles) {
            throw PlanLimitExceededException::customRolesLimitReached(
                current: $customRolesCount,
                max: (int) $plan->max_custom_roles
            );
        }
    }

    /**
     * Enforce that a boolean feature flag is enabled for the workspace.
     *
     * @throws PlanLimitExceededException
     */
    public function enforceFeatureGate(Workspace $workspace, string $featureKey, string $featureName): void
    {
        $plan = $this->getEffectivePlan($workspace);

        if (!$plan->hasFeature($featureKey)) {
            throw PlanLimitExceededException::featureNotIncluded(
                featureKey: $featureKey,
                featureName: $featureName,
                suggestedPlan: 'pro'
            );
        }
    }

    /**
     * Calculate total storage used by workspace in bytes from all attachments.
     */
    public function calculateWorkspaceStorageBytes(Workspace $workspace): int
    {
        // 1. Chat attachments: message_attachments -> messages -> conversation
        $chatBytes = (int) \Illuminate\Support\Facades\DB::table('message_attachments')
            ->join('messages', 'messages.id', '=', 'message_attachments.message_id')
            ->join('conversation', 'conversation.id', '=', 'messages.conversation_id')
            ->where('conversation.workspace_id', $workspace->id)
            ->sum('message_attachments.file_size');

        // 2. Comment attachments: comment_attachments -> comments -> tasks
        $commentBytes = (int) \Illuminate\Support\Facades\DB::table('comment_attachments')
            ->join('comments', 'comments.id', '=', 'comment_attachments.comment_id')
            ->join('tasks', 'tasks.id', '=', 'comments.task_id')
            ->where('tasks.workspace_id', $workspace->id)
            ->sum('comment_attachments.file_size');

        return $chatBytes + $commentBytes;
    }

    /**
     * Calculate current storage used by workspace in MB.
     */
    public function calculateWorkspaceStorageMb(Workspace $workspace): float
    {
        $bytes = $this->calculateWorkspaceStorageBytes($workspace);
        return round($bytes / (1024 * 1024), 2);
    }

    public function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return "{$bytes} B";
        }
        if ($bytes < 1024 * 1024) {
            return round($bytes / 1024, 1) . ' KB';
        }
        if ($bytes < 1024 * 1024 * 1024) {
            return round($bytes / (1024 * 1024), 2) . ' MB';
        }
        return round($bytes / (1024 * 1024 * 1024), 2) . ' GB';
    }

    /**
     * Get complete usage breakdown against plan limits for UI meters.
     *
     * @return array<string, mixed>
     */
    public function getUsageSummary(Workspace $workspace): array
    {
        $plan = $this->getEffectivePlan($workspace);

        $currentMembers = $workspace->members()->count();
        $currentProjects = Project::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id)
            ->count();

        $currentCustomRoles = $workspace->roles()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('is_system', false)
            ->count();


        // Log::info('Workspace', ['workspace members' => $workspace->members()->get()]);
        // Log::info('Custome Roles', ['Custom Roles' => Role::query()->withoutGlobalScope(WorkspaceTenantScope::class)->where('workspace_id', $workspace->id)->where('is_system', 0)->count()]);

        $currentStorageBytes = $this->calculateWorkspaceStorageBytes($workspace);
        $currentStorageMb = round($currentStorageBytes / (1024 * 1024), 2);

        return [
            'members' => [
                'current' => $currentMembers,
                'max' => $plan->max_members,
                'percentage' => $this->calculatePercentage($currentMembers, $plan->max_members),
            ],
            'projects' => [
                'current' => $currentProjects,
                'max' => $plan->max_projects,
                'percentage' => $this->calculatePercentage($currentProjects, $plan->max_projects),
            ],
            'custom_roles' => [
                'current' => $currentCustomRoles,
                'max' => $plan->max_custom_roles,
                'percentage' => $this->calculatePercentage($currentCustomRoles, $plan->max_custom_roles),
            ],
            'storage_mb' => [
                'current' => $currentStorageMb,
                'current_bytes' => $currentStorageBytes,
                'current_formatted' => $this->formatBytes($currentStorageBytes),
                'max' => $plan->max_storage_mb,
                'percentage' => $this->calculatePercentage((int) ceil($currentStorageMb), $plan->max_storage_mb),
            ],
            'features' => [
                'has_audit_logs' => (bool) $plan->has_audit_logs,
                'has_advanced_analytics' => (bool) $plan->has_advanced_analytics,
                'has_data_export' => (bool) $plan->has_data_export,
                'has_priority_support' => (bool) $plan->has_priority_support,
            ],
        ];
    }

    private function calculatePercentage(int $current, ?int $max): ?int
    {
        if ($max === null || $max <= 0) {
            return null;
        }

        return (int) min(100, round(($current / $max) * 100));
    }
}
