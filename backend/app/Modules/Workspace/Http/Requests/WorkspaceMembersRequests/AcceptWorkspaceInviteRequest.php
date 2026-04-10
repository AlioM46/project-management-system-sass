<?php

namespace App\Modules\Workspace\Http\Requests\WorkspaceMembersRequests;

use Illuminate\Foundation\Http\FormRequest;

class AcceptWorkspaceInviteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invitation_id' => ['required', 'integer', 'exists:workspace_invitations,id'],
            'token' => ['required', 'string', 'max:255'],
        ];
    }
}
