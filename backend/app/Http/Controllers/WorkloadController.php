<?php

namespace App\Http\Controllers;

use App\Services\WorkloadService;
use Illuminate\Http\Request;

class WorkloadController extends Controller
{
    public function __construct(private WorkloadService $service)
    {
    }

    public function index(Request $request)
    {
        $request->validate([
            'team_id'    => 'required|exists:teams,id',
            'start_date' => 'nullable|date',
            'end_date'   => 'nullable|date|after_or_equal:start_date',
        ]);

        return response()->json(
            $this->service->membersWorkload($request->team_id, $request->start_date, $request->end_date)
        );
    }

    public function suggestions(Request $request)
    {
        $request->validate([
            'team_id' => 'required|exists:teams,id',
        ]);

        return response()->json($this->service->suggestions($request->team_id));
    }
}
