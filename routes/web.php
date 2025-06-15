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


        Route::prefix('templates')->group(function () {
            // ===================================================================
            // MÉTODOS ALPINE PRIMERO (rutas más específicas)
            // ===================================================================
            Route::get('/alpine-methods', [TemplateController::class, 'getAlpineMethods']);
            Route::get('/alpine-methods/{identifier}', [TemplateController::class, 'getAlpineMethod']);
            Route::get('/alpine-methods-stats', [TemplateController::class, 'getAlpineMethodsStats']);
            Route::post('/alpine-methods', [TemplateController::class, 'createAlpineMethod']);
            Route::put('/alpine-methods/{template}', [TemplateController::class, 'updateAlpineMethod']);
            Route::post('/{template}/generate-code', [TemplateController::class, 'generateAlpineCode']);
            Route::post('/{template}/increment-usage', [TemplateController::class, 'incrementMethodUsage']);

            // ===================================================================
            // RUTAS GENÉRICAS DE TEMPLATES DESPUÉS
            // ===================================================================
            Route::get('/', [TemplateController::class, 'index']);
            Route::get('/metadata', [TemplateController::class, 'metadata']);
            Route::get('/type/{type}', [TemplateController::class, 'byType']);
            Route::post('/', [TemplateController::class, 'store']);
            Route::get('/{template}', [TemplateController::class, 'show']); // Esta era la que causaba conflicto
            Route::put('/{template}', [TemplateController::class, 'update']);
            Route::delete('/{template}', [TemplateController::class, 'destroy']);
            Route::post('/{template}/clone', [TemplateController::class, 'clone']);
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



