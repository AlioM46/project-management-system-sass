<?php

namespace App\Modules\Leads\Observers;

use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Services\StudentLifecycleService;

class LeadObserver
{
    public function __construct(
        private readonly StudentLifecycleService $studentLifecycleService
    ) {}

    public function updated(Lead $lead): void
    {
        if (! $lead->wasChanged('stage_id')) {
            return;
        }

        $this->studentLifecycleService->createFromSuccessfulLead($lead);
    }
}
