{{-- resources/views/component-builder/create.blade.php --}}
@extends('layouts.page-builder')

@section('title', 'Crear Componente - Component Builder')

@section('custom-styles')
<style>
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .tab-button.active { @apply bg-blue-500 text-white; }
    .code-editor { font-family: 'Fira Code', 'Monaco', 'Consolas', monospace; }
</style>
@endsection

@section('content')
<div x-data="componentBuilder()" x-init="init()" class="h-screen flex flex-col bg-gray-50">
    
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
                    <h1 class="text-xl font-semibold text-gray-900">Crear Componente</h1>
                    <p class="text-sm text-gray-600">Diseña componentes avanzados con librerías externas</p>
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
                    <span x-text="isSaving ? 'Guardando...' : 'Guardar'"></span>
                </button>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
        
        <!-- Sidebar con configuración -->
        <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
            
            <!-- Tabs -->
            <div class="border-b border-gray-200">
                <nav class="flex">
                    <button @click="activeTab = 'basic'" 
                            :class="activeTab === 'basic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
                        Básico
                    </button>
                    <button @click="activeTab = 'assets'" 
                            :class="activeTab === 'assets' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/3 py-2 px-1 text-center border-b-2 font-medium text-sm">
                        Assets
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
                    <!-- Name -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Componente *
                        </label>
                        <input type="text" 
                               x-model="component.name" 
                               @input="updateIdentifier()"
                               placeholder="Mi Componente Increíble"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>

                    <!-- Identifier -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Identificador *
                        </label>
                        <input type="text" 
                               x-model="component.identifier"
                               placeholder="mi-componente-increible"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm">
                        <p class="text-xs text-gray-500 mt-1">Se usará como: &lt;x-page-builder.{{ 'componente' }} /&gt;</p>
                    </div>

                    <!-- Category -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            Categoría *
                        </label>
                        <select x-model="component.category" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Seleccionar categoría</option>
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
                                  rows="3"
                                  placeholder="Describe qué hace tu componente..."
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                </div>

                <!-- Assets Tab -->
                <div x-show="activeTab === 'assets'" class="space-y-4">
                    <h4 class="font-medium text-gray-900">Librerías Externas</h4>
                    
                    <div class="space-y-3">
                        @foreach($availableAssets as $key => $asset)
                            <div class="border border-gray-200 rounded-lg p-3">
                                <label class="flex items-start gap-3">
                                    <input type="checkbox" 
                                           :value="'{{ $key }}'"
                                           x-model="component.external_assets"
                                           class="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900">{{ $asset['name'] }}</div>
                                        <div class="text-sm text-gray-600">{{ $asset['description'] }}</div>
                                        <div class="text-xs text-gray-500 mt-1">v{{ $asset['version'] }}</div>
                                    </div>
                                </label>
                            </div>
                        @endforeach
                    </div>

                    <!-- Selected Assets Preview -->
                    <div x-show="component.external_assets.length > 0" class="mt-4">
                        <h5 class="text-sm font-medium text-gray-700 mb-2">Assets Seleccionados:</h5>
                        <div class="space-y-1">
                            <template x-for="asset in component.external_assets" :key="asset">
                                <div class="flex items-center justify-between text-xs bg-purple-50 px-2 py-1 rounded">
                                    <span x-text="asset"></span>
                                    <button @click="removeAsset(asset)" class="text-red-500 hover:text-red-700">×</button>
                                </div>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Communication Tab -->
                <div x-show="activeTab === 'communication'" class="space-y-4">
                    <div class="text-sm text-gray-600 mb-4">
                        Configura cómo este componente se comunica con otros componentes en la página.
                    </div>

                    <!-- Events Emitted -->
                    <div>
                        <h5 class="font-medium text-gray-900 mb-2">Eventos que emite</h5>
                        <div class="space-y-2">
                            <template x-for="(event, index) in component.communication_config.emits" :key="index">
                                <div class="flex gap-2">
                                    <input type="text" 
                                           x-model="event.name"
                                           placeholder="nombre-evento"
                                           class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded">
                                    <select x-model="event.type" class="px-2 py-1 text-sm border border-gray-300 rounded">
                                        <option value="normal">Normal</option>
                                        <option value="broadcast">Broadcast</option>
                                        <option value="sequential">Sequential</option>
                                    </select>
                                    <button @click="removeEmittedEvent(index)" class="px-2 py-1 text-red-500 hover:text-red-700">×</button>
                                </div>
                            </template>
                            <button @click="addEmittedEvent()" class="w-full px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                                + Agregar Evento
                            </button>
                        </div>
                    </div>

                    <!-- Events Listened -->
                    <div>
                        <h5 class="font-medium text-gray-900 mb-2">Eventos que escucha</h5>
                        <div class="space-y-2">
                            <template x-for="(event, index) in component.communication_config.listens" :key="index">
                                <div class="flex gap-2">
                                    <input type="text" 
                                           x-model="event.name"
                                           placeholder="nombre-evento"
                                           class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded">
                                    <input type="text" 
                                           x-model="event.callback"
                                           placeholder="método"
                                           class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded">
                                    <button @click="removeListenedEvent(index)" class="px-2 py-1 text-red-500 hover:text-red-700">×</button>
                                </div>
                            </template>
                            <button @click="addListenedEvent()" class="w-full px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                                + Agregar Listener
                            </button>
                        </div>
                    </div>

                    <!-- Shared State -->
                    <div>
                        <h5 class="font-medium text-gray-900 mb-2">Estado compartido</h5>
                        <div class="space-y-2">
                            <template x-for="(state, index) in component.communication_config.state" :key="index">
                                <div class="space-y-2 border border-gray-200 rounded p-2">
                                    <div class="flex gap-2">
                                        <input type="text" 
                                               x-model="state.key"
                                               placeholder="clave"
                                               class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded">
                                        <input type="text" 
                                               x-model="state.defaultValue"
                                               placeholder="valor por defecto"
                                               class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded">
                                        <button @click="removeStateKey(index)" class="px-2 py-1 text-red-500 hover:text-red-700">×</button>
                                    </div>
                                    <label class="flex items-center gap-2 text-sm">
                                        <input type="checkbox" x-model="state.persist" class="rounded">
                                        Persistir en sessionStorage
                                    </label>
                                </div>
                            </template>
                            <button @click="addStateKey()" class="w-full px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                                + Agregar Estado
                            </button>
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
                    </div>
                </div>
                
                <textarea x-model="component.blade_template"
                          @input="debouncedUpdatePreview()"
                          class="flex-1 bg-gray-900 text-green-400 font-mono text-sm p-4 resize-none border-0 outline-none"
                          placeholder="Escribe tu código Blade aquí...

