<?php

namespace App\Services\Workload;

/**
 * Strategy (GoF) — clasifica un porcentaje de carga en un nivel.
 * Permite OCP: cambiar las reglas de nivel = nueva implementación, sin tocar WorkloadService.
 */
interface WorkloadLevelStrategy
{
    public function classify(float $workloadPct): string;
}
