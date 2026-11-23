<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `name` becomes `first_name` and `last_name` (P2b). Existing names split at the last space:
     * "Ana Maria Popescu" → "Ana Maria" + "Popescu"; a one-word name stays as the first name.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)->default('');
            $table->string('last_name', 100)->default('');
        });

        DB::statement(<<<'SQL'
            UPDATE users SET
                first_name = CASE WHEN position(' ' in btrim(name)) = 0 THEN btrim(name)
                    ELSE btrim(regexp_replace(btrim(name), '\s+\S+$', '')) END,
                last_name = CASE WHEN position(' ' in btrim(name)) = 0 THEN ''
                    ELSE substring(btrim(name) from '\S+$') END
        SQL);

        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name', 100)->default(null)->change();
            $table->string('last_name', 100)->default(null)->change();
            $table->dropColumn('name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->default('');
        });
        DB::statement("UPDATE users SET name = btrim(first_name || ' ' || last_name)");
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->default(null)->change();
            $table->dropColumn(['first_name', 'last_name']);
        });
    }
};
