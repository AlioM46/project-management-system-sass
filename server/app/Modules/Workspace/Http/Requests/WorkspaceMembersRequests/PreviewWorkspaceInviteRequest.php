<?php

namespace App\Modules\Workspace\Http\Requests\WorkspaceMembersRequests;

use Illuminate\Foundation\Http\FormRequest;

class PreviewWorkspaceInviteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invitation_id' => ['required', 'integer'],
            'token' => ['required', 'string', 'max:255'],
        ];
    }
}
