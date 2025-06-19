<?php

use App\Http\Controllers\PageBuilderController;
use App\Http\Controllers\PageController;

// Rutas del Page Builder
Route::prefix('admin')->group(function () {    
    Route::get('/page-builder', [PageBuilderController::class, 'index'])
        ->name('page-builder.index');
    
    Route::get('/page-builder/{page}/edit', [PageBuilderController::class, 'edit'])
        ->name('page-builder.edit');
    
    Route::post('/page-builder/create', [PageBuilderController::class, 'create'])
        ->name('page-builder.create');
});

// API Routes para el Page Builder
Route::middleware(['auth'])->prefix('api')->group(function () {
    // Pages
    Route::post('/pages/{page}/save', [PageBuilderController::class, 'save']);
    Route::post('/pages/{page}/publish', [PageBuilderController::class, 'publish']);
    Route::post('/pages/{page}/unpublish', [PageBuilderController::class, 'unpublish']);
    Route::post('/pages/{page}/duplicate', [PageBuilderController::class, 'duplicate']);
    Route::get('/pages/{page}/export', [PageBuilderController::class, 'export']);
    
    // Components
    Route::get('/components', [PageBuilderController::class, 'getComponents']);
    Route::get('/components/{component}/template', [PageBuilderController::class, 'getComponentTemplate']);
    
    // Preview
    Route::post('/page-builder/preview', [PageBuilderController::class, 'preview']);
});

// Rutas públicas para mostrar las páginas
Route::get('/{page:slug}', [PageController::class, 'show'])
    ->where('page', '^(?!admin|api).*$') // Excluir rutas admin y api
    ->name('page.show');