Ejemplo:
<div x-data='myComponent()' class='p-6'>
    <h2 class='text-2xl font-bold'>{{ $title ?? 'Mi Componente' }}</h2>
    <p>{{ $description ?? 'Descripción del componente' }}</p>
</div>

<script>
function myComponent() {
    return {
        // Tu lógica Alpine.js aquí
    }
}
</script>"></textarea>
            </div>

            <!-- Preview -->
            <div class="w-1/2 flex flex-col border-l border-gray-200">
                <div class="bg-gray-100 px-4 py-2 text-sm flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <span>Preview</span>
                        <div x-show="isUpdatingPreview" class="flex items-center gap-1 text-blue-500">
                            <svg class="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" class="opacity-75"></path>
                            </svg>
                            <span class="text-xs">Actualizando...</span>
                        </div>
                    </div>
                    
                    <div class="flex items-center gap-2">
                        <select x-model="previewMode" @change="updatePreview()" class="px-2 py-1 text-xs border border-gray-300 rounded">
                            <option value="desktop">Desktop</option>
                            <option value="tablet">Tablet</option>
                            <option value="mobile">Mobile</option>
                        </select>
                        <button @click="updatePreview()" 
                                :disabled="isUpdatingPreview"
                                class="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
                            Refresh
                        </button>
                    </div>
                </div>
                
                <div class="flex-1 p-4 bg-gray-50 overflow-auto">
                    <div :class="{
                        'max-w-full': previewMode === 'desktop',
                        'max-w-2xl mx-auto': previewMode === 'tablet',
                        'max-w-sm mx-auto': previewMode === 'mobile'
                    }" class="transition-all duration-300">
                        <div class="bg-white shadow-lg rounded-lg overflow-hidden" 
                             :class="previewMode !== 'desktop' ? 'border' : ''">
                            <iframe x-ref="previewFrame"
                                    class="w-full border-0"
                                    :style="'height: ' + (previewMode === 'mobile' ? '500px' : '600px')"
                                    sandbox="allow-scripts allow-same-origin"></iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    @include('component-builder.partials.notification-toast')
</div>
@endsection

