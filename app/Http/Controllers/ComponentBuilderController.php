<?php

// app/Http/Controllers/ComponentBuilderController.php

namespace App\Http\Controllers;

use App\Models\Component;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ComponentBuilderController extends Controller
{
    /**
     * Lista de componentes del usuario
     */
    public function index(Request $request)
    {
        $components = Component::query()
            ->where('is_advanced', true)
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
            })
            ->when($request->category, function ($query, $category) {
                $query->where('category', $category);
            })
            ->orderBy('last_edited_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        $categories = Component::distinct()
            ->pluck('category')
            ->filter()
            ->sort();

        return view('component-builder.index', compact('components', 'categories'));
    }

    /**
     * Mostrar formulario de creación
     */
    public function create()
    {
        $availableAssets = $this->getAvailableAssetsList();
        $categories = $this->getCategories();
        
        return view('component-builder.create', compact('availableAssets', 'categories'));
    }

    /**
     * Guardar nuevo componente
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'identifier' => 'required|string|max:255|unique:components,identifier',
            'category' => 'required|string|max:50',
            'description' => 'nullable|string|max:500',
            'blade_template' => 'required|string',
            'external_assets' => 'nullable|array',
            'communication_config' => 'nullable|array',
            'props_schema' => 'nullable|array',
            'preview_config' => 'nullable|array',
        ]);

        try {
            // Validar código Blade
            $this->validateBladeCode($validated['blade_template']);

            $component = Component::create([
                'name' => $validated['name'],
                'identifier' => $validated['identifier'],
                'category' => $validated['category'],
                'description' => $validated['description'] ?? '',
                'blade_template' => $validated['blade_template'],
                'external_assets' => $validated['external_assets'] ?? [],
                'communication_config' => $validated['communication_config'] ?? [],
                'props_schema' => $validated['props_schema'] ?? [],
                'preview_config' => $validated['preview_config'] ?? [],
                'is_advanced' => true,
                'is_active' => true,
                'created_by_user_id' => Auth::id(),
                'last_edited_at' => now(),
                'version' => '1.0.0',
            ]);

            // Generar screenshot automático en background
            // dispatch(new GenerateComponentScreenshot($component));

            return redirect()
                ->route('component-builder.edit', $component)
                ->with('success', 'Componente creado exitosamente');

        } catch (\Exception $e) {
            return back()
                ->withInput()
                ->withErrors(['blade_template' => 'Error en el código del componente: ' . $e->getMessage()]);
        }
    }

    public function edit(Component $component)
    {
        $availableAssets = $this->getAvailableAssetsList();
        $categories = $this->getCategories();
        
        // Preparar datos del componente de forma segura
        $componentData = [
            'id' => $component->id,
            'name' => $component->name ?? '',
            'identifier' => $component->identifier ?? '',
            'category' => $component->category ?? 'content',
            'description' => $component->description ?? '',
            'blade_template' => $component->blade_template ?? '',
            'external_assets' => $component->external_assets ?? [],
            'communication_config' => $component->communication_config ?? [
                'emits' => [],
                'listens' => [],
                'state' => []
            ],
            'props_schema' => $component->props_schema ?? [],
            'preview_config' => $component->preview_config ?? [],
            'version' => $component->version ?? '1.0.0',
            'created_at' => $component->created_at,
            'updated_at' => $component->updated_at,
            'last_edited_at' => $component->last_edited_at
        ];

        $existingComponents = Component::where('id', '!=', $component->id)
            ->where('is_active', true)
            ->select('id', 'name', 'identifier', 'category')
            ->get();

        return view('component-builder.edit', [
            'component' => (object) $componentData, // Convertir a objeto para usar en Blade
            'availableAssets' => $availableAssets,
            'categories' => $categories,
            'existingComponents' => $existingComponents
        ]);
    }

    private function getCategories(): array
    {
        return [
            'layout' => 'Layout',
            'content' => 'Contenido',
            'interactive' => 'Interactivo',
            'navigation' => 'Navegación',
            'forms' => 'Formularios',
            'media' => 'Media',
            'ecommerce' => 'E-commerce'
        ];
    }


    public function update(Request $request, $id)
    {
        try {
            $component = Component::findOrFail($id);
            
            // Validar datos
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'identifier' => 'required|string|max:255|unique:components,identifier,' . $id,
                'category' => 'required|string|max:100',
                'description' => 'nullable|string',
                'blade_template' => 'required|string',
                'external_assets' => 'array',
                'external_assets.*' => 'string',
                'communication_config' => 'array',
                'props_schema' => 'array',
                'preview_config' => 'array',
                'is_active' => 'boolean'
            ]);
            
            // Incrementar versión correctamente
            $currentVersion = $component->version ?? '1.0.0';
            $newVersion = $this->incrementVersion($currentVersion);
            
            // Actualizar componente
            $component->update([
                'name' => $validatedData['name'],
                'identifier' => $validatedData['identifier'],
                'category' => $validatedData['category'],
                'description' => $validatedData['description'] ?? '',
                'blade_template' => $validatedData['blade_template'],
                'external_assets' => $validatedData['external_assets'] ?? [],
                'communication_config' => $validatedData['communication_config'] ?? [],
                'props_schema' => $validatedData['props_schema'] ?? (object)[],
                'preview_config' => $validatedData['preview_config'] ?? (object)[],
                'is_active' => $validatedData['is_active'] ?? $component->is_active,
                'last_edited_at' => now(),
                'version' => $newVersion
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Componente actualizado exitosamente',
                'component' => $component->fresh()
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Update component error: ' . $e->getMessage(), [
                'component_id' => $id,
                'request_data' => $request->all(),
                'error_line' => $e->getLine(),
                'error_file' => $e->getFile()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar componente: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar componente
     */
    public function destroy(Component $component)
    {
        if (!$component->is_advanced) {
            return response()->json([
                'success' => false,
                'error' => 'No se pueden eliminar componentes del sistema'
            ], 403);
        }

        $component->delete();

        return response()->json([
            'success' => true,
            'message' => 'Componente eliminado exitosamente'
        ]);
    }


        public function preview(Request $request, $id)
        {
            try {
                $component = Component::findOrFail($id);
                
                // Si se envía blade_template en el request, usar ese (para edit.blade.php)
                // Si no, usar el del componente (para index.blade.php)
                $bladeTemplate = $request->input('blade_template', $component->blade_template);
                $externalAssets = $request->input('external_assets', $component->external_assets ?? []);
                $testData = $request->input('test_data', []);

                   \Log::info('🔍 Preview Debug', [
                        'component_id' => $id,
                        'test_data_received' => $testData,
                        'has_cadenas' => isset($testData['cadenas']),
                        'cadenas_value' => $testData['cadenas'] ?? 'NOT_SET'
                    ]);
                
                // Datos por defecto si no se proporcionan
                $defaultTestData = [
                    'title' => 'Título de Ejemplo',
                    'description' => 'Descripción de ejemplo para el componente.',
                    'content' => 'Contenido de prueba para verificar el componente.',
                    'image' => 'https://via.placeholder.com/400x200/6366f1/ffffff?text=Preview',
                    'url' => '#',
                    'button_text' => 'Ver más',
                    'price' => '$99.99',
                    'date' => now()->format('d/m/Y'),
                    'author' => 'Usuario de Prueba',
                    'items' => [
                        ['name' => 'Item 1', 'value' => 'Valor 1'],
                        ['name' => 'Item 2', 'value' => 'Valor 2'],
                        ['name' => 'Item 3', 'value' => 'Valor 3']
                    ]
                ];
                
                $finalTestData = array_merge($defaultTestData, $testData);

                  \Log::info('🔍 Final Test Data', [
                    'final_data' => $finalTestData,
                    'has_cadenas_final' => isset($finalTestData['cadenas'])
                ]);
                
                $html = $this->generateComponentPreviewSafe(
                    $bladeTemplate,
                    $externalAssets,
                    $finalTestData
                );
                
                return response($html)->header('Content-Type', 'text/html');
                
            } catch (\Exception $e) {
                \Log::error('Preview error: ' . $e->getMessage(), [
                    'component_id' => $id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                    'request_data' => $request->all()
                ]);
                
                $errorHtml = '<!DOCTYPE html>
                <html>
                <head>
                    <title>Error en Preview</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="bg-gray-50 p-8">
                    <div class="max-w-md mx-auto bg-white rounded-lg shadow p-6">
                        <div class="text-red-600 mb-4 text-center">
                            <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 text-center mb-2">Error en Preview</h3>
                        <p class="text-sm text-gray-600 text-center mb-4">' . htmlspecialchars($e->getMessage()) . '</p>
                        <div class="text-xs text-gray-400 text-center">
                            <details>
                                <summary class="cursor-pointer hover:text-gray-600">Ver detalles técnicos</summary>
                                <pre class="mt-2 text-left whitespace-pre-wrap">' . htmlspecialchars($e->getTraceAsString()) . '</pre>
                            </details>
                        </div>
                    </div>
                </body>
                </html>';
                
                return response($errorHtml)->header('Content-Type', 'text/html');
            }
        }
    /**
     * Preview multi-componente para testear comunicación
     */
    public function previewMulti(Request $request)
    {
        try {
            $mainComponent = $request->input('main_component', '');
            $testComponents = $request->input('test_components', []);
            $communicationConfig = $request->input('communication_config', []);
            $externalAssets = $request->input('external_assets', []);

            $html = $this->generateMultiComponentPreview(
                $mainComponent,
                $testComponents,
                $communicationConfig,
                $externalAssets
            );

            return response()->json([
                'success' => true,
                'html' => $html
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error en preview multi-componente: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Validar código Blade
     */
    public function validateCode(Request $request)
    {
        try {
            $code = $request->input('code', '');
            $this->validateBladeCode($code);

            return response()->json([
                'success' => true,
                'message' => 'Código válido'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'line' => $e->getLine() ?? null
            ]);
        }
    }

    private function validateBladeCode(string $code): void
    {
        // Validaciones existentes...
        if (strpos($code, '<?php') !== false || strpos($code, '<?=') !== false) {
            throw new \Exception('No se permite código PHP directo en los componentes');
        }
        
        // NUEVAS validaciones de seguridad JavaScript
        $dangerousPatterns = [
            // XSS y manipulación DOM
            '/on\w+\s*=/i' => 'No se permiten event handlers inline (onclick, onload, etc.)',
            '/javascript\s*:/i' => 'No se permiten URLs javascript:',
            '/eval\s*\(/i' => 'No se permite uso de eval()',
            '/new\s+Function\s*\(/i' => 'No se permite new Function()',
            
            // Acceso a APIs sensibles
            '/document\.cookie/i' => 'No se permite acceso a cookies',
            '/localStorage\s*\./i' => 'No se permite acceso a localStorage',
            '/sessionStorage\s*\./i' => 'No se permite acceso a sessionStorage',
            '/fetch\s*\([\'"]\/admin/i' => 'No se permiten llamadas a rutas admin',
            '/XMLHttpRequest/i' => 'No se permiten requests XMLHttpRequest directos',
            
            // Manipulación de funciones Alpine
            '/Alpine\s*\./i' => 'No se permite manipulación directa de Alpine',
            '/window\s*\./i' => 'No se permite acceso directo al objeto window',
            
            // Scripts inline peligrosos
            '/<script[^>]*>(?!.*x-data).*<\/script>/is' => 'Solo se permiten scripts con Alpine.js (x-data)',
        ];
        
        foreach ($dangerousPatterns as $pattern => $message) {
            if (preg_match($pattern, $code)) {
                throw new \Exception('Código no permitido: ' . $message);
            }
        }
        
        // Validar que scripts usen sistema seguro
        $this->validateSafeScriptUsage($code);
    }


    private function validateSafeScriptUsage(string $code): void
    {
        // Buscar todos los scripts
        preg_match_all('/<script[^>]*>(.*?)<\/script>/is', $code, $scripts);
        
        foreach ($scripts[1] as $scriptContent) {
            // Skip si está vacío
            if (trim($scriptContent) === '') continue;
            
            // Debe usar componentes seguros
            $hasSafeComponent = preg_match('/(safeSwiper|safeAOS|safeGSAP)/', $scriptContent);
            $hasAlpineData = preg_match('/Alpine\.data\s*\(/', $scriptContent);
            
            if (!$hasSafeComponent && !$hasAlpineData) {
                throw new \Exception('Los scripts deben usar componentes seguros (safeSwiper, safeAOS, safeGSAP) o Alpine.data()');
            }
        }
    }


            private function generateComponentPreviewSafe(string $code, array $assets = [], array $testData = []): string
            {
                // Asegurar que el directorio existe
                $tempDir = storage_path('app');
                if (!is_dir($tempDir)) {
                    mkdir($tempDir, 0755, true);
                }
                
                $tempFile = $tempDir . '/temp_preview_' . uniqid() . '.blade.php';
                
                try {
                    // Verificar que podemos escribir en el directorio
                    if (!is_writable($tempDir)) {
                        throw new \Exception('No se puede escribir en el directorio de storage');
                    }
                    
                    // Validar código antes de crear archivo
                    if (empty(trim($code))) {
                        throw new \Exception('El código del componente está vacío');
                    }
                    
                    file_put_contents($tempFile, $code);
                    
                    if (!file_exists($tempFile)) {
                        throw new \Exception('No se pudo crear el archivo temporal');
                    }
                    
                    // Renderizar con manejo de errores específicos
                    try {
                        $renderedComponent = \View::file($tempFile, $testData)->render();
                    } catch (\Illuminate\View\ViewException $e) {
                        throw new \Exception('Error de sintaxis Blade: ' . $e->getMessage());
                    } catch (\ParseError $e) {
                        throw new \Exception('Error de sintaxis PHP: ' . $e->getMessage());
                    }
                    
                    return $this->wrapComponentWithPreviewLayout($renderedComponent, $assets);
                    
                } catch (\Exception $e) {
                    \Log::error('Error in generateComponentPreviewSafe', [
                        'error' => $e->getMessage(),
                        'temp_dir' => $tempDir,
                        'temp_file' => $tempFile ?? 'not_created',
                        'dir_exists' => is_dir($tempDir),
                        'dir_writable' => is_writable($tempDir),
                        'code_length' => strlen($code),
                        'assets_count' => count($assets)
                    ]);
                    
                    // Intentar método alternativo
                    try {
                        return $this->generatePreviewWithoutFile($code, $assets, $testData);
                    } catch (\Exception $fallbackError) {
                        // Si todo falla, devolver error HTML
                        return $this->generateErrorPreview($e->getMessage());
                    }
                    
                } finally {
                    if (isset($tempFile) && file_exists($tempFile)) {
                        unlink($tempFile);
                    }
                }
            }

      
      
      
        private function generatePreviewWithoutFile(string $code, array $assets = [], array $testData = []): string
            {
                try {
                    // Método más directo pero menos seguro
                    // Crear un view temporal en memoria
                    $tempViewName = 'temp_' . uniqid();
                    
                    // Usar View::addNamespace para crear vista temporal
                    $tempPath = storage_path('framework/views');
                    if (!is_dir($tempPath)) {
                        mkdir($tempPath, 0755, true);
                    }
                    
                    $tempFile = $tempPath . '/' . $tempViewName . '.blade.php';
                    file_put_contents($tempFile, $code);
                    
                    // Renderizar
                    $renderedComponent = view()->file($tempFile, $testData)->render();
                    
                    // Limpiar archivo temporal
                    if (file_exists($tempFile)) {
                        unlink($tempFile);
                    }
                    
                    return $this->wrapComponentWithPreviewLayout($renderedComponent, $assets);
                    
                } catch (\Exception $e) {
                    // Si todo falla, devolver error HTML
                    return $this->generateErrorPreview($e->getMessage());
                }
            }

            private function generateMultiComponentPreview(string $main, array $testComponents, array $config, array $assets): string
    {
        $content = '<div class="multi-component-preview p-4 space-y-8">';
        
        // Componente principal
        $content .= '<div class="main-component border-2 border-blue-300 rounded-lg p-4">';
        $content .= '<h3 class="text-sm text-blue-600 mb-2">Componente Principal</h3>';
        $content .= $this->renderSingleComponent($main);
        $content .= '</div>';
        
        // Componentes de prueba
        foreach ($testComponents as $index => $testComponent) {
            $content .= '<div class="test-component border border-gray-300 rounded-lg p-4">';
            $content .= '<h3 class="text-sm text-gray-600 mb-2">Componente de Prueba ' . ($index + 1) . '</h3>';
            $content .= $this->renderSingleComponent($testComponent['code'] ?? '');
            $content .= '</div>';
        }
        
        $content .= '</div>';
        
        return $this->wrapComponentWithPreviewLayout($content, $assets, $config);
    }

    private function renderSingleComponent(string $code): string
    {
        $tempFile = storage_path('app/temp_single_' . uniqid() . '.blade.php');
        
        try {
            File::put($tempFile, $code);
            return View::file($tempFile, [])->render();
        } catch (\Exception $e) {
            return '<div class="text-red-500 p-4">Error: ' . $e->getMessage() . '</div>';
        } finally {
            if (File::exists($tempFile)) {
                File::delete($tempFile);
            }
        }
    }


    private function wrapComponentWithPreviewLayout(string $content, array $assets = []): string
    {
        $assetTags = $this->generateAssetTags($assets);
        $nonce = base64_encode(random_bytes(16));
        $isDev = config('app.env') === 'local';
        
        // CSP con soporte completo para desarrollo
        $cspPolicy = $isDev 
            ? "default-src 'self'; 
            script-src 'self' 'unsafe-eval' 'nonce-{$nonce}' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; 
            style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; 
            font-src 'self' data: https:;
            img-src 'self' data: https:; 
            connect-src 'self';"
            : "default-src 'self'; 
            script-src 'self' 'nonce-{$nonce}' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; 
            style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net; 
            font-src 'self' data: https:;
            img-src 'self' data: https:; 
            connect-src 'self';";
        
        return '<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Component Preview</title>
            
            <!-- CSP Header - Con soporte para fuentes -->
            <meta http-equiv="Content-Security-Policy" content="' . $cspPolicy . '">
            
            <!-- Core Libraries -->
            <script src="https://cdn.tailwindcss.com" nonce="' . $nonce . '"></script>
            <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" nonce="' . $nonce . '"></script>
            
            <!-- Assets ANTES del Component System -->
            ' . $assetTags . '
            
            <!-- Component System DESPUÉS de las librerías -->
            <script nonce="' . $nonce . '">
                ' . $this->getComponentSystemJS() . '
            </script>
            
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; }
                .preview-container { min-height: 50vh; }
                .error { 
                    background: #fee; 
                    color: #c00; 
                    padding: 1rem; 
                    border-radius: 0.5rem;
                    border: 1px solid #fcc;
                }
            </style>
        </head>
        <body class="bg-gray-50">
            <div class="preview-container p-4">
                ' . $content . '
            </div>
            
            <!-- Debug Info -->
            <script nonce="' . $nonce . '">
                console.log("🛡️ Secure Component Preview Loaded");
                console.log("📦 Available libraries:", {
                    Swiper: typeof window.Swiper,
                    AOS: typeof window.AOS,
                    gsap: typeof window.gsap,
                    Alpine: typeof window.Alpine
                });
                
                if (window.ComponentSystem) {
                    console.log("📊 ComponentSystem Stats:", ComponentSystem.getStats());
                }
            </script>
        </body>
        </html>';
    }




    private function generateCommunicationScript(array $config): string
    {
        if (empty($config)) {
            return '';
        }

        return '<script>
            // Auto-setup communication based on config
            document.addEventListener("DOMContentLoaded", function() {
                console.log("Communication config loaded:", ' . json_encode($config) . ');
                
                // TODO: Setup automatic event listeners based on config
                // This will be implemented in Phase 3
            });
        </script>';
    }


        private function incrementVersion(string $version): string
        {
            // Manejar diferentes formatos de versión
            if (preg_match('/^(\d+)\.(\d+)\.(\d+)$/', $version, $matches)) {
                // Formato x.y.z - incrementar el patch
                $major = (int)$matches[1];
                $minor = (int)$matches[2];
                $patch = (int)$matches[3] + 1;
                return "{$major}.{$minor}.{$patch}";
            } elseif (preg_match('/^(\d+)\.(\d+)$/', $version, $matches)) {
                // Formato x.y - incrementar el minor
                $major = (int)$matches[1];
                $minor = (int)$matches[2] + 1;
                return "{$major}.{$minor}";
            } elseif (is_numeric($version)) {
                // Solo número - incrementar
                return (string)((float)$version + 0.1);
            } else {
                // Formato desconocido - devolver versión por defecto
                return '1.0.1';
            }
        }
        public function previewById(Component $component, Request $request)
        {
            try {
                $testData = $request->input('test_data', [
                    'title' => 'Título de Prueba',
                    'description' => 'Esta es una descripción de prueba para el componente.'
                ]);

                // Verificar que el componente tiene contenido
                if (empty($component->blade_template)) {
                    return response()->json([
                        'success' => false,
                        'error' => 'El componente no tiene código definido'
                    ]);
                }

                $html = $this->generateComponentPreview(
                    $component->blade_template,
                    $component->external_assets ?? [],
                    $testData
                );

                return response()->json([
                    'success' => true,
                    'html' => $html,
                    'component' => [
                        'id' => $component->id,
                        'name' => $component->name,
                        'description' => $component->description,
                        'external_assets' => $component->external_assets ?? []
                    ]
                ]);

            } catch (\Exception $e) {
                \Log::error('Component preview by ID error', [
                    'component_id' => $component->id,
                    'error' => $e->getMessage(),
                    'line' => $e->getLine(),
                    'file' => $e->getFile()
                ]);

                return response()->json([
                    'success' => false,
                    'error' => 'Error al generar preview: ' . $e->getMessage()
                ]);
            }
        }



    public function getComponentData($id)
    {
        try {
            $component = Component::findOrFail($id);
            
            return response()->json([
                'success' => true,
                'component' => $component
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Componente no encontrado'
            ], 404);
        }
    }

        /**
         * Preview de componente (método específico para API)
         */
        public function apiPreview(Request $request, $id)
        {
            try {
                $component = Component::findOrFail($id);
                $testData = $request->input('test_data', []);
                
                $html = $this->generateComponentPreviewSafe(
                    $component->blade_template,
                    $component->external_assets ?? [],
                    $testData
                );
                
                return response($html)->header('Content-Type', 'text/html');
                
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage()
                ], 500);
            }
        }

        /**
         * Duplicar componente
         */
        public function duplicate($id)
        {
            try {
                $original = Component::findOrFail($id);
                
                $duplicate = $original->replicate();
                $duplicate->name = $original->name . ' (Copia)';
                $duplicate->identifier = $original->identifier . '_copy_' . time();
                $duplicate->is_active = false; // Las copias inician inactivas
                $duplicate->created_at = now();
                $duplicate->updated_at = now();
                $duplicate->save();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Componente duplicado exitosamente',
                    'component' => $duplicate
                ]);
                
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error al duplicar componente: ' . $e->getMessage()
                ], 500);
            }
        }
        
            /*** nuevo metodos  */


        private function detectRequiredLibraries(string $bladeCode): array
        {
            $libraries = [];
            
            // Patrones de detección para cada librería
            $patterns = [
                'swiper' => [
                    '/x-data=["\'].*swiper/i',
                    '/Swiper/i',
                    '/swiper-/i',
                    '/\.swiper\b/i'
                ],
                'gsap' => [
                    '/x-data=["\'].*gsap/i',
                    '/gsap\./i',
                    '/GSAP/i',
                    '/\.to\(/i',
                    '/\.from\(/i',
                    '/\.timeline/i'
                ],
                'fullcalendar' => [
                    '/FullCalendar/i',
                    '/fullcalendar/i',
                    '/@fullcalendar/i'
                ],
                'aos' => [
                    '/AOS\./i',
                    '/aos-/i',
                    '/data-aos/i'
                ],
                'chart' => [
                    '/Chart\.js/i',
                    '/chart\.js/i',
                    '/new Chart/i',
                    '/chartjs/i'
                ]
            ];
            
            foreach ($patterns as $library => $libraryPatterns) {
                foreach ($libraryPatterns as $pattern) {
                    if (preg_match($pattern, $bladeCode)) {
                        $libraries[] = $library;
                        break; // Solo agregar una vez por librería
                    }
                }
            }
            
            return array_unique($libraries);
        }


        private function getOptimizedAssets(array $requiredLibraries): array
        {
            $allAssets = $this->getAvailableAssetsList();
            $optimizedAssets = [];
            
            foreach ($requiredLibraries as $library) {
                if (isset($allAssets[$library])) {
                    $optimizedAssets[$library] = $allAssets[$library];
                }
            }
            
            return $optimizedAssets;
        }


        private function getAvailableAssetsList(): array
        {
            return [
                'swiper' => [
                    'name' => 'Swiper',
                    'description' => 'Carrusel/Slider moderno y responsive',
                    'css' => 'https://unpkg.com/swiper/swiper-bundle.min.css',
                    'js' => 'https://unpkg.com/swiper/swiper-bundle.min.js',
                    'version' => '11.0.5',
                    'plugin' => 'SwiperPlugin',
                    'auto_detect' => true,
                    'components' => ['swiperBasic', 'swiperAdvanced', 'swiperEcommerce', 'swiperTestimonials', 'swiperHero']
                ],
                'gsap' => [
                    'name' => 'GSAP',
                    'description' => 'Librería de animaciones profesional',
                    'js' => 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
                    'version' => '3.12.2',
                    'plugin' => 'GSAPPlugin',
                    'auto_detect' => true,
                    'components' => ['gsapFade', 'gsapSlide', 'gsapScale', 'gsapText', 'gsapTimeline', 'gsapCounter', 'gsapScroll']
                ],
                'fullcalendar' => [
                    'name' => 'FullCalendar',
                    'description' => 'Calendario interactivo completo',
                    'css' => 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css',
                    'js' => 'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js',
                    'version' => '6.1.10',
                    'plugin' => 'FullCalendarPlugin',
                    'auto_detect' => true,
                    'components' => ['fullCalendarBasic', 'fullCalendarEvents']
                ],
                'aos' => [
                    'name' => 'AOS (Animate On Scroll)',
                    'description' => 'Animaciones activadas por scroll',
                    'css' => 'https://unpkg.com/aos@2.3.1/dist/aos.css',
                    'js' => 'https://unpkg.com/aos@2.3.1/dist/aos.js',
                    'version' => '2.3.1',
                    'plugin' => 'AOSPlugin',
                    'auto_detect' => true,
                    'components' => ['aosBasic']
                ],
                'chart' => [
                    'name' => 'Chart.js',
                    'description' => 'Gráficos y charts interactivos',
                    'js' => 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js',
                    'version' => '4.4.0',
                    'plugin' => 'ChartPlugin',
                    'auto_detect' => true,
                    'components' => ['chartLine', 'chartBar', 'chartPie', 'chartDoughnut']
                ],
                'dompurify' => [
                    'name' => 'DOMPurify',
                    'description' => 'Sanitización XSS (Sistema de seguridad)',
                    'js' => 'https://cdn.jsdelivr.net/npm/dompurify@3.0.5/dist/purify.min.js',
                    'version' => '3.0.5',
                    'required' => true // Siempre incluido por seguridad
                ]
            ];
        }


        private function generateOptimizedAssetTags(array $requiredLibraries): string
        {
            $tags = '';
            $assets = $this->getOptimizedAssets($requiredLibraries);
            $enableSRI = config('app.env') === 'production';
            
            // Siempre incluir DOMPurify primero (seguridad)
            $allAssets = $this->getAvailableAssetsList();
            if (isset($allAssets['dompurify'])) {
                $dompurify = $allAssets['dompurify'];
                $tags .= '<script src="' . $dompurify['js'] . '"';
                if ($enableSRI && isset($dompurify['js_integrity'])) {
                    $tags .= ' integrity="' . $dompurify['js_integrity'] . '" crossorigin="anonymous"';
                }
                $tags .= '></script>' . "\n";
            }
            
            // Generar tags para librerías requeridas
            foreach ($assets as $assetKey => $asset) {
                // CSS primero
                if (isset($asset['css'])) {
                    $tags .= '<link rel="stylesheet" href="' . $asset['css'] . '"';
                    if ($enableSRI && isset($asset['css_integrity'])) {
                        $tags .= ' integrity="' . $asset['css_integrity'] . '" crossorigin="anonymous"';
                    }
                    $tags .= '>' . "\n";
                }
                
                // JavaScript después
                if (isset($asset['js'])) {
                    $tags .= '<script src="' . $asset['js'] . '"';
                    if ($enableSRI && isset($asset['js_integrity'])) {
                        $tags .= ' integrity="' . $asset['js_integrity'] . '" crossorigin="anonymous"';
                    }
                    $tags .= '></script>' . "\n";
                }
            }
            
            return $tags;
        }


        private function generateAssetTags(array $assets): string
        {
            // Usar el nuevo método optimizado pero manteniendo la estructura del método original
            return $this->generateOptimizedAssetTags($assets);
        }



        private function getComponentSystemJS(): string
        {
            // Cargar solo el core + scripts de plugins necesarios
            $coreJS = $this->loadComponentManagerCore();
            $pluginsJS = $this->loadRequiredPlugins();
            $initJS = $this->getInitializationJS();
            
            return $coreJS . $pluginsJS . $initJS;
        }


        private function loadComponentManagerCore(): string
        {
            $coreFile = public_path('js/component-system/core/ComponentManager.js');
            
            if (file_exists($coreFile)) {
                return "\n// ComponentManager Core\n" . file_get_contents($coreFile) . "\n";
            }
            
            // Fallback básico si el archivo no existe
            return $this->getCoreComponentSystemFallback();
        }

        private function getCoreComponentSystemFallback(): string
        {
            return '
                // ComponentManager Fallback
                window.ComponentManager = {
                    activeComponents: new Map(),
                    loadedPlugins: new Set(),
                    
                    init() {
                        console.log("🚀 ComponentManager (fallback) initialized");
                        this.waitForAlpine();
                    },
                    
                    waitForAlpine() {
                        if (typeof window.Alpine !== "undefined") {
                            document.addEventListener("alpine:init", () => {
                                this.initializePlugins();
                            });
                        } else {
                            setTimeout(() => this.waitForAlpine(), 50);
                        }
                    },
                    
                    initializePlugins() {
                        // Auto-inicializar plugins disponibles
                        const plugins = ["SwiperPlugin", "GSAPPlugin"];
                        
                        plugins.forEach(pluginName => {
                            if (window[pluginName]) {
                                try {
                                    const plugin = new window[pluginName]();
                                    plugin.init().then(() => {
                                        plugin.registerAlpineComponents();
                                        this.loadedPlugins.add(pluginName.replace("Plugin", ""));
                                        console.log(`✅ ${pluginName} loaded`);
                                    });
                                } catch (error) {
                                    console.error(`❌ Error loading ${pluginName}:`, error);
                                }
                            }
                        });
                    },
                    
                    registerComponent(type, id, element) {
                        this.activeComponents.set(id, { type, element, createdAt: Date.now() });
                        console.log(`📝 Component registered: ${type} (${id})`);
                    },
                    
                    unregisterComponent(id) {
                        this.activeComponents.delete(id);
                    },
                    
                    generateId() {
                        return "comp_" + Math.random().toString(36).substr(2, 9);
                    },
                    
                    getStats() {
                        return {
                            totalComponents: this.activeComponents.size,
                            loadedPlugins: Array.from(this.loadedPlugins),
                            version: "2.0-fallback"
                        };
                    }
                };
            ';
        }


        public function debugFiles()
        {
            $coreFile = public_path('js/component-system/core/ComponentManager.js');
            $pluginsDir = public_path('js/component-system/plugins');
            
            $result = [
                'core_exists' => file_exists($coreFile),
                'core_path' => $coreFile,
                'plugins_dir_exists' => is_dir($pluginsDir),
                'plugins_dir' => $pluginsDir,
                'available_plugins' => $this->detectAvailablePlugins(),
                'public_path' => public_path(),
            ];
            
            return response()->json($result);
        }

        /**
         * Cargar plugins requeridos basado en detección automática
         */
        private function loadRequiredPlugins(): string
        {
            $js = '';
            
            // Detectar qué plugins están disponibles
            $availablePlugins = $this->detectAvailablePlugins();
            
            foreach ($availablePlugins as $plugin) {
                $pluginFile = public_path("js/component-system/plugins/{$plugin}.js");
                
                if (file_exists($pluginFile)) {
                    $js .= "\n// {$plugin}\n";
                    $js .= file_get_contents($pluginFile) . "\n";
                }
            }
            
            return $js;
        }

        /**
         * Detectar plugins disponibles en el directorio
         */
        private function detectAvailablePlugins(): array
        {
            $pluginsDir = public_path('js/component-system/plugins');
            $plugins = [];
            
            if (is_dir($pluginsDir)) {
                $files = glob($pluginsDir . '/*.js');
                
                foreach ($files as $file) {
                    $filename = basename($file, '.js');
                    $plugins[] = $filename;
                }
            }
            
            return $plugins;
        }


        private function getCoreComponentSystemJS(): string
        {
            return '
                // Core ComponentManager - Solo funciones esenciales
                window.ComponentSystem = {
                    activeComponents: new Map(),
                    loadedPlugins: new Set(),
                    
                    init() {
                        console.log("🚀 ComponentSystem v2.0 initialized");
                        this.waitForAlpine();
                    },
                    
                    waitForAlpine() {
                        if (typeof window.Alpine !== "undefined") {
                            this.setupAlpineIntegration();
                        } else {
                            setTimeout(() => this.waitForAlpine(), 50);
                        }
                    },
                    
                    setupAlpineIntegration() {
                        document.addEventListener("alpine:init", () => {
                            console.log("🎿 Alpine integration ready");
                            this.initializePlugins();
                        });
                    },
                    
                    initializePlugins() {
                        // Los plugins se auto-registrarán
                        console.log("📦 Initializing available plugins...");
                    },
                    
                    registerComponent(type, id, element) {
                        this.activeComponents.set(id, {
                            type,
                            element,
                            createdAt: Date.now()
                        });
                        console.log(`📝 Component registered: ${type} (${id})`);
                    },
                    
                    unregisterComponent(id) {
                        this.activeComponents.delete(id);
                    },
                    
                    generateId() {
                        return "comp_" + Math.random().toString(36).substr(2, 9);
                    },
                    
                    getStats() {
                        const stats = {
                            total: this.activeComponents.size,
                            loadedPlugins: Array.from(this.loadedPlugins),
                            version: "2.0"
                        };
                        
                        for (let [id, component] of this.activeComponents.entries()) {
                            stats[component.type] = (stats[component.type] || 0) + 1;
                        }
                        
                        return stats;
                    }
                };
            ';
        }


        private function getRequiredPluginsJS(array $requiredLibraries): string
        {
            $js = '';
            $assets = $this->getAvailableAssetsList();
            
            foreach ($requiredLibraries as $library) {
                if (isset($assets[$library]['plugin'])) {
                    $pluginName = $assets[$library]['plugin'];
                    
                    // Cargar el archivo del plugin desde public/js/component-system/plugins/
                    $pluginFile = public_path("js/component-system/plugins/{$pluginName}.js");
                    
                    if (file_exists($pluginFile)) {
                        // En desarrollo, incluir el archivo directamente
                        if (config('app.env') === 'local') {
                            $js .= "\n// {$pluginName}\n";
                            $js .= file_get_contents($pluginFile);
                        } else {
                            // En producción, incluir referencia al archivo
                            $js .= "\n// Plugin: {$pluginName} - Loaded from file\n";
                        }
                    } else {
                        // Fallback: plugins inline básicos
                        $js .= $this->getInlinePluginJS($library);
                    }
                }
            }
            
            return $js;
        }


        private function getInlinePluginJS(string $library): string
        {
            $plugins = [
                'swiper' => '
                    // SwiperPlugin básico inline
                    if (typeof window.Swiper !== "undefined") {
                        Alpine.data("swiperBasic", (config = {}) => ({
                            swiper: null,
                            config: { navigation: true, pagination: true, ...config },
                            
                            init() {
                                this.$nextTick(() => {
                                    const swiperEl = this.$el.querySelector(".swiper");
                                    if (swiperEl) {
                                        this.swiper = new Swiper(swiperEl, this.config);
                                        console.log("🎠 Basic Swiper initialized");
                                    }
                                });
                            },
                            
                            destroy() {
                                if (this.swiper) this.swiper.destroy(true, true);
                            }
                        }));
                        
                        ComponentSystem.loadedPlugins.add("swiper");
                    }
                ',
                
                'gsap' => '
                    // GSAPPlugin básico inline
                    if (typeof window.gsap !== "undefined") {
                        Alpine.data("gsapFade", (config = {}) => ({
                            config: { duration: 1, direction: "in", ...config },
                            
                            init() {
                                this.$nextTick(() => {
                                    if (this.config.direction === "in") {
                                        gsap.set(this.$el, { opacity: 0 });
                                        gsap.to(this.$el, { opacity: 1, duration: this.config.duration });
                                    }
                                    console.log("✨ Basic GSAP fade initialized");
                                });
                            }
                        }));
                        
                        ComponentSystem.loadedPlugins.add("gsap");
                    }
                '
            ];
            
            return $plugins[$library] ?? '';
        }


        private function getInitializationJS(): string
        {
            return '
                // Auto-inicialización del sistema
                if (document.readyState === "loading") {
                    document.addEventListener("DOMContentLoaded", () => {
                        if (window.ComponentManager) {
                            ComponentManager.init();
                        }
                    });
                } else {
                    if (window.ComponentManager) {
                        ComponentManager.init();
                    }
                }
                
                // Debug info
                console.log("📦 Component System loaded with plugins:", Object.keys(window).filter(key => key.endsWith("Plugin")));
            ';
        }


        public function generateComponentPreviewOptimized(string $bladeCode, array $manualAssets = [], array $testData = []): string
        {
            try {
                // 1. Detectar librerías automáticamente
                $autoDetectedLibraries = $this->detectRequiredLibraries($bladeCode);
                
                // 2. Combinar con assets manuales
                $allRequiredLibraries = array_unique(array_merge($autoDetectedLibraries, $manualAssets));
                
                // 3. Log para debug
                if (config('app.env') === 'local') {
                    Log::info('Component Preview Generation', [
                        'auto_detected' => $autoDetectedLibraries,
                        'manual_assets' => $manualAssets,
                        'final_libraries' => $allRequiredLibraries
                    ]);
                }
                
                // 4. Generar preview con assets optimizados
                return $this->generateOptimizedPreview($bladeCode, $allRequiredLibraries, $testData);
                
            } catch (\Exception $e) {
                Log::error('Component Preview Error', [
                    'error' => $e->getMessage(),
                    'line' => $e->getLine(),
                    'code_preview' => substr($bladeCode, 0, 200) . '...'
                ]);
                
                return $this->generateErrorPreview($e->getMessage());
            }
        }


        public function generateComponentPreview(string $bladeCode, array $assets = [], array $testData = []): string
        {
            // Usar el nuevo sistema si está habilitado en config
            if (config('pagebuilder.use_optimized_assets', false)) {
                return $this->generateComponentPreviewOptimized($bladeCode, $assets, $testData);
            }
            
            // Fallback al método original por compatibilidad
            try {
                $renderedContent = $this->renderBladeComponent($bladeCode, $testData);
                return $this->wrapComponentWithPreviewLayout($renderedContent, $assets);
            } catch (\Exception $e) {
                return $this->generateErrorPreview($e->getMessage());
            }
        }


        private function generateOptimizedPreview(string $bladeCode, array $requiredLibraries, array $testData = []): string
        {
            // Renderizar el componente Blade
            $renderedContent = $this->renderBladeComponent($bladeCode, $testData);
            
            // Crear layout optimizado
            return $this->wrapWithOptimizedLayout($renderedContent, $requiredLibraries);
        }


        private function renderBladeComponent(string $bladeCode, array $testData = []): string
        {
            $tempFile = storage_path('app/temp_component_' . uniqid() . '.blade.php');
            
            try {
                File::put($tempFile, $bladeCode);
                return View::file($tempFile, $testData)->render();
            } catch (\Exception $e) {
                throw new \Exception('Error rendering Blade component: ' . $e->getMessage());
            } finally {
                if (File::exists($tempFile)) {
                    File::delete($tempFile);
                }
            }
        }


        private function wrapWithOptimizedLayout(string $content, array $requiredLibraries): string
        {
            $nonce = base64_encode(random_bytes(16));
            $isDev = config('app.env') === 'local';
            
            // CSP optimizado
            $cspPolicy = $this->generateCSPPolicy($nonce, $isDev);
            
            // Assets optimizados
            $assetTags = $this->generateOptimizedAssetTags($requiredLibraries);
            
            // ComponentSystem optimizado
            $componentSystemJS = $this->getComponentSystemJS($requiredLibraries);
            
            return '<!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Component Preview - Optimized</title>
                
                <!-- CSP Policy -->
                <meta http-equiv="Content-Security-Policy" content="' . $cspPolicy . '">
                
                <!-- Core Libraries -->
                <script src="https://cdn.tailwindcss.com" nonce="' . $nonce . '"></script>
                <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" nonce="' . $nonce . '"></script>
                
                <!-- Optimized Assets (Only Required Libraries) -->
                ' . $assetTags . '
                
                <!-- Component System (Modular) -->
                <script nonce="' . $nonce . '">
                    ' . $componentSystemJS . '
                </script>
                
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; }
                    .preview-container { min-height: 50vh; }
                    .error { 
                        background: #fee; 
                        color: #c00; 
                        padding: 1rem; 
                        border-radius: 0.5rem;
                        border: 1px solid #fcc;
                    }
                    
                    /* Optimizaciones de carga */
                    .loading { opacity: 0.5; transition: opacity 0.3s; }
                    .loaded { opacity: 1; }
                </style>
            </head>
            <body class="bg-gray-50">
                <div class="preview-container p-4 loading" id="preview-container">
                    ' . $content . '
                </div>
                
                <!-- Debug Info (Solo en desarrollo) -->
                ' . ($isDev ? $this->generateDebugInfo($requiredLibraries, $nonce) : '') . '
                
                <!-- Finalización de carga -->
                <script nonce="' . $nonce . '">
                    // Marcar como cargado cuando todo esté listo
                    document.addEventListener("DOMContentLoaded", () => {
                        setTimeout(() => {
                            document.getElementById("preview-container").classList.remove("loading");
                            document.getElementById("preview-container").classList.add("loaded");
                        }, 300);
                    });
                </script>
            </body>
            </html>';
        }


        private function generateCSPPolicy(string $nonce, bool $isDev): string
        {
            $basePolicy = [
                "default-src 'self'",
                "script-src 'self' 'nonce-{$nonce}' https://cdn.tailwindcss.com https://unpkg.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
                "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.jsdelivr.net",
                "font-src 'self' data: https:",
                "img-src 'self' data: https:",
                "connect-src 'self'"
            ];
            
            if ($isDev) {
                $basePolicy[1] .= " 'unsafe-eval'"; // Solo en desarrollo para debugging
            }
            
            return implode('; ', $basePolicy) . ';';
        }


        private function generateDebugInfo(array $requiredLibraries, string $nonce): string
        {
            return '<script nonce="' . $nonce . '">
                console.log("🛡️ Optimized Component Preview Loaded");
                console.log("📦 Required libraries:", ' . json_encode($requiredLibraries) . ');
                console.log("🎯 Libraries status:", {
                    Swiper: typeof window.Swiper !== "undefined" ? "✅ Loaded" : "❌ Not loaded",
                    GSAP: typeof window.gsap !== "undefined" ? "✅ Loaded" : "❌ Not loaded", 
                    FullCalendar: typeof window.FullCalendar !== "undefined" ? "✅ Loaded" : "❌ Not loaded",
                    AOS: typeof window.AOS !== "undefined" ? "✅ Loaded" : "❌ Not loaded",
                    Chart: typeof window.Chart !== "undefined" ? "✅ Loaded" : "❌ Not loaded",
                    Alpine: typeof window.Alpine !== "undefined" ? "✅ Loaded" : "❌ Not loaded"
                });
                
                // Mostrar estadísticas cuando ComponentSystem esté listo
                setTimeout(() => {
                    if (window.ComponentSystem) {
                        console.log("📊 ComponentSystem Stats:", ComponentSystem.getStats());
                    }
                }, 1000);
            </script>';
        }


        private function generateErrorPreview(string $errorMessage): string
        {
            return '<!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Component Error</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { font-family: system-ui, -apple-system, sans-serif; }
                </style>
            </head>
            <body class="bg-red-50">
                <div class="min-h-screen flex items-center justify-center p-4">
                    <div class="bg-white border border-red-200 rounded-lg p-6 max-w-md w-full">
                        <div class="flex items-center mb-4">
                            <div class="bg-red-100 rounded-full p-2 mr-3">
                                <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 class="text-lg font-semibold text-red-800">Error en el Componente</h3>
                        </div>
                        <p class="text-red-700 mb-4">' . htmlspecialchars($errorMessage) . '</p>
                        <div class="text-xs text-red-500">
                            <p>• Revisa la sintaxis de tu componente Blade</p>
                            <p>• Verifica que las librerías estén disponibles</p>
                            <p>• Comprueba los datos de prueba</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>';
        }


        public function getAvailableAssets(Request $request)
        {
            $assets = $this->getAvailableAssetsList();
            
            // Filtrar información sensible en producción
            if (config('app.env') !== 'local') {
                foreach ($assets as &$asset) {
                    unset($asset['plugin']); // No exponer nombres de plugins
                }
            }
            
            return response()->json([
                'success' => true,
                'assets' => $assets,
                'auto_detection' => true,
                'version' => '2.0'
            ]);
        }


        private function validateAssetConfiguration(array $assets): bool
        {
            $availableAssets = array_keys($this->getAvailableAssetsList());
            
            foreach ($assets as $asset) {
                if (!in_array($asset, $availableAssets)) {
                    return false;
                }
            }
            
            return true;
        }


        public function getLibraryUsageStats()
        {
            // Esto podría implementarse para tracking de uso
            $components = Component::where('is_advanced', true)
                ->where('is_active', true)
                ->get();
            
            $libraryUsage = [];
            
            foreach ($components as $component) {
                $detectedLibraries = $this->detectRequiredLibraries($component->blade_template);
                
                foreach ($detectedLibraries as $library) {
                    $libraryUsage[$library] = ($libraryUsage[$library] ?? 0) + 1;
                }
            }
            
            return response()->json([
                'success' => true,
                'usage_stats' => $libraryUsage,
                'total_components' => $components->count()
            ]);
        }


        

        

}