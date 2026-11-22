<?php

namespace App\Models;

use App\Enums\MembershipStatus;
use Database\Factories\ClassMembershipFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Nothing here is mass-assignable: status and its dates decide who is in a class (D-028), so only
 * trusted code sets them, e.g. `$membership->status = MembershipStatus::Accepted`.
 */
class ClassMembership extends Model
{
    /** @use HasFactory<ClassMembershipFactory> */
    use HasFactory;

    /** Mirrors the database default, so a new membership reads as pending before it is reloaded. */
    protected $attributes = ['status' => 'pending'];

    protected function casts(): array
    {
        return [
            'status' => MembershipStatus::class,
            'requested_at' => 'datetime',
            'decided_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<SchoolClass, $this> */
    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /** @return BelongsTo<User, $this> */
    public function candidate(): BelongsTo
    {
        return $this->belongsTo(User::class, 'candidate_id');
    }
}
