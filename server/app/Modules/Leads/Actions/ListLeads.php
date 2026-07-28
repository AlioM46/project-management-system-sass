<?php

namespace App\Modules\Leads\Actions;

use App\Modules\Leads\Services\LeadService;
use Illuminate\Pagination\LengthAwarePaginator;

class ListLeads
{
    public function __construct(
        private readonly LeadService $leadService
    ) {}

    public function execute(array $filters = []): LengthAwarePaginator
    {
        return $this->leadService->listLeads($this->leadService->currentWorkspace(), $filters);
    }
}
