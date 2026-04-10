<?php

use App\Http\Controllers\TaskController;
use Illuminate\Support\Facades\Route;

Route::middleware('supabase.auth')->group(function () {
    Route::apiResource('tasks', TaskController::class);
});