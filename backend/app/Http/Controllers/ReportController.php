<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Team;
use App\Services\WorkloadService;

/**
 * Reporte de equipo en JSON — compone WorkloadService (Service Layer).
 */
class ReportController extends Controller
{
    public function __construct(private WorkloadService $workload)
    {
    }

    public function team(string $id)
    {
        $team = Team::findOrFail($id);

        $workload = $this->workload->membersWorkload($id, null, null);

        $byStatus = Task::where('team_id', $id)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $byPriority = Task::where('team_id', $id)
            ->selectRaw('priority, count(*) as total')
            ->groupBy('priority')
            ->pluck('total', 'priority');

        return response()->json([
            'team' => [
                'id'          => $team->id,
                'name'        => $team->name,
                'description' => $team->description,
            ],
            'summary' => $workload['summary'] + [
                'by_status'   => $byStatus,
                'by_priority' => $byPriority,
            ],
            'members'            => $workload['members'],
            'suggested_assignee' => $workload['suggested_assignee'],
            'generated_at'       => now()->toIso8601String(),
        ]);
    }
}