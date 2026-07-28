<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Audit\Enums\AuditAction;
use App\Modules\Audit\Enums\AuditTargetType;
use App\Modules\Audit\Model\AuditLog;
use App\Modules\Comments\Model\Comment;
use App\Modules\Comments\Model\CommentAttachment;
use App\Modules\Comments\Model\Mention;
use App\Modules\Notifications\Enums\NotificationType;
use App\Modules\Notifications\Model\Notification;
use App\Modules\Projects\Model\Project;
use App\Modules\RolesPermissions\Model\Permission;
use App\Modules\RolesPermissions\Model\Role;
use App\Modules\RolesPermissions\Services\PermissionCatalogService;
use App\Modules\Tasks\Enums\TaskStatus;
use App\Modules\Tasks\Model\Task;
use App\Modules\Tasks\Model\TaskAssignment;
use App\Modules\Tasks\Model\TaskHistory;
use App\Modules\Workspace\Actions\WorkspaceActions\CreateWorkspace;
use App\Modules\Workspace\Model\Workspace;
use App\Modules\Workspace\Model\Workspace_Members;
use App\Modules\Workspace\Model\WorkspaceInvitation;
use App\Modules\Workspace\Scopes\WorkspaceTenantScope;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ProjectManagementDemoSeeder extends Seeder
{
    private const PASSWORD = 'password123';

    public function run(): void
    {
        /** @var PermissionCatalogService $permissionCatalog */
        $permissionCatalog = app(PermissionCatalogService::class);
        $permissionsByKey = $permissionCatalog->syncSystemPermissions();
        $users = $this->seedUsers();

        $workspaceBlueprints = [
            [
                'name' => 'Northstar Delivery',
                'owner_email' => 'sarah.holt@seed.local',
                'members' => [
                    'omar.raji@seed.local',
                    'mia.khan@seed.local',
                    'liam.ross@seed.local',
                    'nora.lee@seed.local',
                    'zoe.patel@seed.local',
                    'ethan.gray@seed.local',
                    'maya.chen@seed.local',
                    'yousef.adel@seed.local',
                    'huda.salem@seed.local',
                ],
            ],
            [
                'name' => 'Atlas Operations',
                'owner_email' => 'daniel.price@seed.local',
                'members' => [
                    'tariq.noor@seed.local',
                    'aya.hassan@seed.local',
                    'leo.martin@seed.local',
                    'carmen.vega@seed.local',
                    'ryan.woods@seed.local',
                    'lina.fares@seed.local',
                    'samir.naji@seed.local',
                    'eva.brooks@seed.local',
                    'noah.reed@seed.local',
                ],
            ],
            [
                'name' => 'Beacon Product Lab',
                'owner_email' => 'fatima.zahran@seed.local',
                'members' => [
                    'jude.parker@seed.local',
                    'hannah.ford@seed.local',
                    'isla.young@seed.local',
                    'karim.shaw@seed.local',
                    'ranya.amin@seed.local',
                    'mason.clark@seed.local',
                    'nina.doyle@seed.local',
                    'ibrahim.ward@seed.local',
                    'sofia.bennett@seed.local',
                ],
            ],
        ];

        foreach ($workspaceBlueprints as $workspaceIndex => $blueprint) {
            $owner = $users[$blueprint['owner_email']];
            $workspace = app(CreateWorkspace::class)->execute(['name' => $blueprint['name']], $owner);

            $this->seedCustomRoles($workspace, $owner, $permissionsByKey);
            $roles = Role::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->where('workspace_id', $workspace->id)
                ->get()
                ->keyBy('slug');

            $workspaceUsers = collect($blueprint['members'])
                ->map(fn (string $email) => $users[$email])
                ->prepend($owner)
                ->values();

            $this->seedWorkspaceMembers($workspace, $workspaceUsers, $roles, $owner, $workspaceIndex);

            $projects = $this->seedProjects($workspace, $workspaceUsers, $owner, $workspaceIndex);
            $tasks = $this->seedTasks($workspace, $projects, $workspaceUsers, $owner);

            $this->seedComments($workspace, $tasks, $workspaceUsers);
            $this->seedInvitations($workspace, $workspaceUsers, $roles, $owner);
            $this->seedNotifications($workspace, $workspaceUsers, $tasks);
            $this->seedRecentAuditTrail($workspace, $workspaceUsers, $projects, $tasks);
        }

        $this->command?->info('Seeded project management demo data.');
        $this->command?->line('Login with any seed.local account using password: password123');
    }

    private function seedUsers(): array
    {
        $rows = [
            ['name' => 'Sarah Holt', 'username' => 'sarahholt', 'email' => 'sarah.holt@seed.local', 'status' => 'active'],
            ['name' => 'Daniel Price', 'username' => 'danprice', 'email' => 'daniel.price@seed.local', 'status' => 'active'],
            ['name' => 'Fatima Zahran', 'username' => 'fatimaz', 'email' => 'fatima.zahran@seed.local', 'status' => 'active'],
            ['name' => 'Omar Raji', 'username' => 'omarraji', 'email' => 'omar.raji@seed.local', 'status' => 'active'],
            ['name' => 'Mia Khan', 'username' => 'miakhan', 'email' => 'mia.khan@seed.local', 'status' => 'active'],
            ['name' => 'Liam Ross', 'username' => 'liamross', 'email' => 'liam.ross@seed.local', 'status' => 'active'],
            ['name' => 'Nora Lee', 'username' => 'noralee', 'email' => 'nora.lee@seed.local', 'status' => 'active'],
            ['name' => 'Zoe Patel', 'username' => 'zoepatel', 'email' => 'zoe.patel@seed.local', 'status' => 'active'],
            ['name' => 'Ethan Gray', 'username' => 'ethangray', 'email' => 'ethan.gray@seed.local', 'status' => 'active'],
            ['name' => 'Maya Chen', 'username' => 'mayachen', 'email' => 'maya.chen@seed.local', 'status' => 'active'],
            ['name' => 'Yousef Adel', 'username' => 'yousefadel', 'email' => 'yousef.adel@seed.local', 'status' => 'active'],
            ['name' => 'Huda Salem', 'username' => 'hudasalem', 'email' => 'huda.salem@seed.local', 'status' => 'inactive'],
            ['name' => 'Tariq Noor', 'username' => 'tariqnoor', 'email' => 'tariq.noor@seed.local', 'status' => 'active'],
            ['name' => 'Aya Hassan', 'username' => 'ayahassan', 'email' => 'aya.hassan@seed.local', 'status' => 'active'],
            ['name' => 'Leo Martin', 'username' => 'leomartin', 'email' => 'leo.martin@seed.local', 'status' => 'active'],
            ['name' => 'Carmen Vega', 'username' => 'carmenvega', 'email' => 'carmen.vega@seed.local', 'status' => 'active'],
            ['name' => 'Ryan Woods', 'username' => 'ryanwoods', 'email' => 'ryan.woods@seed.local', 'status' => 'active'],
            ['name' => 'Lina Fares', 'username' => 'linafares', 'email' => 'lina.fares@seed.local', 'status' => 'active'],
            ['name' => 'Samir Naji', 'username' => 'samirnaji', 'email' => 'samir.naji@seed.local', 'status' => 'active'],
            ['name' => 'Eva Brooks', 'username' => 'evabrooks', 'email' => 'eva.brooks@seed.local', 'status' => 'active'],
            ['name' => 'Noah Reed', 'username' => 'noahreed', 'email' => 'noah.reed@seed.local', 'status' => 'suspended'],
            ['name' => 'Jude Parker', 'username' => 'judeparker', 'email' => 'jude.parker@seed.local', 'status' => 'active'],
            ['name' => 'Hannah Ford', 'username' => 'hannahford', 'email' => 'hannah.ford@seed.local', 'status' => 'active'],
            ['name' => 'Isla Young', 'username' => 'islayoung', 'email' => 'isla.young@seed.local', 'status' => 'active'],
            ['name' => 'Karim Shaw', 'username' => 'karimshaw', 'email' => 'karim.shaw@seed.local', 'status' => 'active'],
            ['name' => 'Ranya Amin', 'username' => 'ranyaamin', 'email' => 'ranya.amin@seed.local', 'status' => 'active'],
            ['name' => 'Mason Clark', 'username' => 'masonclark', 'email' => 'mason.clark@seed.local', 'status' => 'active'],
            ['name' => 'Nina Doyle', 'username' => 'ninadoyle', 'email' => 'nina.doyle@seed.local', 'status' => 'active'],
            ['name' => 'Ibrahim Ward', 'username' => 'ibrahimward', 'email' => 'ibrahim.ward@seed.local', 'status' => 'active'],
            ['name' => 'Sofia Bennett', 'username' => 'sofiabenn', 'email' => 'sofia.bennett@seed.local', 'status' => 'active'],
        ];

        $users = [];

        foreach ($rows as $index => $row) {
            $verifiedAt = now()->subDays(90 - $index);
            $lastLoginAt = now()->subDays($index % 10)->subHours(($index * 3) % 24);

            $user = User::query()->updateOrCreate(
                ['email' => $row['email']],
                [
                    'name' => $row['name'],
                    'username' => $row['username'],
                    'password' => self::PASSWORD,
                    'status' => $row['status'],
                    'email_verified_at' => $verifiedAt,
                    'last_login_at' => $lastLoginAt,
                    'last_login_ip' => '10.20.30.'.($index + 10),
                    'refresh_token' => Str::random(40),
                    'refresh_token_expiration' => now()->addDays(30),
                ]
            );

            $users[$user->email] = $user;
        }

        return $users;
    }

    private function seedCustomRoles(Workspace $workspace, User $owner, Collection $permissionsByKey): Collection
    {
        $definitions = [
            [
                'slug' => 'project_manager',
                'name' => 'Project Manager',
                'description' => 'Plans delivery, manages projects, and keeps task execution moving.',
                'permissions' => [
                    'workspace.view',
                    'member.view',
                    'role.view',
                    'project.view',
                    'project.create',
                    'project.update',
                    'task.view',
                    'task.create',
                    'task.update',
                    'task.assign',
                    'task.change_status',
                    'comment.view',
                    'comment.create',
                    'comment.update',
                    'audit.view',
                    'report.view',
                    'report.create',
                ],
            ],
            [
                'slug' => 'qa_lead',
                'name' => 'QA Lead',
                'description' => 'Tracks release quality, triages blockers, and drives validation work.',
                'permissions' => [
                    'workspace.view',
                    'member.view',
                    'role.view',
                    'project.view',
                    'task.view',
                    'task.update',
                    'task.assign',
                    'task.change_status',
                    'comment.view',
                    'comment.create',
                    'comment.update',
                    'audit.view',
                    'report.view',
                ],
            ],
            [
                'slug' => 'client_observer',
                'name' => 'Client Observer',
                'description' => 'Read-only access for stakeholders following delivery progress.',
                'permissions' => [
                    'workspace.view',
                    'member.view',
                    'role.view',
                    'project.view',
                    'task.view',
                    'comment.view',
                    'audit.view',
                    'report.view',
                ],
            ],
        ];

        $roles = collect();

        foreach ($definitions as $index => $definition) {
            $role = Role::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->updateOrCreate(
                    [
                        'workspace_id' => $workspace->id,
                        'slug' => $definition['slug'],
                    ],
                    [
                        'name' => $definition['name'],
                        'description' => $definition['description'],
                        'is_system' => false,
                        'is_editable' => true,
                        'is_deletable' => true,
                    ]
                );

            $syncData = [];

            foreach ($definition['permissions'] as $permissionKey) {
                /** @var Permission|null $permission */
                $permission = $permissionsByKey->get($permissionKey);

                if ($permission === null) {
                    continue;
                }

                $syncData[$permission->id] = ['permission_key' => $permission->key];
            }

            $role->permissions()->sync($syncData);
            $roles->put($definition['slug'], $role);

            $this->createAuditLog(
                workspace: $workspace,
                action: AuditAction::RoleCreated,
                targetType: AuditTargetType::Role,
                targetId: $role->id,
                actor: $owner,
                newValues: [
                    'name' => $role->name,
                    'slug' => $role->slug,
                    'permission_count' => count($syncData),
                ],
                occurredAt: now()->subDays(30 - $index)
            );
        }

        return $roles;
    }

    private function seedWorkspaceMembers(
        Workspace $workspace,
        Collection $workspaceUsers,
        Collection $roles,
        User $owner,
        int $workspaceIndex
    ): void {
        $roleSequence = [
            'admin',
            'project_manager',
            'qa_lead',
            'member',
            'member',
            'client_observer',
            'member',
            'admin',
            'member',
        ];

        foreach ($workspaceUsers->slice(1)->values() as $index => $user) {
            $roleSlug = $roleSequence[$index % count($roleSequence)];
            /** @var Role $role */
            $role = $roles[$roleSlug];
            $joinedAt = now()->subDays(40 - ($workspaceIndex * 4) - $index)->subHours($index % 7);

            Workspace_Members::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                ],
                [
                    'role_id' => $role->id,
                    'joined_at' => $joinedAt,
                ]
                );

            $this->createAuditLog(
                workspace: $workspace,
                action: AuditAction::MemberJoined,
                targetType: AuditTargetType::WorkspaceMember,
                targetId: Workspace_Members::query()
                    ->withoutGlobalScope(WorkspaceTenantScope::class)
                    ->where('workspace_id', $workspace->id)
                    ->where('user_id', $user->id)
                    ->value('id'),
                actor: $owner,
                newValues: [
                    'user_id' => $user->id,
                    'role_id' => $role->id,
                ],
                occurredAt: $joinedAt
            );
        }
    }

    private function seedProjects(
        Workspace $workspace,
        Collection $workspaceUsers,
        User $owner,
        int $workspaceIndex
    ): Collection {
        $projectSets = [
            ['Customer Portal Revamp', 'Mobile App Rollout', 'Support Automation', 'Billing Upgrade', 'Security Hardening', 'Executive Reporting'],
            ['Warehouse Visibility', 'Procurement Controls', 'Vendor Scorecards', 'Field Ops Console', 'Compliance Tracker', 'Cost Recovery'],
            ['Discovery Board', 'Roadmap Engine', 'Beta Feedback Hub', 'Release Analytics', 'Design System Ops', 'Growth Experiments'],
        ];

        $projects = collect();
        $names = $projectSets[$workspaceIndex] ?? $projectSets[0];

        foreach ($names as $index => $name) {
            $creator = $workspaceUsers[($index + 1) % $workspaceUsers->count()];
            $createdAt = now()->subDays(28 - $index)->subHours($index * 2);
            $project = Project::query()
                ->withoutGlobalScope(WorkspaceTenantScope::class)
                ->updateOrCreate(
                    [
                        'workspace_id' => $workspace->id,
                        'active_name_key' => Str::slug($name),
                    ],
                    [
                        'name' => $name,
                        'description' => $this->projectDescription($workspace->name, $name),
                        'created_by_user_id' => $creator->id,
                    ]
                );

            $project->forceFill([
                'created_at' => $createdAt,
                'updated_at' => $createdAt->copy()->addDays(2),
            ])->saveQuietly();

            $projects->push($project);

            $this->createAuditLog(
                workspace: $workspace,
                action: AuditAction::ProjectCreated,
                targetType: AuditTargetType::Project,
                targetId: $project->id,
                actor: $creator,
                newValues: [
                    'name' => $project->name,
                    'created_by_user_id' => $creator->id,
                ],
                occurredAt: $createdAt
            );
        }

        return $projects;
    }

    private function seedTasks(
        Workspace $workspace,
        Collection $projects,
        Collection $workspaceUsers,
        User $owner
    ): Collection {
        $titles = [
            'Define delivery milestones',
            'Review stakeholder feedback',
            'Draft implementation plan',
            'Prepare QA checklist',
            'Resolve API edge cases',
            'Refine permission handling',
            'Validate mobile layouts',
            'Optimize dashboard queries',
            'Document rollout steps',
            'Reconcile task dependencies',
            'Prepare launch notes',
            'Audit notification flows',
        ];
        $statuses = [
            TaskStatus::TODO,
            TaskStatus::IN_PROGRESS,
            TaskStatus::BLOCKED,
            TaskStatus::DONE,
            TaskStatus::CANCELLED,
        ];
        $tasks = collect();

        foreach ($projects as $projectIndex => $project) {
            for ($taskIndex = 0; $taskIndex < 12; $taskIndex++) {
                $creator = $workspaceUsers[($projectIndex + $taskIndex + 1) % $workspaceUsers->count()];
                $status = $statuses[($projectIndex + $taskIndex) % count($statuses)];
                $createdAt = now()->subDays(($projectIndex * 2) + ($taskIndex % 9))->subHours(($taskIndex * 3) % 24);
                $updatedAt = $createdAt->copy()->addHours(8 + (($taskIndex + $projectIndex) % 36));
                $completedAt = $status === TaskStatus::DONE ? $updatedAt->copy() : null;

                $task = new Task([
                    'workspace_id' => $workspace->id,
                    'project_id' => $project->id,
                    'title' => $titles[$taskIndex].' #'.($projectIndex + 1).'-'.($taskIndex + 1),
                    'description' => $this->taskDescription($project->name, $taskIndex),
                    'status' => $status->value,
                    'completed_at' => $completedAt,
                    'created_by_user_id' => $creator->id,
                ]);
                $task->created_at = $createdAt;
                $task->updated_at = $updatedAt;
                $task->save();

                $tasks->push($task);

                $this->seedTaskAssignments($task, $workspaceUsers, $creator);
                $this->seedTaskHistory($task, $creator, $owner, $status, $createdAt, $updatedAt);

                $this->createAuditLog(
                    workspace: $workspace,
                    action: AuditAction::TaskCreated,
                    targetType: AuditTargetType::Task,
                    targetId: $task->id,
                    actor: $creator,
                    newValues: [
                        'project_id' => $project->id,
                        'title' => $task->title,
                        'status' => TaskStatus::TODO->value,
                    ],
                    occurredAt: $createdAt
                );

                if ($status !== TaskStatus::TODO) {
                    $this->createAuditLog(
                        workspace: $workspace,
                        action: AuditAction::TaskStatusChanged,
                        targetType: AuditTargetType::Task,
                        targetId: $task->id,
                        actor: $owner,
                        oldValues: [
                            'status' => TaskStatus::TODO->value,
                            'completed_at' => null,
                        ],
                        newValues: [
                            'status' => $status->value,
                            'completed_at' => $completedAt?->toISOString(),
                        ],
                        occurredAt: $updatedAt
                    );
                }
            }
        }

        return $tasks;
    }

    private function seedTaskAssignments(Task $task, Collection $workspaceUsers, User $creator): void
    {
        $assigneeCount = 1 + ($task->id % 3);
        $assignees = $workspaceUsers
            ->shuffle()
            ->take($assigneeCount)
            ->values();

        foreach ($assignees as $index => $assignee) {
            TaskAssignment::query()->updateOrCreate(
                [
                    'task_id' => $task->id,
                    'user_id' => $assignee->id,
                ],
                [
                    'assigned_by_user_id' => $creator->id,
                    'created_at' => $task->created_at->copy()->addMinutes(20 + ($index * 10)),
                ]
            );
        }
    }

    private function seedTaskHistory(
        Task $task,
        User $creator,
        User $owner,
        TaskStatus $status,
        Carbon $createdAt,
        Carbon $updatedAt
    ): void {
        TaskHistory::query()->create([
            'task_id' => $task->id,
            'event_type' => 'task_created',
            'old_value' => null,
            'new_value' => [
                'title' => $task->title,
                'status' => TaskStatus::TODO->value,
            ],
            'actor_user_id' => $creator->id,
            'created_at' => $createdAt,
        ]);

        TaskHistory::query()->create([
            'task_id' => $task->id,
            'event_type' => 'assignees_added',
            'old_value' => null,
            'new_value' => [
                'assignee_ids' => TaskAssignment::query()
                    ->where('task_id', $task->id)
                    ->pluck('user_id')
                    ->values()
                    ->all(),
            ],
            'actor_user_id' => $creator->id,
            'created_at' => $createdAt->copy()->addMinutes(45),
        ]);

        if ($status !== TaskStatus::TODO) {
            TaskHistory::query()->create([
                'task_id' => $task->id,
                'event_type' => 'status_changed',
                'old_value' => ['status' => TaskStatus::TODO->value],
                'new_value' => ['status' => $status->value],
                'actor_user_id' => $owner->id,
                'created_at' => $updatedAt,
            ]);
        }
    }

    private function seedComments(Workspace $workspace, Collection $tasks, Collection $workspaceUsers): void
    {
        $phrases = [
            'Need confirmation on the acceptance criteria before closing this out.',
            'The API response looks stable now, but I still want one more regression pass.',
            'Pairing with design tomorrow to review the latest UI states.',
            'The blocker is reproducible only when the workspace has older imported data.',
            'I pushed a smaller follow-up to keep rollout risk controlled.',
            'Please review the updated notes and mark anything still missing.',
        ];

        foreach ($tasks as $taskIndex => $task) {
            $author = $workspaceUsers[$taskIndex % $workspaceUsers->count()];
            $mentionedUser = $workspaceUsers[($taskIndex + 2) % $workspaceUsers->count()];
            $rootComment = Comment::query()->create([
                'task_id' => $task->id,
                'author_id' => $author->id,
                'parent_id' => null,
                'content' => $phrases[$taskIndex % count($phrases)].' @'.$mentionedUser->username,
                'created_at' => $task->updated_at->copy()->addMinutes(15),
                'updated_at' => $task->updated_at->copy()->addMinutes(15),
            ]);

            Mention::query()->create([
                'mentioned_user_id' => $mentionedUser->id,
                'workspace_id' => $workspace->id,
                'source_type' => 'comment',
                'source_id' => $rootComment->id,
                'mentioned_by_user_id' => $author->id,
                'read_at' => $taskIndex % 2 === 0 ? now()->subHours(3) : null,
                'created_at' => $rootComment->created_at,
                'updated_at' => $rootComment->created_at,
            ]);

            if ($taskIndex % 4 === 0) {
                CommentAttachment::query()->create([
                    'comment_id' => $rootComment->id,
                    'object_key' => 'seed/workspaces/'.$workspace->id.'/comments/'.$rootComment->id.'/spec-'.$task->id.'.pdf',
                    'original_name' => 'spec-'.$task->id.'.pdf',
                    'file_type' => 'application/pdf',
                    'file_size' => 120000 + ($taskIndex * 450),
                    'created_at' => $rootComment->created_at,
                    'updated_at' => $rootComment->created_at,
                ]);
            }

            $replyAuthor = $workspaceUsers[($taskIndex + 3) % $workspaceUsers->count()];
            $reply = Comment::query()->create([
                'task_id' => $task->id,
                'author_id' => $replyAuthor->id,
                'parent_id' => $rootComment->id,
                'content' => 'Follow-up noted. I will handle the next pass today and post results here.',
                'created_at' => $rootComment->created_at->copy()->addMinutes(40),
                'updated_at' => $rootComment->created_at->copy()->addMinutes(40),
            ]);

            $this->createAuditLog(
                workspace: $workspace,
                action: AuditAction::CommentCreated,
                targetType: AuditTargetType::Comment,
                targetId: $rootComment->id,
                actor: $author,
                newValues: ['task_id' => $task->id],
                occurredAt: $rootComment->created_at
            );

            $this->createAuditLog(
                workspace: $workspace,
                action: AuditAction::CommentCreated,
                targetType: AuditTargetType::Comment,
                targetId: $reply->id,
                actor: $replyAuthor,
                newValues: ['task_id' => $task->id, 'parent_id' => $rootComment->id],
                occurredAt: $reply->created_at
            );
        }
    }

    private function seedInvitations(Workspace $workspace, Collection $workspaceUsers, Collection $roles, User $owner): void
    {
        $statuses = ['pending', 'accepted', 'revoked', 'expired', 'cancelled'];

        foreach ($statuses as $index => $status) {
            $role = $roles->values()[$index % $roles->count()];
            $acceptedBy = $status === 'accepted' ? $workspaceUsers[($index + 1) % $workspaceUsers->count()] : null;
            $sentAt = now()->subDays(10 - $index)->subHours($index);
            $expiresAt = $sentAt->copy()->addDays(7);
            $invite = WorkspaceInvitation::query()->updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'email' => 'invite+'.Str::slug($workspace->name).'-'.$status.'@seed.local',
                ],
                [
                    'role_id' => $role->id,
                    'invited_by_user_id' => $owner->id,
                    'accepted_by_user_id' => $acceptedBy?->id,
                    'status' => $status,
                    'token_hash' => hash('sha256', $workspace->id.'-'.$status),
                    'message' => 'Seeded invite for '.$status.' flow coverage.',
                    'expires_at' => $expiresAt,
                    'sent_at' => $sentAt,
                    'accepted_at' => $status === 'accepted' ? $sentAt->copy()->addDays(2) : null,
                    'revoked_at' => $status === 'revoked' ? $sentAt->copy()->addDays(1) : null,
                ]
            );

            $this->createAuditLog(
                workspace: $workspace,
                action: AuditAction::MemberInvited,
                targetType: AuditTargetType::WorkspaceInvitation,
                targetId: $invite->id,
                actor: $owner,
                newValues: [
                    'email' => $invite->email,
                    'status' => $invite->status,
                    'role_id' => $invite->role_id,
                ],
                occurredAt: $sentAt
            );
        }
    }

    private function seedNotifications(Workspace $workspace, Collection $workspaceUsers, Collection $tasks): void
    {
        $types = [
            NotificationType::TASK_ASSIGNED,
            NotificationType::TASK_UPDATED,
            NotificationType::COMMENT_REPLIED,
            NotificationType::MENTIONED,
            NotificationType::WORKSPACE_INVITE,
        ];

        foreach ($workspaceUsers as $userIndex => $user) {
            for ($notificationIndex = 0; $notificationIndex < 5; $notificationIndex++) {
                $task = $tasks[($userIndex * 3 + $notificationIndex) % $tasks->count()];
                $createdAt = now()->subDays(($userIndex + $notificationIndex) % 7)->subHours($notificationIndex * 2);

                Notification::query()->create([
                    'workspace_id' => $workspace->id,
                    'user_id' => $user->id,
                    'type' => $types[($userIndex + $notificationIndex) % count($types)],
                    'data' => [
                        'task_id' => $task->id,
                        'task_title' => $task->title,
                        'workspace_name' => $workspace->name,
                        'message' => 'Seeded notification for dashboard and realtime testing.',
                    ],
                    'read_at' => $notificationIndex % 3 === 0 ? $createdAt->copy()->addHours(4) : null,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]);
            }
        }
    }

    private function seedRecentAuditTrail(
        Workspace $workspace,
        Collection $workspaceUsers,
        Collection $projects,
        Collection $tasks
    ): void {
        for ($index = 0; $index < 8; $index++) {
            $actor = $workspaceUsers[$index % $workspaceUsers->count()];
            $project = $projects[$index % $projects->count()];
            $task = $tasks[$index % $tasks->count()];
            $occurredAt = now()->subHours($index * 5);

            $this->createAuditLog(
                workspace: $workspace,
                action: $index % 2 === 0 ? AuditAction::TaskUpdated : AuditAction::ProjectUpdated,
                targetType: $index % 2 === 0 ? AuditTargetType::Task : AuditTargetType::Project,
                targetId: $index % 2 === 0 ? $task->id : $project->id,
                actor: $actor,
                oldValues: $index % 2 === 0
                    ? ['status' => TaskStatus::IN_PROGRESS->value]
                    : ['description' => 'Previous brief']
                ,
                newValues: $index % 2 === 0
                    ? ['status' => TaskStatus::DONE->value]
                    : ['description' => 'Updated seeded project brief']
                ,
                metadata: [
                    'project_id' => $project->id,
                    'task_id' => $task->id,
                ],
                occurredAt: $occurredAt
            );
        }
    }

    private function createAuditLog(
        Workspace $workspace,
        AuditAction $action,
        AuditTargetType $targetType,
        ?int $targetId,
        ?User $actor,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null,
        ?Carbon $occurredAt = null
    ): void {
        AuditLog::query()->create([
            'workspace_id' => $workspace->id,
            'actor_user_id' => $actor?->id,
            'event_type' => $action->value,
            'target_type' => $targetType->value,
            'target_id' => $targetId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => $metadata,
            'ip_address' => '127.0.0.1',
            'user_agent' => 'project-management-seeder',
            'occurred_at' => $occurredAt ?? now(),
        ]);
    }

    private function projectDescription(string $workspaceName, string $projectName): string
    {
        return sprintf(
            '%s initiative focused on %s. Seeded to populate project listings, dashboard summaries, and task relationships.',
            $workspaceName,
            strtolower($projectName)
        );
    }

    private function taskDescription(string $projectName, int $taskIndex): string
    {
        $tracks = [
            'backend flow validation',
            'frontend interaction cleanup',
            'stakeholder review prep',
            'release readiness checks',
            'data consistency follow-up',
            'cross-team dependency tracking',
        ];

        return sprintf(
            'Seeded task for %s covering %s.',
            $projectName,
            $tracks[$taskIndex % count($tracks)]
        );
    }
}
