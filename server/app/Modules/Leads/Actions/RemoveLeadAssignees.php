<?php

namespace App\Modules\Leads\Actions;

use App\Models\User;
use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Services\LeadAssignmentService;
use App\Modules\Leads\Services\LeadService;

class RemoveLeadAssignees
{
    public function __construct(
        private readonly LeadService $leadService,
        private readonly LeadAssignmentService $leadAssignmentService
    ) {}

    public function execute(int $leadId, array $userIds, User $actor): Lead
    {
        $lead = $this->leadService->resolveActiveLead($this->leadService->currentWorkspace(), $leadId);

        return $this->leadAssignmentService->removeAssignees($lead, $userIds, $actor);
    }
}
