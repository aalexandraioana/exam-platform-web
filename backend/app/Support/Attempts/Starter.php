<?php

namespace App\Support\Attempts;

use App\Enums\AttemptStatus;
use App\Enums\MembershipStatus;
use App\Models\Attempt;
use App\Models\Exam;
use App\Models\Question;
use App\Models\User;
use App\Support\Exams\Blueprint;
use App\Support\Math\ValueDrawer;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Starts an Attempt (P6a). Each Item gets its own question (D-057), its named values are drawn
 * (D-006) and its options shuffled (D-045), all from the Attempt's seed, and the result is stored as
 * a snapshot. `snapshot()` is a pure function of the Exam, its questions and the seed, so a contest
 * can rebuild exactly what a Candidate saw (the twist's reproducibility).
 */
final class Starter
{
    /** Open Attempts block a new start; they are resumed instead. */
    public const OPEN = [AttemptStatus::Started, AttemptStatus::InProgress];

    /** Published Exams of the classes where the Candidate's place is accepted (D-015, D-028). */
    public static function examsFor(User $candidate): Builder
    {
        return Exam::query()
            ->whereNotNull('published_at')
            ->whereHas('classes.memberships', fn (Builder $q) => $q
                ->where('candidate_id', $candidate->id)
                ->where('status', MembershipStatus::Accepted));
    }

    /** upcoming until `available_from`, closed from `available_until`, open in between. */
    public static function state(Exam $exam): string
    {
        $now = now();
        if ($exam->available_from && $now->lt($exam->available_from)) {
            return 'upcoming';
        }

        return $exam->available_until && $now->gte($exam->available_until) ? 'closed' : 'open';
    }

    public static function start(User $candidate, Exam $exam): Attempt
    {
        return DB::transaction(function () use ($candidate, $exam) {
            // One start at a time per Candidate and Exam.
            $candidate->newQuery()->whereKey($candidate->id)->lockForUpdate()->first();
            $attempts = $exam->attempts()->where('candidate_id', $candidate->id);

            $open = (clone $attempts)->whereIn('status', self::OPEN)->first();
            if ($open) {
                throw new StartRefused('attempt_open', $open->id);
            }
            if (self::state($exam) !== 'open') {
                throw new StartRefused('not_available');
            }
            $used = (clone $attempts)->count();
            if ($used >= $exam->max_attempts) {
                throw new StartRefused('no_attempts_left');
            }

            $seed = random_int(1, PHP_INT_MAX >> 16);
            $items = self::snapshot($exam, $seed);
            if ($items === null) {
                throw new StartRefused('not_available'); // the questions changed since publishing
            }

            $attempt = new Attempt;
            $attempt->exam_id = $exam->id;
            $attempt->candidate_id = $candidate->id;
            $attempt->attempt_number = $used + 1;
            $attempt->seed = $seed;
            $attempt->started_at = now();
            $attempt->expires_at = now()->addMinutes($exam->duration_minutes); // D-021
            $attempt->save();

            foreach ($items as $item) {
                $row = $attempt->items()->make();
                foreach ($item as $key => $value) {
                    $row->{$key} = $value;
                }
                $row->save();
            }

            return $attempt->refresh();
        });
    }

    /**
     * Every Item's question, values and option order for this seed; null when the Exam can't be drawn.
     *
     * @return list<array{exam_item_id: int, question_id: int, position: int, question_snapshot: array, drawn_values: ?array, expected_answer: array}>|null
     */
    public static function snapshot(Exam $exam, int $seed): ?array
    {
        $assignment = Blueprint::assign($exam, $seed);
        if ($assignment === null) {
            return null;
        }
        $questions = Question::findMany(array_values($assignment))->keyBy('id');

        return $exam->items()->get()->map(function ($item) use ($assignment, $questions, $seed) {
            $question = $questions[$assignment[$item->id]];
            $key = $question->answer_key ?? [];
            $options = array_map('strval', (array) ($key['options'] ?? []));
            $statement = (string) $question->statement;
            $values = null;
            $answer = null;

            if (! empty($question->parameters)) {
                $draw = ValueDrawer::draw($question->type, $statement, $question->parameters, $seed + $item->position, $options);
                [$statement, $options, $values, $answer] = [$draw->statement, $draw->options, $draw->values, $draw->answer];
            }

            // D-045: the shown order of the options, as their original positions.
            $order = null;
            if ($options) {
                $order = (new Randomizer(new Mt19937($seed + 1_000_003 * $item->position)))->shuffleArray(range(1, count($options)));
                $options = array_map(fn (int $p) => $options[$p - 1], $order);
            }

            return [
                'exam_item_id' => $item->id,
                'question_id' => $question->id,
                'position' => $item->position,
                'question_snapshot' => [
                    'section' => $item->section->value,
                    'type' => $question->type->value,
                    'points' => (float) $item->points,
                    'statement' => $statement,
                    'options' => $options,
                ],
                'drawn_values' => $values,
                'expected_answer' => ['answer_key' => $key, 'option_order' => $order, 'answer' => $answer],
            ];
        })->all();
    }
}
