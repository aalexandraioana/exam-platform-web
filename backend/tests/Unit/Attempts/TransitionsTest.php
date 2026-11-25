<?php

use App\Enums\AttemptStatus as S;
use App\Models\Attempt;
use App\Support\Attempts\InvalidTransition;
use Tests\TestCase;

uses(TestCase::class);

// The catalog's state machine: started → in_progress → submitted → graded, validated on the server,
// with a test for every invalid transition (P6b, Q-068).

function attemptIn(S $status): Attempt
{
    $attempt = new Attempt;
    $attempt->status = $status;

    return $attempt;
}

it('allows exactly the four transitions', function (S $from, S $to) {
    $attempt = attemptIn($from);
    $attempt->moveTo($to);

    expect($attempt->status)->toBe($to);
})->with([
    'started → in_progress' => [S::Started, S::InProgress],
    'started → submitted' => [S::Started, S::Submitted],
    'in_progress → submitted' => [S::InProgress, S::Submitted],
    'submitted → graded' => [S::Submitted, S::Graded],
]);

it('refuses every other transition', function (S $from, S $to) {
    $attempt = attemptIn($from);

    expect(fn () => $attempt->moveTo($to))->toThrow(InvalidTransition::class)
        ->and($attempt->status)->toBe($from);
})->with([
    'started → started' => [S::Started, S::Started],
    'started → graded' => [S::Started, S::Graded],
    'in_progress → started' => [S::InProgress, S::Started],
    'in_progress → in_progress' => [S::InProgress, S::InProgress],
    'in_progress → graded' => [S::InProgress, S::Graded],
    'submitted → started' => [S::Submitted, S::Started],
    'submitted → in_progress' => [S::Submitted, S::InProgress],
    'submitted → submitted' => [S::Submitted, S::Submitted],
    'graded → started' => [S::Graded, S::Started],
    'graded → in_progress' => [S::Graded, S::InProgress],
    'graded → submitted' => [S::Graded, S::Submitted],
    'graded → graded' => [S::Graded, S::Graded],
]);
