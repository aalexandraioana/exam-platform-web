<?php

use App\Http\Middleware\EnsureActive;
use App\Http\Middleware\EnsureRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Render terminates TLS at its proxy; trust it so URLs and client IPs are right.
        $middleware->trustProxies(at: '*');
        $middleware->alias(['active' => EnsureActive::class, 'role' => EnsureRole::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        // 422 bodies carry error codes per field (docs/API.md → Errors), under a fixed message.
        $exceptions->render(fn (ValidationException $e, Request $request) => $request->is('api/*')
            ? response()->json(['message' => 'The given data was invalid.', 'errors' => $e->errors()], 422)
            : null);
    })->create();
