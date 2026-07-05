<?php

namespace App\Repositories;

use App\Models\Task;
use Illuminate\Support\Collection;

/**
 * Patrón Repository (DIP): el controller depende de esta abstracción,
 * no de Eloquent. Cambiar el origen de datos = nueva implementación.
 */
interface TaskRepository
{
    /** Filtros soportados: team_id, assigned_to, start_date + end_date. */
    public function search(array $filters): Collection;

    public function findOrFail(string $id): Task;

    public function create(array $data): Task;

    public function update(Task $task, array $data): Task;

    public function delete(Task $task): void;
}