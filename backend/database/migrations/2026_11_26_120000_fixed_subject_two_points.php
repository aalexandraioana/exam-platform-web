<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * D-062: Subject II problems are worth 20 points. NOT VALID: new and changed rows are checked,
 * rows saved before the rule (if any) are left as they were, so the deploy can't fail on them.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE questions ADD CONSTRAINT questions_subject_two_points_check CHECK (section <> 'subject_2' OR status <> 'ready' OR points = 20) NOT VALID");
        DB::statement("ALTER TABLE exam_items ADD CONSTRAINT exam_items_subject_two_points_check CHECK (section <> 'subject_2' OR points IS NULL OR points = 20) NOT VALID");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE exam_items DROP CONSTRAINT exam_items_subject_two_points_check');
        DB::statement('ALTER TABLE questions DROP CONSTRAINT questions_subject_two_points_check');
    }
};
