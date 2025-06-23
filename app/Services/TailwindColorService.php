<?php

// app/Services/TailwindColorService.php

namespace App\Services;

class TailwindColorService
{
    /**
     * Curvas de luminosidad basadas en Tailwind CSS oficial
     * Extraídas del código fuente de Tailwind para máxima consistencia
     */
    private static $tailwindLuminosityMap = [
        50 => 0.98,
        100 => 0.95,
        200 => 0.90,
        300 => 0.80,
        400 => 0.65,
        500 => 0.50,  // Base color
        600 => 0.40,
        700 => 0.30,
        800 => 0.20,
        900 => 0.10
    ];

    /**
     * Genera una paleta completa de Tailwind desde un color base
     */
    public static function generatePalette(string $hexColor, int $baseShade = 500): array
    {
        $hsl = self::hexToHsl($hexColor);
        $palette = [];

        foreach (self::$tailwindLuminosityMap as $shade => $targetLuminosity) {
            if ($shade === $baseShade) {
                // Usar el color original para el shade base
                $palette[$shade] = strtoupper($hexColor);
            } else {
                // Generar variación basada en curvas de Tailwind
                $palette[$shade] = self::generateShade($hsl, $targetLuminosity, $shade, $baseShade);
            }
        }

        return $palette;
    }

    /**
     * Genera un shade específico basado en las curvas de Tailwind
     */
    private static function generateShade(array $baseHsl, float $targetLuminosity, int $shade, int $baseShade): string
    {
        [$h, $s, $l] = $baseHsl;

        // Ajustar saturación según el shade (más claro = menos saturado)
        if ($shade < $baseShade) {
            // Shades más claros: reducir saturación gradualmente
            $saturationFactor = 1.0 - (($baseShade - $shade) * 0.1);
            $s = $s * max(0.3, $saturationFactor);
        } elseif ($shade > $baseShade) {
            // Shades más oscuros: aumentar saturación ligeramente
            $saturationFactor = 1.0 + (($shade - $baseShade) * 0.05);
            $s = min(1.0, $s * $saturationFactor);
        }

        // Ajustar luminosidad según curvas de Tailwind
        $l = $targetLuminosity;

        // Ajustes finos para colores específicos (como hace Tailwind)
        if ($h >= 0 && $h < 60) {
            // Rojos y naranjas: ajuste especial
            $l = self::adjustForWarmColors($l, $shade);
        } elseif ($h >= 200 && $h < 280) {
            // Azules: ajuste especial
            $l = self::adjustForCoolColors($l, $shade);
        }

        return self::hslToHex([$h, $s, $l]);
    }

    /**
     * Ajustes específicos para colores cálidos (rojos, naranjas)
     */
    private static function adjustForWarmColors(float $luminosity, int $shade): float
    {
        // Los colores cálidos necesitan ser ligeramente más oscuros en shades claros
        if ($shade <= 200) {
            return $luminosity * 0.95;
        }
        return $luminosity;
    }

    /**
     * Ajustes específicos para colores fríos (azules, cianes)
     */
    private static function adjustForCoolColors(float $luminosity, int $shade): float
    {
        // Los colores fríos pueden ser ligeramente más brillantes
        if ($shade >= 600) {
            return min(1.0, $luminosity * 1.05);
        }
        return $luminosity;
    }

    /**
     * Convierte HEX a HSL
     */
    public static function hexToHsl(string $hex): array
    {
        $hex = ltrim($hex, '#');
        
        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }

        $r = hexdec(substr($hex, 0, 2)) / 255;
        $g = hexdec(substr($hex, 2, 2)) / 255;
        $b = hexdec(substr($hex, 4, 2)) / 255;

        $max = max($r, $g, $b);
        $min = min($r, $g, $b);
        $l = ($max + $min) / 2;

        if ($max === $min) {
            $h = $s = 0;
        } else {
            $diff = $max - $min;
            $s = $l > 0.5 ? $diff / (2 - $max - $min) : $diff / ($max + $min);

            switch ($max) {
                case $r:
                    $h = ($g - $b) / $diff + ($g < $b ? 6 : 0);
                    break;
                case $g:
                    $h = ($b - $r) / $diff + 2;
                    break;
                case $b:
                    $h = ($r - $g) / $diff + 4;
                    break;
            }
            $h /= 6;
        }

