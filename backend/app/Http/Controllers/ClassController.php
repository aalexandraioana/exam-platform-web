<?php

namespace App\Http\Controllers;

use App\Enums\MembershipStatus;
use App\Http\Requests\Classes\ClassNameRequest;
use App\Http\Resources\ClassResource;
use App\Models\SchoolClass;
use App\Models\User;
use App\Support\JoinCode;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * C-002: the Examiner's own classes (D-015, D-028, D-049). Another Examiner's class is a 404,
 * because classes are looked up through `$request->user()->classes()`.
 */
class ClassController extends Controller
{
    private const CODE_TRIES = 5;

    public function index(Request $request): JsonResponse
    {
        $classes = $this->withCounts($request->user()->classes())->orderBy('name')->orderBy('id')->get();

        return response()->json(['classes' => ClassResource::collection($classes)]);
    }

    public function store(ClassNameRequest $request): JsonResponse
    {
        $class = $this->saveWithNewCode($request->user()->classes()->make($request->validated()));

        return response()->json(['class' => new ClassResource($this->reload($request, $class->id))], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $class = $this->reload($request, $id);

        $requests = $class->memberships()->with('candidate')
            ->where('status', MembershipStatus::Pending)->orderBy('requested_at')->orderBy('id')->get();
        // As in a school register: by last name, then first name, ignoring case.
        $candidates = $class->memberships()->with('candidate')
            ->where('status', MembershipStatus::Accepted)->get()
            ->sortBy(fn ($m) => [mb_strtolower($m->candidate->last_name), mb_strtolower($m->candidate->first_name)])->values();

        return response()->json([
            'class' => new ClassResource($class),
            'requests' => $requests->map(fn ($m) => [
                'id' => $m->id,
                'candidate' => $this->person($m->candidate),
                'requested_at' => $m->requested_at->toIso8601String(),
            ]),
            'candidates' => $candidates->map(fn ($m) => [
                ...$this->person($m->candidate),
                'joined_at' => ($m->decided_at ?? $m->requested_at)->toIso8601String(),
            ]),
        ]);
    }

    public function update(ClassNameRequest $request, int $id): JsonResponse
    {
        $class = $request->user()->classes()->findOrFail($id);
        $class->update($request->validated());

        return response()->json(['class' => new ClassResource($this->reload($request, $id))]);
    }

    /** A new code stops the old one at once; requests already sent stay (DS-013). */
    public function regenerateCode(Request $request, int $id): JsonResponse
    {
        $this->saveWithNewCode($request->user()->classes()->findOrFail($id));

        return response()->json(['class' => new ClassResource($this->reload($request, $id))]);
    }

    /** D-049: unlink draft Exams first; a class linked to a published Exam stays. */
    public function destroy(Request $request, int $id): JsonResponse|Response
    {
        $class = $request->user()->classes()->findOrFail($id);

        if ($class->exams()->whereNotNull('published_at')->exists()) {
            return response()->json([
                'code' => 'class_has_published_exam',
                'message' => "A class linked to a published Exam can't be deleted.",
            ], 409);
        }

        DB::transaction(function () use ($class) {
            $class->exams()->detach();
            $class->delete(); // memberships cascade
        });

        return response()->noContent();
    }

    /** A Candidate in C-002: both names and the full name for display. */
    private function person(User $candidate): array
    {
        return [
            'id' => $candidate->id,
            'first_name' => $candidate->first_name,
            'last_name' => $candidate->last_name,
            'name' => $candidate->name,
            'email' => $candidate->email,
        ];
    }

    private function reload(Request $request, int $id): SchoolClass
    {
        return $this->withCounts($request->user()->classes())->findOrFail($id);
    }

    /** @param  HasMany<SchoolClass, User>  $classes */
    private function withCounts(HasMany $classes): HasMany
    {
        return $classes->withCount([
            'memberships as pending_count' => fn (Builder $q) => $q->where('status', MembershipStatus::Pending),
            'memberships as candidate_count' => fn (Builder $q) => $q->where('status', MembershipStatus::Accepted),
            'exams as published_exam_count' => fn (Builder $q) => $q->whereNotNull('published_at'),
        ]);
    }

    /** Join codes are unique; a collision (very rare) just draws another code. */
    private function saveWithNewCode(SchoolClass $class): SchoolClass
    {
        for ($try = 1; ; $try++) {
            $class->join_code = JoinCode::generate();
            try {
                DB::transaction(fn () => $class->save());

                return $class;
            } catch (UniqueConstraintViolationException $e) {
                if ($try >= self::CODE_TRIES) {
                    throw $e;
                }
            }
        }
    }
}
