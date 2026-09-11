<?php

declare(strict_types=1);

namespace App\Modules\Billing\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Billing\Actions\ListPlansAction;
use App\Modules\Billing\Http\Resources\PlanResource;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

class PlanController extends Controller
{
    /**
     * Display a listing of available plans.
     */
    public function index(ListPlansAction $action): JsonResponse
    {
        $plans = $action->execute();

        return ApiResponse::success(
            message: 'Plans retrieved successfully.',
            data: [
                'plans' => PlanResource::collection($plans)->resolve(),
            ]
        );
    }
}
