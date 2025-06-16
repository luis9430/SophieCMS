<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PageBuilderController;
use App\Http\Controllers\EditorController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\VariableController;
use App\Http\Controllers\PageController;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('admin')->group(function () {
    Route::get('/page-builder', [PageBuilderController::class, 'index'])->name('page-builder.index');
    Route::post('/page-builder/preview', [PageBuilderController::class, 'preview'])->name('page-builder.preview');
    Route::post('/page-builder/save', [PageBuilderController::class, 'save'])->name('page-builder.save');
    
    // Rutas para el editor de código Monaco
    Route::get('/page-builder/block-template', [PageBuilderController::class, 'getBlockTemplate'])->name('page-builder.get-template');
    Route::post('/page-builder/preview-template', [PageBuilderController::class, 'previewBlockTemplate'])->name('page-builder.preview-template');
    Route::post('/page-builder/update-template', [PageBuilderController::class, 'updateBlockTemplate'])->name('page-builder.update-template');
    
    Route::get('/page-builder-preact', function () {
        return view('page-builder.preact');
    })->name('page-builder.preact');
});

Route::get('/editor', [EditorController::class, 'index'])
    ->middleware('auth')
    ->name('editor');

// ===================================================================
// API ROUTES - ORGANIZADAS Y COMPLETAS
// ===================================================================

