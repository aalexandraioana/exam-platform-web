<?php

namespace App\Http\Controllers\Admin;

use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CreateExaminerRequest;
use App\Http\Requests\Admin\SetPasswordRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * C-003: the Administrator's users (DS-011). Sets temporary passwords (D-054), creates Examiners
 * (D-055) and deactivates Candidates and Examiners, never reactivating anyone (D-056).
 */
class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::orderBy('last_name')->orderBy('first_name')->orderBy('id')->get();

        return response()->json(['users' => UserResource::collection($users)]);
    }

    public function store(CreateExaminerRequest $request): JsonResponse
    {
        // Fillable only; `role` and the temporary flag are set here by trusted code.
        $user = new User($request->only('first_name', 'last_name', 'email', 'password'));
        $user->role = Role::Examiner;
        $user->must_change_password = true;
        $user->save();

        return response()->json(['user' => new UserResource($user->refresh())], 201);
    }

    public function setPassword(SetPasswordRequest $request, int $id): Response|JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->is($request->user())) {
            return $this->forbiddenTarget();
        }
        if (! $user->is_active) {
            return $this->alreadyDeactivated();
        }

        // The User model revokes the user's tokens when the password changes (D-050).
        $user->password = $request->validated('password');
        $user->must_change_password = true;
        $user->save();

        return response()->noContent();
    }

    public function update(UpdateUserRequest $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ($user->role === Role::Administrator) {
            return $this->forbiddenTarget();
        }
        if (! $user->is_active) {
            return $this->alreadyDeactivated();
        }

        // The User model revokes the user's tokens on deactivation (D-050).
        $user->is_active = false;
        $user->save();

        return response()->json(['user' => new UserResource($user)]);
    }

    private function forbiddenTarget(): JsonResponse
    {
        return response()->json(['code' => 'forbidden_target', 'message' => 'This action is not available for this user.'], 403);
    }

    private function alreadyDeactivated(): JsonResponse
    {
        return response()->json(['code' => 'already_deactivated', 'message' => 'This account is deactivated.'], 409);
    }
}
