<?php

namespace App\Http\Controllers;

use App\Models\Practice;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PracticeController extends Controller
{
    public function index()
    {
        return response()->json(Practice::with('skills')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:100|unique:practices,name',
            'description' => 'nullable|string',
        ]);

        $practice = Practice::create($request->only(['name', 'description']));

        return response()->json($practice, 201);
    }

    public function show($id)
    {
        return response()->json(Practice::with('skills')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $practice = Practice::findOrFail($id);

        $request->validate([
            'name'        => ['sometimes', 'string', 'max:100', Rule::unique('practices', 'name')->ignore($id)],
            'description' => 'nullable|string',
        ]);

        $practice->update($request->only(['name', 'description']));

        return response()->json($practice);
    }

    public function destroy($id)
    {
        $practice = Practice::findOrFail($id);
        $practice->delete();

        return response()->json(['message' => 'Práctica eliminada']);
    }
}
