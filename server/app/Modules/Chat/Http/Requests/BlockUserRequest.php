<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class BlockUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'blocked_user_id' => ['required_without:user_id', 'nullable', 'integer', 'exists:users,id'],
            'user_id' => ['required_without:blocked_user_id', 'nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function getBlockedUserId(): int
    {
        return (int) ($this->input('blocked_user_id') ?? $this->input('user_id'));
    }
}
