<?php

namespace App\Support;

/**
 * A class's join code (D-028). Stored upper case without the hyphen; Candidates may type it in
 * any case, with or without the hyphen and spaces.
 */
final class JoinCode
{
    /** No 0/O, 1/I or L, so a code read aloud or from a board can't be mistyped: 31^6 ≈ 887 million codes. */
    private const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

    /** A random code; the caller retries on the unique key (see ClassController). */
    public static function generate(): string
    {
        $code = '';
        for ($i = 0; $i < 6; $i++) {
            $code .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
        }

        return $code;
    }

    /** `K7Q4MX` → `K7Q-4MX`, as shown to people. */
    public static function format(string $stored): string
    {
        return substr($stored, 0, 3).'-'.substr($stored, 3);
    }

    public static function normalise(string $typed): string
    {
        return strtoupper(preg_replace('/[\s-]+/', '', $typed));
    }
}
