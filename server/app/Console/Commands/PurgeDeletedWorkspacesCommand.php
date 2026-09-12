<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Modules\Comments\Model\Comment;
use App\Modules\Projects\Model\Project;
use App\Modules\Tasks\Model\Task;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class PurgeDeletedWorkspacesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'workspace:purge-deleted 
                            {--days= : The number of retention days before permanent deletion (default: 30)}
                            {--minutes= : The number of retention minutes for fast testing (e.g. --minutes=1)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently purges soft-deleted workspaces, projects, and tasks older than the retention period';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $minutesOption = $this->option('minutes');

        if ($minutesOption !== null && $minutesOption !== '') {
            $minutes = max(1, (int) $minutesOption);
            $cutoff = now()->subMinutes($minutes);
            $this->info("Purging soft-deleted records older than {$minutes} minute(s) (before {$cutoff->toDateTimeString()})...");
        } else {
            $days = (int) ($this->option('days') ?: 30);
            if ($days < 1) {
                $days = 30;
            }
            $cutoff = now()->subDays($days);
            $this->info("Purging soft-deleted records older than {$days} days (before {$cutoff->toDateTimeString()})...");
        }

        // 1. Purge soft-deleted Comments
        $purgedComments = Comment::onlyTrashed()
            ->withoutGlobalScopes()
            ->where('deleted_at', '<=', $cutoff)
            ->forceDelete();

        // 2. Purge soft-deleted Tasks
        $purgedTasks = Task::onlyTrashed()
            ->withoutGlobalScopes()
            ->where('deleted_at', '<=', $cutoff)
            ->forceDelete();

        // 3. Purge soft-deleted Projects (and associated tasks & comments)
        $projectsToPurge = Project::onlyTrashed()
            ->withoutGlobalScopes()
            ->where('deleted_at', '<=', $cutoff)
            ->get();

        $purgedProjects = 0;
        foreach ($projectsToPurge as $project) {
            $taskIds = Task::withTrashed()
                ->withoutGlobalScopes()
                ->where('project_id', $project->id)
                ->pluck('id');

            if ($taskIds->isNotEmpty()) {
                Comment::withTrashed()->whereIn('task_id', $taskIds)->forceDelete();
                Task::withTrashed()->whereIn('id', $taskIds)->forceDelete();
            }

            $project->forceDelete();
            $purgedProjects++;
        }

        // 4. Purge soft-deleted Workspaces (and clean up associated entities)
        $workspacesToPurge = Workspace::onlyTrashed()
            ->withoutGlobalScopes()
            ->where('deleted_at', '<=', $cutoff)
            ->get();

        $purgedWorkspaces = 0;
        foreach ($workspacesToPurge as $ws) {
            DB::transaction(function () use ($ws) {
                $taskIds = Task::withTrashed()->withoutGlobalScopes()->where('workspace_id', $ws->id)->pluck('id');
                if ($taskIds->isNotEmpty()) {
                    Comment::withTrashed()->whereIn('task_id', $taskIds)->forceDelete();
                    Task::withTrashed()->whereIn('id', $taskIds)->forceDelete();
                }

                Project::withTrashed()->withoutGlobalScopes()->where('workspace_id', $ws->id)->forceDelete();

                DB::table('workspace_members')->where('workspace_id', $ws->id)->delete();
                DB::table('workspace_invitations')->where('workspace_id', $ws->id)->delete();
                DB::table('roles')->where('workspace_id', $ws->id)->delete();
                DB::table('subscriptions')->where('workspace_id', $ws->id)->delete();
                DB::table('audit_logs')->where('workspace_id', $ws->id)->delete();

                $ws->forceDelete();
            });
            $purgedWorkspaces++;
        }

        $this->info("✅ Purge complete:");
        $this->line("   - Workspaces: {$purgedWorkspaces}");
        $this->line("   - Projects:   {$purgedProjects}");
        $this->line("   - Tasks:      {$purgedTasks}");
        $this->line("   - Comments:   {$purgedComments}");

        return Command::SUCCESS;
    }
}
