<?php

namespace App\Modules\Auth\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auth\Actions\Profile\UpdateProfile as UpdateProfileAction;
use App\Modules\Auth\Actions\Profile\UploadAvatar as UploadAvatarAction;
use App\Modules\Auth\Http\Requests\UpdateProfileRequest;
use App\Modules\Auth\Http\Requests\UploadAvatarRequest;
use App\Shared\Http\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function updateProfile(UpdateProfileRequest $request, UpdateProfileAction $action): JsonResponse
    {
        $user = $action->execute($request->user(), $request->validated());

        return ApiResponse::success(
            message: 'Profile updated successfully.',
            data: ['user' => $user]
        );
    }

    public function uploadAvatar(UploadAvatarRequest $request, UploadAvatarAction $action): JsonResponse
    {
        $user = $action->execute($request->user(), $request->file('avatar'));

        return ApiResponse::success(
            message: 'Avatar uploaded successfully.',
            data: ['user' => $user]
        );
    }

    public function removeAvatar(Request $request, UploadAvatarAction $action): JsonResponse
    {
        $user = $action->remove($request->user());

        return ApiResponse::success(
            message: 'Avatar removed successfully.',
            data: ['user' => $user]
        );
    }
}
