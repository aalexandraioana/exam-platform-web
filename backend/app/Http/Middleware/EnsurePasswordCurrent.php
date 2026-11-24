<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** D-054: a user with a temporary password must choose their own before anything else. */
class EnsurePasswordCurrent
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->must_change_password) {
            return response()->json(['code' => 'password_change_required', 'message' => 'Choose a new password first.'], 403);
        }

        return $next($request);
    }
}
