<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
  public function handle($request, Closure $next, $permission)
{
    if (!$request->user()->hasPermission($permission)) {
        abort(403,  $permission . ' Unauthorized | You do not have permission to perform this action.');
    }

    return $next($request);
}
}
