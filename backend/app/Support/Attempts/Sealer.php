<?php

namespace App\Support\Attempts;

use App\Enums\AttemptStatus;
use App\Models\Attempt;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Submitting and sealing (D-044). An open Attempt past its deadline + Grace Period is sealed:
 * submitted at its deadline, `auto_submitted`. Every Candidate request seals that Candidate's
 * expired Attempts first, and the scheduled command and the cron endpoint seal the rest, so
 * correctness never depends on the job running on time.
 */
final class Sealer
{
    /** Seals the expired open Attempts, of one Candidate or of everyone; returns how many. */
    public static function sealExpired(?User $candidate = null): int
    {
        $cutoff = now()->subSeconds((int) config('attempts.grace_seconds'));
        $ids = Attempt::query()
            ->whereIn('status', Starter::OPEN)
            ->where('expires_at', '<', $cutoff)
            ->when($candidate, fn ($q) => $q->where('candidate_id', $candidate->id))
            ->pluck('id');

        return $ids->filter(fn (int $id) => DB::transaction(function () use ($id) {
            $attempt = Attempt::lockForUpdate()->find($id);

            return $attempt && self::sealIfExpired($attempt);
        }))->count();
    }

    /** The Candidate submits. Repeating it changes nothing; after the grace it seals instead. */
    public static function submit(Attempt $attempt): Attempt
    {
        return DB::transaction(function () use ($attempt) {
            $attempt = Attempt::lockForUpdate()->findOrFail($attempt->id);
            if ($attempt->isOpen() && ! self::sealIfExpired($attempt)) {
                $attempt->moveTo(AttemptStatus::Submitted);
                $attempt->submitted_at = now();
                Grader::subjectOne($attempt); // P6c
                $attempt->save();
            }

            return $attempt;
        });
    }

    /** Inside a transaction, with the Attempt's row locked. */
    public static function sealIfExpired(Attempt $attempt): bool
    {
        if (! $attempt->isOpen() || ! now()->gt($attempt->acceptsAnswersUntil())) {
            return false;
        }
        $attempt->moveTo(AttemptStatus::Submitted);
        $attempt->submitted_at = $attempt->expires_at;
        $attempt->auto_submitted = true;
        Grader::subjectOne($attempt); // P6c
        $attempt->save();

        return true;
    }
}
