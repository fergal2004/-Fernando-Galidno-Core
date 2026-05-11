<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TeamMember;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::with(['assignee', 'team']);

        if ($request->team_id) {
            $query->where('team_id', $request->team_id);
        }

        if ($request->assigned_to) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->start_date && $request->end_date) {
            $query->whereBetween('due_date', [$request->start_date, $request->end_date]);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'           => 'required|string',
            'description'     => 'nullable|string',
            'priority'        => 'required|in:low,medium,high',
            'estimated_hours' => 'required|numeric|min:0.5|max:40',
            'due_date'        => 'nullable|date',
            'team_id'         => 'required|exists:teams,id',
            'assigned_to'     => 'required|exists:profiles,id',
            'status'          => 'in:pending,completed',
        ]);

        $memberExists = TeamMember::where('team_id', $request->team_id)
            ->where('user_id', $request->assigned_to)
            ->exists();

        if (!$memberExists) {
            return response()->json([
                'errors' => ['assigned_to' => ['El usuario asignado no pertenece al equipo seleccionado']]
            ], 422);
        }

        $task = Task::create([
            'title'           => $request->title,
            'description'     => $request->description,
            'priority'        => $request->priority,
            'estimated_hours' => $request->estimated_hours,
            'due_date'        => $request->due_date,
            'team_id'         => $request->team_id,
            'assigned_to'     => $request->assigned_to,
            'status'          => $request->status ?? 'pending',
            'user_id'         => $request->user_id,
            'created_by'      => $request->user_id,
        ]);

        return response()->json($task->load(['assignee', 'team']), 201);
    }

    public function show(Request $request, $id)
    {
        $task = Task::with(['assignee', 'team'])->findOrFail($id);
        return response()->json($task);
    }

    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        $request->validate([
            'title'           => 'sometimes|string',
            'description'     => 'nullable|string',
            'priority'        => 'sometimes|in:low,medium,high',
            'estimated_hours' => 'sometimes|numeric|min:0.5|max:40',
            'due_date'        => 'nullable|date',
            'team_id'         => 'sometimes|exists:teams,id',
            'assigned_to'     => 'sometimes|exists:profiles,id',
            'status'          => 'sometimes|in:pending,completed',
        ]);

        $teamId   = $request->team_id   ?? $task->team_id;
        $assignedTo = $request->assigned_to ?? $task->assigned_to;

        if ($request->has('assigned_to') || $request->has('team_id')) {
            $memberExists = TeamMember::where('team_id', $teamId)
                ->where('user_id', $assignedTo)
                ->exists();

            if (!$memberExists) {
                return response()->json([
                    'errors' => ['assigned_to' => ['El usuario asignado no pertenece al equipo seleccionado']]
                ], 422);
            }
        }

        $task->update($request->only([
            'title', 'description', 'priority', 'estimated_hours',
            'due_date', 'team_id', 'assigned_to', 'status',
        ]));

        return response()->json($task->load(['assignee', 'team']));
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json(['message' => 'Tarea eliminada']);
    }
}
