<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Mirrors the database defaults, so a new user reads as an active candidate before it is
     * reloaded. `role` is deliberately not fillable: only trusted code may change it.
     */
    protected $attributes = ['role' => 'candidate', 'is_active' => true];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
            'is_active' => 'boolean',
        ];
    }

    /** Classes this Examiner created. @return HasMany<SchoolClass, $this> */
    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'examiner_id');
    }

    /** This Examiner's own competences (D-039). @return HasMany<Competence, $this> */
    public function competences(): HasMany
    {
        return $this->hasMany(Competence::class, 'examiner_id');
    }

    /** This Candidate's requests to join classes. @return HasMany<ClassMembership, $this> */
    public function memberships(): HasMany
    {
        return $this->hasMany(ClassMembership::class, 'candidate_id');
    }
}
