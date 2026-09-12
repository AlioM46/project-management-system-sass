<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Modules\Comments\Model\Comment;
use App\Modules\Projects\Model\Project;
use App\Modules\Tasks\Model\Task;
use App\Modules\Workspace\Model\Workspace;
use Illuminate\Console\Command;

class PurgeDeletedWorkspacesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'workspace:purge-deleted {--days=30 : The number of retention days before permanent deletion}';

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
        $days = (int) $this->option('days');
        if ($days < 1) {
            $days = 30;
        }

        $cutoff = now()->subDays($days);
        $this->info("Purging soft-deleted records older than {$days} days (before {$cutoff->toDateTimeString()})...");

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

        // 3. Purge soft-deleted Projects (and associated tasks)
        $purgedProjects = Project::onlyTrashed()
            ->withoutGlobalScopes()
            ->where('deleted_at', '<=', $cutoff)
            ->forceDelete();

        // 4. Purge soft-deleted Workspaces
        $purgedWorkspaces = Workspace::onlyTrashed()
            ->withoutGlobalScopes()
            ->where('deleted_at', '<=', $cutoff)
            ->forceDelete();

        $this->info("✅ Purge complete:");
        $this->line("   - Workspaces: {$purgedWorkspaces}");
        $this->line("   - Projects:   {$purgedProjects}");
        $this->line("   - Tasks:      {$purgedTasks}");
        $this->line("   - Comments:   {$purgedComments}");

        return Command::SUCCESS;
    }
}

