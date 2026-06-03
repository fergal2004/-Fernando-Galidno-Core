<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Skill extends Model
{
    protected $table = 'skills';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'name',
        'practice_id',
    ];

    public function practice()
    {
        return $this->belongsTo(Practice::class);
    }

    public function profiles()
    {
        return $this->belongsToMany(Profile::class, 'user_skills', 'skill_id', 'user_id');
    }
}
