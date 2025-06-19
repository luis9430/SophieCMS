<?php
// app/Models/Template.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'content', // Blade template content
        'preview_image',
        'category',
        'is_active',
        'metadata' // JSON con configuraciones adicionales
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_active' => 'boolean',
    ];

    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }
}