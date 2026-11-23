<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * Creates an Examiner or Administrator (D-020) until the Administrator screen exists (P11).
 * The password is asked twice and never taken as an argument, so it stays out of shell history.
 */
class CreateUser extends Command
{
    protected $signature = 'app:create-user {role : examiner or administrator} {email} {name}';

    protected $description = 'Create an Examiner or Administrator account';

    public function handle(): int
    {
        $role = Role::tryFrom($this->argument('role'));
        if (! in_array($role, [Role::Examiner, Role::Administrator], true)) {
            $this->error('The role must be examiner or administrator. Candidates register themselves.');

            return self::FAILURE;
        }

        $email = strtolower(trim($this->argument('email')));
        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('That is not a valid email address.');

            return self::FAILURE;
        }
        if (User::where('email', $email)->exists()) {
            $this->error('An account with this email already exists.');

            return self::FAILURE;
        }

        $password = (string) $this->secret('Password');
        $again = (string) $this->secret('Password again');
        if (mb_strlen($password) < 8) {
            $this->error('The password needs at least 8 characters.');

            return self::FAILURE;
        }
        if ($password !== $again) {
            $this->error('The passwords are not the same.');

            return self::FAILURE;
        }

        $user = new User(['name' => $this->argument('name'), 'email' => $email, 'password' => $password]);
        $user->role = $role;
        $user->save();

        $this->info("Created {$role->value} {$email}.");

        return self::SUCCESS;
    }
}
