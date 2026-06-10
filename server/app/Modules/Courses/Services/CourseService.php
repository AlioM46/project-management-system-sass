<?php

namespace App\Modules\Courses\Services;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Services\AuditLogger;
use App\Modules\Courses\Exceptions\CoursesException;
use App\Modules\Courses\Model\Course;
use App\Modules\Courses\Model\Stage;
use App\Modules\Workspace\Exceptions\WorkspaceContextException;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use App\Modules\Workspace\Services\WorkspaceContextService;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class CourseService
{
    public function __construct(
        private readonly WorkspaceContextService $workspaceContextService,
        private readonly AuditLogger $auditLogger
    ) {}

    public function currentWorkspace(): Workspace
    {
        $workspace = $this->workspaceContextService->currentWorkspace();

        if ($workspace === null) {
            throw WorkspaceContextException::missingScopedModelContext('Workspace');
        }

        return $workspace;
    }

    public function listCourses(Workspace $workspace, array $filters = []): Collection
    {
        $includeDeleted = (bool) ($filters['include_deleted'] ?? false);
        $search = $this->normalizeSearchTerm($filters['search'] ?? null);

        $query = $this->courseQueryForWorkspace($workspace, $includeDeleted)
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        if ($search !== null) {
            $like = '%'.$search.'%';

            $query->where(function (Builder $builder) use ($like): void {
                $builder
                    ->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw("LOWER(COALESCE(description, '')) LIKE ?", [$like]);
            });
        }

        return $query->get();
    }

    public function resolveCourse(Workspace $workspace, int $courseId, bool $includeDeleted = false): Course
    {
        $course = $this->courseQueryForWorkspace($workspace, $includeDeleted)
            ->whereKey($courseId)
            ->first();

        if ($course === null) {
            throw CoursesException::courseNotFound($courseId, $workspace->id);
        }

        return $course;
    }

    public function createCourse(Workspace $workspace, array $data, User $actor): Course
    {
        $name = $this->normalizeName((string) $data['name']);
        $description = $this->normalizeDescription($data['description'] ?? null);
        $price = $this->normalizePrice($data['price'] ?? 0);
        $durationHours = $this->normalizeDurationHours($data['duration_hours'] ?? 0);
        $activeNameKey = $this->makeActiveNameKey($name);

        $this->guardActiveNameUnique($workspace->id, $name, $activeNameKey);

        return $this->executeWithNameConflictHandling(function () use (
            $workspace,
            $name,
            $description,
            $price,
            $durationHours,
            $activeNameKey,
            $actor
        ): Course {
            return DB::transaction(function () use (
                $workspace,
                $name,
                $description,
                $price,
                $durationHours,
                $activeNameKey,
                $actor
            ): Course {
                $course = Course::query()
                    ->withoutGlobalScope(WorkspaceTenantScope::class)
                    ->create([
                        'workspace_id' => $workspace->id,
                        'name' => $name,
                        'description' => $description,
                        'price' => $price,
                        'duration_hours' => $durationHours,
                        'created_by_user_id' => $actor->id,
                        'active_name_key' => $activeNameKey,
                    ]);

                // Create default CRM stages
                collect([
                    ['name' => 'New Inquiry', 'position' => 1, 'is_success' => false],
                    ['name' => 'Contacted', 'position' => 2, 'is_success' => false],
                    ['name' => 'Qualified', 'position' => 3, 'is_success' => false],
                    ['name' => 'Test Drive Session', 'position' => 4, 'is_success' => false],
                    ['name' => 'Deposit Paid', 'position' => 5, 'is_success' => false],
                    ['name' => 'Won', 'position' => 6, 'is_success' => true],
                    ['name' => 'Lost', 'position' => 7, 'is_success' => false],
                ])->each(fn (array $stage) => Stage::query()
                    ->withoutGlobalScope(WorkspaceTenantScope::class)
                    ->create([
                        'workspace_id' => $workspace->id,
                        'course_id' => $course->id,
                        'name' => $stage['name'],
                        'position' => $stage['position'],
                        'is_success' => $stage['is_success'],
                    ])
                );

                $this->auditLogger->record(
                    workspace: $workspace,
                    action: AuditAction::CourseCreated,
                    targetType: AuditTargetType::Course,
                    targetId: $course->id,
                    actor: $actor,
                    newValues: [
                        'name' => $course->name,
                        'description' => $course->description,
                        'price' => $course->price,
                        'duration_hours' => $course->duration_hours,
                    ]
                );

                return $course->fresh();
            });
        }, $name, $workspace->id);
    }

    public function updateCourse(Course $course, array $data, User $actor): Course
    {
        $this->guardCourseActive($course);

        $oldValues = [
            'name' => $course->name,
            'description' => $course->description,
            'price' => (string) $course->price,
            'duration_hours' => $course->duration_hours,
        ];

        $name = array_key_exists('name', $data) ? $this->normalizeName((string) $data['name']) : $course->name;
        $description = array_key_exists('description', $data) ? $this->normalizeDescription($data['description']) : $course->description;
        $price = array_key_exists('price', $data) ? $this->normalizePrice($data['price']) : (float) $course->price;
        $durationHours = array_key_exists('duration_hours', $data)
            ? $this->normalizeDurationHours($data['duration_hours'])
            : (int) $course->duration_hours;
        $activeNameKey = $this->makeActiveNameKey($name);

        $this->guardActiveNameUnique($course->workspace_id, $name, $activeNameKey, $course->id);

        return $this->executeWithNameConflictHandling(function () use (
            $course,
            $name,
            $description,
            $price,
            $durationHours,
            $activeNameKey,
            $oldValues,
            $actor
        ): Course {
            return DB::transaction(function () use (
                $course,
                $name,
                $description,
                $price,
                $durationHours,
                $activeNameKey,
                $oldValues,
                $actor
            ): Course {
                $course->fill([
                    'name' => $name,
                    'description' => $description,
                    'price' => $price,
                    'duration_hours' => $durationHours,
                    'active_name_key' => $activeNameKey,
                ]);

                $newValues = [
                    'name' => $course->name,
                    'description' => $course->description,
                    'price' => (string) $course->price,
                    'duration_hours' => $course->duration_hours,
                ];

                if ($oldValues === $newValues) {
                    return $course->fresh();
                }

                $course->save();

                $this->auditLogger->record(
                    workspace: $course->workspace,
                    action: AuditAction::CourseUpdated,
                    targetType: AuditTargetType::Course,
                    targetId: $course->id,
                    actor: $actor,
                    oldValues: $oldValues,
                    newValues: $newValues
                );

                return $course->fresh();
            });
        }, $name, $course->workspace_id);
    }

    public function deleteCourse(Course $course, User $actor): void
    {
        if ($course->trashed()) {
            throw CoursesException::courseAlreadyDeleted($course->id, $course->workspace_id);
        }

        DB::transaction(function () use ($course, $actor): void {
            $course->active_name_key = null;
            $course->save();
            $course->delete();

            $this->auditLogger->record(
                workspace: $course->workspace,
                action: AuditAction::CourseDeleted,
                targetType: AuditTargetType::Course,
                targetId: $course->id,
                actor: $actor,
                oldValues: ['deleted_at' => null],
                newValues: ['deleted_at' => $course->deleted_at?->toISOString()]
            );
        });
    }

    public function restoreCourse(Course $course, User $actor): Course
    {
        if (! $course->trashed()) {
            throw CoursesException::courseNotDeleted($course->id, $course->workspace_id);
        }

        $activeNameKey = $this->makeActiveNameKey($course->name);
        $this->guardActiveNameUnique($course->workspace_id, $course->name, $activeNameKey, $course->id);

        return $this->executeWithNameConflictHandling(function () use ($course, $activeNameKey, $actor): Course {
            return DB::transaction(function () use ($course, $activeNameKey, $actor): Course {
                $deletedAt = $course->deleted_at?->toISOString();
                $course->active_name_key = $activeNameKey;
                $course->restore();

                $this->auditLogger->record(
                    workspace: $course->workspace,
                    action: AuditAction::CourseRestored,
                    targetType: AuditTargetType::Course,
                    targetId: $course->id,
                    actor: $actor,
                    oldValues: ['deleted_at' => $deletedAt],
                    newValues: ['deleted_at' => null]
                );

                return $course->fresh();
            });
        }, $course->name, $course->workspace_id);
    }

    public function courseQueryForWorkspace(Workspace $workspace, bool $includeDeleted = false): Builder
    {
        $query = Course::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspace->id);

        if ($includeDeleted) {
            $query->withTrashed();
        }

        return $query;
    }

    public function guardCourseActive(Course $course): void
    {
        if ($course->trashed()) {
            throw CoursesException::courseDeletedImmutable($course->id, $course->workspace_id);
        }
    }

    private function guardActiveNameUnique(
        int $workspaceId,
        string $name,
        string $activeNameKey,
        ?int $ignoreCourseId = null
    ): void {
        $query = Course::query()
            ->withoutGlobalScope(WorkspaceTenantScope::class)
            ->where('workspace_id', $workspaceId)
            ->where('active_name_key', $activeNameKey);

        if ($ignoreCourseId !== null) {
            $query->where('id', '!=', $ignoreCourseId);
        }

        if ($query->exists()) {
            throw CoursesException::courseNameConflict($name, $workspaceId);
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

    private function normalizePrice(mixed $price): float
    {
        return round((float) $price, 2);
    }

    private function normalizeDurationHours(mixed $durationHours): int
    {
        return max(0, (int) $durationHours);
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
            $sqlState = (string) $exception->getCode();
            $message = strtolower($exception->getMessage());

            if (in_array($sqlState, ['19', '23000', '23505'], true)
                || str_contains($message, 'courses_workspace_id_active_name_key_unique')
                || str_contains($message, 'unique constraint')
                || str_contains($message, 'duplicate entry')) {
                throw CoursesException::courseNameConflict($name, $workspaceId);
            }

            throw $exception;
        }
    }
}
