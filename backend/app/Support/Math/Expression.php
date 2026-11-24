<?php

namespace App\Support\Math;

use NXP\Exception\DivisionByZeroException;
use NXP\MathExecutor;
use Throwable;

/**
 * A formula over a question's named values (D-057). Only whole numbers, the names, + − · : and
 * parentheses are allowed (Q-052; `*`, `×`, `/` are the same signs). The whitelist is checked here,
 * before the formula reaches the maths library (D-013), so nothing else is ever evaluated.
 */
final class Expression
{
    private const NAME = '[A-Za-z][A-Za-z0-9_]*';

    /** The problem code of a formula, or null when it is valid: `invalid_formula` or `unknown_name`. */
    public static function problem(string $formula, array $names): ?string
    {
        $tokens = self::tokens($formula);
        if ($tokens === null) {
            return 'invalid_formula';
        }
        foreach ($tokens as $token) {
            if (preg_match('/^'.self::NAME.'$/', $token) && ! in_array($token, $names, true)) {
                return 'unknown_name';
            }
        }

        return null;
    }

    /** The names a valid formula uses. @return list<string> */
    public static function names(string $formula): array
    {
        return array_values(array_unique(array_filter(
            self::tokens($formula) ?? [],
            fn (string $token) => (bool) preg_match('/^'.self::NAME.'$/', $token),
        )));
    }

    /** @param  array<string, int>  $values */
    public static function evaluate(string $formula, array $values): int|float
    {
        if ($code = self::problem($formula, array_keys($values))) {
            throw new MathException($code);
        }

        $executor = new MathExecutor;
        $executor->setVars($values);
        try {
            return $executor->execute(implode(' ', self::tokens($formula)), false);
        } catch (DivisionByZeroException) {
            throw new MathException('division_by_zero');
        } catch (Throwable) {
            throw new MathException('invalid_formula');
        }
    }

    /**
     * Splits a formula into tokens and checks its shape (operand, operator, operand…, balanced
     * parentheses, unary minus or plus before an operand). Null when it isn't plain arithmetic.
     *
     * @return list<string>|null
     */
    private static function tokens(string $formula): ?array
    {
        $normalised = strtr($formula, ['·' => '*', '×' => '*', ':' => '/', '−' => '-']);
        if (! preg_match_all('/\G\s*(\d+|'.self::NAME.'|[-+*\/()])\s*/', $normalised, $matches)) {
            return null;
        }
        if (implode('', $matches[0]) !== $normalised) {
            return null; // something outside the whitelist
        }

        $tokens = $matches[1];
        $expectOperand = true;
        $depth = 0;
        foreach ($tokens as $token) {
            if ($expectOperand) {
                if ($token === '(') {
                    $depth++;
                } elseif ($token === '-' || $token === '+') {
                    // unary sign: still expecting an operand
                } elseif (preg_match('/^(\d+|'.self::NAME.')$/', $token)) {
                    $expectOperand = false;
                } else {
                    return null;
                }
            } elseif ($token === ')' && $depth > 0) {
                $depth--;
            } elseif (in_array($token, ['+', '-', '*', '/'], true)) {
                $expectOperand = true;
            } else {
                return null;
            }
        }

        return $expectOperand || $depth !== 0 ? null : $tokens;
    }
}
