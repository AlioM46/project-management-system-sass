<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class UpdateConversationDetailsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
