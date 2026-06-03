<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with(['practice', 'team']);

        if ($request->team_id) {
            $query->where('team_id', $request->team_id);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:150',
            'description' => 'nullable|string',
            'practice_id' => 'nullable|exists:practices,id',
            'team_id'     => 'nullable|exists:teams,id',
            'status'      => 'in:active,completed,on_hold',
        ]);

        $project = Project::create([
            'name'        => $request->name,
            'description' => $request->description,
            'practice_id' => $request->practice_id,
            'team_id'     => $request->team_id,
            'status'      => $request->status ?? 'active',
        ]);

        return response()->json($project->load(['practice', 'team']), 201);
    }

    public function show($id)
    {
        return response()->json(Project::with(['practice', 'team'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $request->validate([
            'name'        => 'sometimes|string|max:150',
            'description' => 'nullable|string',
            'practice_id' => 'nullable|exists:practices,id',
            'team_id'     => 'nullable|exists:teams,id',
            'status'      => 'sometimes|in:active,completed,on_hold',
        ]);

        $project->update($request->only(['name', 'description', 'practice_id', 'team_id', 'status']));

        return response()->json($project->load(['practice', 'team']));
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);
        $project->delete();

        return response()->json(['message' => 'Proyecto eliminado']);
    }
}
