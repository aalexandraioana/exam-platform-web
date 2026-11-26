<?php

namespace App\Support\Attempts;

use RuntimeException;

/** Why a photo can't be added or removed (P6d): a code and its HTTP status (PATTERN-005). */
final class PhotoRefused extends RuntimeException
{
    public function __construct(public readonly string $reason, public readonly int $status)
    {
        parent::__construct($reason);
    }
}
