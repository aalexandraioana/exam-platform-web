<?php

namespace App\Support\Attempts;

use RuntimeException;

/** Why an Attempt can't start: `attempt_open` (with its id), `no_attempts_left`, `not_available`. */
final class StartRefused extends RuntimeException
{
    public function __construct(public readonly string $reason, public readonly ?int $attemptId = null)
    {
        parent::__construct($reason);
    }
}
