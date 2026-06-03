<?php

namespace App\Http\Controllers;

use App\Models\Skill;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SkillController extends Controller
{
    public function index()
    {
        return response()->json(Skill::with('practice')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'        => 'required|string|max:100|unique:skills,name',
            'practice_id' => 'nullable|exists:practices,id',
        ]);

        $skill = Skill::create($request->only(['name', 'practice_id']));

        return response()->json($skill->load('practice'), 201);
    }

    public function show($id)
    {
        return response()->json(Skill::with('practice')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $skill = Skill::findOrFail($id);

        $request->validate([
            'name'        => ['sometimes', 'string', 'max:100', Rule::unique('skills', 'name')->ignore($id)],
            'practice_id' => 'nullable|exists:practices,id',
        ]);

        $skill->update($request->only(['name', 'practice_id']));

        return response()->json($skill->load('practice'));
    }

    public function destroy($id)
    {
        $skill = Skill::findOrFail($id);
        $skill->delete();

        return response()->json(['message' => 'Skill eliminada']);
    }
}
