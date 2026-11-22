<?php

namespace App\Enums;

enum Role: string
{
    case Candidate = 'candidate';
    case Examiner = 'examiner';
    case Administrator = 'administrator';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
