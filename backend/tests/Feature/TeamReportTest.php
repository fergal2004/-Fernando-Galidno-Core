<?php

namespace Tests\Feature;

/**
 * Prueba funcional 2: GET /api/reports/team/{id} — objeto JSON del reporte
 * (nueva funcionalidad API del examen).
 */
class TeamReportTest extends ApiTestCase
{
    public function test_report_returns_expected_json_object(): void
    {
        $teamId  = $this->seedTeam('Equipo Desarrollo');
        $ocupado = $this->seedProfile('Juan', 'Ocupado', 40);   // 34h / 40h → high
        $libre   = $this->seedProfile('Michel', 'Libre', 30);   // 5h / 30h → low
        $this->addMember($teamId, $ocupado);
        $this->addMember($teamId, $libre);

        $this->seedTask($teamId, $ocupado, 34, 'in_progress', 'high');
        $this->seedTask($teamId, $libre, 5, 'pending', 'low');
        $this->seedTask($teamId, $ocupado, 10, 'completed');

        $response = $this->getJson("/api/reports/team/{$teamId}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'team'    => ['id', 'name', 'description'],
                'summary' => ['total_tasks', 'total_hours', 'average_hours', 'by_status', 'by_priority'],
                'members' => [['id', 'name', 'email', 'assigned_hours', 'capacity', 'workload_pct', 'workload_level']],
                'suggested_assignee',
                'generated_at',
            ])
            ->assertJsonPath('team.name', 'Equipo Desarrollo')
            ->assertJsonPath('summary.total_tasks', 2)          // completadas no cuentan
            ->assertJsonPath('suggested_assignee.id', $libre);  // menor carga

        $members = collect($response->json('members'))->keyBy('id');
        $this->assertSame('high', $members[$ocupado]['workload_level']); // 85%
        $this->assertSame('low', $members[$libre]['workload_level']);    // 17%
    }

    public function test_report_returns_404_for_unknown_team(): void
    {
        $response = $this->getJson('/api/reports/team/00000000-0000-0000-0000-000000000000');

        $response->assertStatus(404);
    }
}