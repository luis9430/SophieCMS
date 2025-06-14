<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PageBuilderController;
use App\Http\Controllers\EditorController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\VariableController;


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

    Route::prefix('api')->group(function () {
 // Templates
    Route::get('/templates', [TemplateController::class, 'index']);
    Route::get('/templates/metadata', [TemplateController::class, 'metadata']);
    Route::get('/templates/type/{type}', [TemplateController::class, 'byType']);
    Route::post('/templates', [TemplateController::class, 'store']);
    Route::get('/templates/{template}', [TemplateController::class, 'show']);
    Route::put('/templates/{template}', [TemplateController::class, 'update']);
    Route::delete('/templates/{template}', [TemplateController::class, 'destroy']);
    Route::post('/templates/{template}/clone', [TemplateController::class, 'clone']);

    // Pages
    Route::get('/pages', [PageController::class, 'index']);
    Route::post('/pages', [PageController::class, 'store']);
    Route::get('/pages/{page}', [PageController::class, 'show']);
    Route::put('/pages/{page}', [PageController::class, 'update']);
    Route::delete('/pages/{page}', [PageController::class, 'destroy']);
    Route::get('/pages/{page}/render', [PageController::class, 'render']);
    Route::post('/pages/{page}/publish', [PageController::class, 'publish']);
    Route::post('/pages/{page}/unpublish', [PageController::class, 'unpublish']);
    Route::post('/pages/{page}/assign-template', [PageController::class, 'assignTemplate']);
    Route::post('/pages/{page}/remove-template', [PageController::class, 'removeTemplate']);

    
        // Variables
        Route::prefix('variables')->group(function () {
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

     });

});



// O si prefieres que esté en las rutas API:
Route::prefix('api/admin')->group(function () {
    // NUEVA: Ruta para preview de templates en API
    Route::post('/page-builder/preview-template', [PageBuilderController::class, 'previewTemplate'])
        ->name('api.page-builder.preview-template');
});


// Variables API Routes

    // CRUD básico
  


