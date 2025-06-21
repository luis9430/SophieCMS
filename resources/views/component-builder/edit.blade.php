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
        <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
            
            <!-- Tabs - ACTUALIZADO CON 4 TABS -->
            <div class="border-b border-gray-200">
                <nav class="flex">
                    <button @click="activeTab = 'basic'" 
                            :class="activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/4 py-2 px-1 text-center border-b-2 font-medium text-sm">
                        Básico
                    </button>
                    <button @click="activeTab = 'props'" 
                            :class="activeTab === 'props' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/4 py-2 px-1 text-center border-b-2 font-medium text-sm">
                        Props
                    </button>
                    <button @click="activeTab = 'templates'" 
                            :class="activeTab === 'templates' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/4 py-2 px-1 text-center border-b-2 font-medium text-sm">
                        Templates
                    </button>
                    <button @click="activeTab = 'communication'" 
                            :class="activeTab === 'communication' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/4 py-2 px-1 text-center border-b-2 font-medium text-sm">
                        Com.
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
                    <div class="flex items-center justify-between">
                        <h4 class="font-medium text-gray-900">Props Simulator</h4>
                        <button @click="addProp()" 
                                class="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">
                            + Agregar Prop
                        </button>
                    </div>
                    
                    <div class="text-sm text-gray-600 mb-4">
                        Define props para testing y preview. Estos valores son solo para desarrollo.
                    </div>

                    <!-- Props List -->
                    <div class="space-y-3">
                        <template x-for="(prop, index) in testProps" :key="index">
                            <div class="border border-gray-200 rounded-lg p-3">
                                <div class="flex gap-2 items-start">
                                    <!-- Key Input -->
                                    <div class="flex-1">
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
                                        <input type="text" 
                                            x-model="prop.key"
                                            @input="updatePreviewWithProps()"
                                            placeholder="title, description..."
                                            class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                    </div>
                                    
                                    <!-- Type Select -->
                                    <div class="w-20">
                                        <label class="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                        <select x-model="prop.type" 
                                                @change="updatePreviewWithProps()"
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
                                        <template x-if="prop.type === 'boolean'">
                                            <select x-model="prop.value" 
                                                    @change="updatePreviewWithProps()"
                                                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                                <option value="true">true</option>
                                                <option value="false">false</option>
                                            </select>
                                        </template>
                                        <template x-if="prop.type !== 'boolean'">
                                            <input type="text" 
                                                x-model="prop.value"
                                                @input="updatePreviewWithProps()"
                                                :placeholder="getPlaceholderForType(prop.type)"
                                                class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
                                        </template>
                                    </div>
                                    
                                    <!-- Remove Button -->
                                    <div class="pt-5">
                                        <button @click="removeProp(index)" 
                                                class="text-red-500 hover:text-red-700 text-sm">
                                            ×
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </div>

                    <!-- Empty State -->
                    <div x-show="testProps.length === 0" class="text-center py-8 text-gray-500">
                        <svg class="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        <p class="text-sm">No hay props definidos</p>
                        <p class="text-xs">Agrega props para testear tu componente</p>
                    </div>

                    <!-- Generated Code Preview -->
                    <div x-show="testProps.length > 0" class="mt-6">
                        <h5 class="text-sm font-medium text-gray-700 mb-2">Código generado para Page Builder:</h5>
                        <div class="bg-gray-100 p-3 rounded-lg">
                            <code class="text-sm font-mono text-gray-800" x-text="getGeneratedCode()"></code>
                        </div>
                        <button @click="copyGeneratedCode()" 
                                class="mt-2 text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700">
                            Copiar código
                        </button>
                    </div>

                    <!-- Quick Presets -->
                    <div class="mt-6 pt-4 border-t border-gray-200">
                        <h5 class="text-sm font-medium text-gray-700 mb-2">Presets rápidos:</h5>
                        <div class="flex flex-wrap gap-2">
                            <button @click="loadPreset('card')" 
                                    class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">
                                Card básica
                            </button>
                            <button @click="loadPreset('hero')" 
                                    class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200">
                                Hero section
                            </button>
                            <button @click="loadPreset('button')" 
                                    class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded hover:bg-orange-200">
                                Botón
                            </button>
                        </div>
                    </div>
                </div>

                <!-- NUEVA PESTAÑA TEMPLATES -->
                <div x-show="activeTab === 'templates'" class="space-y-6">
                    <!-- Header explicativo -->
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 class="font-medium text-blue-900 mb-2">🔄 Sistema Dual de Templates</h4>
                        <p class="text-sm text-blue-800 mb-3">
                            Tu componente puede tener dos versiones: una completa (Component Builder) y una optimizada (Page Builder).
                        </p>
                        <div class="flex items-center space-x-4">
                            <label class="flex items-center">
                                <input type="checkbox" 
                                       x-model="component.auto_generate_short"
                                       @change="markAsChanged()"
                                       class="rounded border-gray-300 text-blue-600">
                                <span class="ml-2 text-sm text-blue-800">Auto-generar template corto</span>
                            </label>
                            
                            <button @click="regenerateShortTemplate()" 
                                    class="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                🔄 Regenerar
                            </button>
                        </div>
                    </div>

                    <!-- Template Completo (Solo lectura) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            📝 Template Completo (Component Builder)
                            <span class="text-gray-500">- Solo lectura</span>
                        </label>
                        <div class="bg-gray-50 border rounded-lg p-4 max-h-60 overflow-y-auto">
                            <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono" x-text="component.blade_template"></pre>
                        </div>
                        <div class="mt-2 text-xs text-gray-600">
                            ✏️ Editar este template en el editor principal a la derecha.
                        </div>
                    </div>

                    <!-- Template Corto (Editable) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            ⚡ Template para Page Builder
                            <span class="text-green-600">- Optimizado y editable</span>
                        </label>
                        <textarea x-model="component.page_builder_template" 
                                  @input="markAsChanged()"
                                  rows="4"
                                    placeholder="<x-page-builder.{{ $component->identifier }} title=&quot;Hello World&quot; />"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                        
                        <!-- Vista previa del uso -->
                        <div class="mt-2 p-3 bg-gray-100 rounded">
                            <p class="text-xs text-gray-600 mb-1">Uso en Page Builder:</p>
                            <code class="text-sm text-gray-800" x-text="component.page_builder_template || 'Template automático se generará...'"></code>
                        </div>
                    </div>

                    <!-- Configuración de Props para Template Corto -->
                    <div x-show="component.page_builder_template">
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            🎛️ Props Disponibles para Template Corto
                        </label>
                        <div class="bg-white border rounded-lg p-4">
                            <div x-show="testProps.length > 0">
                                <template x-for="(prop, index) in testProps" :key="index">
                                    <div x-show="prop.key" class="flex items-center justify-between py-2 border-b last:border-b-0">
                                        <div>
                                            <span class="font-medium text-sm" x-text="prop.key"></span>
                                            <span class="text-xs text-gray-500 ml-2" x-text="prop.type || 'string'"></span>
                                        </div>
                                        <div class="text-sm text-gray-600" x-text="prop.value || 'Sin valor por defecto'"></div>
                                    </div>
                                </template>
                            </div>
                            <div x-show="testProps.length === 0" class="text-gray-500 text-sm">
                                No hay props configurados. Ve a la pestaña "Props" para agregar.
                            </div>
                        </div>
                    </div>

                    <!-- Acciones rápidas -->
                    <div class="flex gap-3">
                        <button @click="copyPageBuilderTemplate()" 
                                class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                            📋 Copiar Template Corto
                        </button>
                        
                        <button @click="testPageBuilderTemplate()" 
                                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                            🧪 Probar en Page Builder
                        </button>
                    </div>

                    <!-- Ejemplos de uso -->
                    <div class="bg-gray-50 border rounded-lg p-4">
                        <h5 class="text-sm font-medium text-gray-700 mb-2">📖 Ejemplos de Templates Cortos</h5>
                        <div class="space-y-2 text-sm font-mono text-gray-700">
                            <div class="bg-white p-2 rounded border">
                                &lt;x-page-builder.hero title="Mi título" subtitle="Mi subtítulo" /&gt;
                            </div>
                            <div class="bg-white p-2 rounded border">
                                &lt;x-page-builder.card title="Card" :tags="['web', 'design']" /&gt;
                            </div>
                            <div class="bg-white p-2 rounded border">
                                &lt;x-page-builder.button text="Click me" variant="primary" :disabled="false" /&gt;
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

        <!-- Editor y Preview -->
        <div class="flex-1 flex">
            
            <!-- Editor -->
            <div class="w-1/2 flex flex-col">
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
                
                <textarea x-model="component.blade_template"
                          @input="markAsChanged()"              
                          class="flex-1 bg-gray-900 text-green-400 font-mono text-sm p-4 resize-none border-0 outline-none"></textarea>
            </div>

            <!-- Preview -->
            <div class="w-1/2 flex flex-col border-l border-gray-200">
                <div class="bg-gray-100 px-4 py-2 text-sm flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span>Preview</span>
                        <span class="text-xs text-gray-500">(Click en "Nueva Ventana" para ver el preview)</span>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <button @click="openPreviewWindow()" 
                                class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                            🪟 Abrir Preview
                        </button>
                    </div>
                </div>
                
                <!-- Área de preview placeholder -->
                <div class="flex-1 p-8 bg-gray-50 flex items-center justify-center">
                    <div class="text-center">
                        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        
                        <h3 class="text-lg font-medium text-gray-900 mb-2">Preview en Ventana Nueva</h3>
                        <p class="text-gray-600 mb-4">
                            Para una mejor experiencia de preview, abre el componente en una ventana separada.
                        </p>
                        
                        <button @click="openPreviewWindow()" 
                                class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                            🪟 Abrir Preview
                        </button>
                        
                        <div class="mt-6 text-sm text-gray-500">
                            <h4 class="font-medium mb-2">Ventajas del preview en ventana nueva:</h4>
                            <ul class="text-left space-y-1">
                                <li>• ✅ Tailwind funciona perfectamente</li>
                                <li>• ✅ Alpine + GSAP sin problemas</li>
                                <li>• ✅ Sin restricciones de iframe</li>
                                <li>• ✅ Debugging completo en consola</li>
                                <li>• ✅ Más espacio para visualizar</li>
                            </ul>
                        </div>
                        
                        <!-- Info de props actual -->
                        <div x-show="testProps.length > 0" class="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 class="font-medium text-blue-900 mb-2">Props configurados:</h4>
                            <div class="text-sm text-blue-800">
                                <template x-for="prop in testProps" :key="prop.key">
                                    <div x-show="prop.key && prop.value" class="flex justify-between">
                                        <span x-text="prop.key"></span>
                                        <span x-text="prop.type === 'string' ? `'${prop.value}'` : prop.value" class="font-mono"></span>
                                    </div>
                                </template>
                            </div>
                            <p class="text-xs text-blue-600 mt-2">
                                Estos props se incluirán automáticamente en el preview
                            </p>
                        </div>
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
        
        // Component data - LIMPIO Y SEGURO
        component: {
            id: {{ $component->id }},
            name: @json($component->name ?? ''),
            identifier: @json($component->identifier ?? ''),
            category: @json($component->category ?? 'content'),
            description: @json($component->description ?? ''),
            blade_template: @json($component->blade_template ?? ''),
            page_builder_template: @json($component->page_builder_template ?? ''),
            auto_generate_short: {{ ($component->auto_generate_short ?? true) ? 'true' : 'false' }},
            template_config: @json($component->template_config ?? []),
            communication_config: @json($component->communication_config ?? ['emits' => [], 'listens' => [], 'state' => []]),
            props_schema: @json($component->props_schema ?? []),
            preview_config: @json($component->preview_config ?? [])
        },

        // Notification
        notification: {
            show: false,
            type: 'info',
            message: ''
        },

        // Init
        init() {
            console.log('Component Editor initialized');
            this.setupAutoSave();
        },

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
                await this.saveComponent(false);
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

        // Convert props array to test data object
        convertPropsToTestData() {
            const testData = {};
            
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
            
            console.log('🔍 Test Data enviado:', testData);
            return testData;
        },

        parseArrayValue(arrayString) {
            try {
                const parsed = JSON.parse(arrayString);
                return Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                return arrayString.split(',').map(item => item.trim()).filter(item => item !== '');
            }
        },

        // Generate code for Page Builder
        getGeneratedCode() {
            if (this.testProps.length === 0) return '';
            
            let code = `<x-page-builder.${this.component.identifier}`;
            
            this.testProps.forEach(prop => {
                if (prop.key && prop.value !== '') {
                    if (prop.type === 'string') {
                        code += `\n    ${prop.key}="${prop.value}"`;
                    } else {
                        code += `\n    :${prop.key}="${this.formatPropValue(prop)}"`;
                    }
                }
            });
            
            code += ' />';
            return code;
        },

        // Format prop value for Blade
        formatPropValue(prop) {
            switch (prop.type) {
                case 'number':
                    return prop.value;
                case 'boolean':
                    return prop.value;
                case 'array':
                    try {
                        const parsed = JSON.parse(prop.value);
                        return JSON.stringify(parsed);
                    } catch (e) {
                        const items = prop.value.split(',').map(item => `'${item.trim()}'`);
                        return `[${items.join(', ')}]`;
                    }
                default:
                    return `"${prop.value}"`;
            }
        },

        // Copy generated code to clipboard
        async copyGeneratedCode() {
            try {
                await navigator.clipboard.writeText(this.getGeneratedCode());
                this.showNotification('success', 'Código copiado al portapapeles');
            } catch (err) {
                this.showNotification('error', 'Error al copiar código');
            }
        },

        // Get placeholder text for input types
        getPlaceholderForType(type) {
            switch (type) {
                case 'string': return 'Texto aquí...';
                case 'number': return '123';
                case 'boolean': return 'true/false';
                case 'array': return '["Item 1", "Item 2"] o item1, item2, item3';
                default: return '';
            }
        },

        // Load preset props
        loadPreset(presetName) {
            switch (presetName) {
                case 'card':
                    this.testProps = [
                        { key: 'title', value: 'Título de Card', type: 'string' },
                        { key: 'description', value: 'Descripción de la card', type: 'string' },
                        { key: 'image', value: 'https://via.placeholder.com/300x200', type: 'string' },
                        { key: 'tags', value: '["Nuevo", "Popular", "Oferta"]', type: 'array' },
                        { key: 'url', value: '#', type: 'string' }
                    ];
                    break;
                case 'hero':
                    this.testProps = [
                        { key: 'title', value: 'Título Principal', type: 'string' },
                        { key: 'subtitle', value: 'Subtítulo descriptivo', type: 'string' },
                        { key: 'button_text', value: 'Llamada a acción', type: 'string' },
                        { key: 'features', value: 'Rápido, Seguro, Confiable', type: 'array' },
                        { key: 'background_image', value: 'https://via.placeholder.com/1200x600', type: 'string' }
                    ];
                    break;
                case 'button':
                    this.testProps = [
                        { key: 'text', value: 'Click aquí', type: 'string' },
                        { key: 'url', value: '#', type: 'string' },
                        { key: 'variant', value: 'primary', type: 'string' },
                        { key: 'classes', value: '["hover:scale-105", "transition-transform"]', type: 'array' },
                        { key: 'disabled', value: 'false', type: 'boolean' }
                    ];
                    break;
            }
        },

        // NUEVOS MÉTODOS PARA PROPS - VERSIÓN SIMPLE Y SEGURA

        // Preview con props actuales - MÉTODO SIMPLE
        async previewWithCurrentProps() {
            if (this.testProps.length === 0) {
                this.showNotification('warning', 'Agrega algunos props para ver el preview');
                return;
            }

            try {
                // Usar la ruta de preview existente pero con datos de props
                const testData = this.convertPropsToTestData();
                const componentId = this.component.id;
                
                // Crear URL con los props como parámetros
                let previewUrl = `/preview/component/${componentId}`;
                
                if (Object.keys(testData).length > 0) {
                    const params = new URLSearchParams();
                    Object.entries(testData).forEach(([key, value]) => {
                        if (typeof value === 'object') {
                            params.append(key, JSON.stringify(value));
                        } else {
                            params.append(key, value);
                        }
                    });
                    previewUrl = `/preview/component/${componentId}/custom?${params.toString()}`;
                }
                
                // Abrir preview con props
                const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes';
                
                const previewWindow = window.open(previewUrl, `preview-props-${componentId}`, windowFeatures);
                
                if (previewWindow) {
                    previewWindow.focus();
                    this.showNotification('success', `Preview abierto con ${Object.keys(testData).length} props`);
                } else {
                    this.showNotification('error', 'No se pudo abrir ventana de preview');
                }
                
            } catch (error) {
                console.error('Error in preview with props:', error);
                this.showNotification('error', 'Error al generar preview con props');
            }
        },

        // NUEVOS MÉTODOS PARA SISTEMA DUAL DE TEMPLATES

        // Regenerar template corto
        async regenerateShortTemplate() {
            try {
                const response = await fetch(`/admin/page-builder/components/${this.component.id}/regenerate-template`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();
                
                if (result.success) {
                    this.component.page_builder_template = result.short_template;
                    this.showNotification('success', 'Template regenerado exitosamente');
                } else {
                    this.showNotification('error', result.message);
                }
            } catch (error) {
                this.showNotification('error', 'Error al regenerar template');
            }
        },

        // Copiar template corto al portapapeles
        async copyPageBuilderTemplate() {
            const template = this.component.page_builder_template;
            if (template) {
                try {
                    await navigator.clipboard.writeText(template);
                    this.showNotification('success', 'Template copiado al portapapeles');
                } catch (err) {
                    this.showNotification('error', 'Error al copiar template');
                }
            } else {
                this.showNotification('warning', 'No hay template corto para copiar');
            }
        },

        // Probar template en page builder
        testPageBuilderTemplate() {
            const template = this.component.page_builder_template;
            if (template) {
                const testData = this.convertPropsToTestData();
                const params = new URLSearchParams();
                params.append('template', template);
                params.append('test_data', JSON.stringify(testData));
                
                const testUrl = `/admin/page-builder/test-component?${params.toString()}`;
                window.open(testUrl, '_blank');
            } else {
                this.showNotification('warning', 'No hay template corto para probar');
            }
        },

        // Validar código - ARREGLADO
        validateCode() {
            const template = this.component.blade_template;
            const errors = [];
            
            const openBraces = (template.match(/\{/g) || []).length;
            const closeBraces = (template.match(/\}/g) || []).length;
            if (openBraces !== closeBraces) {
                errors.push('Llaves desequilibradas');
            }
            
            // Verificar directivas básicas - ESCAPADO PARA BLADE
            const at = '@';
            const endifStr = at + 'endif';
            const ifStr = at + 'if';
            
            if (template.includes(endifStr) && !template.includes(ifStr)) {
                errors.push('Directiva ' + endifStr + ' sin ' + ifStr + ' correspondiente');
            }
            
            if (errors.length > 0) {
                this.showNotification('error', 'Errores encontrados: ' + errors.join(', '));
            } else {
                this.showNotification('success', 'Código válido');
            }
        },

        // Formatear código
        formatCode() {
            let formatted = this.component.blade_template;
            
            formatted = formatted.replace(/(@\w+.*?)(<)/g, '$1\n$2');
            formatted = formatted.replace(/(>)(@\w+)/g, '$1\n$2');
            formatted = formatted.replace(/\s+/g, ' ');
            formatted = formatted.replace(/\n\s*\n/g, '\n');
            
            this.component.blade_template = formatted;
            this.showNotification('success', 'Código formateado');
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

        // Open preview window
        openPreviewWindow() {
            const componentId = this.component.id;
            const testData = this.convertPropsToTestData();
            
            let previewUrl = `/preview/component/${componentId}`;
            
            if (Object.keys(testData).length > 0) {
                const params = new URLSearchParams();
                Object.entries(testData).forEach(([key, value]) => {
                    if (typeof value === 'object') {
                        params.append(key, JSON.stringify(value));
                    } else {
                        params.append(key, value);
                    }
                });
                previewUrl = `/preview/component/${componentId}/custom?${params.toString()}`;
            }
            
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
            
            const previewWindow = window.open(
                previewUrl, 
                `component-preview-${componentId}`, 
                windowFeatures
            );
            
            if (previewWindow) {
                previewWindow.focus();
                this.showNotification('success', 'Preview abierto en nueva ventana');
            } else {
                this.showNotification('error', 'No se pudo abrir la ventana. Verifica que no estén bloqueadas las ventanas emergentes.');
            }
        },

        // Helper methods
        markAsChanged() {
            this.hasChanges = true;
        },

        updatePreviewWithProps() {
            console.log('🔄 Preview updated with props:', this.testProps);
        },

        goBack() {
            window.location.href = "{{ route('component-builder.index') }}";
        }
    };
}
</script>
@endsection