<?php

namespace App\Support\Math;

/** One drawn set of values with the filled statement and options, and the expected answer if the question has one. */
final readonly class Draw
{
    /**
     * @param  array<string, int>  $values
     * @param  list<string>  $options
     */
    public function __construct(
        public array $values,
        public string $statement,
        public array $options,
        public ?int $answer,
    ) {}
}
