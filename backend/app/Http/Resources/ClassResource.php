<?php

namespace App\Http\Resources;

use App\Support\JoinCode;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** The class shape of C-002 (docs/API.md → Classes); counts come from ClassController::withCounts(). */
class ClassResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'join_code' => JoinCode::format($this->join_code),
            'pending_count' => (int) $this->pending_count,
            'candidate_count' => (int) $this->candidate_count,
            'published_exam_count' => (int) $this->published_exam_count,
        ];
    }
}
