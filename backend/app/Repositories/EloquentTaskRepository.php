<?php

namespace App\Repositories;

use App\Models\Task;
use Illuminate\Support\Collection;

class EloquentTaskRepository implements TaskRepository
{
    private const RELATIONS = ['assignee', 'team', 'project'];

    public function search(array $filters): Collection
    {
        return Task::with(self::RELATIONS)
            ->when($filters['team_id'] ?? null, fn ($q, $v) => $q->where('team_id', $v))
            ->when($filters['assigned_to'] ?? null, fn ($q, $v) => $q->where('assigned_to', $v))
            ->when(
                ($filters['start_date'] ?? null) && ($filters['end_date'] ?? null),
                fn ($q) => $q->whereBetween('due_date', [$filters['start_date'], $filters['end_date']])
            )
            ->get();
    }

    public function findOrFail(string $id): Task
    {
        return Task::with(self::RELATIONS)->findOrFail($id);
    }

    public function create(array $data): Task
    {
        return Task::create($data)->load(self::RELATIONS);
    }

    public function update(Task $task, array $data): Task
    {
        $task->update($data);

        return $task->load(self::RELATIONS);
    }

    public function delete(Task $task): void
    {
        $task->delete();
    }
}