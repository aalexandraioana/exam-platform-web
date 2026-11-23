<?php

namespace App\Http\Controllers;

use App\Enums\MembershipStatus;
use App\Http\Requests\Classes\JoinRequest;
use App\Http\Requests\Classes\SetPasswordRequest;
use App\Models\ClassMembership;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

/**
 * C-002: a Candidate asks to join with a code; the Examiner decides (D-028) and can set a new
 * password for a Candidate of their class (D-020). Status and dates are set only here.
 */
class MembershipController extends Controller
{
    public function join(JoinRequest $request): JsonResponse
    {
        $class = SchoolClass::where('join_code', $request->validated('class_code'))->firstOrFail();
        $membership = ClassMembership::where('class_id', $class->id)
            ->where('candidate_id', $request->user()->id)
            ->first();

        // Q-041 is open: a declined Candidate can't ask again until it is answered.
        if ($membership?->status === MembershipStatus::Rejected) {
            return $this->alreadyDecided();
        }

        $created = $membership === null;
        if ($created) {
            // Not mass-assignable on purpose; a new request is pending, requested now.
            $membership = new ClassMembership;
            $membership->class_id = $class->id;
            $membership->candidate_id = $request->user()->id;
            $membership->save();
            $membership->refresh();
        }

        return response()->json(['membership' => [
            'id' => $membership->id,
            'status' => $membership->status->value,
            'class' => $class->only('id', 'name'),
        ]], $created ? 201 : 200);
    }

    public function accept(Request $request, int $id): JsonResponse
    {
        return $this->decide($request, $id, MembershipStatus::Accepted);
    }

    public function decline(Request $request, int $id): JsonResponse
    {
        return $this->decide($request, $id, MembershipStatus::Rejected);
    }

    public function setPassword(SetPasswordRequest $request, int $classId, int $userId): Response
    {
        $membership = $this->ownMemberships($request)
            ->where('class_id', $classId)
            ->where('candidate_id', $userId)
            ->where('status', MembershipStatus::Accepted)
            ->with('candidate')
            ->firstOrFail();

        // The User model revokes the Candidate's tokens when the password changes.
        $membership->candidate->update(['password' => $request->validated('password')]);

        return response()->noContent();
    }

    private function decide(Request $request, int $id, MembershipStatus $status): JsonResponse
    {
        $membership = $this->ownMemberships($request)->findOrFail($id);

        if ($membership->status !== MembershipStatus::Pending) {
            return $this->alreadyDecided();
        }

        $membership->status = $status;
        $membership->decided_at = now();
        $membership->save();

        return response()->json(['membership' => [
            'id' => $membership->id,
            'status' => $membership->status->value,
            'decided_at' => $membership->decided_at->toIso8601String(),
        ]]);
    }

    /** Memberships of the Examiner's own classes only, so any other is a 404. */
    private function ownMemberships(Request $request)
    {
        return ClassMembership::whereIn('class_id', $request->user()->classes()->select('id'));
    }

    private function alreadyDecided(): JsonResponse
    {
        return response()->json(['code' => 'already_decided', 'message' => 'This join request was already decided.'], 409);
    }
}
