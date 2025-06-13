<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // 'layout', 'header', 'footer', etc.
            $table->longText('content'); // 📝 HTML/Liquid como texto plano
            $table->json('variables')->nullable(); // 📋 Documentación de variables
            $table->text('description')->nullable(); // 📝 Descripción del template
            $table->string('category')->nullable(); // 📁 Categoría
            $table->boolean('is_global')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();
            $table->index(['type', 'is_global']);
            $table->index(['category', 'is_active']);
            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    public function down()
    {
        Schema::dropIfExists('templates');
    }
};