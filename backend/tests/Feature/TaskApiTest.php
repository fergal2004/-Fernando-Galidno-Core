<?php

namespace Tests\Feature;

/**
 * Prueba funcional 1: POST /api/tasks — validación de negocio
 * "el asignado debe pertenecer al equipo" (Rule AssignedToBelongsToTeam).
 */
class TaskApiTest extends ApiTestCase
{
    public function test_store_rejects_assignee_outside_team(): void
    {
        $teamId   = $this->seedTeam();
        $member   = $this->seedProfile('Ana', 'Miembro');
        $outsider = $this->seedProfile('Beto', 'Externo');
        $this->addMember($teamId, $member);

        $response = $this->postJson('/api/tasks', [
            'title'           => 'Tarea inválida',
            'priority'        => 'high',
            'estimated_hours' => 5,
            'team_id'         => $teamId,
            'assigned_to'     => $outsider,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['assigned_to']);

        $this->assertDatabaseCount('tasks', 0);
    }

    public function test_store_creates_task_for_team_member(): void
    {
        $teamId = $this->seedTeam();
        $member = $this->seedProfile('Ana', 'Miembro');
        $this->addMember($teamId, $member);

        $response = $this->postJson('/api/tasks', [
            'title'           => 'Implementar reporte',
            'priority'        => 'medium',
            'estimated_hours' => 8,
            'team_id'         => $teamId,
            'assigned_to'     => $member,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('title', 'Implementar reporte')
            ->assertJsonPath('status', 'pending');

        $this->assertDatabaseHas('tasks', [
            'title'       => 'Implementar reporte',
            'assigned_to' => $member,
        ]);
    }
}