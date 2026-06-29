<?php

namespace App\Services;

use App\Models\Project;
use App\Models\Task;
use App\Models\TeamMember;
use App\Services\Workload\WorkloadLevelStrategy;
use Illuminate\Support\Collection;

/**
 * Service Layer — dueño de la lógica de carga de trabajo.
 * El controller solo orquesta HTTP (SRP); el nivel se decide por estrategia (Strategy/OCP).
 */
class WorkloadService
{
    public function __construct(private WorkloadLevelStrategy $level)
    {
    }

    /**
     * Resumen + carga por miembro de un equipo, con el miembro de menor carga sugerido.
     */
    public function membersWorkload(string $teamId, ?string $startDate, ?string $endDate): array
    {
        $members = TeamMember::where('team_id', $teamId)->with('profile')->get();

        // Una sola query para todos los miembros en lugar de N queries en el loop
        $taskStats = Task::where('team_id', $teamId)
            ->where('status', '!=', 'completed')
            ->when(
                $startDate && $endDate,
                fn ($q) => $q->whereBetween('due_date', [$startDate, $endDate])
            )
            ->selectRaw('assigned_to, count(*) as total_tasks, coalesce(sum(estimated_hours), 0) as total_hours')
            ->groupBy('assigned_to')
            ->get()
            ->keyBy('assigned_to');

        $membersData = $members->map(function ($member) use ($taskStats) {
            $stats = $taskStats->get($member->user_id);
            $base  = $this->computeMember(
                $member,
                $stats ? (float) $stats->total_hours : 0,
            );

            return $base + [
                'tasks_count' => $stats ? (int) $stats->total_tasks : 0,
            ];
        });

        $totalHours = $membersData->sum('assigned_hours');
        $totalTasks = $membersData->sum('tasks_count');
        $count      = $membersData->count();

        $suggested = $membersData->isNotEmpty()
            ? $membersData->sortBy('workload_pct')->first()
            : null;

        return [
            'summary' => [
                'total_tasks'   => $totalTasks,
                'total_hours'   => $totalHours,
                'average_hours' => $count > 0 ? round($totalHours / $count, 2) : 0,
            ],
            'members'            => $membersData->values(),
            'suggested_assignee' => $suggested,
        ];
    }

    /**
     * Sugerencias de asignación: miembros con carga baja cuyas skills calzan con proyectos activos.
     */
    public function suggestions(string $teamId): Collection
    {
        $members = TeamMember::where('team_id', $teamId)
            ->with(['profile.skills.practice'])
            ->get();

        $activeProjects = Project::where('team_id', $teamId)
            ->where('status', 'active')
            ->withCount(['tasks as pending_tasks_count' => function ($q) {
                $q->where('status', '!=', 'completed');
            }])
            ->with('practice')
            ->get()
            ->filter(fn ($p) => $p->pending_tasks_count > 0)
            ->values();

        // Una query para stats de carga de todos los miembros
        $taskStats = Task::where('team_id', $teamId)
            ->where('status', '!=', 'completed')
            ->selectRaw('assigned_to, coalesce(sum(estimated_hours), 0) as total_hours')
            ->groupBy('assigned_to')
            ->get()
            ->keyBy('assigned_to');

        // Una query para todas las tareas pendientes de todos los proyectos activos
        $projectIds      = $activeProjects->pluck('id');
        $allPendingTasks = Task::whereIn('project_id', $projectIds)
            ->where('status', '!=', 'completed')
            ->select('id', 'title', 'priority', 'estimated_hours', 'assigned_to', 'project_id')
            ->get()
            ->groupBy('project_id');

        return $members->map(function ($member) use ($taskStats, $activeProjects, $allPendingTasks) {
            $stats = $taskStats->get($member->user_id);
            $base  = $this->computeMember($member, $stats ? (float) $stats->total_hours : 0);

            if ($base['workload_pct'] >= 40) {
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
                'name'           => $base['name'],
                'workload_pct'   => $base['workload_pct'],
                'assigned_hours' => $base['assigned_hours'],
                'capacity'       => $base['capacity'],
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
    }

    /**
     * Cálculo único de carga de un miembro (capacidad → pct → nivel). Evita la duplicación.
     */
    private function computeMember(TeamMember $member, float $hours): array
    {
        $capacity = (int) ($member->profile->weekly_hours_capacity ?? 40);
        $loadPct  = $capacity > 0 ? round($hours / $capacity * 100) : 100;

        return [
            'id'             => $member->user_id,
            'name'           => $member->profile->first_name . ' ' . $member->profile->last_name,
            'email'          => $member->profile->email,
            'assigned_hours' => $hours,
            'capacity'       => $capacity,
            'workload_pct'   => $loadPct,
            'workload_level' => $this->level->classify($loadPct),
        ];
    }
}
