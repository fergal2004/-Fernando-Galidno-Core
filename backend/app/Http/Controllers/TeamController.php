<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\TeamMember;
use App\Services\WorkloadService;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function __construct(private WorkloadService $workload)
    {
    }

    public function index()
    {
        return response()->json(Team::with('teamMembers.profile')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string',
        ]);

        $team = Team::create($request->only(['name', 'description']));

        return response()->json($team, 201);
    }

    public function show($id)
    {
        return response()->json(Team::with('teamMembers.profile')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $team = Team::findOrFail($id);

        $request->validate([
            'name'        => 'sometimes|string|max:100',
            'description' => 'nullable|string',
        ]);

        $team->update($request->only(['name', 'description']));

        return response()->json($team);
    }

    public function destroy($id)
    {
        $team = Team::findOrFail($id);
        $team->delete();

        return response()->json(['message' => 'Equipo eliminado']);
    }

    // SRP: el cálculo de carga vive en WorkloadService (antes estaba duplicado aquí)
    public function members(Request $request, $id)
    {
        Team::findOrFail($id);

        $data = $this->workload->membersWorkload($id, null, null);

        $result = collect($data['members'])->map(fn ($m) => $m + [
            'total_tasks'  => $m['tasks_count'],
            'active_tasks' => $m['tasks_count'],
            'total_hours'  => $m['assigned_hours'],
        ]);

        return response()->json($result->values());
    }

    public function addMember(Request $request, $id)
    {
        Team::findOrFail($id);

        $request->validate([
            'profile_id' => 'required|exists:profiles,id',
        ]);

        $exists = TeamMember::where('team_id', $id)
            ->where('user_id', $request->profile_id)
            ->exists();

        if ($exists) {
            return response()->json([
                'errors' => ['profile_id' => ['El usuario ya es miembro de este equipo']]
            ], 422);
        }

        $member = TeamMember::create([
            'team_id' => $id,
            'user_id' => $request->profile_id,
        ]);

        return response()->json($member->load('profile'), 201);
    }

    public function removeMember(Request $request, $id, $userId)
    {
        Team::findOrFail($id);

        $member = TeamMember::where('team_id', $id)
            ->where('user_id', $userId)
            ->firstOrFail();

        $member->delete();

        return response()->json(['message' => 'Miembro eliminado del equipo']);
    }
}
