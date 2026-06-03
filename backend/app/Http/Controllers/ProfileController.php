<?php

namespace App\Http\Controllers;

use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function index()
    {
        return response()->json(Profile::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'email'                 => 'required|email|unique:profiles,email',
            'first_name'            => 'required|string|max:50',
            'last_name'             => 'required|string|max:50',
            'role'                  => 'required|in:admin,member',
            'weekly_hours_capacity' => 'sometimes|integer|min:1|max:80',
        ]);

        $profile = Profile::create($request->only([
            'first_name', 'last_name', 'email', 'role', 'weekly_hours_capacity',
        ]));

        return response()->json($profile, 201);
    }

    public function show($id)
    {
        return response()->json(Profile::with('skills.practice')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $profile = Profile::findOrFail($id);

        $request->validate([
            'email'                 => ['sometimes', 'email', Rule::unique('profiles', 'email')->ignore($id)],
            'first_name'            => 'sometimes|string|max:50',
            'last_name'             => 'sometimes|string|max:50',
            'role'                  => 'sometimes|in:admin,member',
            'weekly_hours_capacity' => 'sometimes|integer|min:1|max:80',
        ]);

        $profile->update($request->only([
            'first_name', 'last_name', 'email', 'role', 'weekly_hours_capacity',
        ]));

        return response()->json($profile);
    }

    public function destroy($id)
    {
        $profile = Profile::findOrFail($id);
        $profile->delete();

        return response()->json(['message' => 'Profile eliminado']);
    }

    public function skills($id)
    {
        $profile = Profile::with('skills.practice')->findOrFail($id);

        return response()->json($profile->skills);
    }

    public function syncSkills(Request $request, $id)
    {
        $profile = Profile::findOrFail($id);

        $request->validate([
            'skill_ids'   => 'present|array',
            'skill_ids.*' => 'exists:skills,id',
        ]);

        $profile->skills()->sync($request->skill_ids);

        return response()->json($profile->skills()->with('practice')->get());
    }
}
