<?php

namespace App\Modules\Leads\Actions;

use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Services\LeadService;

class GetLead
{
    public function __construct(
        private readonly LeadService $leadService
    ) {}

    public function execute(int $leadId): Lead
    {
        return $this->leadService->getLead($this->leadService->currentWorkspace(), $leadId);
    }
}
