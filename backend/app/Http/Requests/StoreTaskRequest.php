<?php

namespace App\Http\Requests;

use App\Rules\AssignedToBelongsToTeam;
use Illuminate\Foundation\Http\FormRequest;

/**
 * FormRequest (SRP): la validación de crear tarea sale del controller.
 */
class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'           => 'required|string',
            'description'     => 'nullable|string',
            'priority'        => 'required|in:low,medium,high',
            'estimated_hours' => 'required|numeric|min:0.5|max:40',
            'due_date'        => 'nullable|date',
            'team_id'         => 'required|exists:teams,id',
            'assigned_to'     => [
                'required',
                'exists:profiles,id',
                new AssignedToBelongsToTeam($this->input('team_id')),
            ],
            'status'          => 'in:pending,in_progress,completed',
            'project_id'      => 'nullable|exists:projects,id',
        ];
    }
}