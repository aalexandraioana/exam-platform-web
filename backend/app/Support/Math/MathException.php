<?php

namespace App\Support\Math;

use RuntimeException;

/** A formula that can't be evaluated; `code` is the problem code (`invalid_formula`, `unknown_name`, `division_by_zero`). */
class MathException extends RuntimeException
{
    /** @var string */
    public $code;

    public function __construct(string $code)
    {
        parent::__construct("Math error: {$code}");
        $this->code = $code;
    }
}
