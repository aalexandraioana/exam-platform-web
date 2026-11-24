<?php

use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ClassController;
use App\Http\Controllers\MembershipController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'healthy', 'service' => 'exam-platform-api']);
});

// C-001 (docs/API.md → Users). Login throttles failed attempts itself, per email and IP.
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::middleware('active')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);

        // D-054: the only route that is open while the password is temporary (besides the two above).
        Route::put('/user/password', [AuthController::class, 'changePassword']);

        Route::middleware('password.current')->group(function () {
            // C-002 (docs/API.md → Classes): the Examiner's own classes and join requests.
            Route::middleware('role:examiner')->group(function () {
                Route::get('/classes', [ClassController::class, 'index']);
                Route::post('/classes', [ClassController::class, 'store']);
                Route::get('/classes/{id}', [ClassController::class, 'show'])->whereNumber('id');
                Route::patch('/classes/{id}', [ClassController::class, 'update'])->whereNumber('id');
                Route::post('/classes/{id}/join-code', [ClassController::class, 'regenerateCode'])->whereNumber('id');
                Route::delete('/classes/{id}', [ClassController::class, 'destroy'])->whereNumber('id');
                Route::post('/memberships/{id}/accept', [MembershipController::class, 'accept'])->whereNumber('id');
                Route::post('/memberships/{id}/decline', [MembershipController::class, 'decline'])->whereNumber('id');
            });

            Route::post('/memberships', [MembershipController::class, 'join'])->middleware('role:candidate');

            // C-003 (docs/API.md → Administrator): users, temporary passwords, Examiners, deactivation.
            Route::middleware('role:administrator')->prefix('admin')->group(function () {
                Route::get('/users', [UserController::class, 'index']);
                Route::post('/examiners', [UserController::class, 'store']);
                Route::put('/users/{id}/password', [UserController::class, 'setPassword'])->whereNumber('id');
                Route::patch('/users/{id}', [UserController::class, 'update'])->whereNumber('id');
            });
        });
    });
});
