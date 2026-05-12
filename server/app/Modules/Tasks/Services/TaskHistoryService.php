<?php

namespace App\Modules\Tasks\Services;

use App\Models\User;
use App\Modules\Tasks\Model\Task;
use App\Modules\Tasks\Model\TaskHistory;
use Illuminate\Database\Eloquent\Collection;

class TaskHistoryService
{
    public function record(
        Task $task,
        string $eventType,
        ?array $oldValue,
        ?array $newValue,
        User $actor
    ): TaskHistory {
        return TaskHistory::query()->create([
            'task_id' => $task->id,
            'event_type' => $eventType,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'actor_user_id' => $actor->id,
            'created_at' => now(),
        ]);
    }

    public function listForTask(Task $task): Collection
    {
        return $task->history()->with('actor')->get();
    }
}
