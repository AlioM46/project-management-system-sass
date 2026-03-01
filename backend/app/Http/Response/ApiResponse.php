<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    protected function ok($data = null,  $message = null, int $code = 200): JsonResponse
    {
        return response()->json([
            'isSuccess' => true,
            'data' => $data,
            'message' => $message,
            'errors' => null,
        ], $code);
    }

    protected function fail(string $message, $errors = null, int $code = 400): JsonResponse
    {
        return response()->json([
            'isSuccess' => false,
            'data' => null,
            'message' => $message,
            'errors' => $errors,
        ], $code);
    }
}
