<?php

namespace App\Modules\Projects\Services;

use App\Models\User;
use App\Modules\Projects\Exceptions\ProjectsException;
use App\Modules\Projects\Model\Project;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class ProjectService
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService
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

    public function listProjects(Workspace $workspace, array $filters = []): Collection
    {
        $includeDeleted = (bool) ($filters['include_deleted'] ?? false);
        $search = $this->normalizeSearchTerm($filters['search'] ?? null);

        $query = $this->projectQueryForWorkspace($workspace, $includeDeleted)
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        if ($search !== null) {
            $like = '%' . $search . '%';

            $query->where(function (Builder $builder) use ($like): void {
                $builder
                    ->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw("LOWER(COALESCE(description, '')) LIKE ?", [$like]);
            });
        }

        return $query->get();
    }

    public function resolveProject(Workspace $workspace, int $projectId, bool $includeDeleted = false): Project
    {
        $project = $this->projectQueryForWorkspace($workspace, $includeDeleted)
            ->whereKey($projectId)
            ->first();

        if ($project === null) {
            throw ProjectsException::projectNotFound($projectId, $workspace->id);
        }

        return $project;
    }

    public function resolveActiveProject(Workspace $workspace, int $projectId): Project
    {
        $project = $this->resolveProject($workspace, $projectId, true);

        $this->guardProjectActive($project);

        return $project;
    }

    public function createProject(Workspace $workspace, array $data, User $actor): Project
    {
        $name = $this->normalizeName((string) $data['name']);
        $description = $this->normalizeDescription($data['description'] ?? null);
        $activeNameKey = $this->makeActiveNameKey($name);

        $this->guardActiveNameUnique($workspace->id, $name, $activeNameKey);

        return $this->executeWithNameConflictHandling(
            function () use ($workspace, $name, $description, $activeNameKey, $actor): Project {
                return DB::transaction(function () use ($workspace, $name, $description, $activeNameKey, $actor): Project {
                    $project = Project::query()
                        ->withoutGlobalScope(WorkspaceTenantScope::class)
                        ->create([
                            'workspace_id' => $workspace->id,
                            'name' => $name,
                            'description' => $description,
                            'created_by_user_id' => $actor->id,
                            'active_name_key' => $activeNameKey,
                        ]);

                    return $project->fresh();
                });
            },
            $name,
            $workspace->id
        );
    }

    public function updateProject(Project $project, array $data): Project
    {
        $this->guardProjectActive($project);

        $name = array_key_exists('name', $data)
            ? $this->normalizeName((string) $data['name'])
            : $project->name;

        $description = array_key_exists('description', $data)
            ? $this->normalizeDescription($data['description'])
            : $project->description;

        $activeNameKey = $this->makeActiveNameKey($name);

        $this->guardActiveNameUnique($project->workspace_id, $name, $activeNameKey, $project->id);

        return $this->executeWithNameConflictHandling(
            function () use ($project, $name, $description, $activeNameKey): Project {
                return DB::transaction(function () use ($project, $name, $description, $activeNameKey): Project {
                    $project->name = $name;
                    $project->description = $description;
                    $project->active_name_key = $activeNameKey;
                    $project->save();

                    return $project->fresh();
                });
            },
            $name,
            $project->workspace_id
        );
    }

    public function deleteProject(Project $project): void
    {
        if ($project->trashed()) {
            throw ProjectsException::projectAlreadyDeleted($project->id, $project->workspace_id);
        }

        DB::transaction(function () use ($project): void {
            $project->active_name_key = null;
            $project->save();
            $project->delete();
        });
    }

    public function restoreProject(Project $project): Project
    {
        $this->guardProjectDeleted($project);

        $activeNameKey = $this->makeActiveNameKey($project->name);

        $this->guardActiveNameUnique($project->workspace_id, $project->name, $activeNameKey, $project->id);

        return $this->executeWithNameConflictHandling(
            function () use ($project, $activeNameKey): Project {
                return DB::transaction(function () use ($project, $activeNameKey): Project {
                    $project->active_name_key = $activeNameKey;
                    $project->restore();

                    return $project->fresh();
                });
            },
            $project->name,
            $project->workspace_id
        );
    }

    public function guardProjectActive(Project $project): void
    {
        if ($project->trashed()) {
            throw ProjectsException::projectDeletedImmutable($project->id, $project->workspace_id);
        }
    }

    public function projectQueryForWorkspace(Workspace $workspace, bool $includeDeleted = false): Builder
    {
        $query = Project::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id);

        if ($includeDeleted) {
            $query->withTrashed();
        }

        return $query;
    }

    private function guardProjectDeleted(Project $project): void
    {
        if (!$project->trashed()) {
            throw ProjectsException::projectNotDeleted($project->id, $project->workspace_id);
        }
    }

    private function guardActiveNameUnique(
        int $workspaceId,
        string $name,
        string $activeNameKey,
        ?int $ignoreProjectId = null
    ): void {
        $query = Project::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspaceId)
            ->where('active_name_key', $activeNameKey);

        if ($ignoreProjectId !== null) {
            $query->where('id', '!=', $ignoreProjectId);
        }

        if ($query->exists()) {
            throw ProjectsException::projectNameConflict($name, $workspaceId);
        }
    }

    private function normalizeName(string $name): string
    {
        return trim($name);
    }

    private function normalizeDescription(mixed $description): ?string
    {
        if ($description === null) {
            return null;
        }

        $trimmed = trim((string) $description);

        return $trimmed === '' ? null : $trimmed;
    }

    private function normalizeSearchTerm(mixed $search): ?string
    {
        if ($search === null) {
            return null;
        }

        $trimmed = trim((string) $search);

        return $trimmed === '' ? null : mb_strtolower($trimmed);
    }

    private function makeActiveNameKey(string $name): string
    {
        return mb_strtolower(trim($name));
    }

    private function executeWithNameConflictHandling(Closure $callback, string $name, int $workspaceId): mixed
    {
        try {
            return $callback();
        } catch (QueryException $exception) {
            if ($this->isUniqueConstraintViolation($exception)) {
                throw ProjectsException::projectNameConflict($name, $workspaceId);
            }

            throw $exception;
        }
    }

    private function isUniqueConstraintViolation(QueryException $exception): bool
    {
        $sqlState = (string) $exception->getCode();

        if (in_array($sqlState, ['19', '23000', '23505'], true)) {
            return true;
        }

        $message = strtolower($exception->getMessage());

        return str_contains($message, 'projects_workspace_id_active_name_key_unique')
            || str_contains($message, 'unique constraint')
            || str_contains($message, 'duplicate entry');
    }
}
