<?php

namespace App\Support\Math;

use App\Enums\QuestionType;

/**
 * Whether a Subject I answer is correct (D-017, D-006, D-005): numbers exactly, with either decimal
 * separator; fractions only in the expected form; text without case, extra spaces or Romanian
 * diacritics; choice questions all or nothing, on the original option positions (D-045 shuffling is
 * undone before this). Subject II is graded by the Examiner, never here.
 */
final class AnswerMatcher
{
    private const DIACRITICS = ['ă' => 'a', 'â' => 'a', 'î' => 'i', 'ș' => 's', 'ş' => 's', 'ț' => 't', 'ţ' => 't'];

    /**
     * @param  array  $key  the question's answer key (see questions.template.yaml)
     * @param  int|null  $expected  the drawn answer of a parameterised question
     */
    public static function matches(QuestionType $type, array $key, mixed $given, ?int $expected = null): bool
    {
        return match ($type) {
            QuestionType::DualChoice => is_bool($given) && $given === (bool) ($key['correct'] ?? null),
            QuestionType::SingleChoice => is_int($given) && $given === (int) ($key['correct'] ?? 0),
            QuestionType::MultipleChoice => is_array($given) && self::sameSet($given, (array) ($key['correct'] ?? [])),
            QuestionType::ShortAnswer => is_string($given) && self::shortAnswer($key, $given, $expected),
            QuestionType::StructuredProblem => false,
        };
    }

    private static function shortAnswer(array $key, string $given, ?int $expected): bool
    {
        return match ($key['kind'] ?? null) {
            'number' => ($g = self::number($given)) !== null
                && $g === self::number($expected !== null ? (string) $expected : (string) ($key['value'] ?? '')),
            'fraction' => ($g = self::fraction($given)) !== null && $g === self::fraction((string) ($key['value'] ?? '')),
            'text' => in_array(self::text($given), array_map(fn ($a) => self::text((string) $a), (array) ($key['accepted'] ?? [])), true),
            default => false,
        };
    }

    /** A canonical decimal ("2,50" → "2.5", "-0" → "0"), or null if it isn't a plain number. */
    public static function number(string $value): ?string
    {
        $value = str_replace(['−', ','], ['-', '.'], trim($value));
        if (! preg_match('/^([+-]?)(\d+)(?:\.(\d+))?$/', $value, $m)) {
            return null;
        }
        $whole = ltrim($m[2], '0') ?: '0';
        $fraction = rtrim($m[3] ?? '', '0');
        $sign = $m[1] === '-' && ($whole !== '0' || $fraction !== '') ? '-' : '';

        return $sign.$whole.($fraction !== '' ? '.'.$fraction : '');
    }

    /** [sign, numerator, denominator] exactly as written (spaces ignored), or null. */
    public static function fraction(string $value): ?array
    {
        $value = str_replace('−', '-', $value);
        if (! preg_match('/^\s*([+-]?)\s*(\d+)\s*\/\s*(\d+)\s*$/', $value, $m)) {
            return null;
        }

        return [$m[1] === '-' ? '-' : '', (int) $m[2], (int) $m[3]];
    }

    private static function text(string $value): string
    {
        $value = strtr(mb_strtolower($value), self::DIACRITICS);

        return trim(preg_replace('/\s+/u', ' ', $value));
    }

    private static function sameSet(array $given, array $correct): bool
    {
        foreach ($given as $position) {
            if (! is_int($position)) {
                return false;
            }
        }
        $given = array_unique($given);
        $correct = array_map('intval', $correct);
        sort($given);
        sort($correct);

        return $given === $correct;
    }
}
