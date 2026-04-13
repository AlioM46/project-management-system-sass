<?php

namespace App\Modules\Tasks\Services;

use App\Models\User;
use App\Modules\Projects\Model\Project;
use App\Modules\Tasks\Exceptions\TasksException;
use App\Modules\Tasks\Model\Task;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TaskService
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly TaskAssignmentService $taskAssignmentService,
        private readonly TaskHistoryService $taskHistoryService
    ) {
    }

    public function currentWorkspace(): Workspace
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        return $workspace;
    }

    public function createTask(Workspace $workspace, array $data, User $actor): Task
    {
        $project = $this->resolveProject($workspace, (int) $data['project_id']);
        $title = $this->normalizeTitle((string) $data['title']);
        $description = $this->normalizeDescription($data['description'] ?? null);
        $assigneeIds = $data['assignee_ids'] ?? [];

        return DB::transaction(function () use ($workspace, $project, $title, $description, $assigneeIds, $actor): Task {
            $task = Task::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->create([
                    'workspace_id' => $workspace->id,
                    'project_id' => $project->id,
                    'title' => $title,
                    'description' => $description,
                    'status' => Task::STATUS_TODO,
                    'created_by_user_id' => $actor->id,
                ]);

            $this->taskHistoryService->record(
                $task,
                'task_created',
                null,
                [
                    'project_id' => $project->id,
                    'title' => $title,
                    'description' => $description,
                    'status' => Task::STATUS_TODO,
                ],
                $actor
            );

            if (is_array($assigneeIds) && $assigneeIds !== []) {
                $task = $this->taskAssignmentService->replaceAssignees($task, $assigneeIds, $actor);
            }

            return $this->loadTaskRelations($task->fresh());
        });
    }

    public function getTask(Workspace $workspace, int $taskId): Task
    {
        return $this->resolveTask($workspace, $taskId);
    }

    public function listTasks(Workspace $workspace, array $filters = []): LengthAwarePaginator
    {
        $query = $this->taskQueryForWorkspace($workspace)
            ->with($this->taskRelations());

        if (!empty($filters['project_id'])) {
            $query->where('project_id', (int) $filters['project_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', (string) $filters['status']);
        }

        if (!empty($filters['assignee_id'])) {
            $query->whereHas('assignments', function (Builder $builder) use ($filters): void {
                $builder->where('user_id', (int) $filters['assignee_id']);
            });
        }

        $sortBy = $this->resolveSortBy($filters['sort_by'] ?? null);
        $sortDir = $this->resolveSortDirection($filters['sort_dir'] ?? null);
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 15)));

        $query->orderBy($sortBy, $sortDir)->orderByDesc('id');

        return $query->paginate($perPage, ['*'], 'page', $page);
    }

    public function updateTask(Task $task, array $data, User $actor): Task
    {
        $this->guardTaskActive($task);

        $oldValue = [];
        $newValue = [];

        if (array_key_exists('title', $data)) {
            $title = $this->normalizeTitle((string) $data['title']);

            if ($title !== $task->title) {
                $oldValue['title'] = $task->title;
                $newValue['title'] = $title;
                $task->title = $title;
            }
        }

        if (array_key_exists('description', $data)) {
            $description = $this->normalizeDescription($data['description']);

            if ($description !== $task->description) {
                $oldValue['description'] = $task->description;
                $newValue['description'] = $description;
                $task->description = $description;
            }
        }

        if (array_key_exists('status', $data)) {
            $status = (string) $data['status'];

            if ($status !== $task->status) {
                $oldValue['status'] = $task->status;
                $newValue['status'] = $status;
                $task->status = $status;
            }
        }

        if ($oldValue === []) {
            return $this->loadTaskRelations($task->fresh());
        }

        return DB::transaction(function () use ($task, $oldValue, $newValue, $actor): Task {
            $task->save();

            $this->taskHistoryService->record(
                $task,
                'task_updated',
                $oldValue,
                $newValue,
                $actor
            );

            return $this->loadTaskRelations($task->fresh());
        });
    }

    public function deleteTask(Task $task, User $actor): void
    {
        if ($task->trashed()) {
            throw TasksException::taskAlreadyDeleted($task->id, $task->workspace_id);
        }

        DB::transaction(function () use ($task, $actor): void {
            $task->delete();

            $this->taskHistoryService->record(
                $task,
                'task_deleted',
                ['deleted_at' => null],
                ['deleted_at' => optional($task->deleted_at)->toISOString()],
                $actor
            );
        });
    }

    public function resolveTask(Workspace $workspace, int $taskId, bool $includeDeleted = false): Task
    {
        $task = $this->taskQueryForWorkspace($workspace, $includeDeleted)
            ->with($this->taskRelations())
            ->whereKey($taskId)
            ->first();

        if ($task === null) {
            throw TasksException::taskNotFound($taskId, $workspace->id);
        }

        return $task;
    }

    public function resolveActiveTask(Workspace $workspace, int $taskId): Task
    {
        $task = $this->resolveTask($workspace, $taskId, true);

        $this->guardTaskActive($task);

        return $task;
    }

    public function taskQueryForWorkspace(Workspace $workspace, bool $includeDeleted = false): Builder
    {
        $query = Task::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id);

        if ($includeDeleted) {
            $query->withTrashed();
        }

        return $query;
    }

    public function guardTaskActive(Task $task): void
    {
        if ($task->trashed()) {
            throw TasksException::taskDeletedImmutable($task->id, $task->workspace_id);
        }
    }

    private function resolveProject(Workspace $workspace, int $projectId): Project
    {
        $project = Project::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id)
            ->whereKey($projectId)
            ->first();

        if ($project === null) {
            throw TasksException::projectNotFound($projectId, $workspace->id);
        }

        return $project;
    }

    private function normalizeTitle(string $title): string
    {
        return trim($title);
    }

    private function normalizeDescription(mixed $description): ?string
    {
        if ($description === null) {
            return null;
        }

        $trimmed = trim((string) $description);

        return $trimmed === '' ? null : $trimmed;
    }

    private function resolveSortBy(mixed $sortBy): string
    {
        $allowed = [
            'created_at',
            'updated_at',
            'title',
            'status',
        ];

        return in_array($sortBy, $allowed, true) ? (string) $sortBy : 'updated_at';
    }

    private function resolveSortDirection(mixed $sortDir): string
    {
        return in_array($sortDir, ['asc', 'desc'], true) ? (string) $sortDir : 'desc';
    }

    private function loadTaskRelations(?Task $task): Task
    {
        return $task->load($this->taskRelations());
    }

    private function taskRelations(): array
    {
        return [
            'project',
            'creator',
            'assignees' => fn($query) => $query->orderBy('name'),
        ];
    }
}
