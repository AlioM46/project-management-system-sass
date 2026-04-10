<?php

namespace App\Modules\Auth\Actions\Email;

use App\Modules\Auth\Services\EmailVerficationService;
use Illuminate\Http\Request;

class VerifyEmail
{
    public function __construct(
        private readonly EmailVerficationService $service
    ) {}

    public function execute(Request $request, int|string $id, string $hash): array
    {
        return $this->service->verify($request, $id, $hash);
    }
}
