<?php
// ===================================================================
// app/Services/LiquidRenderer.php
// ===================================================================

namespace App\Services;

class LiquidRenderer
{
    protected array $config;

    public function __construct()
    {
        $this->config = [
            'strict_filters' => false,
            'strict_variables' => false,
            'auto_escape' => false,
        ];
    }

    /**
     * Renderizar template Liquid
     */
    public function render(string $template, array $variables = []): string
    {
        try {
            // Si tenemos Liquid.js en PHP (librería hipotética)
            // Por ahora, hacemos procesamiento básico
            return $this->processBasicLiquid($template, $variables);
        } catch (\Exception $e) {
            throw new \Exception("Error en Liquid rendering: " . $e->getMessage());
        }
    }

    /**
     * Procesamiento básico de Liquid (fallback)
     */
    protected function processBasicLiquid(string $template, array $variables): string
    {
        $processed = $template;

        // 1. Procesar variables simples {{ variable }}
        $processed = preg_replace_callback('/\{\{\s*([^\|}\s]+)\s*\}\}/', function ($matches) use ($variables) {
            $path = trim($matches[1]);
            $value = $this->getNestedValue($variables, $path);
            return $value !== null ? (string) $value : $matches[0];
        }, $processed);

        // 2. Procesar variables con filtros {{ variable | filter }}
        $processed = preg_replace_callback('/\{\{\s*([^\|}\s]+)\s*\|\s*(\w+)\s*\}\}/', function ($matches) use ($variables) {
            $path = trim($matches[1]);
            $filter = trim($matches[2]);
            $value = $this->getNestedValue($variables, $path);
            
            if ($value === null) return $matches[0];
            
            return $this->applyFilter($value, $filter);
        }, $processed);

        // 3. Procesar condicionales básicos {% if condition %}
        $processed = preg_replace_callback('/\{%\s*if\s+([^\s%]+)\s*%\}(.*?)\{%\s*endif\s*%\}/s', function ($matches) use ($variables) {
            $condition = trim($matches[1]);
            $content = $matches[2];
            $value = $this->getNestedValue($variables, $condition);
            
            return $this->isTruthy($value) ? $content : '';
        }, $processed);

        // 4. Procesar loops básicos {% for item in items %}
        $processed = preg_replace_callback('/\{%\s*for\s+(\w+)\s+in\s+([^\s%]+)\s*%\}(.*?)\{%\s*endfor\s*%\}/s', function ($matches) use ($variables) {
            $itemVar = trim($matches[1]);
            $arrayPath = trim($matches[2]);
            $loopContent = $matches[3];
            
            $items = $this->getNestedValue($variables, $arrayPath);
            
            if (!is_array($items)) return '';
            
            $output = '';
            foreach ($items as $item) {
                $loopVars = array_merge($variables, [$itemVar => $item]);
                $itemOutput = $this->processBasicLiquid($loopContent, $loopVars);
                $output .= $itemOutput;
            }
            
            return $output;
        }, $processed);

        return $processed;
    }

    /**
     * Obtener valor anidado de array
     */
    protected function getNestedValue(array $array, string $path)
    {
        $keys = explode('.', $path);
        $value = $array;

        foreach ($keys as $key) {
            if (is_array($value) && isset($value[$key])) {
                $value = $value[$key];
            } else {
                return null;
            }
        }

        return $value;
    }

    /**
     * Aplicar filtro a valor
     */
    protected function applyFilter($value, string $filter): string
    {
        return match($filter) {
            'upcase', 'uppercase' => strtoupper($value),
            'downcase', 'lowercase' => strtolower($value),
            'capitalize' => ucfirst(strtolower($value)),
            'title' => ucwords(strtolower($value)),
            'currency' => '$' . number_format((float) $value, 2),
            'percentage' => round((float) $value) . '%',
            'truncate' => strlen($value) > 50 ? substr($value, 0, 47) . '...' : $value,
            'strip' => trim($value),
            'escape' => htmlspecialchars($value),
            default => (string) $value
        };
    }

    /**
     * Verificar si valor es truthy
     */
    protected function isTruthy($value): bool
    {
        if ($value === null || $value === false || $value === '') {
            return false;
        }
        
        if (is_array($value) && empty($value)) {
            return false;
        }
        
        return true;
    }
}



