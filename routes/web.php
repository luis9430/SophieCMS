<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PageBuilderController;

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
