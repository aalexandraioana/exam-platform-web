<?php

namespace App\Support\Math;

use App\Enums\QuestionType;
use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * Draws a question's named values from a seed (D-057). The same seed always gives the same values,
 * so an Attempt's draw can be reproduced in a contest (D-006). A set is drawn again when a condition
 * fails, a calculated value or the answer isn't a whole number (Q-049), a division by zero occurs,
 * or two choice options read the same (Q-050). Expects definitions that ValueDefinitions accepts.
 */
final class ValueDrawer
{
    public const MAX_TRIES = 1000;

    /** @param  list<string>  $options */
    public static function draw(QuestionType $type, string $statement, array $parameters, int $seed, array $options = []): Draw
    {
        $definitions = $parameters['values'] ?? [];
        // JSON objects (jsonb) don't keep key order, so draw in name order to stay reproducible.
        ksort($definitions, SORT_STRING);
        $order = self::calculationOrder($definitions);
        $randomizer = new Randomizer(new Mt19937($seed));

        for ($try = 0; $try < self::MAX_TRIES; $try++) {
            $values = [];
            foreach ($definitions as $name => $definition) {
                if (isset($definition['fixed'])) {
                    $values[$name] = $definition['fixed'];
                } elseif (isset($definition['random'])) {
                    $values[$name] = self::pick($randomizer, $definition['random']);
                }
            }

            $draw = self::complete($values, $definitions, $order, $parameters, $statement, $options);
            if ($draw !== null) {
                return $draw;
            }
        }

        throw new NoValidDraw('No valid set of values within '.self::MAX_TRIES.' tries.');
    }

    /** A whole number in [min, max] that isn't excluded, chosen evenly among the allowed ones. */
    private static function pick(Randomizer $randomizer, array $range): int
    {
        $excluded = array_values(array_filter(array_unique($range['except'] ?? []), fn (int $v) => $v >= $range['min'] && $v <= $range['max']));
        sort($excluded);
        $value = $range['min'] + $randomizer->getInt(0, ValueDefinitions::allowedCount($range['min'], $range['max'], $excluded) - 1);
        foreach ($excluded as $skip) {
            if ($skip <= $value) {
                $value++;
            }
        }

        return $value;
    }

    /** Calculates the rest of the set; null when the set breaks a rule and must be drawn again. */
    private static function complete(array $values, array $definitions, array $order, array $parameters, string $statement, array $options): ?Draw
    {
        try {
            foreach ($order as $name) {
                $values[$name] = self::whole(Expression::evaluate($definitions[$name]['calculated'], $values));
                if ($values[$name] === null) {
                    return null;
                }
            }
            foreach ((array) ($parameters['conditions'] ?? []) as $condition) {
                if (! Condition::holds((string) $condition, $values)) {
                    return null;
                }
            }
            $answer = null;
            if (is_string($parameters['answer'] ?? null) && trim($parameters['answer']) !== '') {
                $answer = self::whole(Expression::evaluate($parameters['answer'], $values));
                if ($answer === null) {
                    return null;
                }
            }
        } catch (MathException $e) {
            if ($e->code === 'division_by_zero') {
                return null;
            }
            throw $e;
        }

        $filled = array_map(fn ($option) => self::fill((string) $option, $values), $options);
        if (count(array_unique(array_map('trim', $filled))) !== count($filled)) {
            return null;
        }

        return new Draw($values, self::fill($statement, $values), $filled, $answer);
    }

    /** Calculated values ordered so each comes after the values it uses (ties by name). @return list<string> */
    private static function calculationOrder(array $definitions): array
    {
        $pending = array_filter($definitions, fn ($d) => isset($d['calculated']));
        $order = [];
        while ($pending) {
            $ready = array_filter(array_keys($pending), fn ($name) => ! array_intersect(Expression::names($pending[$name]['calculated']), array_keys($pending)));
            if (! $ready) {
                throw new MathException('cycle');
            }
            foreach ($ready as $name) {
                $order[] = $name;
                unset($pending[$name]);
            }
        }

        return $order;
    }

    private static function whole(int|float $value): ?int
    {
        if (is_int($value)) {
            return $value;
        }

        return is_finite($value) && floor($value) === $value && abs($value) < PHP_INT_MAX ? (int) $value : null;
    }

    /** Replaces each {name} that has a value; any other braces (e.g. a set {1, 2, 3}) stay as written. */
    private static function fill(string $text, array $values): string
    {
        return preg_replace_callback(ValueDefinitions::PLACEHOLDER, fn ($m) => array_key_exists($m[1], $values) ? (string) $values[$m[1]] : $m[0], $text);
    }
}
