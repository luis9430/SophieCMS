{{-- resources/views/component-builder/edit.blade.php --}}
@extends('layouts.page-builder')

@section('title', 'Editar Componente: ' . $component->name)

@section('custom-styles')
<style>
    .code-editor { font-family: 'Fira Code', 'Monaco', 'Consolas', monospace; }
</style>
@endsection

@section('content')
<div x-data="componentEditor()" x-init="init()" class="h-screen flex flex-col bg-gray-50">
    
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
                <a href="{{ route('component-builder.index') }}" 
                   class="text-gray-600 hover:text-gray-900">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                </a>
                <div>
                    <h1 class="text-xl font-semibold text-gray-900">{{ $component->name }}</h1>
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                        <span>v{{ $component->version }}</span>
                        <span>•</span>
                        <span>{{ ucfirst($component->category) }}</span>
                        <span>•</span>
                        <span>{{ $component->last_edited_at?->diffForHumans() ?? 'Nunca editado' }}</span>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <!-- Save Button -->
                <button @click="saveComponent()" 
                        :disabled="isSaving"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    <svg x-show="!isSaving" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h8m0 0h2a2 2 0 002-2V9a2 2 0 00-2-2h-2m0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0h8"></path>
                    </svg>
                    <svg x-show="isSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                    </svg>
                    <span x-text="isSaving ? 'Guardando...' : hasChanges ? 'Guardar Cambios' : 'Guardado'"></span>
                </button>
            </div>
        </div>
    </div>

    <!-- Auto-save indicator -->
    <div x-show="autoSaving" 
         x-transition
         class="bg-yellow-100 border-b border-yellow-200 px-6 py-2 text-sm text-yellow-800">
        <div class="flex items-center gap-2">
            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
            </svg>
            Auto-guardando cambios...
        </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
        
        <!-- Sidebar con configuración -->
        <div class="w-84 bg-white border-r border-gray-200 flex flex-col">
            
            <!-- Tabs -->
            <div class="border-b border-gray-200">
                <nav class="flex">
                    <button @click="activeTab = 'basic'" 
                            :class="activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
                        Básico
                    </button>
                    <button @click="activeTab = 'variables'" 
                            :class="activeTab === 'variables' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
                        Props
                    </button>
                    <button @click="activeTab = 'communication'" 
                            :class="activeTab === 'communication' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
                        Comunicación
                    </button>
                </nav>
            </div>

            <!-- Tab Content -->
            <div class="flex-1 overflow-y-auto p-4">
                
                <!-- Basic Tab -->
                <div x-show="activeTab === 'basic'" class="space-y-4">
                    <!-- Version info -->
                    <div class="bg-blue-50 p-3 rounded-lg text-sm">
                        <div class="font-medium text-blue-900">Versión {{ $component->version }}</div>
                        <div class="text-blue-700">Creado {{ $component->created_at->diffForHumans() }}</div>
                        <div class="text-blue-700">ID: {{ $component->identifier }}</div>
                    </div>

                    <!-- Name -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Componente *
                        </label>
                        <input type="text" 
                               x-model="component.name" 
                               @input="markAsChanged()"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>

                    <!-- Identifier (readonly) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Identificador
                        </label>
                        <input type="text" 
                               x-model="component.identifier"
                               readonly
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm">
                        <p class="text-xs text-gray-500 mt-1">El identificador no se puede cambiar después de crear el componente</p>
                    </div>

                    <!-- Category -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Categoría *
                        </label>
                        <select x-model="component.category" 
                                @change="markAsChanged()"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            @foreach($categories as $key => $label)
                                <option value="{{ $key }}">{{ $label }}</option>
                            @endforeach
                        </select>
                    </div>

                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea x-model="component.description" 
                                  @input="markAsChanged()"
                                  rows="3"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>

                    <!-- Usage example -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Uso en Page Builder
                        </label>
                        <div class="bg-gray-100 p-3 rounded-lg">
                            <code class="text-sm font-mono">&lt;x-page-builder.{{ $component->identifier }} /&gt;</code>
                        </div>
                    </div>
                </div>

