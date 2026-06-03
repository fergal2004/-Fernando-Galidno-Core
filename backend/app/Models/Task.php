<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'title',
        'description',
        'status',
        'due_date',
        'user_id',
        'priority',
        'estimated_hours',
        'assigned_to',
        'created_by',
        'team_id',
        'project_id',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee()
    {
        return $this->belongsTo(Profile::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(Profile::class, 'created_by');
    }

    public function team()
    {
        return $this->belongsTo(Team::class);
    }
}