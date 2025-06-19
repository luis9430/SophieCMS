<?php

// app/Models/Website.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Website extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'domain',
        'slug',
        'description',
        'status',
        'language',
        'template_name',
        'settings',
        'structure',
        'is_active'
    ];

    protected $casts = [
        'settings' => 'array',
        'structure' => 'array',
        'is_active' => 'boolean',
    ];

    // Relaciones
    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }

    // Scopes
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Accessors
    public function getUrlAttribute()
    {
        $protocol = $this->settings['ssl_enabled'] ?? false ? 'https://' : 'http://';
        return $protocol . $this->domain;
    }
}
