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
use App\Services\ComponentPreviewService;




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


        private function getComponentSystemJS(): string
        {
            // Cargar solo el core + scripts de plugins necesarios
            $coreJS = $this->loadComponentManagerCore();
            $pluginsJS = $this->loadRequiredPlugins();
            $initJS = $this->getInitializationJS();
            
            return $coreJS . $pluginsJS . $initJS;
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


        public function previewWindow(Component $component)
        {
            try {
                // Datos de prueba por defecto
                $testData = [
                    'title' => 'Vista Previa del Componente',
                    'description' => 'Esta es la vista previa del componente en ventana nueva.',
                    'content' => 'Contenido de ejemplo para verificar el componente.',
                    'image' => 'https://picsum.photos/400/200?random=1',
                    'button_text' => 'Botón de Ejemplo',
                    'link' => '#ejemplo',
                    'author' => 'Autor de Ejemplo',
                    'date' => now()->format('d/m/Y'),
                    'price' => '$99.99',
                    'category' => 'Categoría Ejemplo',
                    'slides' => [
                        ['title' => 'Slide 1', 'content' => 'Contenido del primer slide', 'image' => 'https://picsum.photos/400/200?random=2'],
                        ['title' => 'Slide 2', 'content' => 'Contenido del segundo slide', 'image' => 'https://picsum.photos/400/200?random=3'],
                        ['title' => 'Slide 3', 'content' => 'Contenido del tercer slide', 'image' => 'https://picsum.photos/400/200?random=4']
                    ],
                    'items' => [
                        ['name' => 'Item 1', 'value' => 'Valor 1'],
                        ['name' => 'Item 2', 'value' => 'Valor 2'],
                        ['name' => 'Item 3', 'value' => 'Valor 3']
                    ]
                ];

                // Renderizar el componente con datos de prueba
                $renderedComponent = $this->renderComponentSafely($component->blade_template, $testData);

                // Detectar librerías requeridas automáticamente
                $requiredLibraries = $this->detectRequiredLibrariesFromCode($component->blade_template);

                return view('component-preview.window', [
                    'component' => $component,
                    'renderedComponent' => $renderedComponent,
                    'requiredLibraries' => $requiredLibraries,
                    'testData' => $testData
                ]);

            } catch (\Exception $e) {
                \Log::error('Preview window error', [
                    'component_id' => $component->id,
                    'error' => $e->getMessage()
                ]);

                return view('component-preview.error', [
                    'error' => $e->getMessage(),
                    'component' => $component
                ]);
            }
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

         public function preview(Request $request, Component $component)
        {
            try {
                $testData = $request->input('test_data', []);
                
                Log::info('🔍 Test Data enviado: ' . json_encode($testData));
                Log::info('🔍 Props configurados: ' . json_encode($component->props_schema ?? []));
                
                // ✅ TODO el procesamiento delegado al Service
                $html = app(ComponentPreviewService::class)->generatePreview(
                    $component->blade_template, 
                    $testData
                );
                
                Log::info('🔍 Preview generado exitosamente');
                
                // ✅ CSP dinámico según entorno
                $csp = app()->environment('local') 
                    ? "default-src *; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; connect-src *;"
                    : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:;";
                
                return response($html)
                    ->header('Content-Type', 'text/html; charset=utf-8')
                    ->header('X-Frame-Options', 'SAMEORIGIN')
                    ->header('Content-Security-Policy', $csp);
                    
            } catch (\Exception $e) {
                Log::error('Error generating preview: ' . $e->getMessage());
                
                return response(view('component-preview.error', [
                    'errorMessage' => 'Error al generar preview: ' . $e->getMessage()
                ])->render())
                    ->header('Content-Type', 'text/html; charset=utf-8')
                    ->header('Content-Security-Policy', 
                        "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:;"
                    );
            }
        }
        

        /**
         * Obtener información completa de assets disponibles (para el Asset Manager)
         */
        public function getAvailableAssets()
        {
            $assets = [
                'gsap' => [
                    'name' => 'GSAP',
                    'description' => 'Librería de animaciones profesional',
                    'category' => 'animations',
                    'size' => '128KB',
                    'version' => '3.12.x',
                    'components' => ['Fade', 'Slide', 'Scale', 'Timeline', 'ScrollTrigger'],
                    'patterns' => ['x-data="gsapFade"', 'x-data="gsapSlider"', 'gsap.to()']
                ],
                'swiper' => [
                    'name' => 'Swiper',
                    'description' => 'Carrusel/Slider moderno y táctil',
                    'category' => 'sliders',
                    'size' => '156KB',
                    'version' => '11.x',
                    'components' => ['Basic Slider', 'Navigation', 'Pagination', 'Autoplay'],
                    'patterns' => ['x-data="swiperBasic"', 'new Swiper()', 'swiper-slide']
                ],
                'fullcalendar' => [
                    'name' => 'FullCalendar',
                    'description' => 'Calendario completo y personalizable',
                    'category' => 'widgets',
                    'size' => '280KB',
                    'version' => '6.x',
                    'components' => ['Month View', 'Week View', 'Day View', 'Event Management'],
                    'patterns' => ['x-data="calendar"', 'new FullCalendar()']
                ],
                'aos' => [
                    'name' => 'AOS',
                    'description' => 'Animate On Scroll library',
                    'category' => 'animations',
                    'size' => '45KB',
                    'version' => '2.3.x',
                    'components' => ['Fade', 'Slide', 'Zoom', 'Flip'],
                    'patterns' => ['data-aos="fade-up"', 'AOS.init()']
                ],
                'chartjs' => [
                    'name' => 'Chart.js',
                    'description' => 'Gráficos responsivos y animados',
                    'category' => 'data-visualization',
                    'size' => '200KB',
                    'version' => '4.x',
                    'components' => ['Line Chart', 'Bar Chart', 'Pie Chart', 'Doughnut'],
                    'patterns' => ['new Chart()', '<canvas class="chart">']
                ],
                'dompurify' => [
                    'name' => 'DOMPurify',
                    'description' => 'Sanitización XSS (Sistema de seguridad)',
                    'category' => 'security',
                    'size' => '55KB',
                    'version' => '3.x',
                    'components' => ['HTML Sanitizer', 'XSS Protection'],
                    'patterns' => ['DOMPurify.sanitize()', '{!! $content !!}']
                ]
            ];
            
            return response()->json([
                'success' => true,
                'assets' => $assets,
                'categories' => [
                    'animations' => ['gsap', 'aos'],
                    'sliders' => ['swiper'],
                    'widgets' => ['fullcalendar'],
                    'data-visualization' => ['chartjs'],
                    'security' => ['dompurify']
                ]
            ]);
        }

       
        /**
         * Renderizar componente de manera segura
         */
        private function renderComponentSafely(string $bladeCode, array $data = [])
        {
            $tempFile = storage_path('app/temp_preview_' . uniqid() . '.blade.php');
            
            try {
                File::put($tempFile, $bladeCode);
                return View::file($tempFile, $data)->render();
            } catch (\Exception $e) {
                throw new \Exception('Error al renderizar componente: ' . $e->getMessage());
            } finally {
                if (File::exists($tempFile)) {
                    File::delete($tempFile);
                }
            }
        }

        /**
         * Detectar librerías del código Blade
         */
        private function detectRequiredLibrariesFromCode(string $bladeCode): array
        {
            $libraries = [];
            
            $patterns = [
                'gsap' => ['/x-data=["\']gsap/', '/gsap\./i', '/@gsap/'],
                'swiper' => ['/x-data=["\']swiper/', '/swiper-/', '/new Swiper/i'],
                'aos' => ['/data-aos/', '/AOS\./i'],
                'fullcalendar' => ['/x-data=["\'].*calendar/', '/FullCalendar/i']
            ];

            foreach ($patterns as $library => $libraryPatterns) {
                foreach ($libraryPatterns as $pattern) {
                    if (preg_match($pattern, $bladeCode)) {
                        $libraries[] = $library;
                        break;
                    }
                }
            }

            return array_unique($libraries);
        }


                        

}