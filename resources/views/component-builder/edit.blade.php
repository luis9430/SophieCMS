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
                    <button @click="activeTab = 'props'" 
                            :class="activeTab === 'props' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
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

                <!-- Props Tab -->
                <div x-show="activeTab === 'props'" class="space-y-4">
                    <!-- Header con tabs para Props y Variables -->
                    <div class="border-b border-gray-200">
                        <div class="flex items-center justify-between mb-3">
                            <div class="flex space-x-1">
                                <button @click="propsSubTab = 'props'" 
                                        :class="propsSubTab === 'props' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-600 border-gray-200'"
                                        class="px-3 py-1 text-sm border rounded-lg transition-colors">
                                    📊 Props
                                </button>
                                <button @click="propsSubTab = 'variables'" 
                                        :class="propsSubTab === 'variables' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-50 text-gray-600 border-gray-200'"
                                        class="px-3 py-1 text-sm border rounded-lg transition-colors">
                                    🔄 Variables
                                </button>
                            </div>
                            
                            <button @click="propsSubTab === 'props' ? addProp() : addVariable()" 
                                    :class="propsSubTab === 'props' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-green-100 text-green-700 hover:bg-green-200'"
                                    class="text-sm px-3 py-1 rounded transition-colors">
                                <span x-text="propsSubTab === 'props' ? '+ Agregar Prop' : '+ Agregar Variable'"></span>
                            </button>
                        </div>
                        
                        <!-- Descripción dinámica -->
                        <div class="text-sm text-gray-600 mb-4">
                            <template x-if="propsSubTab === 'props'">
                                <p>Define props para testing y preview. Estos valores son solo para desarrollo.</p>
                            </template>
                            <template x-if="propsSubTab === 'variables'">
                                <p>Crea variables globales reutilizables en todos tus componentes. Estas se guardan permanentemente.</p>
                            </template>
                        </div>
                    </div>

                    <!-- ===== PROPS TAB ===== -->
                    <div x-show="propsSubTab === 'props'">
                        <!-- Props List -->
                        <div class="space-y-3" x-show="testProps.length > 0">
                            <template x-for="(prop, index) in testProps" :key="index">
                                <div class="border border-gray-200 rounded-lg p-3 bg-blue-50/30">
                                    <div class="flex gap-2 items-start">
                                        <!-- Key Input -->
                                        <div class="flex-1">
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                                            <input type="text" 
                                                x-model="prop.key"
                                                placeholder="title, description..."
                                                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                        </div>
                                        
                                        <!-- Type Select -->
                                        <div class="w-20">
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                            <select x-model="prop.type" 
                                                    class="w-full px-1 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="array">Array</option>
                                            </select>
                                        </div>
                                        
                                        <!-- Value Input -->
                                        <div class="flex-1">
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                                            
                                            <!-- Boolean Select -->
                                            <template x-if="prop.type === 'boolean'">
                                                <select x-model="prop.value" 
                                                        class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                                    <option value="true">true</option>
                                                    <option value="false">false</option>
                                                </select>
                                            </template>
                                            
                                            <!-- Array Textarea -->
                                            <template x-if="prop.type === 'array'">
                                                <div>
                                                    <textarea x-model="prop.value"
                                                            placeholder='["Item 1", "Item 2"] o item1, item2, item3'
                                                            rows="2"
                                                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"></textarea>
                                                    <div class="flex items-center justify-between mt-1">
                                                        <span class="text-xs text-gray-500">Formato: ["item1", "item2"] o item1, item2, item3</span>
                                                        <button @click="validateArrayFormat(prop)" 
                                                                class="text-xs text-blue-600 hover:text-blue-800">
                                                            Validar
                                                        </button>
                                                    </div>
                                                </div>
                                            </template>
                                            
                                            <!-- Other types Input -->
                                            <template x-if="prop.type !== 'boolean' && prop.type !== 'array'">
                                                <input type="text" 
                                                    x-model="prop.value"
                                                    :placeholder="getPlaceholderForType(prop.type)"
                                                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                            </template>
                                        </div>
                                        
                                        <!-- Remove Button -->
                                        <div class="pt-5">
                                            <button @click="removeProp(index)" 
                                                    class="text-red-500 hover:text-red-700 transition-colors">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                        
                        <!-- Empty state for Props -->
                        <div x-show="testProps.length === 0" class="text-center py-8 text-gray-500">
                            <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z"/>
                            </svg>
                            <p class="text-sm">No hay props configurados</p>
                            <button @click="addProp()" class="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                                + Agregar primer prop
                            </button>
                        </div>
                    </div>

                    <!-- ===== VARIABLES TAB ===== -->
                    <div x-show="propsSubTab === 'variables'">
                        <!-- Variables List -->
                        <div class="space-y-3" x-show="globalVariables.length > 0">
                            <template x-for="(variable, index) in globalVariables" :key="index">
                                <div class="border border-green-200 rounded-lg p-3 bg-green-50/30">
                                    <div class="flex gap-2 items-start">
                                        <!-- Variable Name -->
                                        <div class="flex-1">
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Nombre Variable</label>
                                            <input type="text" 
                                                x-model="variable.name"
                                                @input="saveVariable(index)"
                                                placeholder="hotel_title, site_name..."
                                                class="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500">
                                            <div class="text-xs text-gray-500 mt-1">
                                                Úsalo como: <code class="bg-gray-100 px-1 rounded" x-text="'@{{ $' + (variable.name || 'nombre') + ' }}'"></code>
                                            </div>
                                        </div>
                                        
                                        <!-- Variable Type -->
                                        <div class="w-20">
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                            <select x-model="variable.type" 
                                                    @change="saveVariable(index)"
                                                    class="w-full px-1 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500">
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="array">Array</option>
                                            </select>
                                        </div>
                                        
                                        <!-- Variable Value -->
                                        <div class="flex-1">
                                            <label class="block text-xs font-medium text-gray-700 mb-1">Valor</label>
                                            
                                            <!-- Boolean Select -->
                                            <template x-if="variable.type === 'boolean'">
                                                <select x-model="variable.value" 
                                                        @change="saveVariable(index)"
                                                        class="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500">
                                                    <option value="true">true</option>
                                                    <option value="false">false</option>
                                                </select>
                                            </template>
                                            
                                            <!-- Array Textarea -->
                                            <template x-if="variable.type === 'array'">
                                                <textarea x-model="variable.value"
                                                        @input="saveVariable(index)"
                                                        placeholder='["Item 1", "Item 2"] o separado por comas'
                                                        rows="2"
                                                        class="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 font-mono"></textarea>
                                            </template>
                                            
                                            <!-- Other types Input -->
                                            <template x-if="variable.type !== 'boolean' && variable.type !== 'array'">
                                                <input type="text" 
                                                    x-model="variable.value"
                                                    @input="saveVariable(index)"
                                                    :placeholder="variable.type === 'number' ? '123' : 'Valor de la variable...'"
                                                    class="w-full px-2 py-1 text-sm border border-green-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500">
                                            </template>
                                        </div>
                                        
                                        <!-- Remove Button -->
                                        <div class="pt-5">
                                            <button @click="removeVariable(index)" 
                                                    class="text-red-500 hover:text-red-700 transition-colors">
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <!-- Status indicator -->
                                    <div class="mt-2 flex items-center justify-between">
                                        <div class="flex items-center gap-2 text-xs">
                                            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                                            <span class="text-green-700">Variable global guardada</span>
                                        </div>
                                        <div class="text-xs text-gray-500">
                                            ID: <span x-text="variable.id || 'nuevo'"></span>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </div>
                        
                        <!-- Empty state for Variables -->
                        <div x-show="globalVariables.length === 0" class="text-center py-8 text-gray-500">
                            <svg class="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                            </svg>
                            <p class="text-sm font-medium">No hay variables globales</p>
                            <p class="text-xs text-gray-400 mt-1">Las variables te permiten reutilizar valores en todos tus componentes</p>
                            <button @click="addVariable()" class="mt-3 text-green-600 hover:text-green-800 text-sm">
                                + Crear primera variable
                            </button>
                        </div>
                        
                        <!-- Variables Info -->
                        <div x-show="globalVariables.length > 0" class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <h5 class="text-sm font-medium text-green-900 mb-2">💡 Cómo usar variables:</h5>
                            <div class="text-xs text-green-800 space-y-1">
                                <div>• En tu código Blade: <code class="bg-green-100 px-1 rounded">@{{ $variable_name }}</code></div>
                                <div>• Las variables son globales para todo el proyecto</div>
                                <div>• Se incluyen automáticamente en el preview</div>
                                <div>• Perfectas para: títulos del sitio, URLs, configuraciones, etc.</div>
                            </div>
                        </div>
                    </div>

                    <!-- Preview integration info -->
                    <div class="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg" x-show="testProps.length > 0 || globalVariables.length > 0">
                        <h5 class="text-sm font-medium text-gray-900 mb-2">📊 Datos del Preview:</h5>
                        <div class="text-xs text-gray-700 space-y-1">
                            <div x-show="testProps.length > 0">
                                <strong>Props:</strong> <span x-text="testProps.length"></span> configurados (solo desarrollo)
                            </div>
                            <div x-show="globalVariables.length > 0">
                                <strong>Variables:</strong> <span x-text="globalVariables.length"></span> globales (permanentes)
                            </div>
                            <div class="text-gray-500 mt-2">
                                Todos se incluyen automáticamente cuando abres el preview en nueva ventana
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

        // Init
        async init() {
            console.log('Component Editor initialized');
            this.setupAutoSave();
            
            // Cargar variables globales
            await this.loadGlobalVariables();
        },

        // ===== VARIABLES GLOBALES METHODS =====

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

        // Agregar nueva variable
        addVariable() {
            this.globalVariables.push({
                id: null,
                name: '',
                value: '',
                type: 'string',
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
                        type: variable.type
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

        // ===== PROPS METHODS =====

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