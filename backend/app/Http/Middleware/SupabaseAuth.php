<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SupabaseAuth
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Token no proporcionado'], 401);
        }

        try {
            $supabaseUrl = env('SUPABASE_URL');
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $token,
                'apikey' => env('SUPABASE_ANON_KEY'),
            ])->get($supabaseUrl . '/auth/v1/user');

            if ($response->failed()) {
                return response()->json(['error' => 'Token inválido'], 401);
            }

            $user = $response->json();
            $request->merge(['user_id' => $user['id']]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error de autenticación'], 401);
        }

        return $next($request);
    }
}