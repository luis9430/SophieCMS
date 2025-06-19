<?php

// ===================================================================
// database/migrations/xxxx_create_page_builder_tables.php
// ===================================================================

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Tabla de websites
         Schema::create('websites', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('domain')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->string('language', 10)->default('es');
            $table->string('template_name')->nullable();
            $table->json('settings')->nullable(); // Configuraciones del sitio
            $table->json('structure')->nullable(); // Estructura del page builder
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Tabla de templates
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->longText('content'); // Template Blade content
            $table->string('preview_image')->nullable();
            $table->string('category')->nullable();
            $table->json('metadata')->nullable(); // Configuraciones adicionales
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Tabla de componentes
        Schema::create('components', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('identifier')->unique(); // hero, card, button, etc.
            $table->string('category'); // layout, content, interactive
            $table->text('description')->nullable();
            $table->longText('blade_template'); // Template Blade del componente
            $table->json('default_config')->nullable(); // Configuración por defecto
            $table->string('preview_image')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Tabla de páginas
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->foreignId('website_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->nullable()->constrained()->onDelete('set null');
            $table->longText('content')->nullable(); // JSON con estructura de componentes
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->enum('status', ['draft', 'published'])->default('draft');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });

        // Tabla de componentes de página (para estructura más granular - opcional)
        Schema::create('page_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained()->onDelete('cascade');
            $table->foreignId('component_id')->constrained()->onDelete('cascade');
            $table->json('config')->nullable(); // Configuración específica del componente
            $table->integer('order')->default(0);
            $table->foreignId('parent_id')->nullable()->constrained('page_components')->onDelete('cascade');
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('page_components');
        Schema::dropIfExists('pages');
        Schema::dropIfExists('components');
        Schema::dropIfExists('templates');
        Schema::dropIfExists('websites');
    }
};