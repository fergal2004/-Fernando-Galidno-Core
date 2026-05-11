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
            'email'      => 'required|email|unique:profiles,email',
            'first_name' => 'required|string|max:50',
            'last_name'  => 'required|string|max:50',
            'role'       => 'required|in:admin,member',
        ]);

        $profile = Profile::create($request->only(['first_name', 'last_name', 'email', 'role']));

        return response()->json($profile, 201);
    }

    public function show($id)
    {
        return response()->json(Profile::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $profile = Profile::findOrFail($id);

        $request->validate([
            'email'      => ['sometimes', 'email', Rule::unique('profiles', 'email')->ignore($id)],
            'first_name' => 'sometimes|string|max:50',
            'last_name'  => 'sometimes|string|max:50',
            'role'       => 'sometimes|in:admin,member',
        ]);

        $profile->update($request->only(['first_name', 'last_name', 'email', 'role']));

        return response()->json($profile);
    }

    public function destroy($id)
    {
        $profile = Profile::findOrFail($id);
        $profile->delete();

        return response()->json(['message' => 'Profile eliminado']);
    }
}
