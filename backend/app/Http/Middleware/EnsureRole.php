<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** `role:examiner` or `role:examiner,administrator`: the route is for these roles only. */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! in_array($request->user()?->role->value, $roles, true)) {
            return response()->json(['code' => 'forbidden_role', 'message' => 'This action is not available for your role.'], 403);
        }

        return $next($request);
    }
}
