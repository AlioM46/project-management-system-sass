<?php

namespace App\Modules\Leads\Services;

use App\Models\User;
use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Model\LeadHistory;
use Illuminate\Database\Eloquent\Collection;

class LeadHistoryService
{
    public function record(Lead $lead, string $eventType, ?array $oldValue, ?array $newValue, User $actor): LeadHistory
    {
        return LeadHistory::query()->create([
            'workspace_id' => $lead->workspace_id,
            'lead_id' => $lead->id,
            'event_type' => $eventType,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'actor_user_id' => $actor->id,
            'created_at' => now(),
        ]);
    }

    public function listForLead(Lead $lead): Collection
    {
        return $lead->history()->with('actor')->get();
    }
}
