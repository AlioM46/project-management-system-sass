<?php

namespace App\Shared\Http;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    public static function success(array $data = [], array $meta = [], int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'meta' => (object) $meta,
        ], $status);
    }

    public static function error(string $code, string $message, array $meta = [], int $status = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'meta' => (object) $meta,
            ],
        ], $status);
    }
}