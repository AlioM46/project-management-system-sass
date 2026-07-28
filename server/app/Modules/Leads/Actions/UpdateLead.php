<?php

namespace App\Modules\Leads\Actions;

use App\Models\User;
use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Services\LeadService;

class UpdateLead
{
    public function __construct(
        private readonly LeadService $leadService
    ) {}

    public function execute(int $leadId, array $data, User $actor): Lead
    {
        $lead = $this->leadService->resolveActiveLead($this->leadService->currentWorkspace(), $leadId);

        return $this->leadService->updateLead($lead, $data, $actor);
    }
}
