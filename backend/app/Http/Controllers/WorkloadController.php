<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMember;
use Illuminate\Http\Request;

class WorkloadController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'team_id'    => 'required|exists:teams,id',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
        ]);

        $members = TeamMember::where('team_id', $request->team_id)
            ->with('profile')
            ->get();

        // Una sola query para todos los miembros en lugar de N queries en el loop
        $taskStats = Task::where('team_id', $request->team_id)
            ->where('status', '!=', 'completed')
            ->when(
                $request->start_date && $request->end_date,
                fn ($q) => $q->whereBetween('due_date', [$request->start_date, $request->end_date])
            )
            ->selectRaw('assigned_to, count(*) as total_tasks, coalesce(sum(estimated_hours), 0) as total_hours')
            ->groupBy('assigned_to')
            ->get()
            ->keyBy('assigned_to');

        $membersData = $members->map(function ($member) use ($taskStats) {
            $stats    = $taskStats->get($member->user_id);
            $hours    = $stats ? (float) $stats->total_hours : 0;
            $tasks    = $stats ? (int) $stats->total_tasks : 0;
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
                'tasks_count'    => $tasks,
                'assigned_hours' => $hours,
                'capacity'       => $capacity,
                'workload_pct'   => $loadPct,
                'workload_level' => $workloadLevel,
            ];
        });

        $totalHours = $membersData->sum('assigned_hours');
        $totalTasks = $membersData->sum('tasks_count');
        $count      = $membersData->count();

        $suggested = $membersData->isNotEmpty()
            ? $membersData->sortBy('workload_pct')->first()
            : null;

        return response()->json([
            'summary' => [
                'total_tasks'   => $totalTasks,
                'total_hours'   => $totalHours,
                'average_hours' => $count > 0 ? round($totalHours / $count, 2) : 0,
            ],
            'members'            => $membersData->values(),
            'suggested_assignee' => $suggested,
        ]);
    }

    public function suggestions(Request $request)
    {
        $request->validate([
            'team_id' => 'required|exists:teams,id',
        ]);

        $members = TeamMember::where('team_id', $request->team_id)
            ->with(['profile.skills.practice'])
            ->get();

        $activeProjects = Project::where('team_id', $request->team_id)
            ->where('status', 'active')
            ->withCount(['tasks as pending_tasks_count' => function ($q) {
                $q->where('status', '!=', 'completed');
            }])
            ->with('practice')
            ->get()
            ->filter(fn ($p) => $p->pending_tasks_count > 0)
            ->values();

        // Una query para stats de carga de todos los miembros
        $taskStats = Task::where('team_id', $request->team_id)
            ->where('status', '!=', 'completed')
            ->selectRaw('assigned_to, coalesce(sum(estimated_hours), 0) as total_hours')
            ->groupBy('assigned_to')
            ->get()
            ->keyBy('assigned_to');

        // Una query para todas las tareas pendientes de todos los proyectos activos
        $projectIds     = $activeProjects->pluck('id');
        $allPendingTasks = Task::whereIn('project_id', $projectIds)
            ->where('status', '!=', 'completed')
            ->select('id', 'title', 'priority', 'estimated_hours', 'assigned_to', 'project_id')
            ->get()
            ->groupBy('project_id');

        $suggestions = $members->map(function ($member) use ($taskStats, $activeProjects, $allPendingTasks) {
            $stats    = $taskStats->get($member->user_id);
            $hours    = $stats ? (float) $stats->total_hours : 0;
            $capacity = (int) ($member->profile->weekly_hours_capacity ?? 40);
            $loadPct  = $capacity > 0 ? round($hours / $capacity * 100) : 100;

            if ($loadPct >= 40) {
                return null;
            }

            $userPracticeIds = $member->profile->skills
                ->pluck('practice_id')
                ->filter()
                ->unique()
                ->values();

            $matchingProjects = $activeProjects->filter(
                fn ($p) => $p->practice_id && $userPracticeIds->contains($p->practice_id)
            )->values();

            if ($matchingProjects->isEmpty()) {
                return null;
            }

            return [
                'user_id'        => $member->user_id,
                'name'           => $member->profile->first_name . ' ' . $member->profile->last_name,
                'workload_pct'   => $loadPct,
                'assigned_hours' => $hours,
                'capacity'       => $capacity,
                'skills'         => $member->profile->skills->pluck('name')->values(),
                'matching_projects' => $matchingProjects->map(fn ($p) => [
                    'id'                  => $p->id,
                    'name'                => $p->name,
                    'practice'            => $p->practice?->name,
                    'pending_tasks_count' => $p->pending_tasks_count,
                    'pending_tasks'       => $allPendingTasks->get($p->id, collect())->values(),
                ])->values(),
            ];
        })->filter()->values();

        return response()->json($suggestions);
    }
}
