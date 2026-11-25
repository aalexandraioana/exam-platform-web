<?php

namespace App\Support\Attempts;

use RuntimeException;

/** Why an Attempt takes no more answers: `time_up` (sealed at its deadline) or `attempt_submitted`. */
final class AttemptClosed extends RuntimeException
{
    public function __construct(public readonly string $reason)
    {
        parent::__construct($reason);
    }
}
