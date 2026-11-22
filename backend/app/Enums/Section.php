<?php

namespace App\Enums;

use App\Enums\Concerns\HasValues;

/** Subject I is auto-graded without partial credit; Subject II is graded by the Examiner (D-005). */
enum Section: string
{
    use HasValues;

    case SubjectOne = 'subject_1';
    case SubjectTwo = 'subject_2';
}
