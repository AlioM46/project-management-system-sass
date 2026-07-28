<?php

namespace App\Modules\Leads\Actions;

use App\Models\User;
use App\Modules\Leads\Model\Lead;
use App\Modules\Leads\Services\LeadService;

class CreateLead
{
    public function __construct(
        private readonly LeadService $leadService
    ) {}

    public function execute(array $data, User $actor): Lead
    {
        return $this->leadService->createLead($this->leadService->currentWorkspace(), $data, $actor);
    }
}
