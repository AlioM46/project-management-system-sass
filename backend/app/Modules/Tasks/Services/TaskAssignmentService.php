<?php

namespace App\Modules\Tasks\Services;

use App\Models\User;
use App\Modules\Tasks\Exceptions\TasksException;
use App\Modules\Tasks\Model\Task;
use App\Modules\Tasks\Model\TaskAssignment;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class TaskAssignmentService
{
    public function __construct(
        private readonly TaskHistoryService $taskHistoryService
    ) {}

    public function addAssignees(Task $task, array $userIds, User $actor): Task
    {
        $this->guardTaskActive($task);

        $workspace = $this->resolveWorkspace($task);
        $normalizedUserIds = $this->normalizeUserIds($userIds);

        if ($normalizedUserIds === []) {
            return $this->loadTaskRelations($task->fresh());
        }

        $this->guardUsersBelongToWorkspace($workspace, $normalizedUserIds);

        return DB::transaction(function () use ($task, $normalizedUserIds, $actor): Task {
            $existingIds = $task->assignments()
                ->whereIn('user_id', $normalizedUserIds)
                ->pluck('user_id')
                ->map(fn ($id): int => (int) $id)
                ->all();

            $userIdsToAdd = array_values(array_diff($normalizedUserIds, $existingIds));

            if ($userIdsToAdd !== []) {
                $timestamp = now();
                $rows = [];

                foreach ($userIdsToAdd as $userId) {
                    $rows[] = [
                        'task_id' => $task->id,
                        'user_id' => $userId,
                        'assigned_by_user_id' => $actor->id,
                        'created_at' => $timestamp,
                    ];
                }

                TaskAssignment::query()->insert($rows);

                foreach ($userIdsToAdd as $userId) {
                    $this->taskHistoryService->record(
                        $task,
                        'assignee_added',
                        null,
                        ['user_id' => $userId],
                        $actor
                    );
                }
            }

            return $this->loadTaskRelations($task->fresh());
        });
    }

    public function removeAssignees(Task $task, array $userIds, User $actor): Task
    {
        $this->guardTaskActive($task);

        $normalizedUserIds = $this->normalizeUserIds($userIds);

        if ($normalizedUserIds === []) {
            return $this->loadTaskRelations($task->fresh());
        }

        return DB::transaction(function () use ($task, $normalizedUserIds, $actor): Task {
            $userIdsToRemove = $task->assignments()
                ->whereIn('user_id', $normalizedUserIds)
                ->pluck('user_id')
                ->map(fn ($id): int => (int) $id)
                ->all();

            if ($userIdsToRemove !== []) {
                $task->assignments()
                    ->whereIn('user_id', $userIdsToRemove)
                    ->delete();

                foreach ($userIdsToRemove as $userId) {
                    $this->taskHistoryService->record(
                        $task,
                        'assignee_removed',
                        ['user_id' => $userId],
                        null,
                        $actor
                    );
                }
            }

            return $this->loadTaskRelations($task->fresh());
        });
    }

    public function replaceAssignees(Task $task, array $userIds, User $actor): Task
    {
        $this->guardTaskActive($task);

        $workspace = $this->resolveWorkspace($task);
        $normalizedUserIds = $this->normalizeUserIds($userIds);

        $this->guardUsersBelongToWorkspace($workspace, $normalizedUserIds);

        return DB::transaction(function () use ($task, $normalizedUserIds, $actor): Task {
            $existingIds = $task->assignments()
                ->pluck('user_id')
                ->map(fn ($id): int => (int) $id)
                ->all();

            $userIdsToAdd = array_values(array_diff($normalizedUserIds, $existingIds));
            $userIdsToRemove = array_values(array_diff($existingIds, $normalizedUserIds));

            if ($userIdsToRemove !== []) {
                $task->assignments()
                    ->whereIn('user_id', $userIdsToRemove)
                    ->delete();

                foreach ($userIdsToRemove as $userId) {
                    $this->taskHistoryService->record(
                        $task,
                        'assignee_removed',
                        ['user_id' => $userId],
                        null,
                        $actor
                    );
                }
            }

            if ($userIdsToAdd !== []) {
                $timestamp = now();
                $rows = [];

                foreach ($userIdsToAdd as $userId) {
                    $rows[] = [
                        'task_id' => $task->id,
                        'user_id' => $userId,
                        'assigned_by_user_id' => $actor->id,
                        'created_at' => $timestamp,
                    ];
                }

                TaskAssignment::query()->insert($rows);

                foreach ($userIdsToAdd as $userId) {
                    $this->taskHistoryService->record(
                        $task,
                        'assignee_added',
                        null,
                        ['user_id' => $userId],
                        $actor
                    );
                }
            }

            return $this->loadTaskRelations($task->fresh());
        });
    }

    public function getAssignees(Task $task): Collection
    {
        return $task->assignees()
            ->orderBy('name')
            ->get();
    }

    private function resolveWorkspace(Task $task): Workspace
    {
        return $task->workspace()->firstOrFail();
    }

    private function guardTaskActive(Task $task): void
    {
        if ($task->trashed()) {
            throw TasksException::taskDeletedImmutable($task->id, $task->workspace_id);
        }
    }

    private function guardUsersBelongToWorkspace(Workspace $workspace, array $userIds): void
    {
        if ($userIds === []) {
            return;
        }

        $workspaceUserIds = Workspace_Members::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id)
            ->whereIn('user_id', $userIds)
            ->pluck('user_id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        if (in_array((int) $workspace->created_by_user_id, $userIds, true)) {
            $workspaceUserIds[] = (int) $workspace->created_by_user_id;
        }

        $workspaceUserIds = array_values(array_unique($workspaceUserIds));
        $invalidUserIds = array_values(array_diff($userIds, $workspaceUserIds));

        if ($invalidUserIds !== []) {
            throw TasksException::userNotInWorkspace($invalidUserIds[0], $workspace->id);
        }
    }

    private function normalizeUserIds(array $userIds): array
    {
        return array_values(array_unique(array_map(
            fn ($userId): int => (int) $userId,
            array_filter($userIds, fn ($userId): bool => $userId !== null && $userId !== '')
        )));
    }

    private function loadTaskRelations(?Task $task): Task
    {
        return $task->load([
            'project',
            'creator',
            'assignees' => fn ($query) => $query->orderBy('name'),
        ]);
    }
}
