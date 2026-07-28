<?php

namespace App\Modules\Auth\Actions\Profile;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadAvatar
{
    public function execute(User $user, UploadedFile $file): User
    {
        // Determine configured disk (R2 if bucket configured, else public)
        $diskName = config('filesystems.disks.r2.bucket') ? 'r2' : 'public';

        try {
            $disk = Storage::disk($diskName);

            // Delete previous avatar if exists
            if ($user->avatar_url) {
                $this->deleteOldAvatar($disk, $user->avatar_url);
            }

            $extension = $file->getClientOriginalExtension() ?: 'png';
            $filename = 'avatar_' . $user->id . '_' . time() . '_' . Str::random(6) . '.' . $extension;

            // Store file to disk (avatars directory)
            $path = $file->storeAs('avatars', $filename, ['disk' => $diskName, 'visibility' => 'public']);

            // Get URL
            $url = $disk->url($path);

            $user->avatar_url = $url;
            $user->save();

            return $user->fresh();
        } catch (\Throwable $e) {
            Log::error('Avatar upload failed on disk ' . $diskName . ': ' . $e->getMessage());

            // If R2 failed, fallback to local public disk
            if ($diskName !== 'public') {
                return $this->executeLocalFallback($user, $file);
            }

            throw $e;
        }
    }

    public function remove(User $user): User
    {
        if ($user->avatar_url) {
            $diskName = config('filesystems.disks.r2.bucket') ? 'r2' : 'public';
            try {
                $disk = Storage::disk($diskName);
                $this->deleteOldAvatar($disk, $user->avatar_url);
            } catch (\Throwable $e) {
                Log::warning('Could not delete avatar from storage: ' . $e->getMessage());
            }

            $user->avatar_url = null;
            $user->save();
        }

        return $user->fresh();
    }

    private function deleteOldAvatar($disk, string $url): void
    {
        $path = parse_url($url, PHP_URL_PATH);
        if ($path) {
            $relativePath = ltrim($path, '/');
            // Strip bucket name if present in URL path
            $bucket = config('filesystems.disks.r2.bucket');
            if ($bucket && str_starts_with($relativePath, $bucket . '/')) {
                $relativePath = substr($relativePath, strlen($bucket) + 1);
            }

            if ($disk->exists($relativePath)) {
                $disk->delete($relativePath);
            }
        }
    }

    private function executeLocalFallback(User $user, UploadedFile $file): User
    {
        $extension = $file->getClientOriginalExtension() ?: 'png';
        $filename = 'avatar_' . $user->id . '_' . time() . '_' . Str::random(6) . '.' . $extension;

        $path = $file->storeAs('avatars', $filename, ['disk' => 'public', 'visibility' => 'public']);
        $url = Storage::disk('public')->url($path);

        $user->avatar_url = $url;
        $user->save();

        return $user->fresh();
    }
}
