<?php

namespace App\Modules\Leads\Actions;

use App\Models\User;
use App\Modules\Leads\Services\LeadService;

class DeleteLead
{
    public function __construct(
        private readonly LeadService $leadService
    ) {}

    public function execute(int $leadId, User $actor): void
    {
        $lead = $this->leadService->resolveActiveLead($this->leadService->currentWorkspace(), $leadId);
        $this->leadService->deleteLead($lead, $actor);
    }
}
