<?php

namespace App\Modules\Auth\Services;

use App\Models\User;
use App\Modules\Auth\Exceptions\InvalidEmailVerificationLinkException;
use App\Modules\Auth\Mail\EmailVerificationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;

class EmailVerficationService
{
    public function send(User $user): array
    {
        if ($this->isVerified($user)) {
            return [
                'sent' => false,
                'user' => $user->fresh(),
            ];
        }

        $expiresAt = now()->addMinutes($this->expirationMinutes());
        $verificationUrl = $this->generateVerificationUrl($user, $expiresAt);

        Mail::to($user->email)->send(
            new EmailVerificationMail($user, $verificationUrl, $expiresAt)
        );

        return [
            'sent' => true,
            'user' => $user->fresh(),
        ];
    }

    public function verify(Request $request, int|string $id, string $hash): array
    {
        $user = User::query()->find($id);

        if (! $user || ! hash_equals(sha1($user->email), $hash)) {
            throw new InvalidEmailVerificationLinkException;
        }

        if (! $this->hasValidSignature($request, $id, $hash)) {
            throw new InvalidEmailVerificationLinkException;
        }

        if ($this->isVerified($user)) {
            return [
                'verified' => false,
                'user' => $user->fresh(),
            ];
        }

        $user->forceFill([
            'email_verified_at' => now(),
        ])->save();

        return [
            'verified' => true,
            'user' => $user->fresh(),
        ];
    }

    public function generateVerificationUrl(User $user, ?Carbon $expiresAt = null): string
    {
        // if no expiresAt Passed, or it was null, set it to now + expirationMinutes
        $expiresAt ??= now()->addMinutes($this->expirationMinutes());
        
        $expires = $expiresAt->timestamp;
        
        $hash = sha1($user->email);
        
        $path = $this->verificationPath($user->getKey(), $hash);
        
        $signature = $this->makeSignature($path, $expires);
        

        return rtrim((string) config('app.url'), '/').$path.'?'.http_build_query([
            'expires' => $expires,
            'signature' => $signature,
        ], '', '&', PHP_QUERY_RFC3986);
    }

    private function hasValidSignature(Request $request, int|string $id, string $hash): bool
    {
        $expires = (int) $request->query('expires', 0);
        $signature = (string) $request->query('signature', '');

        if ($expires === 0 || $signature === '' || now()->timestamp > $expires) {
            return false;
        }

        $expectedSignature = $this->makeSignature(
            $this->verificationPath($id, $hash),
            $expires
        );

        return hash_equals($expectedSignature, $signature);
    }

    private function verificationPath(int|string $id, string $hash): string
    {
        return '/api/auth/email/verify/'.$id.'/'.$hash;
    }

    private function makeSignature(string $path, int $expires): string
    {
        return hash_hmac('sha256', $path.'|'.$expires, $this->signingKey());
    }

    private function signingKey(): string
    {
        $appKey = (string) config('app.key');

        if (str_starts_with($appKey, 'base64:')) {
            $decoded = base64_decode(substr($appKey, 7), true);

            if ($decoded !== false) {
                return $decoded;
            }
        }

        return $appKey;
    }

    private function expirationMinutes(): int
    {
        return (int) env('EMAIL_VERIFICATION_EXPIRE_MINUTES', 60);
    }

    private function isVerified(User $user): bool
    {
        return $user->email_verified_at !== null;
    }
}
