<?php

use App\Enums\QuestionType;
use App\Support\Math\AnswerMatcher;

// D-017, D-006, D-005: numbers with both separators and exact; fractions in the expected form;
// text without case, extra spaces or diacritics; choice all or nothing.

it('matches numbers with either decimal separator, exactly', function (string $given, bool $ok) {
    expect(AnswerMatcher::matches(QuestionType::ShortAnswer, ['kind' => 'number', 'value' => '2,5'], $given))->toBe($ok);
})->with([
    ['2,5', true], ['2.5', true], [' 2,50 ', true], ['+2,5', true],
    ['2,4', false], ['2,51', false], ['5/2', false], ['2,5 cm', false], ['', false], ['abc', false],
]);

it('reads minus signs and takes no thousands separators', function () {
    $key = ['kind' => 'number', 'value' => '-3'];
    expect(AnswerMatcher::matches(QuestionType::ShortAnswer, $key, '-3'))->toBeTrue()
        ->and(AnswerMatcher::matches(QuestionType::ShortAnswer, $key, '−3'))->toBeTrue()
        ->and(AnswerMatcher::matches(QuestionType::ShortAnswer, $key, '3'))->toBeFalse()
        ->and(AnswerMatcher::matches(QuestionType::ShortAnswer, ['kind' => 'number', 'value' => '1'], '1.000'))->toBeTrue()
        ->and(AnswerMatcher::matches(QuestionType::ShortAnswer, ['kind' => 'number', 'value' => '0'], '-0'))->toBeTrue();
});

it('matches a parameterised answer against the drawn value', function () {
    $key = ['kind' => 'number'];
    expect(AnswerMatcher::matches(QuestionType::ShortAnswer, $key, '12', 12))->toBeTrue()
        ->and(AnswerMatcher::matches(QuestionType::ShortAnswer, $key, '12,0', 12))->toBeTrue()
        ->and(AnswerMatcher::matches(QuestionType::ShortAnswer, $key, '13', 12))->toBeFalse();
});

it('accepts a fraction only in the expected form', function (string $given, bool $ok) {
    expect(AnswerMatcher::matches(QuestionType::ShortAnswer, ['kind' => 'fraction', 'value' => '3/4'], $given))->toBe($ok);
})->with([
    ['3/4', true], [' 3 / 4 ', true], ['6/8', false], ['0,75', false], ['-3/4', false], ['3/4/1', false],
]);

it('matches text without case, extra spaces or Romanian diacritics', function (string $given, bool $ok) {
    $key = ['kind' => 'text', 'accepted' => ['se înjumătățește', 'scade de două ori']];
    expect(AnswerMatcher::matches(QuestionType::ShortAnswer, $key, $given))->toBe($ok);
})->with([
    ['Se injumatateste ', true],
    ['SE  ÎNJUMĂTĂȚEȘTE', true],
    ['se înjumătăţeşte', true],   // cedilla forms ş ţ
    ['scade de doua ori', true],
    ['se dublează', false],
    ['se înjumătățește.', false], // punctuation is not ignored (D-017 lists case, spaces, diacritics)
]);

it('matches true/false and choice questions all or nothing', function () {
    expect(AnswerMatcher::matches(QuestionType::DualChoice, ['correct' => true], true))->toBeTrue()
        ->and(AnswerMatcher::matches(QuestionType::DualChoice, ['correct' => true], false))->toBeFalse()
        ->and(AnswerMatcher::matches(QuestionType::SingleChoice, ['options' => ['12', '36'], 'correct' => 2], 2))->toBeTrue()
        ->and(AnswerMatcher::matches(QuestionType::SingleChoice, ['options' => ['12', '36'], 'correct' => 2], 1))->toBeFalse()
        ->and(AnswerMatcher::matches(QuestionType::MultipleChoice, ['options' => ['12', '14', '21'], 'correct' => [1, 3]], [3, 1]))->toBeTrue()
        ->and(AnswerMatcher::matches(QuestionType::MultipleChoice, ['options' => ['12', '14', '21'], 'correct' => [1, 3]], [1]))->toBeFalse()
        ->and(AnswerMatcher::matches(QuestionType::MultipleChoice, ['options' => ['12', '14', '21'], 'correct' => [1, 3]], [1, 2, 3]))->toBeFalse()
        ->and(AnswerMatcher::matches(QuestionType::MultipleChoice, ['options' => ['12', '14', '21'], 'correct' => [1, 3]], 'x'))->toBeFalse();
});
