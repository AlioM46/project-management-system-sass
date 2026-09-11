<?php

declare(strict_types=1);

namespace App\Modules\Billing\Exceptions;

use App\Shared\Exceptions\BusinessException;

class PlanLimitExceededException extends BusinessException
{
    public static function memberLimitReached(int $current, int $max): self
    {
        return new self(
            message: "Your workspace has reached the limit of {$max} members for your current plan. Upgrade to invite more members.",
            errorCode: 'PLAN_LIMIT_MEMBERS_EXCEEDED',
            status: 403,
            meta: [
                'limit_type' => 'max_members',
                'current' => $current,
                'max' => $max,
                'suggested_plan' => 'pro',
            ]
        );
    }

    public static function projectLimitReached(int $current, int $max): self
    {
        return new self(
            message: "Your workspace has reached the limit of {$max} projects for your current plan. Upgrade to create more projects.",
            errorCode: 'PLAN_LIMIT_PROJECTS_EXCEEDED',
            status: 403,
            meta: [
                'limit_type' => 'max_projects',
                'current' => $current,
                'max' => $max,
                'suggested_plan' => 'pro',
            ]
        );
    }

    public static function taskLimitReached(int $current, int $max, ?string $projectName = null): self
    {
        $projectContext = $projectName ? " in project '{$projectName}'" : '';

        return new self(
            message: "You have reached the limit of {$max} tasks per project{$projectContext}. Upgrade for unlimited tasks.",
            errorCode: 'PLAN_LIMIT_TASKS_EXCEEDED',
            status: 403,
            meta: [
                'limit_type' => 'max_tasks_per_project',
                'current' => $current,
                'max' => $max,
                'suggested_plan' => 'pro',
            ]
        );
    }

    public static function storageLimitReached(int $currentMb, int $maxMb): self
    {
        return new self(
            message: "Your workspace has reached its storage limit of {$maxMb}MB ({$currentMb}MB used). Upgrade to get more storage.",
            errorCode: 'PLAN_LIMIT_STORAGE_EXCEEDED',
            status: 403,
            meta: [
                'limit_type' => 'max_storage_mb',
                'current_mb' => $currentMb,
                'max_mb' => $maxMb,
                'suggested_plan' => 'pro',
            ]
        );
    }

    public static function fileSizeLimitReached(int $fileSizeMb, int $maxFileSizeMb): self
    {
        return new self(
            message: "The uploaded file size ({$fileSizeMb}MB) exceeds the maximum allowed file size of {$maxFileSizeMb}MB on your plan.",
            errorCode: 'PLAN_LIMIT_FILE_SIZE_EXCEEDED',
            status: 403,
            meta: [
                'limit_type' => 'max_file_size_mb',
                'file_size_mb' => $fileSizeMb,
                'max_file_size_mb' => $maxFileSizeMb,
                'suggested_plan' => 'pro',
            ]
        );
    }

    public static function customRolesLimitReached(int $current, int $max): self
    {
        return new self(
            message: "Your workspace has reached the limit of {$max} custom roles for your current plan. Upgrade to create more roles.",
            errorCode: 'PLAN_LIMIT_CUSTOM_ROLES_EXCEEDED',
            status: 403,
            meta: [
                'limit_type' => 'max_custom_roles',
                'current' => $current,
                'max' => $max,
                'suggested_plan' => 'pro',
            ]
        );
    }

    public static function featureNotIncluded(string $featureKey, string $featureName, string $suggestedPlan = 'pro'): self
    {
        return new self(
            message: "The feature '{$featureName}' is not included in your current workspace plan. Upgrade to unlock it.",
            errorCode: 'PLAN_FEATURE_NOT_INCLUDED',
            status: 403,
            meta: [
                'feature_key' => $featureKey,
                'feature_name' => $featureName,
                'suggested_plan' => $suggestedPlan,
            ]
        );
    }
}
