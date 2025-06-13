<?php

// ===================================================================
// app/Models/Template.php
// ===================================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'content',
        'variables',
        'description',
        'category',
        'is_global',
        'is_active',
        'user_id',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_global' => 'boolean',
        'is_active' => 'boolean',
    ];

    // ===================================================================
    // RELATIONSHIPS
    // ===================================================================

    /**
     * Template pertenece a un usuario (si no es global)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Páginas que usan este template como layout
     */
    public function pagesAsLayout(): HasMany
    {
        return $this->hasMany(Page::class, 'layout_id');
    }

    // ===================================================================
    // SCOPES
    // ===================================================================

    /**
     * Solo templates activos
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Solo templates globales
     */
    public function scopeGlobal(Builder $query): Builder
    {
        return $query->where('is_global', true);
    }

    /**
     * Templates de un usuario específico
     */
    public function scopeForUser(Builder $query, $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Templates por tipo
     */
    public function scopeOfType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Templates por categoría
     */
    public function scopeInCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * Templates disponibles para un usuario (globales + propios)
     */
    public function scopeAvailableForUser(Builder $query, $userId): Builder
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('is_global', true)
              ->orWhere('user_id', $userId);
        })->active();
    }

    // ===================================================================
    // ACCESSORS & MUTATORS
    // ===================================================================

    /**
     * Obtener el nombre del tipo formateado
     */
    public function getTypeNameAttribute(): string
    {
        return match($this->type) {
            'layout' => 'Layout',
            'header' => 'Header',
            'footer' => 'Footer',
            'sidebar' => 'Sidebar',
            'nav' => 'Navegación',
            'component' => 'Componente',
            'partial' => 'Partial',
            default => ucfirst($this->type)
        };
    }

    /**
     * Obtener el nombre de la categoría formateado
     */
    public function getCategoryNameAttribute(): string
    {
        return match($this->category) {
            'structure' => 'Estructura',
            'navigation' => 'Navegación',
            'content' => 'Contenido',
            'marketing' => 'Marketing',
            'ecommerce' => 'E-commerce',
            'blog' => 'Blog',
            default => ucfirst($this->category ?? 'General')
        };
    }

    /**
     * Verificar si el template requiere variables específicas
     */
    public function getRequiredVariablesAttribute(): array
    {
        return $this->variables['required'] ?? [];
    }

    /**
     * Verificar si el template acepta variables opcionales
     */
    public function getOptionalVariablesAttribute(): array
    {
        return $this->variables['optional'] ?? [];
    }

    // ===================================================================
    // METHODS
    // ===================================================================

    /**
     * Verificar si el usuario puede usar este template
     */
    public function canBeUsedByUser($userId): bool
    {
        return $this->is_global || $this->user_id == $userId;
    }

    /**
     * Verificar si el template está siendo usado
     */
    public function isInUse(): bool
    {
        return $this->pagesAsLayout()->exists();
    }

    /**
     * Clonar template para un usuario
     */
    public function cloneForUser($userId): self
    {
        $clone = $this->replicate();
        $clone->user_id = $userId;
        $clone->is_global = false;
        $clone->name = $this->name . ' (Copia)';
        $clone->save();
        
        return $clone;
    }

    /**
     * Validar variables requeridas
     */
    public function validateVariables(array $variables): array
    {
        $missing = [];
        foreach ($this->required_variables as $required) {
            if (!isset($variables[$required])) {
                $missing[] = $required;
            }
        }
        return $missing;
    }

    // ===================================================================
    // CONSTANTS
    // ===================================================================

    const TYPES = [
        'layout' => 'Layout completo',
        'header' => 'Cabecera',
        'footer' => 'Pie de página',
        'sidebar' => 'Barra lateral',
        'nav' => 'Navegación',
        'component' => 'Componente',
        'partial' => 'Fragmento'
    ];

    const CATEGORIES = [
        'structure' => 'Estructura',
        'navigation' => 'Navegación',
        'content' => 'Contenido',
        'marketing' => 'Marketing',
        'ecommerce' => 'E-commerce',
        'blog' => 'Blog'
    ];
}
