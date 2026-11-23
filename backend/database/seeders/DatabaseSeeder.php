<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Local demo accounts, one per role, with the factory password ("password"). Never in
     * production: real Examiners and Administrators are created with `app:create-user`.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        User::factory()->administrator()->create(['first_name' => 'Demo', 'last_name' => 'Administrator', 'email' => 'admin@example.test']);
        User::factory()->examiner()->create(['first_name' => 'Demo', 'last_name' => 'Examiner', 'email' => 'examiner@example.test']);
        User::factory()->candidate()->create(['first_name' => 'Demo', 'last_name' => 'Candidate', 'email' => 'candidate@example.test']);
    }
}
