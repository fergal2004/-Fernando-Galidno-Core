<?php

namespace Tests\Feature;

use App\Http\Middleware\SupabaseAuth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Base para pruebas funcionales de la API: esquema mínimo en sqlite :memory:
 * (el esquema real vive en Supabase) y bypass del middleware de auth.
 */
abstract class ApiTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware(SupabaseAuth::class);
        $this->createSchema();
    }

    private function createSchema(): void
    {
        Schema::create('profiles', function ($t) {
            $t->string('id')->primary();
            $t->string('first_name');
            $t->string('last_name');
            $t->string('email');
            $t->string('role')->default('member');
            $t->integer('weekly_hours_capacity')->default(40);
            $t->timestamps();
        });

        Schema::create('teams', function ($t) {
            $t->string('id')->primary();
            $t->string('name');
            $t->text('description')->nullable();
            $t->timestamps();
        });

        Schema::create('team_members', function ($t) {
            $t->string('id')->primary();
            $t->string('team_id');
            $t->string('user_id');
            $t->timestamp('joined_at')->nullable();
        });

        Schema::create('projects', function ($t) {
            $t->string('id')->primary();
            $t->string('name');
            $t->text('description')->nullable();
            $t->string('practice_id')->nullable();
            $t->string('team_id')->nullable();
            $t->string('status')->default('active');
            $t->timestamps();
        });

        Schema::create('tasks', function ($t) {
            $t->string('id')->primary();
            $t->string('title');
            $t->text('description')->nullable();
            $t->string('status')->default('pending');
            $t->string('priority')->default('medium');
            $t->decimal('estimated_hours')->default(0);
            $t->date('due_date')->nullable();
            $t->string('user_id')->nullable();
            $t->string('assigned_to')->nullable();
            $t->string('created_by')->nullable();
            $t->string('team_id')->nullable();
            $t->string('project_id')->nullable();
            $t->timestamps();
        });
    }

    protected function seedProfile(string $firstName = 'Ana', string $lastName = 'Prueba', int $capacity = 40): string
    {
        $id = (string) Str::uuid();

        DB::table('profiles')->insert([
            'id'                    => $id,
            'first_name'            => $firstName,
            'last_name'             => $lastName,
            'email'                 => Str::uuid() . '@test.com',
            'weekly_hours_capacity' => $capacity,
        ]);

        return $id;
    }

    protected function seedTeam(string $name = 'Equipo Test'): string
    {
        $id = (string) Str::uuid();
        DB::table('teams')->insert(['id' => $id, 'name' => $name]);

        return $id;
    }

    protected function addMember(string $teamId, string $profileId): void
    {
        DB::table('team_members')->insert([
            'id'      => (string) Str::uuid(),
            'team_id' => $teamId,
            'user_id' => $profileId,
        ]);
    }

    protected function seedTask(string $teamId, string $assignedTo, float $hours, string $status = 'pending', string $priority = 'medium'): void
    {
        DB::table('tasks')->insert([
            'id'              => (string) Str::uuid(),
            'title'           => 'Tarea ' . Str::random(5),
            'status'          => $status,
            'priority'        => $priority,
            'estimated_hours' => $hours,
            'team_id'         => $teamId,
            'assigned_to'     => $assignedTo,
        ]);
    }
}