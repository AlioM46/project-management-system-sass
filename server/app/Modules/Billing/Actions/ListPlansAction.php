<?php

declare(strict_types=1);

namespace App\Modules\Billing\Actions;

use App\Modules\Billing\Model\Plan;
use Illuminate\Database\Eloquent\Collection;

class ListPlansAction
{
    /**
     * Retrieve all active plans ordered by configured sort order.
     *
     * @return Collection<int, Plan>
     */
    public function execute(): Collection
    {
        return Plan::query()
            ->active()
            ->ordered()
            ->get();
    }
}
