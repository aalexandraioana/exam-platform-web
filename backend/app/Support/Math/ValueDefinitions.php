<?php

namespace App\Support\Math;

use App\Enums\QuestionType;

/**
 * Checks a question's named values (D-057) before it can be Ready (D-059). Problems come back as
 * codes (PATTERN-005), with the value's name when there is one:
 * `invalid_value`, `invalid_range`, `all_excluded`, `invalid_formula`, `unknown_name`, `cycle`,
 * `undefined_value`, `invalid_condition`, `answer_required`, `values_not_allowed`.
 *
 * Shape: `values` (name => one of `fixed: int`, `random: {min, max, except?}`, `calculated: formula`),
 * optional `conditions` (list), `answer` (formula; required for a short answer, Q-050).
 */
final class ValueDefinitions
{
    public const PLACEHOLDER = '/\{([A-Za-z][A-Za-z0-9_]*)\}/';

    private const KINDS = ['fixed', 'random', 'calculated'];

    /**
     * @param  list<string>  $options  the options of a choice question, which may use {name} too
     * @return list<array{code: string, name?: string}>
     */
    public static function problems(QuestionType $type, string $statement, ?array $parameters, array $options = []): array
    {
        if (! $parameters) {
            return [];
        }
        // The truth of a true/false statement could change with the values (P4a plan).
        if ($type === QuestionType::DualChoice) {
            return [['code' => 'values_not_allowed']];
        }

        $values = is_array($parameters['values'] ?? null) ? $parameters['values'] : [];
        $names = array_map('strval', array_keys($values));
        $problems = [];

        foreach ($values as $name => $definition) {
            if ($code = self::valueProblem((string) $name, $definition, $names)) {
                $problems[] = ['code' => $code, 'name' => (string) $name];
            }
        }
        foreach (self::inCycle($values) as $name) {
            $problems[] = ['code' => 'cycle', 'name' => $name];
        }

        $used = [];
        foreach ([$statement, ...$options] as $text) {
            preg_match_all(self::PLACEHOLDER, (string) $text, $matches);
            $used = [...$used, ...$matches[1]];
        }
        foreach (array_unique($used) as $name) {
            if (! in_array($name, $names, true)) {
                $problems[] = ['code' => 'undefined_value', 'name' => $name];
            }
        }

        foreach ((array) ($parameters['conditions'] ?? []) as $condition) {
            if ($code = Condition::problem((string) $condition, $names)) {
                $problems[] = ['code' => $code];
            }
        }

        $answer = $parameters['answer'] ?? null;
        if (is_string($answer) && trim($answer) !== '') {
            if ($code = Expression::problem($answer, $names)) {
                $problems[] = ['code' => $code];
            }
        } elseif ($type === QuestionType::ShortAnswer) {
            $problems[] = ['code' => 'answer_required'];
        }

        return $problems;
    }

    /** @param  list<string>  $names */
    private static function valueProblem(string $name, mixed $definition, array $names): ?string
    {
        if (! preg_match('/^[A-Za-z][A-Za-z0-9_]*$/', $name) || ! is_array($definition)) {
            return 'invalid_value';
        }
        $kinds = array_values(array_intersect(array_keys($definition), self::KINDS));
        if (count($kinds) !== 1 || count($definition) !== 1) {
            return 'invalid_value';
        }

        return match ($kinds[0]) {
            'fixed' => is_int($definition['fixed']) ? null : 'invalid_value',
            'random' => self::rangeProblem($definition['random']),
            'calculated' => is_string($definition['calculated'])
                ? Expression::problem($definition['calculated'], $names)
                : 'invalid_formula',
        };
    }

    private static function rangeProblem(mixed $range): ?string
    {
        $min = $range['min'] ?? null;
        $max = $range['max'] ?? null;
        $except = $range['except'] ?? [];
        if (! is_int($min) || ! is_int($max) || $min > $max || ! is_array($except)) {
            return 'invalid_range';
        }
        foreach ($except as $value) {
            if (! is_int($value)) {
                return 'invalid_range';
            }
        }

        return self::allowedCount($min, $max, $except) > 0 ? null : 'all_excluded';
    }

    /** @param  list<int>  $except */
    public static function allowedCount(int $min, int $max, array $except): int
    {
        $excluded = array_filter(array_unique($except), fn (int $v) => $v >= $min && $v <= $max);

        return $max - $min + 1 - count($excluded);
    }

    /**
     * Calculated values that depend on themselves, in definition order.
     *
     * @return list<string>
     */
    private static function inCycle(array $values): array
    {
        $deps = [];
        foreach ($values as $name => $definition) {
            if (is_array($definition) && is_string($definition['calculated'] ?? null)) {
                $deps[(string) $name] = Expression::names($definition['calculated']);
            }
        }

        $cyclic = [];
        foreach (array_keys($deps) as $start) {
            $stack = $deps[$start];
            $seen = [];
            while ($stack) {
                $next = array_pop($stack);
                if ($next === $start) {
                    $cyclic[] = $start;
                    break;
                }
                if (isset($seen[$next]) || ! isset($deps[$next])) {
                    continue;
                }
                $seen[$next] = true;
                array_push($stack, ...$deps[$next]);
            }
        }

        return $cyclic;
    }
}
