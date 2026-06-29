<?php

namespace App\Services\Workload;

/**
 * Estrategia por umbrales fijos: < 40 low · <= 70 medium · resto high.
 */
class ThresholdLevelStrategy implements WorkloadLevelStrategy
{
    public function classify(float $workloadPct): string
    {
        return match (true) {
            $workloadPct < 40  => 'low',
            $workloadPct <= 70 => 'medium',
            default            => 'high',
        };
    }
}
