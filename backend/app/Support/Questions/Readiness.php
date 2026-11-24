<?php

namespace App\Support\Questions;

use App\Enums\QuestionType;
use App\Enums\Section;
use App\Models\Question;
use App\Support\Math\AnswerMatcher;
use App\Support\Math\NoValidDraw;
use App\Support\Math\ValueDefinitions;
use App\Support\Math\ValueDrawer;

/**
 * What a question still needs before it can be Ready (D-059), as codes (PATTERN-005), each with the
 * `field` it concerns and, for named values, the value's `name`. Empty when the question is complete.
 * Postgres refuses an incomplete Ready row too (questions_ready_complete_check); this adds the
 * answer key, the barem (D-031) and the named values (D-057), which the database can't check.
 */
final class Readiness
{
    /** @return list<array{code: string, field?: string, name?: string}> */
    public static function problems(Question $question): array
    {
        $problems = [];
        $required = [
            'statement' => $question->statement === null || trim($question->statement) === '',
            'points' => $question->points === null,
            'grade_level' => $question->grade_level === null,
            'difficulty' => $question->difficulty === null,
            'competence' => $question->competence_id === null,
            'topic' => $question->topic_id === null,
        ];
        foreach ($required as $field => $missing) {
            if ($missing) {
                $problems[] = ['code' => 'required', 'field' => $field];
            }
        }

        $hasValues = ! empty($question->parameters);
        if ($question->section === Section::SubjectOne) {
            $code = self::answerKeyProblem($question->type, $question->answer_key, $hasValues);
            if ($code !== null) {
                $problems[] = ['code' => $code, 'field' => 'answer_key'];
            }
        } elseif ($question->uses_barem) {
            $steps = $question->baremSteps;
            if ($steps->isEmpty() || $question->points === null || (float) $steps->sum('points') !== (float) $question->points) {
                $problems[] = ['code' => 'barem_incomplete', 'field' => 'barem'];
            }
        }

        if ($hasValues) {
            $options = array_map('strval', (array) ($question->answer_key['options'] ?? []));
            $valueProblems = ValueDefinitions::problems($question->type, (string) $question->statement, $question->parameters, $options);
            foreach ($valueProblems as $problem) {
                $problems[] = ['code' => $problem['code'], 'field' => 'parameters', ...(isset($problem['name']) ? ['name' => $problem['name']] : [])];
            }
            if (! $valueProblems) {
                try {
                    ValueDrawer::draw($question->type, (string) $question->statement, $question->parameters, 1, $options);
                } catch (NoValidDraw) {
                    $problems[] = ['code' => 'no_valid_draw', 'field' => 'parameters'];
                }
            }
        }

        return $problems;
    }

    private static function answerKeyProblem(QuestionType $type, ?array $key, bool $hasValues): ?string
    {
        if ($key === null) {
            return 'required';
        }

        return match ($type) {
            QuestionType::DualChoice => is_bool($key['correct'] ?? null) ? null : 'invalid_answer_key',
            QuestionType::SingleChoice => self::optionsProblem($key) ?? (self::position($key['correct'] ?? null, $key) ? null : 'invalid_answer_key'),
            QuestionType::MultipleChoice => self::optionsProblem($key) ?? self::correctSetProblem($key),
            QuestionType::ShortAnswer => self::shortAnswerProblem($key, $hasValues),
            QuestionType::StructuredProblem => null,
        };
    }

    private static function optionsProblem(array $key): ?string
    {
        $options = $key['options'] ?? null;
        if (! is_array($options) || count($options) < 2) {
            return 'too_few_options';
        }
        $trimmed = [];
        foreach ($options as $option) {
            if (! is_string($option) || trim($option) === '') {
                return 'empty_option';
            }
            $trimmed[] = trim($option);
        }

        return count(array_unique($trimmed)) === count($trimmed) ? null : 'duplicate_options';
    }

    private static function correctSetProblem(array $key): ?string
    {
        $correct = $key['correct'] ?? null;
        if (! is_array($correct) || $correct === [] || count(array_unique($correct)) !== count($correct)) {
            return 'invalid_answer_key';
        }
        foreach ($correct as $position) {
            if (! self::position($position, $key)) {
                return 'invalid_answer_key';
            }
        }

        return null;
    }

    private static function position(mixed $position, array $key): bool
    {
        return is_int($position) && $position >= 1 && $position <= count($key['options']);
    }

    private static function shortAnswerProblem(array $key, bool $hasValues): ?string
    {
        return match ($key['kind'] ?? null) {
            'text' => self::acceptedProblem($key['accepted'] ?? null),
            // With values, the expected number comes from parameters.answer (D-057).
            'number' => $hasValues || AnswerMatcher::number((string) ($key['value'] ?? '')) !== null ? null : 'invalid_answer_key',
            'fraction' => match (true) {
                $hasValues => 'fraction_with_values', // Q-051
                ($f = AnswerMatcher::fraction((string) ($key['value'] ?? ''))) !== null && $f[2] > 0 => null,
                default => 'invalid_answer_key',
            },
            default => 'invalid_answer_key',
        };
    }

    private static function acceptedProblem(mixed $accepted): ?string
    {
        if (! is_array($accepted) || $accepted === []) {
            return 'invalid_answer_key';
        }
        foreach ($accepted as $answer) {
            if (! is_string($answer) || trim($answer) === '') {
                return 'invalid_answer_key';
            }
        }

        return null;
    }
}
