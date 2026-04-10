<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $tasks = Task::where('user_id', $request->user_id)->get();
        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'status' => 'in:pending,completed',
            'due_date' => 'nullable|date',
        ]);

        $task = Task::create([
            'title' => $request->title,
            'description' => $request->description,
            'status' => $request->status ?? 'pending',
            'due_date' => $request->due_date,
            'user_id' => $request->user_id,
        ]);

        return response()->json($task, 201);
    }

    public function show(Request $request, $id)
    {
        $task = Task::where('id', $id)->where('user_id', $request->user_id)->firstOrFail();
        return response()->json($task);
    }

    public function update(Request $request, $id)
    {
        $task = Task::where('id', $id)->where('user_id', $request->user_id)->firstOrFail();

        $task->update($request->only(['title', 'description', 'status', 'due_date']));

        return response()->json($task);
    }

    public function destroy(Request $request, $id)
    {
        $task = Task::where('id', $id)->where('user_id', $request->user_id)->firstOrFail();
        $task->delete();

        return response()->json(['message' => 'Tarea eliminada']);
    }
}