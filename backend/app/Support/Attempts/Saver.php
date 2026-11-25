<?php

namespace App\Support\Attempts;

use App\Enums\AttemptStatus;
use App\Models\Answer;
use App\Models\Attempt;
use App\Models\AttemptItem;
use Illuminate\Support\Facades\DB;

/**
 * Autosave (catalog P13): one version per answer, numbered by the client. A save is stored only
 * when its version is higher than the stored one, so a repeated or late save changes nothing.
 * Answers are refused after the deadline + Grace Period (D-004) and after submitting.
 */
final class Saver
{
    public const SHORT_ANSWER_MAX = 200;

    public const PROBLEM_TEXT_MAX = 10_000;

    /**
     * Whether `$answer` has the shape of an answer to this item. Choices are the shown positions
     * (1-based), mapped through `option_order` at grading (P6c). `null` clears any answer.
     */
    public static function fits(AttemptItem $item, mixed $answer): bool
    {
        if ($answer === null) {
            return true;
        }
        $count = count($item->question_snapshot['options'] ?? []);
        $position = fn ($p) => is_int($p) && $p >= 1 && $p <= $count;

        return match ($item->question_snapshot['type']) {
            'dual_choice' => is_bool($answer),
            'single_choice' => $position($answer),
            'multiple_choice' => is_array($answer) && array_is_list($answer) && $answer !== []
                && array_all($answer, $position) && count(array_unique($answer)) === count($answer),
            'short_answer' => is_string($answer) && mb_strlen($answer) <= self::SHORT_ANSWER_MAX,
            'structured_problem' => is_string($answer) && mb_strlen($answer) <= self::PROBLEM_TEXT_MAX,
            default => false,
        };
    }

    /** @return array{answer: Answer, applied: bool, status: AttemptStatus} */
    public static function save(Attempt $attempt, AttemptItem $item, mixed $answer, bool $marked, int $version): array
    {
        $result = DB::transaction(function () use ($attempt, $item, $answer, $marked, $version) {
            $attempt = Attempt::lockForUpdate()->findOrFail($attempt->id);
            if (Sealer::sealIfExpired($attempt)) {
                return 'time_up'; // committed: the seal stays
            }
            if (! $attempt->isOpen()) {
                return $attempt->auto_submitted ? 'time_up' : 'attempt_submitted';
            }

            $row = Answer::where('attempt_item_id', $item->id)->first();
            if (! $row) {
                $row = new Answer;
                $row->attempt_item_id = $item->id; // not fillable
            }
            $applied = $version > $row->version;
            if ($applied) {
                $row->answer = ['value' => $answer];
                $row->marked_for_review = $marked;
                $row->version = $version;
                $row->saved_at = now();
                $row->save();
                if ($attempt->status === AttemptStatus::Started) {
                    $attempt->moveTo(AttemptStatus::InProgress); // Q-068
                    $attempt->save();
                }
            }

            return ['answer' => $row, 'applied' => $applied, 'status' => $attempt->status];
        });

        if (is_string($result)) {
            throw new AttemptClosed($result);
        }

        return $result;
    }
}
