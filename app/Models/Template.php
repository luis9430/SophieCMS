<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'type', 'user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Scope para filtrar por usuario
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}