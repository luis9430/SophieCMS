<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
        $table->id();
        $table->string('title');
        $table->string('slug');
        $table->json('content'); 
        $table->longText('rendered_content')->nullable();
        $table->timestamp('last_rendered_at')->nullable(); 
        $table->unsignedBigInteger('layout_id')->nullable();
        $table->json('template_assignments')->nullable();
        $table->json('page_variables')->nullable();
        $table->string('status')->default('draft');
        $table->timestamps();
        $table->foreign('layout_id')->references('id')->on('templates');
    });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
