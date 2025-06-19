<?php
// app/Models/PageComponent.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageComponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'page_id',
        'component_id',
        'config', // JSON con la configuración específica del componente
        'order',
        'parent_id', // Para componentes anidados
        'is_visible'
    ];

    protected $casts = [
        'config' => 'array',
        'is_visible' => 'boolean',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(Component::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(PageComponent::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(PageComponent::class, 'parent_id')->orderBy('order');
    }
}