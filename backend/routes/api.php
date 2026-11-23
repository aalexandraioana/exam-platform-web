<?php

use App\Http\Controllers\Auth\AuthController;
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
    });
});
