<?php

// app/Models/GlobalVariable.php (ACTUALIZADO con soporte para colores)

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Services\TailwindColorService;

class GlobalVariable extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'value',
        'type',
        'category',
        'description',
        'metadata',
        'created_by_user_id',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relationship con el usuario que creó la variable
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Scope para variables activas
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para filtrar por categoría
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope para variables de design tokens
     */
    public function scopeDesignTokens($query)
    {
        return $query->whereIn('type', ['color_palette', 'typography_system']);
    }

    /**
     * Obtener el valor parseado según el tipo
     */
    public function getParsedValueAttribute()
    {
        switch ($this->type) {
            case 'number':
                return (float) $this->value;
            case 'boolean':
                return filter_var($this->value, FILTER_VALIDATE_BOOLEAN);
            case 'array':
                return $this->parseArrayValue($this->value);
            case 'color_palette':
            case 'typography_system':
                return $this->value; // Para design tokens, devolver el valor base
            default:
                return $this->value;
        }
    }

    /**
     * Obtener la paleta completa de colores (solo para tipo 'color')
     */
    public function getColorPaletteAttribute()
    {
        if ($this->type !== 'color') {
            return null;
        }

        return $this->metadata['tailwind_shades'] ?? [];
    }

    /**
     * Obtener variables CSS generadas (solo para tipo 'color')
     */
    public function getCssVariablesAttribute()
    {
        if ($this->type !== 'color') {
            return [];
        }

        return $this->metadata['css_variables'] ?? [];
    }

    /**
     * Obtener clases Tailwind generadas (solo para tipo 'color')
     */
    public function getTailwindClassesAttribute()
    {
        if ($this->type !== 'color' || !$this->color_palette) {
            return [];
        }

        $paletteName = $this->metadata['palette_name'] ?? $this->name;
        return TailwindColorService::generateTailwindClasses($paletteName, $this->color_palette);
    }

    /**
     * Parsear valor de array
     */
    protected function parseArrayValue($arrayString)
    {
        // Si está vacío, devolver array vacío
        if (empty($arrayString)) {
            return [];
        }

        try {
            // Intentar parsear como JSON
            if (str_starts_with(trim($arrayString), '[') && str_ends_with(trim($arrayString), ']')) {
                $decoded = json_decode($arrayString, true);
                return is_array($decoded) ? $decoded : [];
            }

            // Si no es JSON, dividir por comas
            return array_map('trim', explode(',', $arrayString));
        } catch (\Exception $e) {
            // En caso de error, dividir por comas
            return array_map('trim', explode(',', $arrayString));
        }
    }

    /**
     * Validar nombre de variable
     */
    public static function validateVariableName($name)
    {
        // Solo letras, números y underscore, no puede empezar con número
        return preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $name);
    }

    /**
     * Obtener todas las variables como array asociativo para Blade
     */
    public static function getAllForBlade()
    {
        $variables = static::active()->get();
        $result = [];

        foreach ($variables as $variable) {
            // Variables normales
            $result[$variable->name] = $variable->parsed_value;

            // Variables de color: agregar todas las variaciones
            if ($variable->type === 'color' && $variable->color_palette) {
                $paletteName = $variable->metadata['palette_name'] ?? $variable->name;
                
                // Agregar cada shade como variable separada
                foreach ($variable->color_palette as $shade => $color) {
                    $result["{$paletteName}_{$shade}"] = $color;
                }

                // Agregar variables CSS
                foreach ($variable->css_variables as $cssVar => $value) {
                    $cleanName = str_replace(['--color-', '-'], ['', '_'], $cssVar);
                    $result[$cleanName] = $value;
                }
            }
        }

        return $result;
    }

    /**
     * Obtener CSS completo para inyectar en preview
     */
    public static function getAllCssForPreview()
    {
        $colorVariables = static::active()->colors()->get();
        $css = ":root {\n";

        foreach ($colorVariables as $variable) {
            if ($variable->css_variables) {
                foreach ($variable->css_variables as $cssVar => $value) {
                    $css .= "  {$cssVar}: {$value};\n";
                }
            }
        }

        $css .= "}\n\n";

        // Agregar clases Tailwind personalizadas
        foreach ($colorVariables as $variable) {
            if ($variable->tailwind_classes) {
                foreach ($variable->tailwind_classes as $className => $rule) {
                    $css .= ".{$className} { {$rule} }\n";
                }
            }
        }

        return $css;
    }

    /**
     * Crear o actualizar variable
     */
    public static function createOrUpdate($name, $value, $type = 'string', $category = 'custom', $metadata = null, $userId = null)
    {
        // Validar nombre
        if (!static::validateVariableName($name)) {
            throw new \InvalidArgumentException('Invalid variable name format');
        }

        $data = [
            'value' => $value,
            'type' => $type,
            'category' => $category,
            'created_by_user_id' => $userId ?: auth()->id(),
            'is_active' => true
        ];

        if ($metadata) {
            $data['metadata'] = $metadata;
        }

        return static::updateOrCreate(['name' => $name], $data);
    }

    /**
     * Crear variable de color con paleta automática
     */
    public static function createColorVariable($name, $baseColor, $paletteName = null, $baseShade = 500, $userId = null)
    {
        // Generar paleta completa
        $palette = TailwindColorService::generatePalette($baseColor, $baseShade);
        
        // Generar variables CSS
        $cssVars = TailwindColorService::generateCssVariables($paletteName ?: $name, $palette);

        // Calcular información de accesibilidad
        $contrastRatio = TailwindColorService::getContrastRatio($palette['500'], '#FFFFFF');
        $wcagCompliant = TailwindColorService::isWcagCompliant($palette['500'], '#FFFFFF');

        $metadata = [
            'palette_name' => $paletteName ?: $name,
            'base_shade' => (string) $baseShade,
            'tailwind_shades' => $palette,
            'css_variables' => $cssVars,
            'accessibility' => [
                'contrast_ratio' => round($contrastRatio, 2),
                'wcag_compliant' => $wcagCompliant
            ],
            'generated_at' => now()->toISOString()
        ];

        return static::createOrUpdate($name, $baseColor, 'color', 'design', $metadata, $userId);
    }

    /**
     * Obtener categorías disponibles con sus metadatos (ACTUALIZADO)
     */
    public static function getCategories()
    {
        return [
            'design' => [
                'label' => 'Diseño',
                'icon' => '🎨',
                'description' => 'Colores, fuentes, espaciados'
            ],
            'content' => [
                'label' => 'Contenido',
                'icon' => '📝',
                'description' => 'Textos, títulos, descripciones'
            ],
            'site' => [
                'label' => 'Sitio',
                'icon' => '⚙️',
                'description' => 'Configuración general del sitio'
            ],
            'media' => [
                'label' => 'Media',
                'icon' => '🖼️',
                'description' => 'Imágenes, videos, assets'
            ],
            'seo' => [
                'label' => 'SEO',
                'icon' => '🔍',
                'description' => 'Meta tags, analytics, structured data'
            ],
            'social' => [
                'label' => 'Social',
                'icon' => '📱',
                'description' => 'Redes sociales, compartir'
            ],
            'api' => [
                'label' => 'API',
                'icon' => '🔗',
                'description' => 'Endpoints, integraciones'
            ],
            'custom' => [
                'label' => 'Personalizado',
                'icon' => '✨',
                'description' => 'Variables personalizadas'
            ]
        ];
    }

    /**
     * Obtener conteo de variables por categoría
     */
    public static function getCategoryCounts()
    {
        return static::active()
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category')
            ->toArray();
    }

    /**
     * Obtener variables agrupadas por categoría
     */
    public static function getGroupedByCategory()
    {
        return static::active()
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->groupBy('category');
    }

    /**
     * Obtener todas las paletas de colores
     */
    public static function getColorPalettes()
    {
        return static::active()
            ->colors()
            ->get()
            ->mapWithKeys(function ($variable) {
                $paletteName = $variable->metadata['palette_name'] ?? $variable->name;
                return [$paletteName => $variable->color_palette];
            });
    }
}