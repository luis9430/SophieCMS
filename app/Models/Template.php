<?php

// ===================================================================
// app/Models/Template.php
// ACTUALIZADO - Con soporte para métodos Alpine
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
        // ✅ Nuevos campos para métodos Alpine
        'method_config',
        'method_template',
        'method_parameters',
        'trigger_syntax',
        'usage_count',
        'last_used_at',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_global' => 'boolean',
        'is_active' => 'boolean',
        // ✅ Nuevos casts para métodos Alpine
        'method_config' => 'array',
        'method_parameters' => 'array',
        'usage_count' => 'integer',
        'last_used_at' => 'datetime',
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
    // ✅ NUEVOS SCOPES PARA MÉTODOS ALPINE
    // ===================================================================

    /**
     * Solo métodos Alpine
     */
    public function scopeAlpineMethods(Builder $query): Builder
    {
        return $query->where('type', 'alpine_method');
    }

    /**
     * Métodos Alpine por sintaxis de trigger
     */
    public function scopeByTrigger(Builder $query, string $trigger): Builder
    {
        return $query->where('trigger_syntax', $trigger);
    }

    /**
     * Métodos Alpine más usados
     */
    public function scopeMostUsed(Builder $query, int $limit = 10): Builder
    {
        return $query->alpineMethods()
                    ->orderBy('usage_count', 'desc')
                    ->limit($limit);
    }

    /**
     * Métodos Alpine usados recientemente
     */
    public function scopeRecentlyUsed(Builder $query, int $days = 30): Builder
    {
        return $query->alpineMethods()
                    ->where('last_used_at', '>=', now()->subDays($days))
                    ->orderBy('last_used_at', 'desc');
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
            'alpine_method' => 'Método Alpine', // ✅ Nuevo tipo
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
            // ✅ Nuevas categorías para métodos Alpine
            'ui' => 'Interfaz de Usuario',
            'data' => 'Manejo de Datos',
            'animation' => 'Animaciones',
            'form' => 'Formularios',
            'utility' => 'Utilidades',
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
    // ✅ NUEVOS ACCESSORS PARA MÉTODOS ALPINE
    // ===================================================================

    /**
     * Verificar si es un método Alpine
     */
    public function getIsAlpineMethodAttribute(): bool
    {
        return $this->type === 'alpine_method';
    }

    /**
     * Obtener parámetros requeridos del método
     */
    public function getRequiredParametersAttribute(): array
    {
        if (!$this->is_alpine_method) return [];
        
        return collect($this->method_parameters ?? [])
            ->filter(fn($param) => !($param['optional'] ?? false))
            ->keys()
            ->toArray();
    }

    /**
     * Obtener parámetros opcionales del método
     */
    public function getOptionalParametersAttribute(): array
    {
        if (!$this->is_alpine_method) return [];
        
        return collect($this->method_parameters ?? [])
            ->filter(fn($param) => $param['optional'] ?? false)
            ->keys()
            ->toArray();
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
        $clone->usage_count = 0; // ✅ Reset contador de uso
        $clone->last_used_at = null; // ✅ Reset última vez usado
        $clone->save();
        
        return $clone;
    }

    /**
     * Validar variables requeridas (para templates HTML)
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
    // ✅ NUEVOS MÉTODOS PARA MÉTODOS ALPINE
    // ===================================================================

    /**
     * Incrementar contador de uso del método
     */
    public function incrementUsage(): self
    {
        if ($this->is_alpine_method) {
            $this->increment('usage_count');
            $this->update(['last_used_at' => now()]);
        }
        
        return $this;
    }

    /**
     * Validar parámetros del método Alpine
     */
    public function validateMethodParameters(array $parameters): array
    {
        if (!$this->is_alpine_method) return [];
        
        $errors = [];
        $required = $this->required_parameters;
        $schema = $this->method_parameters ?? [];
        
        // Verificar parámetros requeridos
        foreach ($required as $param) {
            if (!array_key_exists($param, $parameters)) {
                $errors[] = "Parameter '$param' is required";
            }
        }
        
        // Verificar tipos de parámetros
        foreach ($parameters as $key => $value) {
            if (isset($schema[$key]['type'])) {
                $expectedType = $schema[$key]['type'];
                if (!$this->validateParameterType($value, $expectedType)) {
                    $errors[] = "Parameter '$key' must be of type $expectedType";
                }
            }
        }
        
        return $errors;
    }

    /**
     * Generar código Alpine completo del método
     */
    public function generateAlpineCode(array $parameters = []): string
    {
        if (!$this->is_alpine_method) return '';
        
        // Merge con parámetros por defecto
        $params = $this->getDefaultParameters();
        $params = array_merge($params, $parameters);
        
        // Reemplazar placeholders en el template
        $template = $this->method_template;
        foreach ($params as $key => $value) {
            $placeholder = "{{" . $key . "}}";
            $template = str_replace($placeholder, json_encode($value), $template);
        }
        
        // Extraer nombre del método desde trigger_syntax (@timer -> timer)
        $methodName = ltrim($this->trigger_syntax, '@');
        
        return "Alpine.data('$methodName', () => ({\n    $template\n}))";
    }

    /**
     * Obtener parámetros por defecto del método
     */
    public function getDefaultParameters(): array
    {
        if (!$this->is_alpine_method) return [];
        
        return collect($this->method_parameters ?? [])
            ->mapWithKeys(fn($param, $key) => [$key => $param['default'] ?? null])
            ->filter(fn($value) => $value !== null)
            ->toArray();
    }

    /**
     * Validar tipo de parámetro
     */
    private function validateParameterType($value, string $expectedType): bool
    {
        return match($expectedType) {
            'string' => is_string($value),
            'number' => is_numeric($value),
            'boolean' => is_bool($value),
            'array' => is_array($value),
            'object' => is_object($value) || is_array($value),
            default => true // Tipo no reconocido, aceptar cualquier valor
        };
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
        'partial' => 'Fragmento',
        'alpine_method' => 'Método Alpine', // ✅ Nuevo tipo
    ];

    const CATEGORIES = [
        'structure' => 'Estructura',
        'navigation' => 'Navegación',
        'content' => 'Contenido',
        'marketing' => 'Marketing',
        'ecommerce' => 'E-commerce',
        'blog' => 'Blog',
        // ✅ Nuevas categorías para métodos Alpine
        'ui' => 'Interfaz de Usuario',
        'data' => 'Manejo de Datos',
        'animation' => 'Animaciones',
        'form' => 'Formularios',
        'utility' => 'Utilidades',
    ];

    // ✅ Constantes específicas para métodos Alpine
    const ALPINE_PARAMETER_TYPES = [
        'string' => 'Texto',
        'number' => 'Número',
        'boolean' => 'Verdadero/Falso',
        'array' => 'Lista',
        'object' => 'Objeto',
    ];
}