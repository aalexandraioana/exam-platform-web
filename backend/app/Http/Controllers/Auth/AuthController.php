<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\ClassMembership;
use App\Models\SchoolClass;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/** C-001: register, login, logout and the current user, with Sanctum bearer tokens (D-050). */
class AuthController extends Controller
{
    private const LOGIN_ATTEMPTS = 5;

    private const LOGIN_DECAY_SECONDS = 60;

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            // Fillable only: `role` and `is_active` keep their defaults (an active Candidate).
            $user = User::create($request->only('name', 'email', 'password'));

            if ($code = $request->validated('class_code')) {
                $membership = new ClassMembership;
                $membership->class_id = SchoolClass::where('join_code', $code)->value('id');
                $membership->candidate_id = $user->id;
                $membership->save(); // pending until the Examiner decides (D-028)
            }

            return $user->refresh();
        });

        return $this->tokenResponse($user, 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $key = 'login:'.$request->input('email').'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, self::LOGIN_ATTEMPTS)) {
            return response()->json(['message' => 'Too Many Attempts.'], 429, [
                'Retry-After' => RateLimiter::availableIn($key),
            ]);
        }

        $user = User::where('email', $request->input('email'))->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            RateLimiter::hit($key, self::LOGIN_DECAY_SECONDS);

            // The same answer for an unknown email and a wrong password.
            throw ValidationException::withMessages(['email' => 'credentials']);
        }

        RateLimiter::clear($key);

        if (! $user->is_active) {
            return response()->json(['code' => 'account_inactive', 'message' => 'This account is deactivated.'], 403);
        }

        return $this->tokenResponse($user);
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    public function user(Request $request): JsonResponse
    {
        return response()->json(['user' => new UserResource($request->user())]);
    }

    private function tokenResponse(User $user, int $status = 200): JsonResponse
    {
        return response()->json([
            'token' => $user->createToken('spa')->plainTextToken,
            'user' => new UserResource($user),
        ], $status);
    }
}