@section('custom-scripts')
<script>
function componentBuilder() {
    return {
        // State
        activeTab: 'basic',
        previewMode: 'desktop',
        isSaving: false,
        isUpdatingPreview: false,
        previewTimeout: null,
        
        // Component data
        component: {
            name: '',
            identifier: '',
            category: '',
            description: '',
            blade_template: '',
            external_assets: [],
            communication_config: {
                emits: [],
                listens: [],
                state: []
            },
            props_schema: {},
            preview_config: {}
        },

        // Notification
        notification: {
            show: false,
            type: 'info',
            message: ''
        },

        // Init
        init() {
            this.updatePreview();
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

        // Asset management
        removeAsset(asset) {
            const index = this.component.external_assets.indexOf(asset);
            if (index > -1) {
                this.component.external_assets.splice(index, 1);
                this.updatePreview();
            }
        },

        // Communication events
        addEmittedEvent() {
            this.component.communication_config.emits.push({
                name: '',
                type: 'normal'
            });
        },

        removeEmittedEvent(index) {
            this.component.communication_config.emits.splice(index, 1);
        },

        addListenedEvent() {
            this.component.communication_config.listens.push({
                name: '',
                callback: ''
            });
        },

        removeListenedEvent(index) {
            this.component.communication_config.listens.splice(index, 1);
        },

        addStateKey() {
            this.component.communication_config.state.push({
                key: '',
                defaultValue: '',
                persist: false
            });
        },

        removeStateKey(index) {
            this.component.communication_config.state.splice(index, 1);
        },

        // Preview
        debouncedUpdatePreview() {
            if (this.previewTimeout) {
                clearTimeout(this.previewTimeout);
            }
            
            this.previewTimeout = setTimeout(() => {
                this.updatePreview();
            }, 800);
        },

        async updatePreview() {
            if (this.isUpdatingPreview) return;
            
            this.isUpdatingPreview = true;

            try {
                const response = await fetch('/api/component-builder/preview', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        component_code: this.component.blade_template,
                        external_assets: this.component.external_assets,
                        test_data: {
                            title: 'Título de Prueba',
                            description: 'Esta es una descripción de prueba para el componente.'
                        }
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    this.renderPreview(data.html);
                } else {
                    this.renderPreview(`<div class="p-8 text-center text-red-500">
                        <h3 class="font-bold mb-2">Error en el componente</h3>
                        <p class="text-sm">${data.error}</p>
                    </div>`);
                }
            } catch (error) {
                this.renderPreview(`<div class="p-8 text-center text-red-500">
                    <h3 class="font-bold mb-2">Error de conexión</h3>
                    <p class="text-sm">${error.message}</p>
                </div>`);
            } finally {
                this.isUpdatingPreview = false;
            }
        },

        renderPreview(html) {
            const iframe = this.$refs.previewFrame;
            if (!iframe) return;

            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();
        },

        // Validation
        async validateCode() {
            try {
                const response = await fetch('/api/component-builder/validate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        code: this.component.blade_template
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    this.showNotification('success', 'Código válido');
                } else {
                    this.showNotification('error', `Error: ${data.error}`);
                }
            } catch (error) {
                this.showNotification('error', 'Error de validación');
            }
        },

        // Format code (basic)
        formatCode() {
            // Basic Blade formatting
            let code = this.component.blade_template;
            
            // Add basic indentation
            code = code.replace(/(<[^>]+>)/g, '\n$1\n');
            code = code.replace(/\n\s*\n/g, '\n');
            code = code.trim();
            
            this.component.blade_template = code;
            this.showNotification('info', 'Código formateado');
        },

        // Save component
        async saveComponent() {
            if (this.isSaving) return;

            // Basic validation
            if (!this.component.name.trim()) {
                this.showNotification('error', 'El nombre del componente es requerido');
                return;
            }

            if (!this.component.identifier.trim()) {
                this.showNotification('error', 'El identificador es requerido');
                return;
            }

            if (!this.component.category) {
                this.showNotification('error', 'La categoría es requerida');
                return;
            }

            if (!this.component.blade_template.trim()) {
                this.showNotification('error', 'El código del componente es requerido');
                return;
            }

            this.isSaving = true;

            try {
                const response = await fetch('/admin/page-builder/components', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify(this.component)
                });

                const data = await response.json();

                if (response.ok && data.success !== false) {
                    this.showNotification('success', 'Componente creado exitosamente');
                    setTimeout(() => {
                        window.location.href = `/admin/page-builder/components/${data.component?.id || ''}/edit`;
                    }, 1500);
                } else {
                    this.showNotification('error', data.error || 'Error al crear el componente');
                }
            } catch (error) {
                this.showNotification('error', 'Error de conexión');
            } finally {
                this.isSaving = false;
            }
        },

        // Notifications
        showNotification(type, message) {
            this.notification = { show: true, type, message };
            setTimeout(() => {
                this.notification.show = false;
            }, 4000);
        }
    }
}
</script>
@endsection