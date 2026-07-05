<?php

namespace App\Http\Requests;

use App\Models\Task;
use App\Rules\AssignedToBelongsToTeam;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * FormRequest (SRP): la validación de actualizar tarea sale del controller.
 * La regla de pertenencia al equipo se reutiliza (antes duplicada en store/update).
 */
class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'           => 'sometimes|string',
            'description'     => 'nullable|string',
            'priority'        => 'sometimes|in:low,medium,high',
            'estimated_hours' => 'sometimes|numeric|min:0.5|max:40',
            'due_date'        => 'nullable|date',
            'team_id'         => 'sometimes|exists:teams,id',
            'assigned_to'     => 'sometimes|exists:profiles,id',
            'status'          => 'sometimes|in:pending,in_progress,completed',
            'project_id'      => 'nullable|exists:projects,id',
        ];
    }

    /**
     * Si cambia el equipo o el asignado, validar la pertenencia con los
     * valores efectivos (request o tarea actual).
     */
    public function after(): array
    {
        return [
            function (Validator $validator) {
                if (!$this->has('assigned_to') && !$this->has('team_id')) {
                    return;
                }

                $task = Task::find($this->route('task'));

                $rule = new AssignedToBelongsToTeam($this->input('team_id') ?? $task?->team_id);
                $rule->validate(
                    'assigned_to',
                    $this->input('assigned_to') ?? $task?->assigned_to,
                    fn (string $message) => $validator->errors()->add('assigned_to', $message),
                );
            },
        ];
    }
}