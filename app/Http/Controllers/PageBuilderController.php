<?php
// app/Http/Controllers/PageBuilderController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\BlockBuilder\BlockRegistry;
use App\Services\BlockBuilder\BlockRenderer;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\File;

class PageBuilderController extends Controller
{
    public function index()
    {
        $availableBlocks = BlockRegistry::getBlocksInfo();
        
        // DEBUG: Verificar qué datos estamos enviando
        \Log::info('Available blocks:', $availableBlocks);
        
        return view('page-builder.index', compact('availableBlocks'));
    }
    
    public function preview(Request $request)
    {
        $blockData = $request->input('blocks.0'); // Solo el primer bloque para preview
        
        try {
            // Crear el bloque manualmente para preview
            $block = BlockRegistry::create(
                $blockData['type'], 
                $blockData['config'] ?? [], 
                $blockData['styles'] ?? []
            );
            
            $html = $block->render();
            return response()->json(['html' => $html]);
        } catch (\Exception $e) {
            \Log::error('Preview error:', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
    
    public function save(Request $request)
    {
        $blocksData = $request->input('blocks', []);
        $pageId = $request->input('page_id');
        
        return response()->json(['success' => true, 'message' => 'Página guardada']);
    }
    
    /**
     * Obtener la plantilla Blade para un tipo de bloque
     */
    public function getBlockTemplate(Request $request)
    {
        $type = $request->input('type');
        $config = $request->input('config', []);
        $styles = $request->input('styles', []);
        
        // Obtener la plantilla Blade correspondiente
        $template = $this->getTemplateForBlockType($type);
        
        // Renderizar la plantilla para la vista previa
        $rendered = $this->renderTemplate($template, [
            'config' => $config,
            'styles' => $styles,
            'cssClasses' => $this->generateCssClasses($styles)
        ]);
        
        return response()->json([
            'template' => $template,
            'rendered' => $rendered
        ]);
    }
    
    /**
     * Previsualizar una plantilla Blade
     */
    public function previewBlockTemplate(Request $request)
    {
        $template = $request->input('template');
        $config = $request->input('config', []);
        $styles = $request->input('styles', []);
        
        // Crear un archivo temporal con el template
        $tempFile = storage_path('app/temp_' . uniqid() . '.blade.php');
        File::put($tempFile, $template);
        
        try {
            // Renderizar el template
            $html = View::file($tempFile, [
                'config' => $config,
                'styles' => $styles,
                'cssClasses' => $this->generateCssClasses($styles)
            ])->render();
            
            // Eliminar el archivo temporal
            File::delete($tempFile);
            
            return response()->json(['html' => $html]);
        } catch (\Exception $e) {
            // Eliminar el archivo temporal en caso de error
            if (File::exists($tempFile)) {
                File::delete($tempFile);
            }
            
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Actualizar la configuración de un bloque a partir de una plantilla
     */
    public function updateBlockTemplate(Request $request)
    {
        $id = $request->input('id');
        $type = $request->input('type');
        $template = $request->input('template');
        
        // Extraer la configuración del template
        $config = $this->extractConfigFromTemplate($template, $type);
        
        return response()->json(['config' => $config]);
    }
    
    /**
     * Obtener la plantilla para un tipo de bloque
     */
    private function getTemplateForBlockType($type)
    {
        // Obtener el contenido del archivo de plantilla
        $path = resource_path("views/blocks/{$type}.blade.php");
        
        if (File::exists($path)) {
            return File::get($path);
        }
        
        // Plantilla por defecto si no existe
        return '<div>Plantilla no encontrada para el tipo: ' . $type . '</div>';
    }
    
    /**
     * Renderizar una plantilla Blade
     */
    private function renderTemplate($template, $data)
    {
        // Crear un archivo temporal con el template
        $tempFile = storage_path('app/temp_' . uniqid() . '.blade.php');
        File::put($tempFile, $template);
        
        try {
            // Renderizar el template
            $html = View::file($tempFile, $data)->render();
            
            // Eliminar el archivo temporal
            File::delete($tempFile);
            
            return $html;
        } catch (\Exception $e) {
            // Eliminar el archivo temporal en caso de error
            if (File::exists($tempFile)) {
                File::delete($tempFile);
            }
            
            throw $e;
        }
    }
    
    /**
     * Generar clases CSS a partir de estilos
     */
    private function generateCssClasses($styles)
    {
        $classes = [];
        
        // Mapear estilos a clases de Tailwind
        if (!empty($styles['textAlign'])) {
            $classes[] = 'text-' . $styles['textAlign'];
        }
        
        if (!empty($styles['padding'])) {
            $paddingMap = [
                'xs' => 'p-2',
                'sm' => 'p-4',
                'md' => 'p-6',
                'lg' => 'p-8',
                'xl' => 'p-10'
            ];
            $classes[] = $paddingMap[$styles['padding']] ?? 'p-4';
        }
        
        if (!empty($styles['margin'])) {
            $marginMap = [
                'xs' => 'm-2',
                'sm' => 'm-4',
                'md' => 'm-6',
                'lg' => 'm-8',
                'xl' => 'm-10'
            ];
            $classes[] = $marginMap[$styles['margin']] ?? 'm-4';
        }
        
        if (!empty($styles['backgroundColor']) && $styles['backgroundColor'] !== 'transparent') {
            $classes[] = 'bg-' . $styles['backgroundColor'];
        }
        
        return implode(' ', $classes);
    }
    
    /**
     * Extraer configuración de una plantilla Blade
     */
    private function extractConfigFromTemplate($template, $type)
    {
        $config = [];
        
        // Extraer configuración según el tipo de bloque
        switch ($type) {
            case 'hero':
                // Extraer título
                if (preg_match('/\{\{\s*\$config\[\'title\'\]\s*\?\?\s*\'([^\']*)\'\s*\}\}/s', $template, $matches)) {
                    $config['title'] = $matches[1];
                }
                
                // Extraer subtítulo
                if (preg_match('/\{\{\s*\$config\[\'subtitle\'\]\s*\?\?\s*\'([^\']*)\'\s*\}\}/s', $template, $matches)) {
                    $config['subtitle'] = $matches[1];
                }
                
                // Extraer texto del botón
                if (preg_match('/\{\{\s*\$config\[\'buttonText\'\]\s*\?\?\s*\'([^\']*)\'\s*\}\}/s', $template, $matches)) {
                    $config['buttonText'] = $matches[1];
                }
                
                // Extraer URL del botón
                if (preg_match('/\{\{\s*\$config\[\'buttonUrl\'\]\s*\?\?\s*\'([^\']*)\'\s*\}\}/s', $template, $matches)) {
                    $config['buttonUrl'] = $matches[1];
                }
                break;
                
            case 'text':
                // Extraer contenido
                if (preg_match('/\{\{\s*\$config\[\'content\'\]\s*\?\?\s*\'([^\']*)\'\s*\}\}/s', $template, $matches)) {
                    $config['content'] = $matches[1];
                }
                break;
                
            // Otros tipos de bloques...
        }
        
        return $config;
    }

    /**
     * Preview template with variables processing
     */
    public function previewTemplate(Request $request)
    {
        try {
            $content = $request->input('content', '');
            $config = $request->input('config', []);
            $styles = $request->input('styles', []);

            // Procesar variables en el contenido
            $processedContent = $this->processVariablesInContent($content);
            
            // Procesar configuración si es necesario
            $processedContent = $this->processConfigInContent($processedContent, $config);

            return response()->json([
                'success' => true,
                'html' => $processedContent,
                'rendered' => $processedContent,
                'config' => $config,
                'styles' => $styles
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to preview template',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Procesar variables en el contenido
     */
    private function processVariablesInContent($content)
    {
        try {
            // Obtener variables resueltas
            $variables = \App\Models\Variable::getAllForFrontend();
            
            // Reemplazar variables en el contenido
            foreach ($variables as $key => $value) {
                // Convertir objetos/arrays a string de manera segura
                $stringValue = $this->convertValueToString($value);
                
                // Crear patrones individuales (no arrays)
                $patterns = [
                    '/\{\{\s*' . preg_quote($key, '/') . '\s*\}\}/',   // {{variable}}
                    '/\$\{\s*' . preg_quote($key, '/') . '\s*\}/',     // ${variable}
                ];
                
                // Aplicar cada patrón individualmente
                foreach ($patterns as $pattern) {
                    $content = preg_replace($pattern, $stringValue, $content);
                }
            }
            
            return $content;
            
        } catch (\Exception $e) {
            \Log::error('Error processing variables in content: ' . $e->getMessage());
            return $content; // Devolver contenido original si hay error
        }
    }

    private function convertValueToString($value)
    {
        if ($value === null) {
            return '';
        }
        
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        
        if (is_array($value) || is_object($value)) {
            // Para objetos complejos, extraer valor si es posible
            if (is_array($value) && isset($value['count'])) {
                return (string) $value['count'];
            }
            
            if (is_object($value) && property_exists($value, 'count')) {
                return (string) $value->count;
            }
            
            // Para otros casos, convertir a JSON
            try {
                return json_encode($value, JSON_UNESCAPED_UNICODE);
            } catch (\Exception $e) {
                return '[Object]';
            }
        }
        
        // Para valores escalares, convertir a string directamente
        return (string) $value;
    }


    /**
     * Procesar configuración en el contenido
     */
    private function processConfigInContent($content, $config)
    {
        try {
            // Procesar sintaxis de configuración como {{ $config['title'] }}
            foreach ($config as $key => $value) {
                $stringValue = $this->convertValueToString($value);
                
                $patterns = [
                    '/\{\{\s*\$config\[\s*[\'"]' . preg_quote($key, '/') . '[\'"]\s*\]\s*\}\}/',
                    '/\{\{\s*\$config\[' . preg_quote($key, '/') . '\]\s*\}\}/',
                ];
                
                // Aplicar cada patrón individualmente
                foreach ($patterns as $pattern) {
                    $content = preg_replace($pattern, $stringValue, $content);
                }
            }
            
            return $content;
            
        } catch (\Exception $e) {
            \Log::error('Error processing config in content: ' . $e->getMessage());
            return $content;
        }
    }

}
