<?php

namespace App\Modules\Workspace\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Workspace\Actions\GetDashboardSummary;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(GetDashboardSummary $action): JsonResponse
    {
        return ApiResponse::success(
            message: 'Dashboard summary retrieved successfully.',
            data: $action->execute()
        );
    }
}
