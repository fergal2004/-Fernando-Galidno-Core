<?php

namespace App\Providers;

use App\Services\Workload\ThresholdLevelStrategy;
use App\Services\Workload\WorkloadLevelStrategy;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // DIP: el contenedor inyecta la estrategia; WorkloadService depende de la abstracción.
        $this->app->bind(WorkloadLevelStrategy::class, ThresholdLevelStrategy::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
