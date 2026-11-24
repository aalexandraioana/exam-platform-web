<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\Role;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['first_name', 'last_name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Mirrors the database defaults, so a new user reads as an active candidate before it is
     * reloaded. `role` and `must_change_password` are deliberately not fillable: only trusted
     * code may change them.
     */
    protected $attributes = ['role' => 'candidate', 'is_active' => true, 'must_change_password' => false];

    /**
     * Deactivating a user or changing their password logs them out everywhere (D-050).
     */
    protected static function booted(): void
    {
        static::updated(function (User $user) {
            if ($user->wasChanged('password') || ($user->wasChanged('is_active') && ! $user->is_active)) {
                $user->tokens()->delete();
            }
        });
    }

    /** "Prenume Nume", for display (P2b). Read-only: names are stored as `first_name` and `last_name`. */
    protected function name(): Attribute
    {
        return Attribute::get(fn () => trim($this->first_name.' '.$this->last_name));
    }

    /** Emails are stored lower case, so the unique key and login ignore case. */
    public function setEmailAttribute(string $value): void
    {
        $this->attributes['email'] = strtolower(trim($value));
    }

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
            'must_change_password' => 'boolean',
        ];
    }

    /** Classes this Examiner created. @return HasMany<SchoolClass, $this> */
    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'examiner_id');
    }

    /** This Examiner's own competences (D-058). @return HasMany<Competence, $this> */
    public function competences(): HasMany
    {
        return $this->hasMany(Competence::class, 'examiner_id');
    }

    /** This Examiner's bank: all their questions, including library entries they published (D-040, D-041). @return HasMany<Question, $this> */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class, 'examiner_id');
    }

    /** @return HasMany<Pool, $this> */
    public function pools(): HasMany
    {
        return $this->hasMany(Pool::class, 'examiner_id');
    }

    /** This Examiner's own topics (D-058). @return HasMany<Topic, $this> */
    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class, 'examiner_id');
    }

    /** This Candidate's requests to join classes. @return HasMany<ClassMembership, $this> */
    public function memberships(): HasMany
    {
        return $this->hasMany(ClassMembership::class, 'candidate_id');
    }

    /** Exams this Examiner created. @return HasMany<Exam, $this> */
    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class, 'examiner_id');
    }

    /** This Candidate's Attempts. @return HasMany<Attempt, $this> */
    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class, 'candidate_id');
    }
}
