<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Team extends Model
{
    protected $table = 'teams';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'description',
    ];

    public function teamMembers()
    {
        return $this->hasMany(TeamMember::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
