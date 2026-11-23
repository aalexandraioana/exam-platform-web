<?php

namespace App\Support;

/**
 * A class's join code (D-028). Stored upper case without the hyphen; Candidates may type it in
 * any case, with or without the hyphen and spaces. P3 adds generating and formatting.
 */
final class JoinCode
{
    public static function normalise(string $typed): string
    {
        return strtoupper(preg_replace('/[\s-]+/', '', $typed));
    }
}
