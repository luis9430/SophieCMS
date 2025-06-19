<?php 
// app/Models/Component.php  
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Component extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'identifier', // hero, card, button, etc.
        'category', // layout, content, interactive
        'description',
        'blade_template',
        'default_config', // JSON con configuración por defecto
        'preview_image',
        'is_active'
    ];

    protected $casts = [
        'default_config' => 'array',
        'is_active' => 'boolean',
    ];
}
