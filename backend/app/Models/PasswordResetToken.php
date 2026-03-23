<?php

namespace App\Models;

use Illuminate\Support\Facades\Hash;

class PasswordResetToken  extends Model
{

    protected $fillable = [
        'email',
        'token',
        'expires_at',
        'used_at',
    ];


    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

  
    }
