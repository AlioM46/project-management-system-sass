<?php

namespace App\Modules\Leads\Actions;

use App\Modules\Leads\Services\LeadService;

class GetAllowedStageTransitionsAction
{
    public function __construct(
        private readonly LeadService $leadService
    ) {}

    public function execute(int $leadId): array
    {
        $lead = $this->leadService->resolveActiveLead($this->leadService->currentWorkspace(), $leadId);

        return [
            'current_stage_id' => $lead->stage_id,
            'allowed_transitions' => $this->leadService->allowedTransitions($lead),
        ];
    }
}
