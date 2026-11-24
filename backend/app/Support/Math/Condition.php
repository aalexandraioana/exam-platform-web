<?php

namespace App\Support\Math;

/** A simple condition such as `p < q`: one comparison between two formulas (D-057). */
final class Condition
{
    private const OPERATORS = ['<=' => '<=', '>=' => '>=', '!=' => '!=', '≤' => '<=', '≥' => '>=', '≠' => '!=', '<' => '<', '>' => '>', '=' => '='];

    /** The problem code, or null when valid: `invalid_condition` or `unknown_name`. */
    public static function problem(string $condition, array $names): ?string
    {
        $parts = self::parts($condition);
        if ($parts === null) {
            return 'invalid_condition';
        }
        foreach ([$parts[0], $parts[2]] as $side) {
            $code = Expression::problem($side, $names);
            if ($code !== null) {
                return $code === 'unknown_name' ? 'unknown_name' : 'invalid_condition';
            }
        }

        return null;
    }

    /** @return list<string> */
    public static function names(string $condition): array
    {
        $parts = self::parts($condition) ?? ['', '', ''];

        return array_values(array_unique([...Expression::names($parts[0]), ...Expression::names($parts[2])]));
    }

    /** @param  array<string, int>  $values */
    public static function holds(string $condition, array $values): bool
    {
        [$left, $operator, $right] = self::parts($condition) ?? throw new MathException('invalid_condition');
        $a = Expression::evaluate($left, $values);
        $b = Expression::evaluate($right, $values);

        return match ($operator) {
            '<' => $a < $b, '>' => $a > $b, '<=' => $a <= $b, '>=' => $a >= $b,
            '=' => $a == $b, '!=' => $a != $b,
        };
    }

    /** @return array{string, string, string}|null [left, operator, right] */
    private static function parts(string $condition): ?array
    {
        $pieces = preg_split('/(<=|>=|!=|≤|≥|≠|<|>|=)/u', $condition, -1, PREG_SPLIT_DELIM_CAPTURE);
        if ($pieces === false || count($pieces) !== 3) {
            return null;
        }

        return [$pieces[0], self::OPERATORS[$pieces[1]], $pieces[2]];
    }
}
