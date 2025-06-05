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
});