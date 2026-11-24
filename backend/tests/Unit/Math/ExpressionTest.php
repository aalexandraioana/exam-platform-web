<?php

use App\Support\Math\Expression;
use App\Support\Math\MathException;

// D-013, Q-052: whole numbers, the question's names, + − · : and parentheses (also * × /).

it('evaluates formulas with school and programming signs', function (string $formula, int|float $expected) {
    expect(Expression::evaluate($formula, ['p' => 3, 'q' => 5, 'k' => 4]))->toEqual($expected);
})->with([
    ['(p + q) * k', 32],
    ['p · k', 12],
    ['p × k', 12],
    ['12 : k', 3],
    ['12 / k', 3],
    ['p − q', -2],
    ['-p + q', 2],
    ['7 : 2', 3.5],
]);

it('accepts a valid formula and reports none', function () {
    expect(Expression::problem('(p + q) · k', ['p', 'q', 'k']))->toBeNull();
});

it('refuses anything that is not plain arithmetic on known names', function (string $formula, string $code) {
    expect(Expression::problem($formula, ['p', 'q']))->toBe($code);
})->with([
    ['', 'invalid_formula'],
    ['   ', 'invalid_formula'],
    ['sin(p)', 'invalid_formula'],
    ['p ^ 2', 'invalid_formula'],
    ['p % 2', 'invalid_formula'],
    ['2p', 'invalid_formula'],
    ['p q', 'invalid_formula'],
    ['(p + q', 'invalid_formula'],
    ['p +', 'invalid_formula'],
    ['2,5 * p', 'invalid_formula'],
    ['system("ls")', 'invalid_formula'],
    ['$p', 'invalid_formula'],
    ['p + r', 'unknown_name'],
]);

it('never evaluates a refused formula', function () {
    Expression::evaluate('sin(1)', []);
})->throws(MathException::class);

it('turns a division by zero into a math error, not a crash', function () {
    try {
        Expression::evaluate('p : (q - q)', ['p' => 1, 'q' => 2]);
        $this->fail('expected a MathException');
    } catch (MathException $e) {
        expect($e->code)->toBe('division_by_zero');
    }
});
