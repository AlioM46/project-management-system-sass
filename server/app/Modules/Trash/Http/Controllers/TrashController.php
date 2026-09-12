<?php

declare(strict_types=1);

namespace App\Modules\Trash\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Trash\Actions\EmptyTrashAction;
use App\Modules\Trash\Actions\ForceDeleteTrashItemAction;
use App\Modules\Trash\Actions\ListTrashAction;
use App\Modules\Trash\Actions\RestoreTrashItemAction;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrashController extends Controller
{
    public function index(Request $request, ListTrashAction $action): JsonResponse
    {
        $filterType = $request->query('type');
        $result = $action->execute($filterType ? (string) $filterType : null);

        return ApiResponse::success(
            message: 'Trashed items retrieved successfully.',
            data: $result
        );
    }

    public function restore(string $type, int|string $id, Request $request, RestoreTrashItemAction $action): JsonResponse
    {
        $result = $action->execute($type, $id, $request->user());

        return ApiResponse::success(
            message: $result['message'],
            data: $result
        );
    }

    public function forceDelete(string $type, int|string $id, Request $request, ForceDeleteTrashItemAction $action): JsonResponse
    {
        $result = $action->execute($type, $id, $request->user());

        return ApiResponse::success(
            message: $result['message'],
            data: $result
        );
    }

    public function empty(Request $request, EmptyTrashAction $action): JsonResponse
    {
        $result = $action->execute($request->user());

        return ApiResponse::success(
            message: $result['message'],
            data: $result
        );
    }
}
