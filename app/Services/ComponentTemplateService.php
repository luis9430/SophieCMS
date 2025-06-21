<?php

// app/Services/ComponentTemplateService.php - VERSIÓN VIRTUAL

namespace App\Services;

use App\Models\Component;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\File;

class ComponentTemplateService
{
    /**
     * Renderiza un componente virtualmente sin crear archivos físicos
     */
    public function renderComponentVirtually(Component $component, array $data = []): string
    {
        $template = $this->getTemplateForContext($component, 'page-builder');
        
        // Si es un shortcode, renderizar directamente
        if ($this->isShortcodeTemplate($template)) {
            return $this->renderShortcodeTemplate($component, $template, $data);
        }
        
        // Si es template completo, usar archivo temporal
        return $this->renderFullTemplate($component->blade_template, $data);
    }

    /**
     * Detecta si es un template tipo shortcode
     */
    protected function isShortcodeTemplate(string $template): bool
    {
        return Str::startsWith(trim($template), '<x-page-builder.');
    }

    /**
     * Renderiza template tipo shortcode reemplazando props
     */
    protected function renderShortcodeTemplate(Component $component, string $template, array $data): string
    {
        // Extraer props del template shortcode
        preg_match_all('/(\w+)=["\']([^"\']*)["\']/', $template, $matches);
        
        $templateData = [];
        if (!empty($matches[1])) {
            foreach ($matches[1] as $i => $propName) {
                $defaultValue = $matches[2][$i] ?? '';
                $templateData[$propName] = $data[$propName] ?? $defaultValue;
            }
        }

        // Obtener el template completo del componente
        $fullTemplate = $component->blade_template;
        
        // Reemplazar variables con los datos
        foreach ($templateData as $key => $value) {
            $fullTemplate = preg_replace(
                '/\{\{\s*\$' . $key . '\s*\?\?\s*["\'][^"\']*["\']?\s*\}\}/',
                '{{ $' . $key . ' }}',
                $fullTemplate
            );
        }

        return $this->renderFullTemplate($fullTemplate, $templateData);
    }

    /**
     * Renderiza template completo usando archivo temporal
     */
    protected function renderFullTemplate(string $template, array $data): string
    {
        $tempFile = storage_path('app/temp_component_' . uniqid() . '.blade.php');
        
        try {
            File::put($tempFile, $template);
            return View::file($tempFile, $data)->render();
        } catch (\Exception $e) {
            throw new \Exception('Error rendering component: ' . $e->getMessage());
        } finally {
            if (File::exists($tempFile)) {
                File::delete($tempFile);
            }
        }
    }

    /**
     * Genera automáticamente el template corto para Page Builder
     */
    public function generateShortTemplate(Component $component): string
    {
        $fullTemplate = $component->blade_template;
        $identifier = $component->identifier;
        $propsSchema = $component->props_schema ?? [];

        // Detectar si ya es un componente Blade
        if (Str::contains($fullTemplate, "<x-page-builder.{$identifier}")) {
            return $fullTemplate; // Ya es corto
        }

        // Extraer props del schema o detectar del template
        $props = $this->extractPropsFromSchema($propsSchema) ?: $this->detectPropsFromTemplate($fullTemplate);
        
        // Generar template corto
        $shortTemplate = "<x-page-builder.{$identifier}";
        
        if (!empty($props)) {
            $shortTemplate .= "\n";
            foreach ($props as $prop => $config) {
                $defaultValue = $config['default'] ?? $config ?? '';
                $shortTemplate .= "    {$prop}=\"{$defaultValue}\"\n";
            }
        }
        
        $shortTemplate .= " />";

        return $shortTemplate;
    }

    /**
     * Detecta props automáticamente del template
     */
    protected function detectPropsFromTemplate(string $template): array
    {
        $props = [];
        
        // Buscar patrones como {{ $title ?? "default" }}
        preg_match_all('/\{\{\s*\$(\w+)\s*\?\?\s*["\']([^"\']*)["\']?\s*\}\}/', $template, $matches);
        
        if (!empty($matches[1])) {
            foreach ($matches[1] as $i => $propName) {
                $defaultValue = $matches[2][$i] ?? '';
                $props[$propName] = ['default' => $defaultValue, 'type' => 'string'];
            }
        }
        
        return $props;
    }

    /**
     * Obtiene el template apropiado según el contexto
     */
    public function getTemplateForContext(Component $component, string $context = 'page-builder'): string
    {
        switch ($context) {
            case 'page-builder':
                return $component->page_builder_template ?? $this->generateShortTemplate($component);
            
            case 'component-builder':
            case 'preview':
                return $component->blade_template;
            
            default:
                return $component->blade_template;
        }
    }

    /**
     * Actualiza automáticamente los templates cuando se guarda un componente
     */
    public function updateComponentTemplates(Component $component): void
    {
        if ($component->auto_generate_short) {
            // Generar template corto
            $shortTemplate = $this->generateShortTemplate($component);
            $component->update(['page_builder_template' => $shortTemplate]);
        }
    }

    /**
     * Extrae props del schema
     */
    protected function extractPropsFromSchema(array $schema): array
    {
        return $schema['properties'] ?? $schema ?? [];
    }

    /**
     * Valida si un template shortcode es válido
     */
    public function validateShortcodeTemplate(string $template): array
    {
        $errors = [];
        
        if (!$this->isShortcodeTemplate($template)) {
            $errors[] = 'El template debe comenzar con <x-page-builder.';
        }
        
        // Validar sintaxis de props
        if (!preg_match('/^<x-page-builder\.\w+(?:\s+\w+=["\'][^"\']*["\'])*\s*\/>$/', trim($template))) {
            $errors[] = 'Sintaxis de template shortcode inválida';
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors
        ];
    }
}