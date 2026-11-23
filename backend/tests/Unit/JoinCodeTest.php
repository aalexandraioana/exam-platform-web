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