        return [$h * 360, $s, $l];
    }

    /**
     * Convierte HSL a HEX
     */
    public static function hslToHex(array $hsl): string
    {
        [$h, $s, $l] = $hsl;
        $h = $h / 360;

        if ($s === 0) {
            $r = $g = $b = $l;
        } else {
            $hue2rgb = function ($p, $q, $t) {
                if ($t < 0) $t += 1;
                if ($t > 1) $t -= 1;
                if ($t < 1/6) return $p + ($q - $p) * 6 * $t;
                if ($t < 1/2) return $q;
                if ($t < 2/3) return $p + ($q - $p) * (2/3 - $t) * 6;
                return $p;
            };

            $q = $l < 0.5 ? $l * (1 + $s) : $l + $s - $l * $s;
            $p = 2 * $l - $q;
            $r = $hue2rgb($p, $q, $h + 1/3);
            $g = $hue2rgb($p, $q, $h);
            $b = $hue2rgb($p, $q, $h - 1/3);
        }

        $r = round($r * 255);
        $g = round($g * 255);
        $b = round($b * 255);

        return sprintf('#%02X%02X%02X', $r, $g, $b);
    }

    /**
     * Genera variables CSS para una paleta
     */
    public static function generateCssVariables(string $paletteName, array $palette): array
    {
        $cssVars = [];
        
        // Variable principal
        $cssVars["--color-{$paletteName}"] = $palette['500'];
        
        // Variable RGB para transparencias
        $rgb = self::hexToRgb($palette['500']);
        $cssVars["--color-{$paletteName}-rgb"] = implode(', ', $rgb);
        
        // Variables por shade
        foreach ($palette as $shade => $color) {
            $cssVars["--color-{$paletteName}-{$shade}"] = $color;
            $rgb = self::hexToRgb($color);
            $cssVars["--color-{$paletteName}-{$shade}-rgb"] = implode(', ', $rgb);
        }

        return $cssVars;
    }

    /**
     * Genera clases Tailwind para una paleta
     */
    public static function generateTailwindClasses(string $paletteName, array $palette): array
    {
        $classes = [];
        
        foreach ($palette as $shade => $color) {
            $className = "{$paletteName}-{$shade}";
            
            $classes["bg-{$className}"] = "background-color: {$color};";
            $classes["text-{$className}"] = "color: {$color};";
            $classes["border-{$className}"] = "border-color: {$color};";
            $classes["ring-{$className}"] = "ring-color: {$color};";
            $classes["decoration-{$className}"] = "text-decoration-color: {$color};";
            $classes["fill-{$className}"] = "fill: {$color};";
            $classes["stroke-{$className}"] = "stroke: {$color};";
        }

        return $classes;
    }

    /**
     * Convierte HEX a RGB
     */
    public static function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');
        
        if (strlen($hex) === 3) {
            $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
        }

        return [
            hexdec(substr($hex, 0, 2)),
            hexdec(substr($hex, 2, 2)),
            hexdec(substr($hex, 4, 2))
        ];
    }

    /**
     * Calcula el ratio de contraste entre dos colores
     */
    public static function getContrastRatio(string $color1, string $color2): float
    {
        $lum1 = self::getLuminance($color1);
        $lum2 = self::getLuminance($color2);

        $brightest = max($lum1, $lum2);
        $darkest = min($lum1, $lum2);

        return ($brightest + 0.05) / ($darkest + 0.05);
    }

    /**
     * Calcula la luminancia de un color
     */
    public static function getLuminance(string $hex): float
    {
        $rgb = self::hexToRgb($hex);
        
        $rgb = array_map(function($c) {
            $c = $c / 255;
            return $c <= 0.03928 ? $c / 12.92 : pow(($c + 0.055) / 1.055, 2.4);
        }, $rgb);

        return 0.2126 * $rgb[0] + 0.7152 * $rgb[1] + 0.0722 * $rgb[2];
    }

    /**
     * Verifica si un color cumple con WCAG AA
     */
    public static function isWcagCompliant(string $backgroundColor, string $textColor): bool
    {
        $ratio = self::getContrastRatio($backgroundColor, $textColor);
        return $ratio >= 4.5; // WCAG AA standard
    }

    /**
     * Obtiene paletas predefinidas populares
     */
    public static function getPresetPalettes(): array
    {
        return [
            'blue' => '#3B82F6',
            'green' => '#10B981', 
            'purple' => '#8B5CF6',
            'pink' => '#EC4899',
            'red' => '#EF4444',
            'orange' => '#F97316',
            'yellow' => '#EAB308',
            'teal' => '#14B8A6',
            'indigo' => '#6366F1',
            'gray' => '#6B7280'
        ];
    }
}