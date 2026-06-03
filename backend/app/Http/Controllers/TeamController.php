<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Http\Request;

class TeamController extends Controller
{
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

    public function members(Request $request, $id)
    {
        Team::findOrFail($id);

        $teamMembers = TeamMember::where('team_id', $id)->with('profile')->get();

        // Una sola query para todos los miembros en lugar de N queries en el loop
        $taskStats = Task::where('team_id', $id)
            ->where('status', '!=', 'completed')
            ->selectRaw('assigned_to, count(*) as total_tasks, coalesce(sum(estimated_hours), 0) as total_hours')
            ->groupBy('assigned_to')
            ->get()
            ->keyBy('assigned_to');

        $result = $teamMembers->map(function ($member) use ($taskStats) {
            $stats  = $taskStats->get($member->user_id);
            $hours  = $stats ? (float) $stats->total_hours : 0;
            $tasks  = $stats ? (int) $stats->total_tasks : 0;
            $capacity = (int) ($member->profile->weekly_hours_capacity ?? 40);
            $loadPct  = $capacity > 0 ? round($hours / $capacity * 100) : 100;

            $workloadLevel = match (true) {
                $loadPct < 40  => 'low',
                $loadPct <= 70 => 'medium',
                default        => 'high',
            };

            return [
                'id'             => $member->user_id,
                'name'           => $member->profile->first_name . ' ' . $member->profile->last_name,
                'email'          => $member->profile->email,
                'total_tasks'    => $tasks,
                'total_hours'    => $hours,
                'assigned_hours' => $hours,
                'capacity'       => $capacity,
                'workload_pct'   => $loadPct,
                'workload_level' => $workloadLevel,
            ];
        });

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
