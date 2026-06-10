<?php

namespace App\Modules\Leads\Actions;

use App\Modules\Leads\Services\LeadAssignmentService;
use App\Modules\Leads\Services\LeadService;
use Illuminate\Database\Eloquent\Collection;

class GetLeadAssignees
{
    public function __construct(
        private readonly LeadService $leadService,
        private readonly LeadAssignmentService $leadAssignmentService
    ) {}

    public function execute(int $leadId): Collection
    {
        $lead = $this->leadService->getLead($this->leadService->currentWorkspace(), $leadId);

        return $this->leadAssignmentService->getAssignees($lead);
    }
}
