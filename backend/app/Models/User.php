<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'status',
        'last_login_at',
        'last_login_ip',
        "refresh_token",
        "refresh_token_expiration",
    ];

    protected $hidden = [
        'password',
        'deleted_at',
        "refresh_token",
        "refresh_token_expiration",
    ];

    protected $casts = [
        'refresh_token_expiration' => 'datetime',
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function setPasswordAttribute($value): void
    {
        if (!empty($value)) {
            $this->attributes['password'] = password_get_info($value)['algo'] !== null
                ? $value
                : Hash::make($value);
        }
    }

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [
            'user' => [
                'id' => $this->id,
                'name' => $this->name,
                'email' => $this->email,
                'status' => $this->status,
            ],
        ];
    }
}
