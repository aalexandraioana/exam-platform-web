<?php

namespace App\Models;

use App\Enums\MembershipStatus;
use Database\Factories\SchoolClassFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A Class (CONTEXT.md); named SchoolClass because `class` is reserved in PHP. */
#[Fillable(['name', 'join_code'])]
class SchoolClass extends Model
{
    /** @use HasFactory<SchoolClassFactory> */
    use HasFactory;

    protected $table = 'classes';

    /** @return BelongsTo<User, $this> */
    public function examiner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'examiner_id');
    }

    /** Every request to join, whatever its status. @return HasMany<ClassMembership, $this> */
    public function memberships(): HasMany
    {
        return $this->hasMany(ClassMembership::class, 'class_id');
    }

    /** Candidates the Examiner accepted (D-028). @return BelongsToMany<User, $this> */
    public function candidates(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'class_memberships', 'class_id', 'candidate_id')
            ->wherePivot('status', MembershipStatus::Accepted->value);
    }
}
