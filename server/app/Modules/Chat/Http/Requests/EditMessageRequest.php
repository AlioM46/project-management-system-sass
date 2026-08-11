<?php

declare(strict_types=1);

namespace App\Modules\Chat\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class EditMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string'],
        ];
    }
}
