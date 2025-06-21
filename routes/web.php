<?php

use App\Http\Controllers\PageBuilderController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ComponentBuilderController;

// Rutas del Page Builder (interfaz)
Route::prefix('admin')->group(function () {   
    Route::get('/page-builder', [PageBuilderController::class, 'index'])
        ->name('page-builder.index');
    
    Route::get('/page-builder/{page}/edit', [PageBuilderController::class, 'edit'])
        ->name('page-builder.edit');
    
    Route::post('/page-builder/create', [PageBuilderController::class, 'create'])
        ->name('page-builder.create');
        
});

Route::prefix('admin/page-builder')->group(function () {
    
    // Component Builder - CRUD de componentes
    Route::get('/components', [ComponentBuilderController::class, 'index'])
        ->name('component-builder.index');
    
    Route::get('/components/create', [ComponentBuilderController::class, 'create'])
        ->name('component-builder.create');
    
    Route::get('/components/{component}/edit', [ComponentBuilderController::class, 'edit'])
        ->name('component-builder.edit');
    
    Route::post('/components', [ComponentBuilderController::class, 'store'])
        ->name('component-builder.store');
    
    Route::put('/components/{component}', [ComponentBuilderController::class, 'update'])
        ->name('component-builder.update');
    
    Route::delete('/components/{component}', [ComponentBuilderController::class, 'destroy'])
        ->name('component-builder.destroy');
    
    // Preview del componente - UNA SOLA RUTA
    Route::post('/components/{component}/preview', [ComponentBuilderController::class, 'preview'])
        ->name('component-builder.preview');
    
    // Para duplicar componente
    Route::post('/components/{component}/duplicate', [ComponentBuilderController::class, 'duplicate'])
        ->name('component-builder.duplicate');
    
    // Para obtener datos del componente en JSON
    Route::get('/components/{component}/data', [ComponentBuilderController::class, 'getComponentData'])
        ->name('component-builder.data');


    Route::post('/components/{component}/regenerate-template', [ComponentBuilderController::class, 'regenerateShortTemplate'])
        ->name('component-builder.regenerate-template');
    
    // Obtener template específico para Page Builder
    Route::get('/components/{component}/page-builder-template', [ComponentBuilderController::class, 'getPageBuilderTemplate'])
        ->name('component-builder.page-builder-template');
    
    // Vista para gestionar templates duales
    Route::get('/components/{component}/templates', [ComponentBuilderController::class, 'manageTemplates'])
        ->name('component-builder.manage-templates');
    
    // Test de template en Page Builder (página temporal)
    Route::get('/test-component', [ComponentBuilderController::class, 'testComponentInPageBuilder'])
        ->name('component-builder.test-component');

    Route::post('/components/{component}/preview-with-props', [ComponentBuilderController::class, 'previewWithProps'])
        ->name('component-builder.preview-with-props');

    // Validar template shortcode
    Route::post('/components/{component}/validate-template', [ComponentBuilderController::class, 'validateTemplate'])
        ->name('component-builder.validate-template');
        
});


Route::prefix('api/component-builder')->middleware(['auth'])->group(function () {
    
    // Preview de componente en tiempo real
    Route::post('/preview', [ComponentBuilderController::class, 'preview'])
        ->name('component-builder.preview');
    
    // Preview por ID de componente (NUEVA RUTA)
    Route::post('/components/{component}/preview', [ComponentBuilderController::class, 'previewById'])
        ->name('component-builder.preview-by-id');
    
    // Multi-component preview (para testear comunicación)
    Route::post('/preview-multi', [ComponentBuilderController::class, 'previewMulti'])
        ->name('component-builder.preview-multi');
    
    // Generar screenshot automático
    Route::post('/components/{component}/screenshot', [ComponentBuilderController::class, 'generateScreenshot'])
        ->name('component-builder.screenshot');
    
    // Obtener assets disponibles
    Route::get('/assets', [ComponentBuilderController::class, 'getAvailableAssets'])
        ->name('component-builder.assets');

    Route::post('/detect-assets', [ComponentBuilderController::class, 'detectAssets'])
    ->name('component-builder.detect-assets');

    // 📋 Assets disponibles (para el Asset Manager)
    Route::get('/available-assets', [ComponentBuilderController::class, 'getAvailableAssets'])
    ->name('component-builder.available-assets');
    
    // Validar código Blade
    Route::post('/validate', [ComponentBuilderController::class, 'validateCode'])
        ->name('component-builder.validate');
    
    // Export component
    Route::get('/components/{component}/export', [ComponentBuilderController::class, 'export'])
        ->name('component-builder.export');
});


// API Routes para el Page Builder
Route::prefix('api')->group(function () {
    // Pages - CORREGIDAS Y CON NOMBRES
    Route::post('/pages/{page}/save', [PageBuilderController::class, 'save'])
        ->name('pagebuilder.save');
    
    Route::put('/pages/{page}/update', [PageBuilderController::class, 'update'])
        ->name('pagebuilder.update');
    
    Route::post('/pages/{page}/publish', [PageBuilderController::class, 'publish'])
        ->name('pagebuilder.publish');
    
    Route::post('/pages/{page}/unpublish', [PageBuilderController::class, 'unpublish'])
        ->name('pagebuilder.unpublish');
    
    Route::post('/pages/{page}/duplicate', [PageBuilderController::class, 'duplicate'])
        ->name('pagebuilder.duplicate');
    
    Route::get('/pages/{page}/export', [PageBuilderController::class, 'export'])
        ->name('pagebuilder.export');
    
    // Components
    Route::get('/components', [PageBuilderController::class, 'getComponents'])
        ->name('pagebuilder.components');
    
    Route::get('/components/{component}/template', [PageBuilderController::class, 'getComponentTemplate'])
        ->name('pagebuilder.component.template');
    
    // Preview - CORREGIDA CON NOMBRE
    Route::match(['GET', 'POST'], '/page-builder/preview', [PageBuilderController::class, 'preview'])
        ->name('pagebuilder.preview');
});

   
Route::get('/preview/component/{component}', [ComponentBuilderController::class, 'previewWindow'])
    ->name('component.preview.window');

Route::get('/preview/component/{component}/custom', [ComponentBuilderController::class, 'previewWindowWithData'])
    ->name('component.preview.window.custom');

Route::get('/debug-component-files', [ComponentBuilderController::class, 'debugFiles']);




    // Rutas públicas para mostrar las páginas
Route::get('/{page:slug}', [PageController::class, 'show'])
    ->where('page', '^(?!admin|api).*$')
    ->name('page.show');
