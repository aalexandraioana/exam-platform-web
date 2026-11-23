<?php

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
            Route::put('/classes/{classId}/candidates/{userId}/password', [MembershipController::class, 'setPassword'])
                ->whereNumber(['classId', 'userId']);
        });

        Route::post('/memberships', [MembershipController::class, 'join'])->middleware('role:candidate');
    });
});