<!-- Sección de Variables Globales actualizada para edit.blade.php -->
<!-- Reemplazar la sección existente de variables con esto: -->

                <div x-show="activeTab === 'variables'" class="space-y-4">
                    <!-- Header con controles -->
                    <div class="flex justify-between items-center">
                        <div>
                            <h4 class="text-lg font-medium text-gray-900">Variables Globales</h4>
                            <p class="text-sm text-gray-600">Variables reutilizables en todo el proyecto</p>
                        </div>
                        <div class="flex gap-2">
                            <!-- Toggle de vista -->
                            <div class="flex bg-gray-100 rounded-lg p-1">
                                <button 
                                    @click="viewMode = 'grouped'"
                                    :class="viewMode === 'grouped' ? 'bg-white shadow-sm' : ''"
                                    class="px-3 py-1 text-sm rounded transition-all"
                                    title="Vista agrupada"
                                >
                                    📂
                                </button>
                                <button 
                                    @click="viewMode = 'list'"
                                    :class="viewMode === 'list' ? 'bg-white shadow-sm' : ''"
                                    class="px-3 py-1 text-sm rounded transition-all"
                                    title="Vista lista"
                                >
                                    📋
                                </button>
                            </div>
                            
                            <button @click="addVariable()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                + Agregar Variable
                            </button>
                        </div>
                    </div>

                    <!-- Barra de filtros -->
                    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                        <!-- Búsqueda -->
                        <div class="relative">
                            <input 
                                x-model="searchTerm" 
                                type="text" 
                                placeholder="Buscar variables por nombre o descripción..."
                                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                            <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                        </div>
                        
                        <!-- Filtros de categoría -->
                        <div class="flex flex-wrap gap-2">
                            <button 
                                @click="filterByCategory('all')"
                                :class="selectedCategory === 'all' ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50'"
                                class="px-3 py-1 rounded-full text-sm font-medium border transition-all"
                            >
                                🌟 Todas (<span x-text="globalVariables.length"></span>)
                            </button>
                            
                            <template x-for="(category, key) in categories" :key="key">
                                <button 
                                    @click="filterByCategory(key)"
                                    :class="selectedCategory === key ? 'bg-blue-500 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50'"
                                    class="px-3 py-1 rounded-full text-sm font-medium border transition-all"
                                >
                                    <span x-text="category.icon"></span>
                                    <span x-text="category.label"></span>
                                    (<span x-text="getCategoryCount(key)"></span>)
                                </button>
                            </template>
                            
                            <!-- Limpiar filtros -->
                            <button 
                                @click="clearFilters()"
                                x-show="selectedCategory !== 'all' || searchTerm"
                                class="px-3 py-1 rounded-full text-sm text-red-600 hover:bg-red-50 border border-red-200 transition-all"
                            >
                                🗑️ Limpiar
                            </button>
                        </div>

                        <!-- Ordenamiento -->
                        <div class="flex items-center gap-3 text-sm">
                            <span class="text-gray-600">Ordenar por:</span>
                            <button 
                                @click="toggleSort('category')"
                                :class="sortBy === 'category' ? 'text-blue-600 font-medium' : 'text-gray-500'"
                                class="hover:text-blue-600 transition-colors"
                            >
                                Categoría 
                                <span x-show="sortBy === 'category'" x-text="sortOrder === 'asc' ? '↑' : '↓'"></span>
                            </button>
                            <button 
                                @click="toggleSort('name')"
                                :class="sortBy === 'name' ? 'text-blue-600 font-medium' : 'text-gray-500'"
                                class="hover:text-blue-600 transition-colors"
                            >
                                Nombre 
                                <span x-show="sortBy === 'name'" x-text="sortOrder === 'asc' ? '↑' : '↓'"></span>
                            </button>
                            <button 
                                @click="toggleSort('created_at')"
                                :class="sortBy === 'created_at' ? 'text-blue-600 font-medium' : 'text-gray-500'"
                                class="hover:text-blue-600 transition-colors"
                            >
                                Fecha 
                                <span x-show="sortBy === 'created_at'" x-text="sortOrder === 'asc' ? '↑' : '↓'"></span>
                            </button>
                        </div>
                    </div>

                    <!-- Vista Agrupada por Categorías -->
                    <div x-show="viewMode === 'grouped' && Object.keys(groupedVariables).length > 0" class="space-y-6">
                        <template x-for="(variables, categoryKey) in groupedVariables" :key="categoryKey">
                            <div class="border border-gray-200 rounded-lg overflow-hidden">
                                <!-- Header de categoría -->
                                <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center gap-3">
                                            <span x-text="getCategoryInfo(categoryKey).icon" class="text-xl"></span>
                                            <div>
                                                <h5 x-text="getCategoryInfo(categoryKey).label" class="font-medium text-gray-900"></h5>
                                                <p x-text="getCategoryInfo(categoryKey).description" class="text-sm text-gray-600"></p>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-2">
                                            <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                                <span x-text="variables.length"></span> variable<span x-show="variables.length !== 1">s</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Variables de la categoría -->
                                <div class="divide-y divide-gray-100">
                                    <template x-for="(variable, index) in variables" :key="variable.id || index">
                                        <div class="p-4 hover:bg-gray-50 transition-colors">
                                            <div class="grid grid-cols-12 gap-4 items-start">
                                                <!-- Nombre -->
                                                <div class="col-span-3">
                                                    <label class="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                                                    <input 
                                                        x-model="variable.name" 
                                                        type="text" 
                                                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="variable_name"
                                                    >
                                                </div>
                                                
                                                <!-- Valor -->
                                                <div class="col-span-4">
                                                    <label class="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                                                    <template x-if="variable.type === 'array'">
                                                        <textarea 
                                                            x-model="variable.value" 
                                                            rows="2"
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder='["item1", "item2"] o item1, item2'
                                                        ></textarea>
                                                    </template>
                                                    <template x-if="variable.type !== 'array'">
                                                        <input 
                                                            x-model="variable.value" 
                                                            type="text" 
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="Valor de la variable"
                                                        >
                                                    </template>
                                                </div>
                                                
                                                <!-- Tipo -->
                                                <div class="col-span-2">
                                                    <label class="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                                    <select 
                                                        x-model="variable.type" 
                                                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <option value="string">String</option>
                                                        <option value="number">Number</option>
                                                        <option value="boolean">Boolean</option>
                                                        <option value="array">Array</option>
                                                    </select>
                                                </div>

                                                <!-- Categoría -->
                                                <div class="col-span-2">
                                                    <label class="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                                                    <select 
                                                        x-model="variable.category" 
                                                        class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    >
                                                        <template x-for="(cat, key) in categories" :key="key">
                                                            <option :value="key" x-text="cat.icon + ' ' + cat.label"></option>
                                                        </template>
                                                    </select>
                                                </div>
                                                
                                                <!-- Acciones -->
                                                <div class="col-span-1 flex justify-end">
                                                    <button 
                                                        @click="removeVariable(globalVariables.findIndex(v => v === variable))" 
                                                        class="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                                                        title="Eliminar variable"
                                                    >
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <!-- Descripción -->
                                            <div class="mt-3">
                                                <label class="block text-xs font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                                                <input 
                                                    x-model="variable.description" 
                                                    type="text" 
                                                    class="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                    placeholder="Descripción de qué hace esta variable"
                                                >
                                            </div>

                                            <!-- Preview del uso -->
                                        <div class="mt-2 text-xs text-gray-500">
                                            💡 Usar en Blade: <code class="bg-gray-100 px-1 rounded font-mono">@{{ '$' }}<span x-text="variable.name || 'variable_name'"></span>@{{ '' }}</code>
                                        </div>
                                    </div>
                                    </template>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- Vista Lista (fallback) -->
                    <div x-show="viewMode === 'list' || Object.keys(groupedVariables).length === 0" class="space-y-3">
                        <template x-for="(variable, index) in filteredVariables" :key="variable.id || index">
                            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div class="grid grid-cols-12 gap-4 items-start">
                                    <!-- Badge de categoría -->
                                    <div class="col-span-1 flex justify-center">
                                        <span 
                                            :title="getCategoryInfo(variable.category).label"
                                            class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                        >
                                            <span x-text="getCategoryInfo(variable.category).icon"></span>
                                        </span>
                                    </div>
                                    
                                    <!-- Resto igual que la vista agrupada pero en col-span-11 -->
                                    <div class="col-span-11">
                                        <!-- Contenido de la variable igual que arriba -->
                                        <!-- ... (mismo HTML que en vista agrupada) -->
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>
                    
                    <!-- Empty state -->
                    <div x-show="filteredVariables.length === 0" class="text-center py-12">
                        <div class="text-gray-400 mb-4">
                            <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                            </svg>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">
                            <span x-show="searchTerm || selectedCategory !== 'all'">No se encontraron variables</span>
                            <span x-show="!searchTerm && selectedCategory === 'all'">No hay variables globales</span>
                        </h3>
                        <p class="text-gray-600 mb-4">
                            <span x-show="searchTerm || selectedCategory !== 'all'">
                                Prueba ajustando los filtros o búsqueda
                            </span>
                            <span x-show="!searchTerm && selectedCategory === 'all'">
                                Las variables globales te permiten reutilizar valores en todos tus componentes
                            </span>
                        </p>
                        <div class="space-x-3">
                            <button 
                                x-show="searchTerm || selectedCategory !== 'all'"
                                @click="clearFilters()" 
                                class="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                            <button 
                                @click="addVariable()" 
                                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                + Crear primera variable
                            </button>
                        </div>
                    </div>

                    <!-- Variables Info -->
                    <div x-show="globalVariables.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 class="text-sm font-medium text-blue-900 mb-2">💡 Guía de uso rápido:</h5>
                        <div class="text-xs text-blue-800 space-y-1">
                                <div>• En Blade: <code class="bg-blue-100 px-1 rounded font-mono">@{{ '$variable_name' }}</code></div>
                            <div>• Se incluyen automáticamente en el preview</div>
                            <div>• Perfectas para: títulos del sitio, colores, configuraciones, datos dinámicos</div>
                            <div>• <strong>Categorías:</strong> organiza por tipo de uso (diseño, contenido, SEO, etc.)</div>
                        </div>
                    </div>

                    <!-- Botón para guardar variables -->
                    <div x-show="globalVariables.length > 0" class="flex justify-end pt-4 border-t border-gray-200">
                        <button 
                            @click="saveAllVariables()" 
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Guardar Variables
                        </button>
                    </div>
                </div>
     

                <!-- Communication Tab -->
                <div x-show="activeTab === 'communication'" class="space-y-4">
                    <div class="text-sm text-gray-600 mb-4">
                        Configura cómo este componente se comunica con otros componentes en la página.
                    </div>

                    <!-- Placeholder para Fase 3 -->
                    <div class="bg-gray-50 p-6 rounded-lg text-center">
                        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Comunicación Entre Componentes</h3>
                        <p class="text-gray-600 mb-4">Esta funcionalidad estará disponible en la Fase 3 del desarrollo.</p>
                        <div class="text-sm text-gray-500">
                            <p>• Eventos personalizados</p>
                            <p>• Estado compartido</p>
                            <p>• Comunicación bidireccional</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Editor y Preview - Layout Optimizado -->
        <div class="flex-1 flex" x-data="{ previewCollapsed: false }" x-init="
            const savedCollapsed = localStorage.getItem('componentBuilderPreviewCollapsed');
            if (savedCollapsed !== null) {
                previewCollapsed = savedCollapsed === 'true';
            }
        ">
            
            <!-- Editor - Más espacio -->
            <div :class="previewCollapsed ? 'w-4/5' : 'w-3/5'" 
                 class="flex flex-col transition-all duration-300 ease-in-out">
                
                <!-- Header del Editor -->
                <div class="bg-gray-800 text-white px-4 py-2 text-sm flex items-center justify-between">
                    <span>Editor de Código Blade</span>
                    <div class="flex gap-2 text-xs">
                        <button @click="validateCode()" 
                                class="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                            Validar
                        </button>
                        <button @click="formatCode()" 
                                class="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                            Formatear
                        </button>
                        <div class="px-2 py-1 text-xs" :class="hasChanges ? 'text-yellow-300' : 'text-green-300'">
                            <span x-text="hasChanges ? '● Sin guardar' : '✓ Guardado'"></span>
                        </div>
                    </div>
                </div>
                
                <!-- Textarea del Editor -->
                <textarea x-model="component.blade_template"              
                          @input="markAsChanged()"
                          class="flex-1 bg-gray-900 text-green-400 font-mono text-sm p-4 resize-none border-0 outline-none"></textarea>
            </div>

            <!-- Preview Panel - Compacto y Retraíble -->
            <div :class="previewCollapsed ? 'w-1/5' : 'w-2/5'" 
                 class="border-l border-gray-200 transition-all duration-300 ease-in-out relative flex flex-col">
                
                <!-- Botón Toggle Preview -->
                <button @click="previewCollapsed = !previewCollapsed; localStorage.setItem('componentBuilderPreviewCollapsed', previewCollapsed)"
                        class="absolute -left-3 top-4 z-10 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                        :title="previewCollapsed ? 'Expandir Preview' : 'Colapsar Preview'">
                    <svg :class="previewCollapsed ? 'rotate-180' : ''" 
                         class="w-3 h-3 transition-transform duration-300" 
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                    </svg>
                </button>
                
                <!-- Preview Expandido -->
                <div x-show="!previewCollapsed" 
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0 transform scale-95"
                     x-transition:enter-end="opacity-100 transform scale-100"
                     x-transition:leave="transition ease-in duration-200"
                     x-transition:leave-start="opacity-100 transform scale-100"
                     x-transition:leave-end="opacity-0 transform scale-95"
                     class="flex flex-col h-full">
                    
                    <!-- Header Preview -->
                    <div class="bg-gray-100 px-4 py-2 text-sm flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <span>Preview</span>
                            <span class="text-xs text-gray-500">(Nueva Ventana recomendada)</span>
                        </div>
                        
                        <div class="flex items-center gap-2">
                            <button @click="openPreviewWindow()" 
                                    class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                                🪟 Abrir Preview
                            </button>
                        </div>
                    </div>
                    
                    <!-- Área de preview compacta -->
                    <div class="flex-1 p-4 bg-gray-50 flex items-center justify-center">
                        <div class="text-center">
                            <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z"/>
                            </svg>
                            
                            <h3 class="text-base font-medium text-gray-900 mb-2">Preview en Ventana Nueva</h3>
                            <p class="text-sm text-gray-600 mb-3">
                                Para mejor experiencia, abre el componente en ventana separada.
                            </p>
                            
                            <button @click="openPreviewWindow()" 
                                    class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                🪟 Abrir Preview
                            </button>
                            
                            <!-- Ventajas compactas -->
                            <div class="mt-4 text-xs text-gray-500">
                                <h4 class="font-medium mb-2">Ventajas:</h4>
                                <div class="grid grid-cols-2 gap-1 text-left">
                                    <div>• ✅ Tailwind completo</div>
                                    <div>• ✅ Alpine + GSAP</div>
                                    <div>• ✅ Sin restricciones</div>
                                    <div>• ✅ Debug completo</div>
                                </div>
                            </div>
                            
                            <!-- Info de props -->
                            <div x-show="testProps.length > 0" class="mt-4 p-3 bg-blue-50 rounded-lg">
                                <h4 class="font-medium text-blue-900 mb-2 text-sm">Props configurados:</h4>
                                <div class="text-xs text-blue-800">
                                    <template x-for="prop in testProps.slice(0, 4)" :key="prop.key">
                                        <div x-show="prop.key && prop.value" class="flex justify-between">
                                            <span x-text="prop.key" class="truncate"></span>
                                            <span x-text="prop.type === 'string' ? `'${prop.value.substring(0,8)}...'` : prop.value" 
                                                  class="font-mono text-blue-600 ml-1 truncate"></span>
                                        </div>
                                    </template>
                                    <div x-show="testProps.length > 4" class="text-blue-600 text-center mt-1">
                                        ... y <span x-text="testProps.length - 4"></span> más
                                    </div>
                                </div>
                                <p class="text-xs text-blue-600 mt-2">
                                    Se incluirán automáticamente en el preview
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Preview Colapsado -->
                <div x-show="previewCollapsed" 
                     x-transition:enter="transition ease-out duration-300"
                     x-transition:enter-start="opacity-0"
                     x-transition:enter-end="opacity-100"
                     class="h-full flex flex-col items-center justify-center p-3">
                    
                    <!-- Botón vertical para preview -->
                    <button @click="openPreviewWindow()" 
                            class="bg-green-500 text-white px-2 py-8 rounded-lg hover:bg-green-600 transition-colors flex flex-col items-center gap-2 transform hover:scale-105 shadow-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                        <div class="text-xs font-medium transform rotate-90 whitespace-nowrap">
                            Preview
                        </div>
                    </button>
                    
                    <!-- Indicador de props (si hay) -->
                    <div x-show="testProps.length > 0" class="mt-6 text-center">
                        <div class="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-1 animate-pulse"></div>
                        <div class="text-xs text-gray-600">
                            <span x-text="testProps.length"></span> props
                        </div>
                    </div>
                    
                    <!-- Tip para expandir -->
                    <div class="mt-4 text-xs text-gray-400 text-center">
                        <svg class="w-3 h-3 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        Click para expandir
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Solo incluir el notification toast -->
    @include('component-builder.partials.notification-toast')

