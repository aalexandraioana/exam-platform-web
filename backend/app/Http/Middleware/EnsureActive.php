<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** Refuses a deactivated user, even with a token that survived (docs/API.md → Errors). */
class EnsureActive
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && ! $request->user()->is_active) {
            return response()->json(['code' => 'account_inactive', 'message' => 'This account is deactivated.'], 403);
        }

        return $next($request);
    }
}
