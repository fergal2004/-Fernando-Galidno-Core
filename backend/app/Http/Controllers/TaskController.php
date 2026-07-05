<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Repositories\TaskRepository;
use Illuminate\Http\Request;

/**
 * SRP: validación en FormRequests, acceso a datos en TaskRepository (DIP).
 */
class TaskController extends Controller
{
    public function __construct(private TaskRepository $tasks)
    {
    }

    public function index(Request $request)
    {
        return response()->json(
            $this->tasks->search($request->only(['team_id', 'assigned_to', 'start_date', 'end_date']))
        );
    }

    public function store(StoreTaskRequest $request)
    {
        $task = $this->tasks->create($request->validated() + [
            'status'     => 'pending',
            'user_id'    => $request->input('user_id'),
            'created_by' => $request->input('user_id'),
        ]);

        return response()->json($task, 201);
    }

    public function show(Request $request, $id)
    {
        return response()->json($this->tasks->findOrFail($id));
    }

    public function update(UpdateTaskRequest $request, $id)
    {
        $task = $this->tasks->findOrFail($id);

        return response()->json($this->tasks->update($task, $request->validated()));
    }

    public function destroy(Request $request, $id)
    {
        $this->tasks->delete($this->tasks->findOrFail($id));

        return response()->json(['message' => 'Tarea eliminada']);
    }
}