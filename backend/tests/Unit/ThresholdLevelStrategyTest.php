<?php

namespace Tests\Unit;

use App\Services\Workload\ThresholdLevelStrategy;
use PHPUnit\Framework\TestCase;

class ThresholdLevelStrategyTest extends TestCase
{
    public function test_classifies_by_threshold(): void
    {
        $s = new ThresholdLevelStrategy();

        $this->assertSame('low', $s->classify(39));
        $this->assertSame('medium', $s->classify(40));
        $this->assertSame('medium', $s->classify(70));
        $this->assertSame('high', $s->classify(71));
    }
}