</div>
@endsection

@section('custom-scripts')
<script>
function componentEditor() {    
    return {
        // State básico
        activeTab: 'basic',
        previewMode: 'desktop',
        isSaving: false,
        autoSaving: false,
        isUpdatingPreview: false,
        previewTimeout: null,
        hasChanges: false,
        testProps: [],
        showPreviewModal: false,
        previewComponent: null,
        
        // ===== NUEVAS PROPIEDADES PARA CATEGORÍAS =====
        categories: {},
        selectedCategory: 'all',
        searchTerm: '',
        sortBy: 'category',
        sortOrder: 'asc',
        viewMode: 'grouped', // 'grouped' o 'list'
        
        // ===== VARIABLES GLOBALES =====
        globalVariables: [],
        propsSubTab: 'props', // Sub-tab para Props/Variables

        // Component data - cargado de forma ultra segura
        component: {
            id: {{ $component->id }},
            name: "{{ addslashes($component->name ?? '') }}",
            identifier: "{{ addslashes($component->identifier ?? '') }}",
            category: "{{ addslashes($component->category ?? 'content') }}",
            description: "{{ addslashes($component->description ?? '') }}",
            blade_template: `{!! addslashes($component->blade_template ?? '') !!}`,
            communication_config: @json($component->communication_config ?? ['emits' => [], 'listens' => [], 'state' => []]),
            props_schema: @json($component->props_schema ?? (object)[]),
            preview_config: @json($component->preview_config ?? (object)[])
        },

        // Notification
        notification: {
            show: false,
            type: 'info',
            message: ''
        },

        // ===== COMPUTADAS PARA FILTROS =====
        get filteredVariables() {
            let filtered = this.globalVariables;
            
            // Filtro por categoría
            if (this.selectedCategory !== 'all') {
                filtered = filtered.filter(v => v.category === this.selectedCategory);
            }
            
            // Búsqueda
            if (this.searchTerm) {
                const search = this.searchTerm.toLowerCase();
                filtered = filtered.filter(v => 
                    v.name.toLowerCase().includes(search) ||
                    (v.description && v.description.toLowerCase().includes(search))
                );
            }
            
            // Ordenamiento
            filtered.sort((a, b) => {
                if (this.sortBy === 'category') {
                    // Primero por categoría, luego por nombre
                    if (a.category !== b.category) {
                        return this.sortOrder === 'asc' 
                            ? a.category.localeCompare(b.category)
                            : b.category.localeCompare(a.category);
                    }
                    return a.name.localeCompare(b.name);
                } else {
                    const valueA = a[this.sortBy] || '';
                    const valueB = b[this.sortBy] || '';
                    return this.sortOrder === 'asc' 
                        ? valueA.localeCompare(valueB)
                        : valueB.localeCompare(valueA);
                }
            });
            
            return filtered;
        },

        get groupedVariables() {
            const grouped = {};
            this.filteredVariables.forEach(variable => {
                if (!grouped[variable.category]) {
                    grouped[variable.category] = [];
                }
                grouped[variable.category].push(variable);
            });
            return grouped;
        },

        // Init
        async init() {
            console.log('Component Editor initialized');
            this.setupAutoSave();
            
            // Cargar categorías ANTES que variables
            await this.loadCategories();
            
            // Cargar variables globales
            await this.loadGlobalVariables();
        },

        // ===== NUEVOS MÉTODOS PARA CATEGORÍAS =====

        // Cargar categorías del servidor
        async loadCategories() {
            try {
                const response = await fetch('/api/component-builder/global-variables/categories', {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });
                
                if (response.ok) {
                    this.categories = await response.json();
                } else {
                    this.categories = {};
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                this.categories = {};
            }
        },

        // Filtrar por categoría
        filterByCategory(category) {
            this.selectedCategory = category;
        },

        // Cambiar orden
        toggleSort(field) {
            if (this.sortBy === field) {
                this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                this.sortBy = field;
                this.sortOrder = 'asc';
            }
        },

        // Limpiar filtros
        clearFilters() {
            this.selectedCategory = 'all';
            this.searchTerm = '';
            this.sortBy = 'category';
            this.sortOrder = 'asc';
        },

        // Obtener información de categoría
        getCategoryInfo(categoryKey) {
            return this.categories[categoryKey] || {
                label: categoryKey,
                icon: '✨',
                description: 'Categoría personalizada'
            };
        },

        // Contar variables por categoría
        getCategoryCount(categoryKey) {
            return this.globalVariables.filter(v => v.category === categoryKey).length;
        },

        // ===== VARIABLES GLOBALES METHODS (ACTUALIZADOS) =====

        // Cargar variables globales del servidor
        async loadGlobalVariables() {
            try {
                const response = await fetch('/api/component-builder/global-variables', {
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });
                
                if (response.ok) {
                    this.globalVariables = await response.json();
                } else {
                    this.globalVariables = [];
                }
            } catch (error) {
                console.error('Error loading global variables:', error);
                this.globalVariables = [];
            }
        },

        // Agregar nueva variable (ACTUALIZADO con categoría)
        addVariable() {
            this.globalVariables.push({
                id: null,
                name: '',
                value: '',
                type: 'string',
                category: 'custom', // NUEVA PROPIEDAD
                description: '',
                created_at: new Date().toISOString()
            });
        },

        // Remover variable
        async removeVariable(index) {
            const variable = this.globalVariables[index];
            
            if (variable.id) {
                // Si tiene ID, eliminar del servidor
                try {
                    await fetch(`/api/component-builder/global-variables/${variable.id}`, {
                        method: 'DELETE',
                        headers: {
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                        }
                    });
                } catch (error) {
                    console.error('Error deleting variable:', error);
                }
            }
            
            this.globalVariables.splice(index, 1);
            this.showNotification('success', 'Variable eliminada');
        },

        // NUEVO: Guardar todas las variables
        async saveAllVariables() {
            this.isSaving = true;
            let savedCount = 0;
            let errorCount = 0;
            
            try {
                for (const variable of this.globalVariables) {
                    // Validar variable antes de guardar
                    if (!variable.name || !variable.value) {
                        continue; // Saltar variables incompletas
                    }
                    
                    try {
                        if (variable.id) {
                            // Actualizar variable existente
                            const response = await fetch(`/api/component-builder/global-variables/${variable.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                                },
                                body: JSON.stringify({
                                    name: variable.name,
                                    value: variable.value,
                                    type: variable.type,
                                    category: variable.category || 'custom',
                                    description: variable.description || ''
                                })
                            });
                            
                            if (response.ok) {
                                const updated = await response.json();
                                // Actualizar la variable en el array local
                                Object.assign(variable, updated);
                                savedCount++;
                            } else {
                                console.error('Error updating variable:', variable.name);
                                errorCount++;
                            }
                        } else {
                            // Crear nueva variable
                            const response = await fetch('/api/component-builder/global-variables', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                                },
                                body: JSON.stringify({
                                    name: variable.name,
                                    value: variable.value,
                                    type: variable.type,
                                    category: variable.category || 'custom',
                                    description: variable.description || ''
                                })
                            });
                            
                            if (response.ok) {
                                const created = await response.json();
                                // Actualizar la variable local con el ID del servidor
                                Object.assign(variable, created);
                                savedCount++;
                            } else {
                                const error = await response.json();
                                console.error('Error creating variable:', error);
                                errorCount++;
                            }
                        }
                    } catch (error) {
                        console.error('Error processing variable:', variable.name, error);
                        errorCount++;
                    }
                }
                
                // Mostrar notificación de resultado
                if (errorCount === 0) {
                    this.showNotification('success', `${savedCount} variables guardadas correctamente`);
                } else if (savedCount > 0) {
                    this.showNotification('warning', `${savedCount} guardadas, ${errorCount} con errores`);
                } else {
                    this.showNotification('error', 'No se pudieron guardar las variables');
                }
                
            } catch (error) {
                console.error('Error saving variables:', error);
                this.showNotification('error', 'Error inesperado al guardar variables');
            } finally {
                this.isSaving = false;
            }
        },

        // Guardar variable (crear o actualizar) CON DEBOUNCE
        async saveVariable(index) {
            const variable = this.globalVariables[index];
            
            // Validar nombre de variable
            if (!variable.name || !variable.name.trim()) {
                return;
            }
            
            // DEBOUNCE: Cancelar timeout anterior
            if (variable.saveTimeout) {
                clearTimeout(variable.saveTimeout);
            }
            
            // DEBOUNCE: Nuevo timeout de 1 segundo
            variable.saveTimeout = setTimeout(async () => {
                await this.performSaveVariable(index);
            }, 1000);
        },

        // Método real para guardar (separado para el debounce)
        async performSaveVariable(index) {
            const variable = this.globalVariables[index];
            
            // Limpiar nombre de variable (solo letras, números y underscore)
            variable.name = variable.name.toLowerCase()
                .replace(/[^a-z0-9_]/g, '')
                .replace(/^[0-9]/, ''); // No puede empezar con número
            
            try {
                const method = variable.id ? 'PUT' : 'POST';
                const url = variable.id 
                    ? `/api/component-builder/global-variables/${variable.id}`
                    : '/api/component-builder/global-variables';
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        name: variable.name,
                        value: variable.value,
                        type: variable.type,
                        category: variable.category || 'custom',
                        description: variable.description || ''
                    })
                });
                
                if (response.ok) {
                    const savedVariable = await response.json();
                    // Actualizar con datos del servidor
                    this.globalVariables[index] = { ...variable, ...savedVariable };
                    console.log('✅ Variable guardada:', savedVariable.name);
                } else {
                    console.error('❌ Error al guardar variable:', response.status);
                }
            } catch (error) {
                console.error('❌ Error saving variable:', error);
                this.showNotification('error', 'Error al guardar variable');
            }
        },

        // ===== PROPS METHODS (SIN CAMBIOS) =====

        // Setup auto-save
        setupAutoSave() {
            this.$watch('component', () => {
                this.hasChanges = true;
                this.debouncedAutoSave();
            }, { deep: true });
        },

        // Debounced auto-save
        debouncedAutoSave() {
            clearTimeout(this.autoSaveTimeout);
            this.autoSaveTimeout = setTimeout(() => {
                this.autoSave();
            }, 3000);
        },

        // Auto-save
        async autoSave() {
            if (!this.hasChanges || this.isSaving) return;

            this.autoSaving = true;
            try {
                await this.saveComponent(false); // false = no mostrar notificación
                this.hasChanges = false;
            } catch (error) {
                console.error('Auto-save failed:', error);
            } finally {
                this.autoSaving = false;
            }
        },

        // Update identifier based on name
        updateIdentifier() {
            if (!this.component.identifier) {
                this.component.identifier = this.component.name
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .trim('-');
            }
        },

        // Props Management
        addProp() {
            this.testProps.push({
                key: '',
                value: '',
                type: 'string'
            });
        },

        removeProp(index) {
            this.testProps.splice(index, 1);
        },

        // Fix para validar formato de array
        validateArrayFormat(prop) {
            try {
                if (prop.value.trim() === '') {
                    this.showNotification('info', 'Array está vacío');
                    return;
                }
                
                const parsed = this.parseArrayValue(prop.value);
                if (Array.isArray(parsed)) {
                    this.showNotification('success', `Array válido: ${parsed.length} elementos`);
                } else {
                    this.showNotification('error', 'Formato de array inválido');
                }
            } catch (error) {
                this.showNotification('error', 'Error en formato: ' + error.message);
            }
        },

        // Mejorar parseArrayValue (ya existente pero mejorada)
        parseArrayValue(arrayString) {
            try {
                // Si está vacío, devolver array vacío
                if (!arrayString || arrayString.trim() === '') {
                    return [];
                }
                
                // Intentar parsear como JSON primero
                if (arrayString.trim().startsWith('[') && arrayString.trim().endsWith(']')) {
                    const parsed = JSON.parse(arrayString);
                    return Array.isArray(parsed) ? parsed : [];
                }
                
                // Si no es JSON, dividir por comas y limpiar
                return arrayString.split(',')
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
                    
            } catch (error) {
                // Si falla todo, dividir por comas
                return arrayString.split(',')
                    .map(item => item.trim())
                    .filter(item => item.length > 0);
            }
        },

        // Mejorar convertPropsToTestData para incluir variables
        convertPropsToTestData() {
            const testData = {};
            
            // Agregar props normales
            this.testProps.forEach(prop => {
                if (prop.key && prop.value !== '') {
                    let value = prop.value;
                    
                    switch (prop.type) {
                        case 'number':
                            value = parseFloat(prop.value) || 0;
                            break;
                        case 'boolean':
                            value = prop.value === 'true';
                            break;
                        case 'array':
                            value = this.parseArrayValue(prop.value);
                            break;
                        default:
                            value = prop.value;
                    }
                    
                    testData[prop.key] = value;
                }
            });
            
            // Agregar variables globales
            this.globalVariables.forEach(variable => {
                if (variable.name && variable.value !== '') {
                    let value = variable.value;
                    
                    switch (variable.type) {
                        case 'number':
                            value = parseFloat(variable.value) || 0;
                            break;
                        case 'boolean':
                            value = variable.value === 'true';
                            break;
                        case 'array':
                            value = this.parseArrayValue(variable.value);
                            break;
                        default:
                            value = variable.value;
                    }
                    
                    testData[variable.name] = value;
                }
            });
            
            // Debug mejorado
            console.log('🔍 Test Data (Props + Variables):', testData);
            console.log('📊 Props:', this.testProps.length);
            console.log('🔄 Variables:', this.globalVariables.length);
            
            return testData;
        },

        // Mejorar placeholder para tipos
        getPlaceholderForType(type) {
            switch (type) {
                case 'string':
                    return 'Texto aquí...';
                case 'number':
                    return '123';
                case 'boolean':
                    return 'true/false';
                case 'array':
                    return '["Item 1", "Item 2"] o item1, item2, item3';
                default:
                    return '';
            }
        },

        // Save component
        async saveComponent(showNotification = true) {
            if (this.isSaving) return;
            
            this.isSaving = true;
            
            try {
                const response = await fetch(`/admin/page-builder/components/${this.component.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify(this.component)
                });

                const data = await response.json();

                if (data.success) {
                    this.hasChanges = false;
                    if (showNotification) {
                        this.showNotification('success', 'Componente guardado exitosamente');
                    }
                } else {
                    throw new Error(data.message || 'Error al guardar');
                }

            } catch (error) {
                console.error('Save error:', error);
                this.showNotification('error', 'Error al guardar componente: ' + error.message);
            } finally {
                this.isSaving = false;
            }
        },

        // Show notification
        showNotification(type, message) {
            this.notification = {
                show: true,
                type: type,
                message: message
            };

            setTimeout(() => {
                this.notification.show = false;
            }, 5000);
        },

        // Close notification
        closeNotification() {
            this.notification.show = false;
        },

        // Agregar método faltante
        markAsChanged() {
            this.hasChanges = true;
        },

        // Handle form submission
        async submitForm() {
            await this.saveComponent();
        },

        openPreviewWindow() {
            const componentId = this.component.id;
            
            // Obtener datos actuales de los props y variables
            const testData = this.convertPropsToTestData();
            
            // URL base para el preview
            let previewUrl = `/preview/component/${componentId}`;
            
            // Si hay datos de test, agregarlos como query params
            if (Object.keys(testData).length > 0) {
                const params = new URLSearchParams();
                
                // Convertir los datos a query string
                Object.entries(testData).forEach(([key, value]) => {
                    if (typeof value === 'object') {
                        params.append(key, JSON.stringify(value));
                    } else {
                        params.append(key, value);
                    }
                });
                
                previewUrl = `/preview/component/${componentId}/custom?${params.toString()}`;
            }
            
            // Configuración de la ventana
            const windowFeatures = [
                'width=1200',
                'height=800',
                'scrollbars=yes',
                'resizable=yes',
                'menubar=no',
                'toolbar=no',
                'location=no',
                'status=no'
            ].join(',');
            
            // Abrir ventana
            const previewWindow = window.open(
                previewUrl, 
                `component-preview-${componentId}`, 
                windowFeatures
            );
            
            if (previewWindow) {
                previewWindow.focus();
                console.log('🚀 Preview window opened for component:', componentId);
                this.showNotification('success', 'Preview abierto en nueva ventana');
            } else {
                this.showNotification('error', 'No se pudo abrir la ventana. Verifica que no estén bloqueadas las ventanas emergentes.');
            }
            
            return previewWindow;
        },

        // Navigate back
        goBack() {
            window.location.href = '{{ route("component-builder.index") }}';
        }
    };
}
</script>
@endsection