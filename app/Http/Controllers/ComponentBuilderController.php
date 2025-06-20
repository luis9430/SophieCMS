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

    private function getAvailableAssetsList(): array
    {
        return [
            'gsap' => [
                'name' => 'GSAP',
                'description' => 'GreenSock Animation Platform',
                'url' => 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
                'version' => '3.12.2'
            ],
            'aos' => [
                'name' => 'AOS',
                'description' => 'Animate On Scroll',
                'url' => 'https://unpkg.com/aos@2.3.1/dist/aos.js',
                'css' => 'https://unpkg.com/aos@2.3.1/dist/aos.css',
                'version' => '2.3.1'
            ],
            'swiper' => [
                'name' => 'Swiper',
                'description' => 'Mobile touch slider',
                'url' => 'https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.js',
                'css' => 'https://cdn.jsdelivr.net/npm/swiper@10/swiper-bundle.min.css',
                'version' => '10.0.0'
            ]
        ];
    }

    /**
     * Actualizar componente
     */
    public function update(Request $request, Component $component)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'identifier' => 'required|string|max:255|unique:components,identifier,' . $component->id,
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

            // Incrementar versión si cambió el template
            $newVersion = $component->version;
            if ($component->blade_template !== $validated['blade_template']) {
                $newVersion = $this->incrementVersion($component->version);
            }

            $component->update([
                'name' => $validated['name'],
                'identifier' => $validated['identifier'],
                'category' => $validated['category'],
                'description' => $validated['description'] ?? '',
                'blade_template' => $validated['blade_template'],
                'external_assets' => $validated['external_assets'] ?? [],
                'communication_config' => $validated['communication_config'] ?? [],
                'props_schema' => $validated['props_schema'] ?? [],
                'preview_config' => $validated['preview_config'] ?? [],
                'last_edited_at' => now(),
                'version' => $newVersion,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Componente actualizado exitosamente',
                'component' => $component->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al actualizar: ' . $e->getMessage()
            ], 422);
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

    /**
     * Duplicar componente
     */
    public function duplicate(Component $component)
    {
        $newComponent = $component->replicate();
        $newComponent->name = $component->name . ' (Copia)';
        $newComponent->identifier = $component->identifier . '-copy-' . time();
        $newComponent->created_by_user_id = Auth::id();
        $newComponent->last_edited_at = now();
        $newComponent->version = '1.0.0';
        $newComponent->preview_image = null;
        $newComponent->save();

        return response()->json([
            'success' => true,
            'message' => 'Componente duplicado exitosamente',
            'component' => $newComponent
        ]);
    }

    /**
     * Preview de componente en tiempo real
     */
        public function preview(Request $request)
        {
            try {
                $content = $request->input('component_code', '');
                $externalAssets = $request->input('external_assets', []);
                $testData = $request->input('test_data', []);

                // Verificar que el contenido no esté vacío
                if (empty(trim($content))) {
                    return response()->json([
                        'success' => true,
                        'html' => '<div class="p-8 text-center text-gray-500">El código del componente está vacío</div>'
                    ]);
                }

                // Generar HTML con assets
                $html = $this->generateComponentPreviewSafe($content, $externalAssets, $testData);

                return response()->json([
                    'success' => true,
                    'html' => $html
                ]);

            } catch (\Exception $e) {
                \Log::error('Preview error', [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]);

                return response()->json([
                    'success' => false,
                    'error' => 'Error en preview: ' . $e->getMessage()
                ]);
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
     * Obtener assets disponibles
     */
    public function getAvailableAssets()
    {
        return response()->json([
            'success' => true,
            'assets' => $this->getAvailableAssetsList()
        ]);
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

    /**
     * Métodos privados helper
     */
    private function validateBladeCode(string $code): void
    {
        // Validaciones básicas de seguridad
        if (strpos($code, '<?php') !== false || strpos($code, '<?=') !== false) {
            throw new \Exception('No se permite código PHP directo en los componentes');
        }

        // Crear archivo temporal para validar sintaxis
        $tempFile = storage_path('app/temp_component_' . uniqid() . '.blade.php');
        
        try {
            File::put($tempFile, $code);
            
            // Intentar compilar la vista para validar sintaxis
            View::file($tempFile, [])->render();
            
        } catch (\Exception $e) {
            throw new \Exception('Error de sintaxis Blade: ' . $e->getMessage());
        } finally {
            if (File::exists($tempFile)) {
                File::delete($tempFile);
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
                    
                    file_put_contents($tempFile, $code);
                    
                    if (!file_exists($tempFile)) {
                        throw new \Exception('No se pudo crear el archivo temporal');
                    }
                    
                    $renderedComponent = \View::file($tempFile, $testData)->render();
                    
                    return $this->wrapComponentWithPreviewLayout($renderedComponent, $assets);
                    
                } catch (\Exception $e) {
                    \Log::error('Error in generateComponentPreviewSafe', [
                        'error' => $e->getMessage(),
                        'temp_dir' => $tempDir,
                        'temp_file' => $tempFile,
                        'dir_exists' => is_dir($tempDir),
                        'dir_writable' => is_writable($tempDir)
                    ]);
                    
                    // Fallback: usar eval (menos seguro pero funciona)
                    return $this->generatePreviewWithoutFile($code, $assets, $testData);
                    
                } finally {
                    if (isset($tempFile) && file_exists($tempFile)) {
                        unlink($tempFile);
                    }
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
            
            return '<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Component Preview</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
            ' . $assetTags . '
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; }
                .preview-container { min-height: 50vh; }
            </style>
        </head>
        <body class="bg-gray-50">
            <div class="preview-container p-4">
                ' . $content . '
            </div>
        </body>
        </html>';
        }

        private function generateAssetTags(array $assets): string
        {
            $tags = '';
            $availableAssets = $this->getAvailableAssetsList();
            
            foreach ($assets as $assetKey) {
                if (isset($availableAssets[$assetKey])) {
                    $asset = $availableAssets[$assetKey];
                    
                    // Agregar CSS si existe
                    if (isset($asset['css'])) {
                        $tags .= '<link rel="stylesheet" href="' . $asset['css'] . '">' . "\n";
                    }
                    
                    // Agregar JS
                    if (isset($asset['url'])) {
                        $tags .= '<script src="' . $asset['url'] . '"></script>' . "\n";
                    }
                }
            }
            
            return $tags;
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
        $parts = explode('.', $version);
        $parts[2] = (int)$parts[2] + 1;
        return implode('.', $parts);
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

}