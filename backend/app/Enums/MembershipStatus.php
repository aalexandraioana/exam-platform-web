<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/** A Candidate's request to join a class stays pending until the Examiner decides (D-028). */
enum MembershipStatus: string
{
    use HasValues;

    case Pending = 'pending';
    case Accepted = 'accepted';
    case Rejected = 'rejected';
}
