<?php

namespace App\Support\Exams;

use App\Enums\QuestionStatus;
use App\Enums\Section;
use App\Http\Resources\QuestionResource;
use App\Models\Competence;
use App\Models\Exam;

/**
 * What blocks publishing an Exam, as codes (PATTERN-005): the settings, every Item complete, the
 * Subject totals (D-005: 30 and 60) and one distinct question per Item (D-057). Competences without
 * an Item are warnings only (Q-063).
 */
final class PublishChecks
{
    public const TOTALS = ['subject_1' => 30, 'subject_2' => 60];

    /** @return array{totals: array<string, int|float>, problems: list<array>, warnings: list<array>} */
    public static function for(Exam $exam): array
    {
        $items = $exam->items()->get();
        $problems = [];

        foreach (['title', 'grade_level', 'duration_minutes'] as $field) {
            if (blank($exam->{$field})) {
                $problems[] = ['code' => 'required', 'field' => $field];
            }
        }
        if (! $exam->classes()->exists()) {
            $problems[] = ['code' => 'required', 'field' => 'classes'];
        }

        $totals = [];
        foreach (self::TOTALS as $section => $expected) {
            $sum = (float) $items->where('section', Section::from($section))->sum(fn ($i) => (float) $i->points);
            $totals[$section] = QuestionResource::number($sum);
            if ($sum !== (float) $expected) {
                $problems[] = ['code' => 'subject_total', 'section' => $section, 'sum' => $totals[$section], 'expected' => $expected];
            }
        }

        // D-062: exactly 3 Subject II problems.
        $subjectTwo = $items->where('section', Section::SubjectTwo)->count();
        if ($subjectTwo !== Section::SUBJECT_TWO_ITEMS) {
            $problems[] = ['code' => 'subject_two_items', 'count' => $subjectTwo, 'expected' => Section::SUBJECT_TWO_ITEMS];
        }

        foreach ($items as $item) {
            $missing = ['points' => ! ($item->points > 0), 'pool' => ! $item->pool_id, 'competence' => ! $item->competence_id, 'difficulty' => ! $item->difficulty];
            foreach (array_keys(array_filter($missing)) as $field) {
                $problems[] = ['code' => 'item_incomplete', 'item' => $item->position, 'field' => $field];
            }
        }

        if ($unserved = Blueprint::unserved($exam)) {
            $problems[] = ['code' => 'no_distinct_draw', 'items' => $unserved];
        }

        return ['totals' => $totals, 'problems' => $problems, 'warnings' => self::coverage($exam, $items->pluck('competence_id')->filter()->all())];
    }

    /** Q-063: the Examiner's competences with a Ready question for this grade level but no Item. */
    private static function coverage(Exam $exam, array $used): array
    {
        if (! $exam->grade_level) {
            return [];
        }

        return Competence::query()
            ->where('examiner_id', $exam->examiner_id)
            ->whereNotIn('id', $used)
            ->whereHas('questions', fn ($q) => $q->where('status', QuestionStatus::Ready)->whereNull('published_to_library_at')->where('grade_level', $exam->grade_level))
            ->orderBy('code')
            ->get()
            ->map(fn ($c) => ['code' => 'competence_missing', 'competence' => $c->only('id', 'code', 'description')])
            ->all();
    }
}
