<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\AsArrayObject; // O AsCollection para Laravel >= 9

class Website extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'language',
        'target_content_type',
        'structure',
        'status',
    ];

   protected $casts = [
    'structure' => 'array', // o 'object'
];


}