<?php

namespace App\Enums;

/** A Candidate's request to join a class stays pending until the Examiner decides (D-028). */
enum MembershipStatus: string
{
    case Pending = 'pending';
    case Accepted = 'accepted';
    case Rejected = 'rejected';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
