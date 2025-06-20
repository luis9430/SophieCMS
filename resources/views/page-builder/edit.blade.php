{{-- resources/views/page-builder/edit.blade.php --}}
@extends('layouts.page-builder')

@section('title', 'Page Builder - ' . ($page->title ?? 'Nueva Página'))

@section('custom-styles')
<style>
    /* Estilos específicos para el editor si necesitas */
    .component-card:hover {
        transform: translateY(-1px);
        transition: transform 0.2s ease;
    }
    
    .editor-toolbar {
        backdrop-filter: blur(10px);
        background-color: rgba(255, 255, 255, 0.95);
    }
</style>
@endsection

@section('content')
<div x-data="pageBuilder()" class="h-screen flex" x-init="init()">
    
    <!-- Sidebar de componentes -->
    <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
        <!-- Header del sidebar -->
        <div class="p-4 border-b border-gray-200">
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-lg font-semibold text-gray-800">Componentes</h2>
                
                <!-- Botón para crear componente -->
                <a href="{{ route('component-builder.create') }}" 
                class="inline-flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Crear nuevo componente">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Crear
                </a>
            </div>
            
            <!-- Search -->
            <div class="relative">
                <input type="text" 
                    x-model="componentSearch" 
                    placeholder="Buscar componentes..."
                    class="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                
                <!-- Link to Component Builder -->
                <div class="mt-2">
                    <a href="{{ route('component-builder.index') }}" 
                    class="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Gestionar Componentes
                    </a>
                </div>
            </div>
        </div>
        
        <!-- Lista de componentes -->
        <div class="flex-1 p-4 overflow-y-auto">
            <div class="space-y-4">
                <!-- Componentes por categoría -->
                <template x-for="(components, category) in filteredComponents" :key="category">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide" x-text="categoryNames[category]"></h3>
                            
                            <!-- Indicador de componentes avanzados -->
                            <template x-if="components.some(c => c.is_advanced)">
                                <span class="px-1 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                                    Avanzados
                                </span>
                            </template>
                        </div>
                        
                        <div class="grid grid-cols-1 gap-2">
                            <template x-for="component in components" :key="component.id">
                                <div class="relative">
                                    <button @click="addComponent(component)" 
                                            class="component-card w-full text-left p-3 rounded-lg border transition-colors hover:shadow-md"
                                            :class="getCategoryStyle(category)">
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1">
                                                <div class="font-medium" x-text="component.name"></div>
                                                <div class="text-xs opacity-75" x-text="component.description"></div>
                                                
                                                <!-- Assets indicators -->
                                                <template x-if="component.external_assets && component.external_assets.length > 0">
                                                    <div class="flex flex-wrap gap-1 mt-1">
                                                        <template x-for="asset in component.external_assets.slice(0, 2)" :key="asset">
                                                            <span class="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded" x-text="asset"></span>
                                                        </template>
                                                        <template x-if="component.external_assets.length > 2">
                                                            <span class="text-xs text-gray-500" x-text="'+' + (component.external_assets.length - 2)"></span>
                                                        </template>
                                                    </div>
                                                </template>
                                            </div>
                                            
                                            <!-- Edit button for advanced components -->
                                            <template x-if="component.is_advanced">
                                                <a :href="`/admin/page-builder/components/${component.id}/edit`"
                                                @click.stop
                                                class="ml-2 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                title="Editar componente">
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                    </svg>
                                                </a>
                                            </template>
                                        </div>
                                    </button>
                                    
                                    <!-- Version indicator for advanced components -->
                                    <template x-if="component.is_advanced">
                                        <div class="absolute top-1 right-1 px-1 py-0.5 text-xs bg-blue-100 text-blue-800 rounded" x-text="'v' + component.version"></div>
                                    </template>
                                </div>
                            </template>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>


    <!-- Área principal -->
    <div class="flex-1 flex flex-col">
        <!-- Toolbar -->
        <div class="editor-toolbar border-b border-gray-200 p-4 flex items-center justify-between">
            <div class="flex items-center gap-4">
                <h1 class="text-xl font-semibold text-gray-800">
                    {{ $page->title ?? 'Nueva Página' }}
                </h1>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 text-xs rounded"
                          :class="page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                          x-text="page.status === 'published' ? 'Publicada' : 'Borrador'"></span>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <!-- View mode selector -->
                <div class="flex bg-gray-100 rounded-lg p-1">
                    <button @click="viewMode = 'editor'" 
                            :class="viewMode === 'editor' ? 'bg-white shadow-sm' : ''"
                            class="px-3 py-1 text-sm rounded transition-colors">
                        Editor
                    </button>
                    <button @click="viewMode = 'preview'" 
                            :class="viewMode === 'preview' ? 'bg-white shadow-sm' : ''"
                            class="px-3 py-1 text-sm rounded transition-colors">
                        Preview
                    </button>
                    <button @click="viewMode = 'split'" 
                            :class="viewMode === 'split' ? 'bg-white shadow-sm' : ''"
                            class="px-3 py-1 text-sm rounded transition-colors">
                        Split
                    </button>
                </div>
                
                <!-- Actions -->
                <button @click="savePage()" 
                        :disabled="isSaving"
                        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                    <svg x-show="!isSaving" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h8m0 0h2a2 2 0 002-2V9a2 2 0 00-2-2h-2m0 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0h8"></path>
                    </svg>
                    <svg x-show="isSaving" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                    </svg>
                    <span x-text="isSaving ? 'Guardando...' : 'Guardar'"></span>
                </button>
                
                <button @click="showHelp = true" 
                        class="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        <!-- Editor/Preview Area -->
        <div class="flex-1 flex">
            <!-- Editor -->
            <div class="flex-1 relative" 
                 x-show="viewMode === 'editor' || viewMode === 'split'">
                <textarea x-model="content" 
                          @input="updatePreview()" 
                          @keydown.ctrl.s.prevent="savePage()"
                          @keydown.ctrl.p.prevent="viewMode = viewMode === 'preview' ? 'editor' : 'preview'"
                          @keydown.ctrl.h.prevent="showHelp = true"
                          placeholder="Comienza a escribir tu contenido aquí o arrastra componentes desde el sidebar..."
                          class="w-full h-full p-6 font-mono text-sm border-0 resize-none focus:outline-none bg-white"></textarea>
            </div>
            
            <!-- Separator for split view -->
            <div x-show="viewMode === 'split'" class="w-px bg-gray-200"></div>
            
            <!-- Preview -->
            <div class="flex-1 bg-gray-50 overflow-auto" 
                 x-show="viewMode === 'preview' || viewMode === 'split'">
                
                <!-- Preview controls -->
                <div class="sticky top-0 bg-white border-b border-gray-200 p-3 flex justify-between items-center z-10">
                    <div class="flex items-center gap-2">
                        <span class="text-sm text-gray-600">Preview:</span>
                        
                        <!-- Loading indicator -->
                        <div x-show="isUpdatingPreview" class="flex items-center gap-1 text-blue-500">
                            <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                            </svg>
                            <span class="text-xs">Actualizando...</span>
                        </div>
                        
                        <div class="flex bg-gray-100 rounded p-1">
                            <button @click="previewMode = 'desktop'" 
                                    :class="previewMode === 'desktop' ? 'bg-white shadow-sm' : ''"
                                    class="px-2 py-1 text-xs rounded transition-colors">
                                Desktop
                            </button>
                            <button @click="previewMode = 'tablet'" 
                                    :class="previewMode === 'tablet' ? 'bg-white shadow-sm' : ''"
                                    class="px-2 py-1 text-xs rounded transition-colors">
                                Tablet
                            </button>
                            <button @click="previewMode = 'mobile'" 
                                    :class="previewMode === 'mobile' ? 'bg-white shadow-sm' : ''"
                                    class="px-2 py-1 text-xs rounded transition-colors">
                                Mobile
                            </button>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <button @click="performPreviewUpdate()" 
                                :disabled="isUpdatingPreview"
                                class="p-1 text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition-colors disabled:opacity-50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Preview iframe -->
                <div class="p-4">
                    <div class="mx-auto transition-all duration-300"
                         :class="{
                             'max-w-full': previewMode === 'desktop',
                             'max-w-2xl': previewMode === 'tablet', 
                             'max-w-sm': previewMode === 'mobile'
                         }">
                        <div class="bg-white shadow-lg rounded-lg overflow-hidden" 
                             :class="previewMode !== 'desktop' ? 'border' : ''">
                            <iframe x-ref="previewFrame"
                                    class="w-full border-0 transition-all duration-300"
                                    :style="'height: ' + (previewMode === 'mobile' ? '600px' : '800px')"
                                    sandbox="allow-scripts allow-same-origin"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    @include('page-builder.partials.help-modal')
    @include('page-builder.partials.notification-toast')
</div>
@endsection

@section('custom-scripts')
@include('page-builder.partials.page-builder-script')
@endsection