Route::prefix('api')->group(function () {
    
    // ===================================================================
    // VARIABLES API - TODAS LAS RUTAS NECESARIAS
    // ===================================================================
    Route::prefix('variables')->group(function () {
        // CRUD básico
        Route::get('/', [VariableController::class, 'index']);
        Route::post('/', [VariableController::class, 'store']);
        Route::get('/{id}', [VariableController::class, 'show']);
        Route::put('/{id}', [VariableController::class, 'update']);
        Route::delete('/{id}', [VariableController::class, 'destroy']);
        
        // Endpoints especiales
        Route::get('/categories/list', [VariableController::class, 'categories']);
        Route::post('/test', [VariableController::class, 'test']);
        Route::post('/{id}/refresh', [VariableController::class, 'refresh']);
        Route::get('/resolve/{key}', [VariableController::class, 'resolve']);
        Route::get('/resolved/all', [VariableController::class, 'resolved']);
        
        // Cache management
        Route::delete('/cache/clear', [VariableController::class, 'clearCache']);
        Route::get('/cache/info', [VariableController::class, 'cacheInfo']);
    });

    // ===================================================================
    // TEMPLATES API - REORGANIZADA CON PREACT COMPONENTS
    // ===================================================================
    Route::prefix('templates')->group(function () {
        
        // ===================================================================
        // 🎨 COMPONENTES PREACT (NUEVAS RUTAS - PRIORIDAD ALTA)
        // ===================================================================
        Route::prefix('preact-components')->group(function () {
            // Obtener todos los componentes Preact
            Route::get('/', [TemplateController::class, 'getPreactComponents'])
                 ->name('api.templates.preact-components.index');
            
            // Estadísticas de componentes Preact
            Route::get('/stats', [TemplateController::class, 'getPreactComponentsStats'])
                 ->name('api.templates.preact-components.stats');
            
            // Generar ejemplo de componente
            Route::post('/generate-example', [TemplateController::class, 'generatePreactComponentExample'])
                 ->name('api.templates.preact-components.generate-example');
            
            // Crear nuevo componente Preact
            Route::post('/', [TemplateController::class, 'storePreactComponent'])
                 ->name('api.templates.preact-components.store');
            
            // Obtener un componente Preact específico
            Route::get('/{template}', [TemplateController::class, 'getPreactComponent'])
                 ->where('template', '[0-9]+')
                 ->name('api.templates.preact-components.show');
            
            // Actualizar componente Preact
            Route::put('/{template}', [TemplateController::class, 'updatePreactComponent'])
                 ->where('template', '[0-9]+')
                 ->name('api.templates.preact-components.update');
            
            // Duplicar componente Preact
            Route::post('/{template}/duplicate', [TemplateController::class, 'duplicatePreactComponent'])
                 ->where('template', '[0-9]+')
                 ->name('api.templates.preact-components.duplicate');
            
            // Incrementar contador de uso
            Route::post('/{template}/increment-usage', [TemplateController::class, 'incrementPreactComponentUsage'])
                 ->where('template', '[0-9]+')
                 ->name('api.templates.preact-components.increment-usage');
            
            // Eliminar componente Preact (con permisos)
            Route::delete('/{template}', [TemplateController::class, 'destroy'])
                 ->where('template', '[0-9]+')
                 ->middleware('can:delete-templates')
                 ->name('api.templates.preact-components.destroy');
        });


        // ===================================================================
        // RUTAS GENÉRICAS DE TEMPLATES (DESPUÉS DE LAS ESPECÍFICAS)
        // ===================================================================
        Route::get('/', [TemplateController::class, 'index'])
             ->name('api.templates.index');
        
        Route::get('/metadata', [TemplateController::class, 'metadata'])
             ->name('api.templates.metadata');
        
        Route::get('/type/{type}', [TemplateController::class, 'byType'])
             ->name('api.templates.by-type');
        
        Route::post('/', [TemplateController::class, 'store'])
             ->name('api.templates.store');
        
        Route::get('/{template}', [TemplateController::class, 'show'])
             ->where('template', '[0-9]+')
             ->name('api.templates.show');
        
        Route::put('/{template}', [TemplateController::class, 'update'])
             ->where('template', '[0-9]+')
             ->name('api.templates.update');
        
        Route::delete('/{template}', [TemplateController::class, 'destroy'])
             ->where('template', '[0-9]+')
             ->name('api.templates.destroy');
        
        Route::post('/{template}/clone', [TemplateController::class, 'clone'])
             ->where('template', '[0-9]+')
             ->name('api.templates.clone');
        
        // Rutas adicionales de templates
        Route::post('/{template}/generate-code', [TemplateController::class, 'generateAlpineCode'])
             ->where('template', '[0-9]+')
             ->name('api.templates.generate-code');
        
        Route::post('/{template}/increment-usage', [TemplateController::class, 'incrementMethodUsage'])
             ->where('template', '[0-9]+')
             ->name('api.templates.increment-usage');
    });

    // ===================================================================
    // PAGES API
    // ===================================================================
    Route::prefix('pages')->group(function () {
        Route::get('/', [PageController::class, 'index']);
        Route::post('/', [PageController::class, 'store']);
        Route::get('/{page}', [PageController::class, 'show']);
        Route::put('/{page}', [PageController::class, 'update']);
        Route::delete('/{page}', [PageController::class, 'destroy']);
        Route::get('/{page}/render', [PageController::class, 'render']);
        Route::post('/{page}/publish', [PageController::class, 'publish']);
        Route::post('/{page}/unpublish', [PageController::class, 'unpublish']);
        Route::post('/{page}/assign-template', [PageController::class, 'assignTemplate']);
        Route::post('/{page}/remove-template', [PageController::class, 'removeTemplate']);
    });

    // ===================================================================
    // PAGE BUILDER API ADICIONAL
    // ===================================================================
    Route::prefix('admin')->group(function () {
        // Ruta para preview de templates en API
        Route::post('/page-builder/preview-template', [PageBuilderController::class, 'previewTemplate'])
            ->name('api.page-builder.preview-template');
    });
});

