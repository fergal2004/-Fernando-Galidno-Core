<?php

namespace App\Http\Controllers;

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

        $membersData = $members->map(function ($member) use ($request) {
            $query = Task::where('assigned_to', $member->user_id)
                ->where('team_id', $request->team_id)
                ->where('status', '!=', 'completed');

            if ($request->start_date && $request->end_date) {
                $query->whereBetween('due_date', [$request->start_date, $request->end_date]);
            }

            $stats = $query->selectRaw('count(*) as total_tasks, coalesce(sum(estimated_hours), 0) as total_hours')
                ->first();

            $hours = (float) $stats->total_hours;

            return [
                'id'             => $member->user_id,
                'name'           => $member->profile->first_name . ' ' . $member->profile->last_name,
                'email'          => $member->profile->email,
                'tasks_count'    => (int) $stats->total_tasks,
                'assigned_hours' => $hours,
                'workload_level' => $hours <= 15 ? 'low' : ($hours <= 30 ? 'medium' : 'high'),
            ];
        });

        $totalHours = $membersData->sum('assigned_hours');
        $totalTasks = $membersData->sum('tasks_count');
        $count      = $membersData->count();

        $suggested = $membersData->isNotEmpty()
            ? $membersData->sortBy('total_hours')->first()
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
}
