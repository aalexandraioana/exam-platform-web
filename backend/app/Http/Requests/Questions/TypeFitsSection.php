<?php

namespace App\Http\Requests\Questions;

/** structured_problem is the only Subject II type (questions_type_matches_section_check). */
final class TypeFitsSection
{
    public static function check(?string $section, ?string $type): bool
    {
        return ($section === 'subject_2') === ($type === 'structured_problem');
    }
}
