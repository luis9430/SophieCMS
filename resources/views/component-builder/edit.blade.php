{{-- resources/views/component-builder/edit.blade.php --}}
@extends('layouts.page-builder')

@section('title', 'Editar Componente: ' . $component->name)

@section('custom-styles')
    <style>
        .code-editor {
            font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
        }
    </style>
@endsection

@section('content')
    <div x-data="componentEditor()" x-init="init()" class="h-screen flex flex-col bg-gray-50">

        <!-- Header -->
        <div class="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <a href="{{ route('component-builder.index') }}" class="text-gray-600 hover:text-gray-900">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7">
                            </path>
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
                    <button @click="saveComponent()" :disabled="isSaving"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                        <svg x-show="!isSaving" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 7H5a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h8m0 0h2a2 2 0 002-2V9a2 2 0 00-2-2h-2m0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0h8">
                            </path>
                        </svg>
                        <svg x-show="isSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
                                class="opacity-25"></circle>
                            <path fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                class="opacity-75"></path>
                        </svg>
                        <span x-text="isSaving ? 'Guardando...' : hasChanges ? 'Guardar Cambios' : 'Guardado'"></span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Auto-save indicator -->
        <div x-show="autoSaving" x-transition
            class="bg-yellow-100 border-b border-yellow-200 px-6 py-2 text-sm text-yellow-800">
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25">
                    </circle>
                    <path fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        class="opacity-75"></path>
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
                            :class="activeTab === 'basic' ? 'border-blue-500 text-blue-600' :
                                'border-transparent text-gray-500'"
                            class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
                            Básico
                        </button>
                        <button @click="activeTab = 'variables'"
                            :class="activeTab === 'variables' ? 'border-blue-500 text-blue-600' :
                                'border-transparent text-gray-500'"
                            class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
                            Props
                        </button>
                        <button @click="activeTab = 'communication'"
                            :class="activeTab === 'communication' ? 'border-blue-500 text-blue-600' :
                                'border-transparent text-gray-500'"
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
                            <input type="text" x-model="component.name" @input="markAsChanged()"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>

                        <!-- Identifier (readonly) -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Identificador
                            </label>
                            <input type="text" x-model="component.identifier" readonly
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm">
                            <p class="text-xs text-gray-500 mt-1">El identificador no se puede cambiar después de crear el
                                componente</p>
                        </div>

                        <!-- Category -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Categoría *
                            </label>
                            <select x-model="component.category" @change="markAsChanged()"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                @foreach ($categories as $key => $label)
                                    <option value="{{ $key }}">{{ $label }}</option>
                                @endforeach
                            </select>
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea x-model="component.description" @input="markAsChanged()" rows="3"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                        </div>

                        <!-- Usage example -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">
                                Uso en Page Builder
                            </label>
                            <div class="bg-gray-100 p-3 rounded-lg">
                                <code class="text-sm font-mono">&lt;x-page-builder.{{ $component->identifier }}
                                    /&gt;</code>
                            </div>
                        </div>
                    </div>

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
                                    <button @click="viewMode = 'grouped'"
                                        :class="viewMode === 'grouped' ? 'bg-white shadow-sm' : ''"
                                        class="px-3 py-1 text-sm rounded transition-all" title="Vista agrupada">
                                        📂
                                    </button>
                                    <button @click="viewMode = 'list'"
                                        :class="viewMode === 'list' ? 'bg-white shadow-sm' : ''"
                                        class="px-3 py-1 text-sm rounded transition-all" title="Vista lista">
                                        📋
                                    </button>
                                </div>

                                <button @click="addVariable()"
                                    class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                                    + Agregar Variable
                                </button>
                            </div>
                        </div>

                        <!-- Barra de filtros -->
                        <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                            <!-- Búsqueda -->
                            <div class="relative">
                                <input x-model="searchTerm" type="text"
                                    placeholder="Buscar variables por nombre o descripción..."
                                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none"
                                    stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <!-- Filtros de categoría -->
                            <div class="flex flex-wrap gap-2">
                                <button @click="filterByCategory('all')"
                                    :class="selectedCategory === 'all' ? 'bg-blue-500 text-white shadow-md' :
                                        'bg-white text-gray-700 hover:bg-gray-50'"
                                    class="px-3 py-1 rounded-full text-sm font-medium border transition-all">
                                    🌟 Todas (<span x-text="globalVariables.length"></span>)
                                </button>

                                <template x-for="(category, key) in categories" :key="key">
                                    <button @click="filterByCategory(key)"
                                        :class="selectedCategory === key ? 'bg-blue-500 text-white shadow-md' :
                                            'bg-white text-gray-700 hover:bg-gray-50'"
                                        class="px-3 py-1 rounded-full text-sm font-medium border transition-all">
                                        <span x-text="category.icon"></span>
                                        <span x-text="category.label"></span>
                                        (<span x-text="getCategoryCount(key)"></span>)
                                    </button>
                                </template>

                                <!-- Limpiar filtros -->
                                <button @click="clearFilters()" x-show="selectedCategory !== 'all' || searchTerm"
                                    class="px-3 py-1 rounded-full text-sm text-red-600 hover:bg-red-50 border border-red-200 transition-all">
                                    🗑️ Limpiar
                                </button>
                            </div>

                            <!-- Ordenamiento -->
                            <div class="flex items-center gap-3 text-sm">
                                <span class="text-gray-600">Ordenar por:</span>
                                <button @click="toggleSort('category')"
                                    :class="sortBy === 'category' ? 'text-blue-600 font-medium' : 'text-gray-500'"
                                    class="hover:text-blue-600 transition-colors">
                                    Categoría
                                    <span x-show="sortBy === 'category'" x-text="sortOrder === 'asc' ? '↑' : '↓'"></span>
                                </button>
                                <button @click="toggleSort('name')"
                                    :class="sortBy === 'name' ? 'text-blue-600 font-medium' : 'text-gray-500'"
                                    class="hover:text-blue-600 transition-colors">
                                    Nombre
                                    <span x-show="sortBy === 'name'" x-text="sortOrder === 'asc' ? '↑' : '↓'"></span>
                                </button>
                                <button @click="toggleSort('created_at')"
                                    :class="sortBy === 'created_at' ? 'text-blue-600 font-medium' : 'text-gray-500'"
                                    class="hover:text-blue-600 transition-colors">
                                    Fecha
                                    <span x-show="sortBy === 'created_at'"
                                        x-text="sortOrder === 'asc' ? '↑' : '↓'"></span>
                                </button>
                            </div>
                        </div>

                        <!-- Vista Agrupada por Categorías -->
                        <div x-show="viewMode === 'grouped' && Object.keys(groupedVariables).length > 0"
                            class="space-y-6">
                            <template x-for="(variables, categoryKey) in groupedVariables" :key="categoryKey">
                                <div class="border border-gray-200 rounded-lg overflow-hidden">
                                    <!-- Header de categoría -->
                                    <div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-3">
                                                <span x-text="getCategoryInfo(categoryKey).icon" class="text-xl"></span>
                                                <div>
                                                    <h5 x-text="getCategoryInfo(categoryKey).label"
                                                        class="font-medium text-gray-900"></h5>
                                                    <p x-text="getCategoryInfo(categoryKey).description"
                                                        class="text-sm text-gray-600"></p>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span
                                                    class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                                    <span x-text="variables.length"></span> variable<span
                                                        x-show="variables.length !== 1">s</span>
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
                                                        <label
                                                            class="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                                                        <input x-model="variable.name" type="text"
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                            placeholder="variable_name">
                                                    </div>

                                                    <!-- Valor -->
                                                    <div class="col-span-4">
                                                        <label
                                                            class="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                                                        <template x-if="variable.type === 'array'">
                                                            <textarea x-model="variable.value" rows="2"
                                                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder='["item1", "item2"] o item1, item2'></textarea>
                                                        </template>
                                                        <template x-if="variable.type !== 'array'">
                                                            <input x-model="variable.value" type="text"
                                                                class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                                placeholder="Valor de la variable">
                                                        </template>
                                                    </div>

                                                    <!-- Tipo -->
                                                    <div class="col-span-2">
                                                        <label
                                                            class="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                                        <select x-model="variable.type"
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                                                            <option value="string">String</option>
                                                            <option value="number">Number</option>
                                                            <option value="boolean">Boolean</option>
                                                            <option value="array">Array</option>
                                                        </select>
                                                    </div>

                                                    <!-- Categoría -->
                                                    <div class="col-span-2">
                                                        <label
                                                            class="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
                                                        <select x-model="variable.category"
                                                            class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500">
                                                            <template x-for="(cat, key) in categories"
                                                                :key="key">
                                                                <option :value="key"
                                                                    x-text="cat.icon + ' ' + cat.label"></option>
                                                            </template>
                                                        </select>
                                                    </div>

                                                    <!-- Acciones -->
                                                    <div class="col-span-1 flex justify-end">
                                                        <button
                                                            @click="removeVariable(globalVariables.findIndex(v => v === variable))"
                                                            class="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-colors"
                                                            title="Eliminar variable">
                                                            <svg class="w-4 h-4" fill="none" stroke="currentColor"
                                                                viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                    stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>

                                                <!-- Descripción -->
                                                <div class="mt-3">
                                                    <label class="block text-xs font-medium text-gray-700 mb-1">Descripción
                                                        (opcional)</label>
                                                    <input x-model="variable.description" type="text"
                                                        class="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                        placeholder="Descripción de qué hace esta variable">
                                                </div>

                                                <!-- Preview del uso -->
                                                <div class="mt-2 text-xs text-gray-500">
                                                    💡 Usar en Blade: <code
                                                        class="bg-gray-100 px-1 rounded font-mono">@{{ '$' }}<span
                                                            x-text="variable.name || 'variable_name'"></span>@{{ '' }}</code>
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
                                            <span :title="getCategoryInfo(variable.category).label"
                                                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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


                        <div x-show="viewMode === 'grouped' && Object.keys(groupedVariables).length > 0" class="mt-8">
                            <div class="border-t border-gray-200 pt-6">
                                <div class="flex items-center justify-between mb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 bg-purple-100 rounded-lg">
                                            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h6a2 2 0 002-2V7a2 2 0 00-2-2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 class="text-lg font-semibold text-gray-900">🎨 Design Tokens</h3>
                                            <p class="text-sm text-gray-600">Crea paletas de colores y sistemas
                                                tipográficos completos</p>
                                        </div>
                                    </div>

                                    <div class="flex gap-2">
                                        <button @click="showCreateColorModal = true"
                                            class="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-medium flex items-center gap-2">
                                            <span>🎨</span>
                                            Color Palette
                                        </button>

                                        <button @click="showCreateTypographyModal = true"
                                            class="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:from-green-600 hover:to-teal-700 transition-all text-sm font-medium flex items-center gap-2">
                                            <span>📝</span>
                                            Typography
                                        </button>
                                    </div>
                                </div>

                                <!-- Design Tokens existentes -->
                                <div class="grid gap-4 md:grid-cols-2" x-show="designTokens.length > 0">
                                    <template x-for="token in designTokens" :key="token.id">
                                        <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                                            @click="openTokenDetails(token)">
                                            <!-- Color Palette Token -->
                                            <template x-if="token.type === 'color_palette'">
                                                <div>
                                                    <div class="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 class="font-medium text-gray-900 group-hover:text-blue-600 transition-colors"
                                                                x-text="token.name"></h4>
                                                            <p class="text-sm text-gray-600"
                                                                x-text="token.description || 'Paleta de colores'"></p>
                                                        </div>
                                                        <button @click.stop="removeDesignToken(token)"
                                                            class="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <svg class="w-4 h-4" fill="none" stroke="currentColor"
                                                                viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                    stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    <!-- Paleta de colores visual -->
                                                    <div class="flex rounded-lg overflow-hidden mb-3"
                                                        x-show="token.metadata && token.metadata.shades">
                                                        <template x-if="token.metadata && token.metadata.shades">
                                                            <template
                                                                x-for="(color, shade) in Object.entries(token.metadata.shades).slice(0, 6)"
                                                                :key="shade">
                                                                <div class="flex-1 h-6 cursor-pointer hover:scale-105 transition-transform"
                                                                    :style="`background-color: ${color[1]}`"
                                                                    :title="`${color[0]}: ${color[1]}`"></div>
                                                            </template>
                                                        </template>
                                                        <div
                                                            class="flex-1 h-6 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                                            +4 más
                                                        </div>
                                                    </div>

                                                    <!-- Información básica -->
                                                    <div class="text-xs text-gray-500 space-y-1">
                                                        <div>Base: <span class="font-mono bg-gray-100 px-1 rounded"
                                                                x-text="token.value"></span></div>
                                                        <div class="text-blue-600 group-hover:text-blue-700 font-medium">
                                                            👁️ Clic para ver detalles completos
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>

                                            <!-- Typography System Token -->
                                            <template x-if="token.type === 'typography_system'">
                                                <div>
                                                    <div class="flex items-start justify-between mb-3">
                                                        <div>
                                                            <h4 class="font-medium text-gray-900 group-hover:text-green-600 transition-colors"
                                                                x-text="token.name"></h4>
                                                            <p class="text-sm text-gray-600"
                                                                x-text="token.description || 'Sistema tipográfico'"></p>
                                                        </div>
                                                        <button @click.stop="removeDesignToken(token)"
                                                            class="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <svg class="w-4 h-4" fill="none" stroke="currentColor"
                                                                viewBox="0 0 24 24">
                                                                <path stroke-linecap="round" stroke-linejoin="round"
                                                                    stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    <!-- Preview tipográfico básico -->
                                                    <div class="mb-3" x-show="token.metadata && token.metadata.fonts">
                                                        <div class="text-lg font-medium"
                                                            :style="`font-family: ${token.value}`">
                                                            <span x-text="(token.value || '').split(',')[0]"></span>
                                                        </div>
                                                        <div class="text-sm text-gray-500"
                                                            :style="`font-family: ${token.value}`">ABC abc 123</div>
                                                    </div>

                                                    <!-- Información básica -->
                                                    <div class="text-xs text-gray-500 space-y-1">
                                                        <div>Font: <span class="font-mono bg-gray-100 px-1 rounded"
                                                                x-text="token.value"></span></div>
                                                        <div class="text-green-600 group-hover:text-green-700 font-medium">
                                                            👁️ Clic para ver detalles completos
                                                        </div>
                                                    </div>
                                                </div>
                                            </template>
                                        </div>
                                    </template>
                                </div>
                                <!-- Empty state para design tokens -->
                                <div x-show="designTokens.length === 0"
                                    class="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                    <div class="text-gray-400 mb-3">
                                        <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h6a2 2 0 002-2V7a2 2 0 00-2-2z" />
                                        </svg>
                                    </div>
                                    <h4 class="text-lg font-medium text-gray-900 mb-2">¡Crea tu primer Design Token!</h4>
                                    <p class="text-gray-600 mb-4">Los design tokens te permiten crear sistemas de diseño
                                        consistentes</p>
                                    <div class="flex justify-center gap-3">
                                        <button @click="showCreateColorModal = true"
                                            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                            🎨 Paleta de Colores
                                        </button>
                                        <button @click="showCreateTypographyModal = true"
                                            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                                            📝 Tipografía
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- MODAL: Crear Paleta de Colores -->
                        <div x-show="showCreateColorModal" x-transition:enter="transition ease-out duration-300"
                            x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
                            x-transition:leave="transition ease-in duration-200"
                            x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
                            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                            style="display: none;">

                            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-semibold">🎨 Crear Paleta de Colores</h3>
                                    <button @click="showCreateColorModal = false"
                                        class="text-gray-500 hover:text-gray-700">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form @submit.prevent="createColorPalette()">
                                    <div class="space-y-4">
                                        <!-- Nombre -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la
                                                variable</label>
                                            <input x-model="colorForm.name" type="text" placeholder="primary_color"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                required>
                                        </div>

                                        <!-- Color Base -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Color base</label>
                                            <div class="flex gap-2">
                                                <input x-model="colorForm.base_color" type="color"
                                                    class="w-16 h-10 border border-gray-300 rounded-lg cursor-pointer"
                                                    @change="previewColorPalette()">
                                                <input x-model="colorForm.base_color" type="text"
                                                    placeholder="#3B82F6"
                                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                                    @input="previewColorPalette()">
                                            </div>
                                        </div>

                                        <!-- Nombre de paleta -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de paleta
                                                (opcional)</label>
                                            <input x-model="colorForm.palette_name" type="text"
                                                placeholder="primary (se usa primary_color si está vacío)"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                        </div>

                                        <!-- Descripción -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                            <textarea x-model="colorForm.description" placeholder="Color principal del sitio web" rows="2"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
                                        </div>

                                        <!-- Preview de la paleta -->
                                        <div x-show="colorPreview.shades" class="border border-gray-200 rounded-lg p-3">
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Vista
                                                previa</label>
                                            <div class="flex rounded-lg overflow-hidden">
                                                <template x-for="(color, shade) in colorPreview.shades"
                                                    :key="shade">
                                                    <div class="flex-1 h-8 cursor-pointer"
                                                        :style="`background-color: ${color}`"
                                                        :title="`${shade}: ${color}`"></div>
                                                </template>
                                            </div>
                                            <div class="text-xs text-gray-500 mt-2" x-show="colorPreview.contrast_info">
                                                Contraste con blanco: <span
                                                    x-text="colorPreview.contrast_info ? Math.round(colorPreview.contrast_info.white_text * 100) / 100 : ''"></span>
                                                <span
                                                    x-show="colorPreview.contrast_info && colorPreview.contrast_info.wcag_compliant_white"
                                                    class="text-green-600">✓ WCAG</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex justify-end gap-3 mt-6">
                                        <button type="button" @click="showCreateColorModal = false"
                                            class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                                            Cancelar
                                        </button>
                                        <button type="submit"
                                            class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                            :disabled="creatingToken">
                                            <span x-show="!creatingToken">Crear Paleta</span>
                                            <span x-show="creatingToken">Creando...</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <!-- MODAL: Crear Sistema Tipográfico -->
                        <div x-show="showCreateTypographyModal" x-transition:enter="transition ease-out duration-300"
                            x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
                            x-transition:leave="transition ease-in duration-200"
                            x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
                            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                            style="display: none;">

                            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                                <div class="flex items-center justify-between mb-4">
                                    <h3 class="text-lg font-semibold">📝 Crear Sistema Tipográfico</h3>
                                    <button @click="showCreateTypographyModal = false"
                                        class="text-gray-500 hover:text-gray-700">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form @submit.prevent="createTypographySystem()">
                                    <div class="space-y-4">
                                        <!-- Nombre -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la
                                                variable</label>
                                            <input x-model="typographyForm.name" type="text"
                                                placeholder="primary_typography"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                required>
                                        </div>

                                        <!-- Fuente principal -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Fuente
                                                principal</label>
                                            <select x-model="typographyForm.primary_font"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                                <option value="">Seleccionar fuente...</option>
                                                <option value="Inter">Inter</option>
                                                <option value="Roboto">Roboto</option>
                                                <option value="Open Sans">Open Sans</option>
                                                <option value="Lato">Lato</option>
                                                <option value="Montserrat">Montserrat</option>
                                                <option value="Poppins">Poppins</option>
                                                <option value="Playfair Display">Playfair Display</option>
                                                <option value="Merriweather">Merriweather</option>
                                            </select>
                                        </div>

                                        <!-- Fuente secundaria -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Fuente secundaria
                                                (opcional)</label>
                                            <select x-model="typographyForm.secondary_font"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                                                <option value="">Usar serif por defecto</option>
                                                <option value="Playfair Display">Playfair Display</option>
                                                <option value="Merriweather">Merriweather</option>
                                                <option value="Lora">Lora</option>
                                                <option value="Crimson Text">Crimson Text</option>
                                            </select>
                                        </div>

                                        <!-- Descripción -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                            <textarea x-model="typographyForm.description" placeholder="Sistema tipográfico principal del sitio" rows="2"
                                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"></textarea>
                                        </div>

                                        <!-- Preview tipográfico -->
                                        <div x-show="typographyForm.primary_font"
                                            class="border border-gray-200 rounded-lg p-3">
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Vista
                                                previa</label>
                                            <div :style="`font-family: '${typographyForm.primary_font}', sans-serif`">
                                                <div class="text-2xl font-bold mb-2">Heading Grande</div>
                                                <div class="text-lg font-medium mb-2">Heading Medium</div>
                                                <div class="text-base mb-2">Texto normal para párrafos y contenido general
                                                    del sitio web.</div>
                                                <div class="text-sm text-gray-600">Texto pequeño para notas y detalles.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="flex justify-end gap-3 mt-6">
                                        <button type="button" @click="showCreateTypographyModal = false"
                                            class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                                            Cancelar
                                        </button>
                                        <button type="submit"
                                            class="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                            :disabled="creatingToken">
                                            <span x-show="!creatingToken">Crear Sistema</span>
                                            <span x-show="creatingToken">Creando...</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        <!-- MODAL: Ver Detalles de Design Token -->
                        <div x-show="showTokenDetailsModal" x-transition:enter="transition ease-out duration-300"
                            x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100"
                            x-transition:leave="transition ease-in duration-200"
                            x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95"
                            class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                            style="display: none;">

                            <div
                                class="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
                                <!-- Header del Modal -->
                                <div class="flex items-center justify-between p-6 border-b border-gray-200">
                                    <div class="flex items-center gap-3">
                                        <div class="p-2 bg-purple-100 rounded-lg">
                                            <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor"
                                                viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5H9a2 2 0 00-2 2v12a4 4 0 004 4h6a2 2 0 002-2V7a2 2 0 00-2-2z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 class="text-xl font-semibold text-gray-900"
                                                x-text="selectedToken?.name || 'Design Token'"></h3>
                                            <p class="text-sm text-gray-600"
                                                x-text="selectedToken?.description || 'Detalles del token'"></p>
                                        </div>
                                    </div>
                                    <button @click="showTokenDetailsModal = false"
                                        class="text-gray-500 hover:text-gray-700">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <!-- Contenido del Modal -->
                                <div class="flex-1 overflow-y-auto p-6">

                                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
                                        x-show="!selectedToken?.metadata">
                                        <h4 class="text-yellow-800 font-medium mb-2">⚠️ Debug: Token sin metadata</h4>
                                        <div class="text-yellow-700 text-sm space-y-1">
                                            <div>Token ID: <span x-text="selectedToken?.id"></span></div>
                                            <div>Tiene metadata: <span
                                                    x-text="selectedToken?.metadata ? 'Sí' : 'No'"></span></div>
                                            <div>Estructura completa:</div>
                                            <pre class="bg-yellow-100 p-2 rounded text-xs overflow-x-auto" x-text="JSON.stringify(selectedToken, null, 2)"></pre>
                                        </div>
                                        <div class="mt-3 text-yellow-800 text-sm">
                                            <strong>Solución:</strong> Este token no tiene metadata. Intenta:
                                            <ol class="list-decimal list-inside mt-1 space-y-1">
                                                <li>Eliminar este token y crear uno nuevo</li>
                                                <li>Verificar que el backend incluya metadata</li>
                                                <li>Revisar la ruta API que devuelve los tokens</li>
                                            </ol>
                                        </div>
                                    </div>
                                    <!-- Color Palette Details -->
                                    <template x-if="selectedToken?.type === 'color_palette'">
                                        <div>
                                            <!-- Información General -->
                                            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span class="text-gray-500 block">Nombre Variable:</span>
                                                        <code class="bg-white px-2 py-1 rounded font-mono text-blue-600"
                                                            x-text="selectedToken?.name"></code>
                                                    </div>
                                                    <div>
                                                        <span class="text-gray-500 block">Color Base:</span>
                                                        <div class="flex items-center gap-2">
                                                            <div class="w-4 h-4 rounded border"
                                                                :style="`background-color: ${selectedToken?.value}`"></div>
                                                            <code class="bg-white px-2 py-1 rounded font-mono"
                                                                x-text="selectedToken?.value"></code>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span class="text-gray-500 block">Tipo:</span>
                                                        <span
                                                            class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Paleta
                                                            de
                                                            Colores</span>
                                                    </div>
                                                    <div>
                                                        <span class="text-gray-500 block">Variables CSS:</span>
                                                        <span class="font-medium"
                                                            x-text="selectedToken?.metadata?.css_variables ? Object.keys(selectedToken.metadata.css_variables).length : 0"></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Paleta Visual Completa -->
                                            <div class="mb-6">
                                                <h4 class="text-lg font-semibold text-gray-900 mb-3">🎨 Paleta Completa
                                                    Generada</h4>
                                                <div class="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 mb-4">
                                                    <template x-if="selectedToken?.metadata?.shades">
                                                        <template x-for="(color, shade) in selectedToken.metadata.shades"
                                                            :key="shade">
                                                            <div class="text-center">
                                                                <div class="w-full h-16 rounded-lg border-2 border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                                                                    :style="`background-color: ${color}`"
                                                                    :title="`${shade}: ${color}`"
                                                                    @click="copyToClipboard(color)"></div>
                                                                <div class="mt-1">
                                                                    <div class="text-xs font-medium text-gray-700"
                                                                        x-text="shade"></div>
                                                                    <div class="text-xs text-gray-500 font-mono"
                                                                        x-text="color"></div>
                                                                </div>
                                                            </div>
                                                        </template>
                                                    </template>
                                                </div>
                                                <p class="text-xs text-gray-500 text-center">💡 Haz clic en cualquier color
                                                    para copiarlo al
                                                    portapapeles</p>
                                            </div>

                                            <!-- Variables CSS Disponibles -->
                                            <div class="mb-6">
                                                <h4 class="text-lg font-semibold text-gray-900 mb-3">🔧 Variables CSS
                                                    Generadas</h4>

                                                <!-- Tabs para organizar variables -->
                                                <div x-data="{ activeVarTab: 'colors' }" class="mb-4">
                                                    <div class="border-b border-gray-200">
                                                        <nav class="flex space-x-8">
                                                            <button @click="activeVarTab = 'colors'"
                                                                :class="activeVarTab === 'colors' ?
                                                                    'border-blue-500 text-blue-600' :
                                                                    'border-transparent text-gray-500'"
                                                                class="py-2 px-1 border-b-2 font-medium text-sm">
                                                                Colores Sólidos
                                                            </button>
                                                            <button @click="activeVarTab = 'rgb'"
                                                                :class="activeVarTab === 'rgb' ?
                                                                    'border-blue-500 text-blue-600' :
                                                                    'border-transparent text-gray-500'"
                                                                class="py-2 px-1 border-b-2 font-medium text-sm">
                                                                Valores RGB
                                                            </button>
                                                            <button @click="activeVarTab = 'usage'"
                                                                :class="activeVarTab === 'usage' ?
                                                                    'border-blue-500 text-blue-600' :
                                                                    'border-transparent text-gray-500'"
                                                                class="py-2 px-1 border-b-2 font-medium text-sm">
                                                                Ejemplos de Uso
                                                            </button>
                                                        </nav>
                                                    </div>

                                                    <!-- Colores Sólidos -->
                                                    <div x-show="activeVarTab === 'colors'" class="pt-4">
                                                        <div class="space-y-2 max-h-64 overflow-y-auto">
                                                            <template x-if="selectedToken?.metadata?.css_variables">
                                                                <template
                                                                    x-for="(value, varName) in selectedToken.metadata.css_variables"
                                                                    :key="varName">
                                                                    <template x-if="!varName.includes('-rgb')">
                                                                        <div
                                                                            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                                            <div class="flex items-center gap-3">
                                                                                <div class="w-6 h-6 rounded border-2 border-gray-300"
                                                                                    :style="`background-color: ${value}`">
                                                                                </div>
                                                                                <code
                                                                                    class="font-mono text-sm text-blue-600"
                                                                                    x-text="'var(' + varName + ')'"></code>
                                                                            </div>
                                                                            <div class="flex items-center gap-2">
                                                                                <code
                                                                                    class="text-xs text-gray-600 font-mono"
                                                                                    x-text="value"></code>
                                                                                <button
                                                                                    @click="copyToClipboard('var(' + varName + ')')"
                                                                                    class="text-gray-400 hover:text-gray-600"
                                                                                    title="Copiar variable CSS">
                                                                                    <svg class="w-4 h-4" fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24">
                                                                                        <path stroke-linecap="round"
                                                                                            stroke-linejoin="round"
                                                                                            stroke-width="2"
                                                                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </template>
                                                                </template>
                                                            </template>
                                                        </div>
                                                    </div>

                                                    <!-- Valores RGB -->
                                                    <div x-show="activeVarTab === 'rgb'" class="pt-4">
                                                        <div class="space-y-2 max-h-64 overflow-y-auto">
                                                            <template x-if="selectedToken?.metadata?.css_variables">
                                                                <template
                                                                    x-for="(value, varName) in selectedToken.metadata.css_variables"
                                                                    :key="varName">
                                                                    <template x-if="varName.includes('-rgb')">
                                                                        <div
                                                                            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                                            <div class="flex items-center gap-3">
                                                                                <div class="w-6 h-6 rounded border-2 border-gray-300"
                                                                                    :style="`background-color: rgb(${value})`">
                                                                                </div>
                                                                                <code
                                                                                    class="font-mono text-sm text-purple-600"
                                                                                    x-text="'var(' + varName + ')'"></code>
                                                                            </div>
                                                                            <div class="flex items-center gap-2">
                                                                                <code
                                                                                    class="text-xs text-gray-600 font-mono"
                                                                                    x-text="value"></code>
                                                                                <button
                                                                                    @click="copyToClipboard('rgba(var(' + varName + '), 0.5)')"
                                                                                    class="text-gray-400 hover:text-gray-600"
                                                                                    title="Copiar con transparencia">
                                                                                    <svg class="w-4 h-4" fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24">
                                                                                        <path stroke-linecap="round"
                                                                                            stroke-linejoin="round"
                                                                                            stroke-width="2"
                                                                                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </template>
                                                                </template>
                                                            </template>
                                                        </div>
                                                        <div class="mt-3 p-3 bg-purple-50 rounded-lg">
                                                            <p class="text-sm text-purple-700">
                                                                💡 <strong>Uso con transparencia:</strong> <code
                                                                    class="bg-white px-1 rounded">rgba(var(--color-nombre-rgb),
                                                                    0.5)</code>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <!-- Ejemplos de Uso -->
                                                    <div x-show="activeVarTab === 'usage'" class="pt-4">
                                                        <div class="space-y-4">
                                                            <!-- Ejemplo CSS directo -->
                                                            <div class="bg-gray-50 rounded-lg p-4">
                                                                <h5 class="font-medium text-gray-900 mb-2">🎨 En CSS/Style
                                                                    directo:</h5>
                                                                <div class="bg-gray-900 rounded p-3">
                                                                    <code class="text-green-400 text-sm block"
                                                                        x-text="`/* Usar el color base */\nbackground-color: var(--color-${selectedToken?.metadata?.name || 'token'}-500);`"></code>
                                                                    <code class="text-green-400 text-sm block mt-2"
                                                                        x-text="`/* Versión más clara */\nbackground-color: var(--color-${selectedToken?.metadata?.name || 'token'}-100);`"></code>
                                                                    <code class="text-green-400 text-sm block mt-2"
                                                                        x-text="`/* Con transparencia */\nbackground-color: rgba(var(--color-${selectedToken?.metadata?.name || 'token'}-rgb), 0.3);`"></code>
                                                                </div>
                                                            </div>

                                                            <!-- Ejemplo Blade -->
                                                            <!-- Ejemplo Blade -->
                                                            <div class="bg-gray-50 rounded-lg p-4">
                                                                <h5 class="font-medium text-gray-900 mb-2">🔧 En Blade
                                                                    Template:</h5>
                                                                <div class="bg-gray-900 rounded p-3 space-y-2">
                                                                    <div class="text-yellow-400 text-sm">
                                                                        <div class="text-gray-400">{{-- Como variable PHP --}}
                                                                        </div>
                                                                        <div>&lt;div
                                                                            style="color: <span x-text="`$${selectedToken?.name
                                                                            || 'token_name'}`"></span>"&gt;Texto&lt;/div&gt;
                                                                        </div>
                                                                    </div>
                                                                    <div class="text-yellow-400 text-sm mt-2">
                                                                        <div class="text-gray-400">{{-- Como variable CSS --}}
                                                                        </div>
                                                                        <div>&lt;div
                                                                            style="background-color: <span x-text="`var(--color-${selectedToken?.metadata?.name
                                                                            ||
                                                                            'token'}-500)`"></span>"&gt;Contenido&lt;/div&gt;
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>


                                                            <!-- Preview en vivo -->
                                                            <div class="bg-gray-50 rounded-lg p-4">
                                                                <h5 class="font-medium text-gray-900 mb-2">👁️ Vista
                                                                    Previa:</h5>
                                                                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                                    <div class="p-3 rounded text-white text-center"
                                                                        :style="`background-color: var(--color-${selectedToken?.metadata?.name || 'token'}-500)`">
                                                                        Botón Principal
                                                                    </div>
                                                                    <div class="p-3 rounded border-2 text-center"
                                                                        :style="`border-color: var(--color-${selectedToken?.metadata?.name || 'token'}-300); color: var(--color-${selectedToken?.metadata?.name || 'token'}-700)`">
                                                                        Botón Secundario
                                                                    </div>
                                                                    <div class="p-3 rounded text-center"
                                                                        :style="`background-color: rgba(var(--color-${selectedToken?.metadata?.name || 'token'}-rgb), 0.1); color: var(--color-${selectedToken?.metadata?.name || 'token'}-800)`">
                                                                        Con Transparencia
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </template>

                                    <!-- Typography Details -->
                                    <template x-if="selectedToken?.type === 'typography_system'">
                                        <div>
                                            <!-- Información General Typography -->
                                            <div class="bg-gray-50 rounded-lg p-4 mb-6">
                                                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span class="text-gray-500 block">Nombre Variable:</span>
                                                        <code class="bg-white px-2 py-1 rounded font-mono text-green-600"
                                                            x-text="selectedToken?.name"></code>
                                                    </div>
                                                    <div>
                                                        <span class="text-gray-500 block">Fuente Principal:</span>
                                                        <code class="bg-white px-2 py-1 rounded font-mono"
                                                            x-text="selectedToken?.metadata?.fonts?.primary || selectedToken?.value"></code>
                                                    </div>
                                                    <div>
                                                        <span class="text-gray-500 block">Tipo:</span>
                                                        <span
                                                            class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Sistema
                                                            Tipográfico</span>
                                                    </div>
                                                    <div>
                                                        <span class="text-gray-500 block">Variables CSS:</span>
                                                        <span class="font-medium"
                                                            x-text="selectedToken?.metadata?.css_variables ? Object.keys(selectedToken.metadata.css_variables).length : 0"></span>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Preview Tipográfico -->
                                            <div class="mb-6">
                                                <h4 class="text-lg font-semibold text-gray-900 mb-3">📝 Vista Previa
                                                    Tipográfica</h4>
                                                <div class="border border-gray-200 rounded-lg p-6"
                                                    :style="`font-family: ${selectedToken?.metadata?.fonts?.primary || selectedToken?.value}`">
                                                    <div class="space-y-4">
                                                        <h1 class="text-4xl font-bold text-gray-900">Título Principal H1
                                                        </h1>
                                                        <h2 class="text-3xl font-semibold text-gray-800">Subtítulo H2</h2>
                                                        <h3 class="text-2xl font-medium text-gray-700">Encabezado H3</h3>
                                                        <p class="text-base text-gray-600">
                                                            Este es un párrafo de ejemplo usando la tipografía seleccionada.
                                                            Muestra cómo se ve el texto normal en esta fuente.
                                                        </p>
                                                        <p class="text-sm text-gray-500">Texto pequeño para notas y
                                                            detalles adicionales.</p>
                                                        <div class="flex gap-3">
                                                            <button
                                                                class="px-4 py-2 bg-blue-500 text-white rounded font-medium">Botón</button>
                                                            <span
                                                                class="px-3 py-2 border border-gray-300 rounded text-gray-700">Badge</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Variables Tipográficas -->
                                            <div class="mb-6">
                                                <h4 class="text-lg font-semibold text-gray-900 mb-3">🔧 Variables CSS de
                                                    Tipografía</h4>
                                                <div class="space-y-2">
                                                    <template x-if="selectedToken?.metadata?.css_variables">
                                                        <template
                                                            x-for="(value, varName) in selectedToken.metadata.css_variables"
                                                            :key="varName">
                                                            <div
                                                                class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                                <code class="font-mono text-sm text-green-600"
                                                                    x-text="'var(' + varName + ')'"></code>
                                                                <div class="flex items-center gap-2">
                                                                    <code class="text-xs text-gray-600 font-mono"
                                                                        x-text="value"></code>
                                                                    <button
                                                                        @click="copyToClipboard('var(' + varName + ')')"
                                                                        class="text-gray-400 hover:text-gray-600"
                                                                        title="Copiar variable CSS">
                                                                        <svg class="w-4 h-4" fill="none"
                                                                            stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path stroke-linecap="round"
                                                                                stroke-linejoin="round" stroke-width="2"
                                                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </template>
                                                    </template>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                    <!-- Fallback si no hay metadata -->

                                    <template x-if="!selectedToken?.metadata">
                                        <div class="text-center py-12">
                                            <div class="text-gray-400 mb-4">
                                                <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor"
                                                    viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                                                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <h3 class="text-lg font-medium text-gray-900 mb-2">Token Incompleto</h3>
                                            <p class="text-gray-600 mb-4">Este design token no tiene metadata generada.</p>
                                            <div class="space-y-2">
                                                <p class="text-sm text-gray-500">
                                                    <strong>Información básica:</strong>
                                                </p>
                                                <div class="bg-gray-100 rounded p-3 text-sm">
                                                    <div>Nombre: <span x-text="selectedToken?.name"></span></div>
                                                    <div>Valor: <span x-text="selectedToken?.value"></span></div>
                                                    <div>Tipo: <span x-text="selectedToken?.type"></span></div>
                                                </div>
                                                <button @click="recreateToken(selectedToken)"
                                                    class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                                    🔄 Recrear Token con Metadata
                                                </button>
                                            </div>
                                        </div>
                                    </template>
                                </div>

                                <div class="border-t border-gray-200 px-6 py-4 flex justify-between">
                                    <button @click="showTokenDetailsModal = false"
                                        class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                                        Cerrar
                                    </button>
                                    <div class="flex gap-2">
                                        <button @click="copyTokenAsCSS(selectedToken)"
                                            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                                            📋 Copiar CSS Completo
                                        </button>
                                        <button @click="openTokenInPreview(selectedToken)"
                                            class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                                            👁️ Ver en Preview
                                        </button>
                                    </div>
                                </div>

                                <!-- Empty state -->
                                <div x-show="filteredVariables.length === 0" class="text-center py-12">
                                    <div class="text-gray-400 mb-4">
                                        <svg class="w-16 h-16 mx-auto" fill="none" stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1"
                                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                    </div>
                                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                                        <span x-show="searchTerm || selectedCategory !== 'all'">No se encontraron
                                            variables</span>
                                        <span x-show="!searchTerm && selectedCategory === 'all'">No hay variables
                                            globales</span>
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
                                        <button x-show="searchTerm || selectedCategory !== 'all'" @click="clearFilters()"
                                            class="px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors">
                                            Limpiar filtros
                                        </button>
                                        <button @click="addVariable()"
                                            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                            + Crear primera variable
                                        </button>
                                    </div>
                                </div>

                                <!-- Variables Info -->
                                <div x-show="globalVariables.length > 0"
                                    class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h5 class="text-sm font-medium text-blue-900 mb-2">💡 Guía de uso rápido:</h5>
                                    <div class="text-xs text-blue-800 space-y-1">
                                        <div>• En Blade: <code
                                                class="bg-blue-100 px-1 rounded font-mono">@{{ '$variable_name' }}</code>
                                        </div>
                                        <div>• Se incluyen automáticamente en el preview</div>
                                        <div>• Perfectas para: títulos del sitio, colores, configuraciones, datos dinámicos
                                        </div>
                                        <div>• <strong>Categorías:</strong> organiza por tipo de uso (diseño, contenido,
                                            SEO, etc.)
                                        </div>
                                    </div>
                                </div>

                                <!-- Botón para guardar variables -->
                                <div x-show="globalVariables.length > 0"
                                    class="flex justify-end pt-4 border-t border-gray-200">
                                    <button @click="saveAllVariables()"
                                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M5 13l4 4L19 7"></path>
                                        </svg>
                                        Guardar Variables
                                    </button>
                                </div>
                            </div>



                        </div>
                    </div>
                    <!-- Communication Tab -->
                    <div x-show="activeTab === 'communication'" class="space-y-4">
                        <div class="text-sm text-gray-600 mb-4">
                            Configura cómo este componente se comunica con otros componentes en la página.
                        </div>

                        <!-- Placeholder para Fase 3 -->
                        <div class="bg-gray-50 p-6 rounded-lg text-center">
                            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor"
                                viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z">
                                </path>
                            </svg>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Comunicación Entre Componentes</h3>
                            <p class="text-gray-600 mb-4">Esta funcionalidad estará disponible en la Fase 3 del
                                desarrollo.
                            </p>
                            <div class="text-sm text-gray-500">
                                <p>• Eventos personalizados</p>
                                <p>• Estado compartido</p>
                                <p>• Comunicación bidireccional</p>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Editor y Preview - Layout Optimizado -->



                <!-- Solo incluir el notification toast -->
                @include('component-builder.partials.notification-toast')

            </div>

            <div class="flex-1 flex" x-data="{ previewCollapsed: false }" x-init="const savedCollapsed = localStorage.getItem('componentBuilderPreviewCollapsed');
            if (savedCollapsed !== null) {
                previewCollapsed = savedCollapsed === 'true';
            }">

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
                    <textarea x-model="component.blade_template" @input="markAsChanged()"
                        class="flex-1 bg-gray-900 text-green-400 font-mono text-sm p-4 resize-none border-0 outline-none"></textarea>
                </div>

                <!-- Preview Panel - Compacto y Retraíble -->
                <div :class="previewCollapsed ? 'w-1/5' : 'w-2/5'"
                    class="border-l border-gray-200 transition-all duration-300 ease-in-out relative flex flex-col">

                    <!-- Botón Toggle Preview -->
                    <button
                        @click="previewCollapsed = !previewCollapsed; localStorage.setItem('componentBuilderPreviewCollapsed', previewCollapsed)"
                        class="absolute -left-3 top-4 z-10 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                        :title="previewCollapsed ? 'Expandir Preview' : 'Colapsar Preview'">
                        <svg :class="previewCollapsed ? 'rotate-180' : ''"
                            class="w-3 h-3 transition-transform duration-300" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <!-- Preview Expandido -->
                    <div x-show="!previewCollapsed" x-transition:enter="transition ease-out duration-300"
                        x-transition:enter-start="opacity-0 transform scale-95"
                        x-transition:enter-end="opacity-100 transform scale-100"
                        x-transition:leave="transition ease-in duration-200"
                        x-transition:leave-start="opacity-100 transform scale-100"
                        x-transition:leave-end="opacity-0 transform scale-95" class="flex flex-col h-full">

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
                                <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor"
                                    viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
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
                                                <span
                                                    x-text="prop.type === 'string' ? `'${prop.value.substring(0,8)}...'` : prop.value"
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
                    <div x-show="previewCollapsed" x-transition:enter="transition ease-out duration-300"
                        x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100"
                        class="h-full flex flex-col items-center justify-center p-3">

                        <!-- Botón vertical para preview -->
                        <button @click="openPreviewWindow()"
                            class="bg-green-500 text-white px-2 py-8 rounded-lg hover:bg-green-600 transition-colors flex flex-col items-center gap-2 transform hover:scale-105 shadow-lg">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                            Click para expandir
                        </div>
                    </div>
                </div>
            </div>


        </div>

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
                showTokenDetailsModal: false,
                selectedToken: null,

                // ===== PROPIEDADES PARA CATEGORÍAS =====
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
                    props_schema: @json($component->props_schema ?? (object) []),
                    preview_config: @json($component->preview_config ?? (object) [])
                },

                // Notification
                notification: {
                    show: false,
                    type: 'info',
                    message: ''
                },

                // ===== PROPIEDADES para Design Tokens =====
                designTokens: [], // Array para almacenar design tokens
                showCreateColorModal: false,
                showCreateTypographyModal: false,
                creatingToken: false,

                // Formularios para modales
                colorForm: {
                    name: '',
                    base_color: '#3B82F6',
                    palette_name: '',
                    description: ''
                },

                typographyForm: {
                    name: '',
                    primary_font: '',
                    secondary_font: '',
                    description: ''
                },

                // Preview data
                colorPreview: {},

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
                                return this.sortOrder === 'asc' ?
                                    a.category.localeCompare(b.category) :
                                    b.category.localeCompare(a.category);
                            }
                            return a.name.localeCompare(b.name);
                        } else {
                            const valueA = a[this.sortBy] || '';
                            const valueB = b[this.sortBy] || '';
                            return this.sortOrder === 'asc' ?
                                valueA.localeCompare(valueB) :
                                valueB.localeCompare(valueA);
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


                // Abrir token en preview
                openTokenInPreview(token) {
                    if (!token) return;

                    // Generar código de ejemplo usando el token
                    let exampleCode = '';

                    if (token.type === 'color_palette') {
                        const tokenName = token.metadata?.name || token.name.replace(/[^a-z0-9]/gi, '_');
                        exampleCode = `<!-- Ejemplo usando el design token: ${token.name} -->
                        <div class="p-8 space-y-6">
                            <!-- Header con el color principal -->
                            <div style="background-color: var(--color-${tokenName}-500); color: white;" 
                                class="p-6 rounded-lg">
                                <h1 class="text-2xl font-bold">Usando ${token.name}</h1>
                                <p>Color base: ${token.value}</p>
                            </div>
                            
                            <!-- Grid de tonalidades -->
                            <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div style="background-color: var(--color-${tokenName}-100);" 
                                    class="p-4 rounded text-center">
                                    <strong>100</strong><br>Muy claro
                                </div>
                                <div style="background-color: var(--color-${tokenName}-300);" 
                                    class="p-4 rounded text-center">
                                    <strong>300</strong><br>Claro
                                </div>
                                <div style="background-color: var(--color-${tokenName}-500); color: white;" 
                                    class="p-4 rounded text-center">
                                    <strong>500</strong><br>Base
                                </div>
                                <div style="background-color: var(--color-${tokenName}-700); color: white;" 
                                    class="p-4 rounded text-center">
                                    <strong>700</strong><br>Oscuro
                                </div>
                                <div style="background-color: var(--color-${tokenName}-900); color: white;" 
                                    class="p-4 rounded text-center">
                                    <strong>900</strong><br>Muy oscuro
                                </div>
                            </div>
                            
                            <!-- Botones de ejemplo -->
                            <div class="flex gap-3">
                                <button style="background-color: var(--color-${tokenName}-500);" 
                                        class="px-6 py-3 text-white rounded-lg hover:opacity-90">
                                    Botón Principal
                                </button>
                                <button style="border: 2px solid var(--color-${tokenName}-500); color: var(--color-${tokenName}-500);" 
                                        class="px-6 py-3 bg-white rounded-lg hover:bg-gray-50">
                                    Botón Secundario
                                </button>
                            </div>
                        </div>`;

                    } else if (token.type === 'typography_system') {
                        exampleCode = `<!-- Ejemplo usando el sistema tipográfico: ${token.name} -->
                        <div style="font-family: var(--font-primary);" class="p-8 space-y-6">
                            <h1 class="text-4xl font-bold text-gray-900 mb-2">
                                Título Principal
                            </h1>
                            <p class="text-lg text-gray-600">
                                Usando la tipografía: ${token.name}
                            </p>
                            
                            <div class="space-y-4">
                                <h2 class="text-3xl font-semibold text-gray-800">
                                    Jerarquía Tipográfica
                                </h2>
                                
                                <p class="text-base text-gray-600 leading-relaxed">
                                    Este es un párrafo de ejemplo que muestra cómo se ve el texto normal 
                                    con la tipografía seleccionada.
                                </p>
                            </div>
                        </div>`;
                    }

                    // Guardar el código temporalmente en el editor para preview
                    const originalCode = this.component.blade_template;
                    this.component.blade_template = exampleCode;

                    // Abrir preview
                    const previewWindow = this.openPreviewWindow();

                    // Restaurar código original después de un momento
                    setTimeout(() => {
                        this.component.blade_template = originalCode;
                    }, 1000);

                    // Cerrar modal
                    this.showTokenDetailsModal = false;

                    this.showNotification('info', 'Preview abierto con ejemplo del design token');
                },

                async copyTokenAsCSS(token) {
                    if (!token || !token.metadata || !token.metadata.css_variables) {
                        this.showNotification('error', 'No hay variables CSS para copiar');
                        return;
                    }

                    let cssContent = `/* Design Token: ${token.name} */\n:root {\n`;

                    Object.entries(token.metadata.css_variables).forEach(([varName, value]) => {
                        cssContent += `  ${varName}: ${value};\n`;
                    });

                    cssContent += `}\n\n/* Ejemplo de uso: */\n`;

                    if (token.type === 'color_palette') {
                        const tokenName = token.metadata?.name || token.name.replace(/[^a-z0-9]/gi, '_');
                        cssContent += `/*\n`;
                        cssContent += `.mi-elemento {\n`;
                        cssContent += `  background-color: var(${Object.keys(token.metadata.css_variables)[0]});\n`;
                        cssContent +=
                            `  color: var(${Object.keys(token.metadata.css_variables)[5] || Object.keys(token.metadata.css_variables)[0]});\n`;
                        cssContent += `}\n`;
                        cssContent += `\n/* Con transparencia: */\n`;
                        cssContent += `.mi-overlay {\n`;
                        const rgbVar = Object.keys(token.metadata.css_variables).find(k => k.includes('-rgb'));
                        if (rgbVar) {
                            cssContent += `  background-color: rgba(var(${rgbVar}), 0.5);\n`;
                        }
                        cssContent += `}\n`;
                        cssContent += `*/\n`;
                    } else if (token.type === 'typography_system') {
                        cssContent += `/*\n`;
                        cssContent += `.mi-texto {\n`;
                        cssContent += `  font-family: var(${Object.keys(token.metadata.css_variables)[0]});\n`;
                        cssContent += `}\n`;
                        cssContent += `*/\n`;
                    }

                    try {
                        await navigator.clipboard.writeText(cssContent);
                        this.showNotification('success', 'CSS completo copiado al portapapeles');
                    } catch (error) {
                        console.error('Error copying CSS:', error);
                        this.showNotification('error', 'Error al copiar CSS');
                    }
                },

                async recreateToken(token) {
                    if (!token) return;

                    try {
                        // Eliminar token actual
                        await this.removeDesignToken(token);

                        // Configurar formulario con datos del token
                        if (token.type === 'color_palette') {
                            this.colorForm = {
                                name: token.name,
                                base_color: token.value,
                                palette_name: '',
                                description: token.description || ''
                            };
                            this.showCreateColorModal = true;
                        }

                        this.showTokenDetailsModal = false;
                        this.showNotification('info', 'Recrea el token para generar metadata completa');

                    } catch (error) {
                        console.error('Error recreating token:', error);
                        this.showNotification('error', 'Error al recrear token');
                    }
                },

                openTokenDetails(token) {
                    this.selectedToken = token;
                    this.showTokenDetailsModal = true;
                    console.log('📊 Token seleccionado:', token);
                },

                // Método mejorado para copiar al portapapeles
                async copyToClipboard(text) {
                    try {
                        await navigator.clipboard.writeText(text);
                        this.showNotification('success',
                            `📋 Copiado: ${text.length > 50 ? text.substring(0, 50) + '...' : text}`);
                    } catch (error) {
                        console.error('Error copying to clipboard:', error);

                        // Fallback para navegadores más antiguos
                        try {
                            const textArea = document.createElement('textarea');
                            textArea.value = text;
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textArea);
                            this.showNotification('success',
                                `📋 Copiado: ${text.length > 50 ? text.substring(0, 50) + '...' : text}`);
                        } catch (fallbackError) {
                            this.showNotification('error', 'No se pudo copiar al portapapeles');
                        }
                    }
                },


                // Init
                async init() {
                    console.log('Component Editor initialized');
                    this.setupAutoSave();

                    // Cargar categorías ANTES que variables
                    await this.loadCategories();

                    // Cargar variables globales
                    await this.loadGlobalVariables();

                    // Cargar design tokens
                    await this.loadDesignTokens();

                    // Inyectar CSS de design tokens
                    await this.injectDesignTokensCSS();
                },

                // ===== MÉTODOS PARA CATEGORÍAS =====

                // Cargar categorías del servidor
                async loadCategories() {
                    try {
                        const response = await fetch('/api/component-builder/global-variables/categories', {
                            headers: {
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute(
                                    'content')
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

                // ===== VARIABLES GLOBALES METHODS =====

                // Cargar variables globales del servidor
                async loadGlobalVariables() {
                    try {
                        const response = await fetch('/api/component-builder/global-variables', {
                            headers: {
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute(
                                    'content')
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

                // Agregar nueva variable
                addVariable() {
                    this.globalVariables.push({
                        id: null,
                        name: '',
                        value: '',
                        type: 'string',
                        category: 'custom',
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
                                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')
                                        .getAttribute('content')
                                }
                            });
                        } catch (error) {
                            console.error('Error deleting variable:', error);
                        }
                    }

                    this.globalVariables.splice(index, 1);
                    this.showNotification('success', 'Variable eliminada');
                },

                // Guardar todas las variables
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
                                    const response = await fetch(
                                        `/api/component-builder/global-variables/${variable.id}`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')
                                                    .getAttribute('content')
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
                                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')
                                                .getAttribute('content')
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

                // ===== MÉTODOS para Design Tokens =====

                // Cargar design tokens del servidor
                async loadDesignTokens() {
                    try {
                        const response = await fetch('/api/component-builder/global-variables?category=design', {
                            headers: {
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute(
                                    'content')
                            }
                        });

                        if (response.ok) {
                            const allVariables = await response.json();
                            this.designTokens = allVariables.filter(v =>
                                v.type === 'color_palette' || v.type === 'typography_system'
                            );
                        } else {
                            this.designTokens = [];
                        }
                    } catch (error) {
                        console.error('Error loading design tokens:', error);
                        this.designTokens = [];
                    }
                },

                // Preview de paleta de colores en tiempo real
                async previewColorPalette() {
                    if (!this.colorForm.base_color || !this.colorForm.base_color.match(/^#[0-9A-Fa-f]{6}$/)) {
                        this.colorPreview = {};
                        return;
                    }

                    try {
                        const response = await fetch('/api/component-builder/design-tokens/preview-color', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute(
                                    'content')
                            },
                            body: JSON.stringify({
                                base_color: this.colorForm.base_color,
                                name: this.colorForm.palette_name || this.colorForm.name || 'preview'
                            })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            this.colorPreview = data.palette;
                            this.colorPreview.contrast_info = data.contrast_info;
                        }
                    } catch (error) {
                        console.error('Error previewing color palette:', error);
                    }
                },

                // Crear paleta de colores
                async createColorPalette() {
                    if (this.creatingToken) return;

                    this.creatingToken = true;

                    try {
                        const response = await fetch('/api/component-builder/design-tokens/color-palette', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute(
                                    'content')
                            },
                            body: JSON.stringify(this.colorForm)
                        });

                        const data = await response.json();

                        if (response.ok) {
                            this.showNotification('success', 'Paleta de colores creada exitosamente');
                            this.designTokens.push(data.variable);

                            // Cerrar modal y limpiar formulario
                            this.showCreateColorModal = false;
                            this.colorForm = {
                                name: '',
                                base_color: '#3B82F6',
                                palette_name: '',
                                description: ''
                            };
                            this.colorPreview = {};

                            // Recargar variables globales para incluir las nuevas
                            await this.loadGlobalVariables();

                        } else {
                            this.showNotification('error', data.error || 'Error al crear paleta de colores');
                        }

                    } catch (error) {
                        console.error('Error creating color palette:', error);
                        this.showNotification('error', 'Error de conexión al crear paleta');
                    } finally {
                        this.creatingToken = false;
                    }
                },

                // Crear sistema tipográfico
                async createTypographySystem() {
                    if (this.creatingToken) return;

                    this.creatingToken = true;

                    try {
                        const response = await fetch('/api/component-builder/design-tokens/typography-system', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute(
                                    'content')
                            },
                            body: JSON.stringify(this.typographyForm)
                        });

                        const data = await response.json();

                        if (response.ok) {
                            this.showNotification('success', 'Sistema tipográfico creado exitosamente');
                            this.designTokens.push(data.variable);

                            // Cerrar modal y limpiar formulario
                            this.showCreateTypographyModal = false;
                            this.typographyForm = {
                                name: '',
                                primary_font: '',
                                secondary_font: '',
                                description: ''
                            };

                            // Recargar variables globales
                            await this.loadGlobalVariables();

                        } else {
                            this.showNotification('error', data.error || 'Error al crear sistema tipográfico');
                        }

                    } catch (error) {
                        console.error('Error creating typography system:', error);
                        this.showNotification('error', 'Error de conexión al crear tipografía');
                    } finally {
                        this.creatingToken = false;
                    }
                },

                // Remover design token
                async removeDesignToken(token) {
                    if (!confirm('¿Estás seguro de que quieres eliminar este design token?')) {
                        return;
                    }

                    try {
                        const response = await fetch(`/api/component-builder/global-variables/${token.id}`, {
                            method: 'DELETE',
                            headers: {
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute(
                                    'content')
                            }
                        });

                        if (response.ok) {
                            this.designTokens = this.designTokens.filter(t => t.id !== token.id);
                            this.showNotification('success', 'Design token eliminado');

                            // Recargar variables globales
                            await this.loadGlobalVariables();
                        } else {
                            this.showNotification('error', 'Error al eliminar design token');
                        }

                    } catch (error) {
                        console.error('Error removing design token:', error);
                        this.showNotification('error', 'Error de conexión');
                    }
                },

                // Copiar color al clipboard
                async copyToClipboard(text) {
                    try {
                        await navigator.clipboard.writeText(text);
                        this.showNotification('success', `Copiado: ${text}`);
                    } catch (error) {
                        console.error('Error copying to clipboard:', error);
                    }
                },

                // Inyectar CSS de design tokens en el preview
                async injectDesignTokensCSS() {
                    try {
                        const response = await fetch('/api/component-builder/design-tokens/css');
                        if (response.ok) {
                            const css = await response.text();

                            // Si estás en preview window, inyectar el CSS
                            if (window.opener) {
                                const styleElement = document.createElement('style');
                                styleElement.textContent = css;
                                document.head.appendChild(styleElement);
                            }

                            return css;
                        }
                    } catch (error) {
                        console.error('Error loading design tokens CSS:', error);
                    }
                    return '';
                },

                // ===== MÉTODOS BÁSICOS =====

                // Setup auto-save
                setupAutoSave() {
                    this.$watch('component', () => {
                        this.hasChanges = true;
                        this.debouncedAutoSave();
                    }, {
                        deep: true
                    });
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

                // Validar formato de array
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

                // Parse array value
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

                // Convertir props a test data
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

                    console.log('🔍 Test Data (Props + Variables):', testData);
                    console.log('📊 Props:', this.testProps.length);
                    console.log('🔄 Variables:', this.globalVariables.length);

                    return testData;
                },

                // Get placeholder for type
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
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute(
                                    'content')
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

                // Mark as changed
                markAsChanged() {
                    this.hasChanges = true;
                },

                // Handle form submission
                async submitForm() {
                    await this.saveComponent();
                },

                // Open preview window
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

                        // Inyectar design tokens CSS en la ventana de preview
                        previewWindow.addEventListener('load', async () => {
                            try {
                                const response = await fetch('/api/component-builder/design-tokens/css');
                                if (response.ok) {
                                    const css = await response.text();
                                    const styleElement = previewWindow.document.createElement('style');
                                    styleElement.textContent = css;
                                    previewWindow.document.head.appendChild(styleElement);
                                    console.log('✅ Design tokens CSS injected into preview');
                                }
                            } catch (error) {
                                console.error('Error injecting design tokens CSS:', error);
                            }
                        });

                    } else {
                        this.showNotification('error',
                            'No se pudo abrir la ventana. Verifica que no estén bloqueadas las ventanas emergentes.');
                    }

                    return previewWindow;
                },

                // Métodos utilitarios para Design tokens
                resetForms() {
                    this.colorForm = {
                        name: '',
                        base_color: '#3B82F6',
                        palette_name: '',
                        description: ''
                    };

                    this.typographyForm = {
                        name: '',
                        primary_font: '',
                        secondary_font: '',
                        description: ''
                    };

                    this.colorPreview = {};
                },

                // Método para obtener variables CSS generadas por design tokens
                getDesignTokensCSSVariables() {
                    const cssVars = {};

                    this.designTokens.forEach(token => {
                        if (token.metadata && token.metadata.css_variables) {
                            Object.assign(cssVars, token.metadata.css_variables);
                        }
                    });

                    return cssVars;
                },

                // Navigate back
                goBack() {
                    window.location.href = '{{ route('component-builder.index') }}';
                }
            };
        }
    </script>
@endsection