// ===================================================================
// 🔄 RUTAS DE MIGRACIÓN Y UTILIDADES
// ===================================================================
Route::prefix('admin/migration')->middleware('auth')->group(function () {
    
    // Vista de migración Alpine → Preact
    Route::get('/alpine-to-preact', function () {
        $alpineComponents = \App\Models\Template::where('type', 'alpine_method')->count();
        $preactComponents = \App\Models\Template::where('type', 'preact_component')->count();
        
        return view('admin.migration.alpine-to-preact', compact('alpineComponents', 'preactComponents'));
    })->name('admin.migration.alpine-to-preact');
    
    // Proceso de migración masiva
    Route::post('/alpine-to-preact/batch', function (\Illuminate\Http\Request $request) {
        $templateIds = $request->input('template_ids', []);
        $migrated = [];
        $errors = [];
        
        foreach ($templateIds as $templateId) {
            try {
                $template = \App\Models\Template::findOrFail($templateId);
                // Aquí iría la lógica de migración
                $migrated[] = $template->id;
            } catch (\Exception $e) {
                $errors[] = ['id' => $templateId, 'error' => $e->getMessage()];
            }
        }
        
        return response()->json([
            'success' => true,
            'migrated' => $migrated,
            'errors' => $errors
        ]);
    })->name('admin.migration.alpine-to-preact.batch');
    
    // Reporte de migración
    Route::get('/alpine-to-preact/report', function () {
        $report = [
            'alpine_components' => \App\Models\Template::where('type', 'alpine_method')->count(),
            'preact_components' => \App\Models\Template::where('type', 'preact_component')->count(),
            'migration_candidates' => \App\Models\Template::where('type', 'alpine_method')
                                                        ->where('is_active', true)
                                                        ->count(),
            'total_usage' => \App\Models\Template::whereIn('type', ['alpine_method', 'preact_component'])
                                                ->sum('usage_count')
        ];
        
        return response()->json([
            'success' => true,
            'data' => $report
        ]);
    })->name('admin.migration.alpine-to-preact.report');
});

// ===================================================================
// 📊 RUTAS DE DESARROLLO Y DEBUG (solo en development)
// ===================================================================
if (app()->environment('local', 'development')) {
    Route::prefix('dev/preact-components')->group(function () {
        
        // Playground para testing de componentes
        Route::get('/playground', function () {
            return view('dev.preact-playground');
        })->name('dev.preact-components.playground');
        
        // API para testing de renderizado
        Route::post('/test-render', function (\Illuminate\Http\Request $request) {
            $code = $request->input('code');
            $props = $request->input('props', []);
            
            // Aquí podrías usar Node.js o un servicio para renderizar SSR
            return response()->json([
                'success' => true,
                'rendered' => '<!-- SSR no implementado aún -->',
                'code' => $code,
                'props' => $props,
                'timestamp' => now()->toISOString()
            ]);
        })->name('dev.preact-components.test-render');
        
        // Debug info del sistema
        Route::get('/debug', function () {
            $info = [
                'system' => [
                    'php_version' => PHP_VERSION,
                    'laravel_version' => app()->version(),
                    'environment' => app()->environment(),
                    'debug_mode' => config('app.debug')
                ],
                'templates' => [
                    'total_preact_components' => \App\Models\Template::where('type', 'preact_component')->count(),
                    'total_alpine_methods' => \App\Models\Template::where('type', 'alpine_method')->count(),
                    'total_templates' => \App\Models\Template::count(),
                ],
                'categories' => \App\Models\Template::CATEGORIES,
                'recent_components' => \App\Models\Template::where('type', 'preact_component')
                                                         ->latest()
                                                         ->limit(5)
                                                         ->get(['id', 'name', 'category', 'created_at']),
                'migration_status' => [
                    'alpine_to_migrate' => \App\Models\Template::where('type', 'alpine_method')->count(),
                    'already_preact' => \App\Models\Template::where('type', 'preact_component')->count()
                ]
            ];
            
            return response()->json($info);
        })->name('dev.preact-components.debug');
        
        // Limpiar cache de desarrollo
        Route::post('/clear-cache', function () {
            // Limpiar varios tipos de cache
            \Illuminate\Support\Facades\Cache::forget('templates');
            \Illuminate\Support\Facades\Cache::forget('preact-components');
            
            return response()->json([
                'success' => true,
                'message' => 'Cache limpiado exitosamente'
            ]);
        })->name('dev.preact-components.clear-cache');
    });
}