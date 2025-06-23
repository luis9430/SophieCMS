<?php

// app/Services/DesignSystemService.php
// Sistema completo de Design Tokens en PHP puro (~200 líneas)

namespace App\Services;

use App\Models\GlobalVariable;

class DesignSystemService
{
    /**
     * Generar paleta de colores completa usando curvas de Tailwind
     */
    public static function generateColorPalette(string $baseColor, string $name = 'primary'): array
    {
        // Usar el servicio existente pero con mejoras
        $palette = TailwindColorService::generatePalette($baseColor);
        
        return [
            'type' => 'color_palette',
            'name' => $name,
            'base_color' => $baseColor,
            'shades' => $palette,
            'css_variables' => self::colorPaletteToCssVars($name, $palette),
            'tailwind_classes' => self::colorPaletteToTailwindClasses($name, $palette)
        ];
    }

    /**
     * Generar sistema de tipografía completo
     */
    public static function generateTypographySystem(string $primaryFont, string $secondaryFont = null): array
    {
        $secondaryFont = $secondaryFont ?: 'ui-serif, Georgia, serif';
        
        // Escala tipográfica basada en ratios musicales (muy usada en design systems)
        $typeScale = self::generateTypeScale();
        
        return [
            'type' => 'typography_system',
            'fonts' => [
                'primary' => self::normalizeFontFamily($primaryFont),
                'secondary' => self::normalizeFontFamily($secondaryFont),
                'mono' => 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            ],
            'sizes' => $typeScale,
            'weights' => [
                'light' => '300',
                'normal' => '400',
                'medium' => '500',
                'semibold' => '600',
                'bold' => '700',
                'extrabold' => '800'
            ],
            'line_heights' => [
                'tight' => '1.25',
                'snug' => '1.375', 
                'normal' => '1.5',
                'relaxed' => '1.625',
                'loose' => '2'
            ],
            'css_variables' => self::typographyToCssVars($primaryFont, $secondaryFont, $typeScale),
        ];
    }

    /**
     * Escala tipográfica basada en ratio áureo (1.618) y ratios musicales
     */
    private static function generateTypeScale(float $baseSize = 1.0, string $ratio = 'golden'): array
    {
        $ratios = [
            'minor-second' => 1.067,
            'major-second' => 1.125,
            'minor-third' => 1.2,
            'major-third' => 1.25,
            'perfect-fourth' => 1.333,
            'golden' => 1.618
        ];

        $multiplier = $ratios[$ratio] ?? $ratios['golden'];
        
        return [
            'xs' => round($baseSize / ($multiplier * $multiplier), 3) . 'rem',        // ~0.618rem
            'sm' => round($baseSize / $multiplier, 3) . 'rem',                       // ~0.875rem  
            'base' => $baseSize . 'rem',                                             // 1rem
            'lg' => round($baseSize * $multiplier, 3) . 'rem',                      // ~1.125rem
            'xl' => round($baseSize * ($multiplier * $multiplier), 3) . 'rem',     // ~1.25rem
            '2xl' => round($baseSize * pow($multiplier, 3), 3) . 'rem',            // ~1.5rem
            '3xl' => round($baseSize * pow($multiplier, 4), 3) . 'rem',            // ~1.875rem
            '4xl' => round($baseSize * pow($multiplier, 5), 3) . 'rem',            // ~2.25rem
            '5xl' => round($baseSize * pow($multiplier, 6), 3) . 'rem',            // ~3rem
            '6xl' => round($baseSize * pow($multiplier, 7), 3) . 'rem',            // ~3.75rem
        ];
    }

    /**
     * Normalizar nombres de fuentes para CSS
     */
    private static function normalizeFontFamily(string $font): string
    {
        // Si ya incluye fallbacks, usar tal como está
        if (strpos($font, ',') !== false) {
            return $font;
        }

        // Agregar comillas si es necesario y fallbacks inteligentes
        $needsQuotes = strpos($font, ' ') !== false && !preg_match('/^["\']/', $font);
        $fontFamily = $needsQuotes ? "'{$font}'" : $font;

        // Agregar fallbacks inteligentes basados en el tipo de fuente
        $sansSerifFonts = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins'];
        $serifFonts = ['Playfair Display', 'Merriweather', 'Lora', 'Crimson Text'];
        
        if (in_array($font, $sansSerifFonts)) {
            return $fontFamily . ', ui-sans-serif, system-ui, sans-serif';
        } elseif (in_array($font, $serifFonts)) {
            return $fontFamily . ', ui-serif, Georgia, serif';
        } else {
            // Default a sans-serif
            return $fontFamily . ', ui-sans-serif, system-ui, sans-serif';
        }
    }

