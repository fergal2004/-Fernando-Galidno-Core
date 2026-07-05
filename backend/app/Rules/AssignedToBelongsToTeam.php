<?php

namespace App\Rules;

use App\Models\TeamMember;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Regla cross-table: el usuario asignado debe ser miembro del equipo.
 * Antes estaba duplicada inline en TaskController store() y update() (SRP).
 */
class AssignedToBelongsToTeam implements ValidationRule
{
    public function __construct(private ?string $teamId)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $exists = TeamMember::where('team_id', $this->teamId)
            ->where('user_id', $value)
            ->exists();

        if (!$exists) {
            $fail('El usuario asignado no pertenece al equipo seleccionado');
        }
    }
}