<?php

use App\Http\Controllers\PracticeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\SkillController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\WorkloadController;
use Illuminate\Support\Facades\Route;

Route::middleware('supabase.auth')->group(function () {
    Route::apiResource('tasks', TaskController::class);
    Route::apiResource('profiles', ProfileController::class);

    Route::get('profiles/{id}/skills',  [ProfileController::class, 'skills']);
    Route::post('profiles/{id}/skills', [ProfileController::class, 'syncSkills']);

    Route::get('teams/{id}/members',             [TeamController::class, 'members']);
    Route::post('teams/{id}/members',            [TeamController::class, 'addMember']);
    Route::delete('teams/{id}/members/{userId}', [TeamController::class, 'removeMember']);
    Route::apiResource('teams', TeamController::class);

    Route::apiResource('practices', PracticeController::class);
    Route::apiResource('skills', SkillController::class);
    Route::apiResource('projects', ProjectController::class);

    Route::get('workload',     [WorkloadController::class, 'index']);
    Route::get('suggestions',  [WorkloadController::class, 'suggestions']);
});