    /**
     * Convertir paleta de colores a CSS custom properties
     */
    private static function colorPaletteToCssVars(string $name, array $palette): array
    {
        $cssVars = [];
        
        // Variable principal (shade 500)
        $cssVars["--color-{$name}"] = $palette['500'];
        
        // RGB para transparencias
        $rgb = TailwindColorService::hexToRgb($palette['500']);
        $cssVars["--color-{$name}-rgb"] = implode(', ', $rgb);
        
        // Variables por shade
        foreach ($palette as $shade => $color) {
            $cssVars["--color-{$name}-{$shade}"] = $color;
            $rgb = TailwindColorService::hexToRgb($color);
            $cssVars["--color-{$name}-{$shade}-rgb"] = implode(', ', $rgb);
        }

        return $cssVars;
    }

    /**
     * Convertir paleta a clases Tailwind (para usar con @apply)
     */
    private static function colorPaletteToTailwindClasses(string $name, array $palette): array
    {
        $classes = [];
        
        foreach ($palette as $shade => $color) {
            $className = "{$name}-{$shade}";
            $classes[$className] = $color;
        }

        return $classes;
    }

    /**
     * Convertir tipografía a CSS custom properties
     */
    private static function typographyToCssVars(string $primary, string $secondary, array $sizes): array
    {
        $cssVars = [];
        
        // Fuentes
        $cssVars['--font-primary'] = self::normalizeFontFamily($primary);
        $cssVars['--font-secondary'] = self::normalizeFontFamily($secondary);
        $cssVars['--font-mono'] = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        
        // Tamaños
        foreach ($sizes as $size => $value) {
            $cssVars["--text-{$size}"] = $value;
        }
        
        // Weights
        $weights = ['light' => '300', 'normal' => '400', 'medium' => '500', 'semibold' => '600', 'bold' => '700'];
        foreach ($weights as $weight => $value) {
            $cssVars["--font-{$weight}"] = $value;
        }
        
        // Line heights
        $lineHeights = ['tight' => '1.25', 'normal' => '1.5', 'relaxed' => '1.625'];
        foreach ($lineHeights as $height => $value) {
            $cssVars["--leading-{$height}"] = $value;
        }

        return $cssVars;
    }

    /**
     * Crear variable de color en la base de datos
     */
    public static function createColorVariable(string $name, string $baseColor, string $paletteName = null): GlobalVariable
    {
        $palette = self::generateColorPalette($baseColor, $paletteName ?: $name);
        
        return GlobalVariable::createOrUpdate(
            $name,
            $baseColor,
            'color_palette',
            'design',
            $palette
        );
    }

    /**
     * Crear variable de tipografía en la base de datos
     */
    public static function createTypographyVariable(string $name, string $primaryFont, string $secondaryFont = null): GlobalVariable
    {
        $typography = self::generateTypographySystem($primaryFont, $secondaryFont);
        
        return GlobalVariable::createOrUpdate(
            $name,
            $primaryFont,
            'typography_system', 
            'design',
            $typography
        );
    }

    /**
     * Exportar todos los design tokens como CSS
     */
    public static function exportAllAsCSS(): string
    {
        $css = ":root {\n";
        
        // Obtener todas las variables de diseño
        $designVariables = GlobalVariable::active()
            ->whereIn('type', ['color_palette', 'typography_system'])
            ->where('category', 'design')
            ->get();

        foreach ($designVariables as $variable) {
            if ($variable->metadata && isset($variable->metadata['css_variables'])) {
                foreach ($variable->metadata['css_variables'] as $cssVar => $value) {
                    $css .= "  {$cssVar}: {$value};\n";
                }
            }
        }

        $css .= "}\n\n";

        // Agregar clases utility personalizadas
        $css .= self::generateUtilityClasses($designVariables);

        return $css;
    }

    /**
     * Generar clases utility personalizadas
     */
    private static function generateUtilityClasses($variables): string
    {
        $css = "/* Custom Design System Classes */\n";
        
        foreach ($variables as $variable) {
            if ($variable->type === 'color_palette' && $variable->metadata) {
                $name = $variable->metadata['name'] ?? $variable->name;
                $css .= ".text-{$name} { color: var(--color-{$name}); }\n";
                $css .= ".bg-{$name} { background-color: var(--color-{$name}); }\n";
                $css .= ".border-{$name} { border-color: var(--color-{$name}); }\n\n";
            }
        }

        return $css;
    }

    /**
     * Obtener presets populares de fuentes
     */
    public static function getFontPresets(): array
    {
        return [
            'modern' => ['Inter', 'Roboto'],
            'classic' => ['Playfair Display', 'Source Sans Pro'], 
            'minimalist' => ['Poppins', 'Open Sans'],
            'editorial' => ['Merriweather', 'Lato'],
            'tech' => ['JetBrains Mono', 'Inter'],
            'elegant' => ['Crimson Text', 'Montserrat']
        ];
    }

    /**
     * Validar que una fuente esté disponible
     */
    public static function validateFont(string $fontName): bool
    {
        // Lista de fuentes web-safe y Google Fonts populares
        $availableFonts = [
            'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
            'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Arial', 
            'Helvetica', 'Times New Roman', 'Georgia', 'Verdana'
        ];
        
        return in_array($fontName, $availableFonts);
    }
}