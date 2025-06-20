<?php

use App\Http\Controllers\PageBuilderController;
use App\Http\Controllers\PageController;

// Rutas del Page Builder (interfaz)
Route::prefix('admin')->group(function () {   
    Route::get('/page-builder', [PageBuilderController::class, 'index'])
        ->name('page-builder.index');
    
    Route::get('/page-builder/{page}/edit', [PageBuilderController::class, 'edit'])
        ->name('page-builder.edit');
    
    Route::post('/page-builder/create', [PageBuilderController::class, 'create'])
        ->name('page-builder.create');
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

// Rutas públicas para mostrar las páginas
Route::get('/{page:slug}', [PageController::class, 'show'])
    ->where('page', '^(?!admin|api).*$')
    ->name('page.show');