<?php

use App\Support\JoinCode;

it('normalises a typed code to upper case without hyphens or spaces', function (string $typed, string $stored) {
    expect(JoinCode::normalise($typed))->toBe($stored);
})->with([
    ['K7Q4MX', 'K7Q4MX'],
    ['k7q-4mx', 'K7Q4MX'],
    [' K7Q - 4MX ', 'K7Q4MX'],
    ['', ''],
]);

it('generates 6 characters from an alphabet without 0, O, 1, I or L', function () {
    foreach (range(1, 200) as $ignored) {
        expect(JoinCode::generate())->toMatch('/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/');
    }
});

it('formats a stored code with a hyphen in the middle', function () {
    expect(JoinCode::format('K7Q4MX'))->toBe('K7Q-4MX');
});
