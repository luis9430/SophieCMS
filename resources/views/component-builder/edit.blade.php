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
            
            <!-- Tabs -->
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
                    <button @click="activeTab = 'assets'" 
                            :class="activeTab === 'assets' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/4 py-2 px-1 text-center border-b-2 font-medium text-sm">
                        Assets
                    </button>
                    <button @click="activeTab = 'communication'" 
                            :class="activeTab === 'communication' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                            class="w-1/4 py-2 px-1 text-center border-b-2 font-medium text-sm">
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


                                    <template x-if="prop.type === 'array'">
                                        <div class="w-full">
                                            <textarea x-model="prop.value"
                                                    @input="updatePreviewWithProps()"
                                                    :placeholder="getPlaceholderForType(prop.type)"
                                                    rows="3"
                                                    class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"></textarea>
                                            <div class="flex items-center justify-between mt-1">
                                                <div class="text-xs text-gray-500">
                                                    Formato: ["item1", "item2"] o item1, item2, item3
                                                </div>
                                                <button @click="validateArrayFormat(prop)" 
                                                        type="button"
                                                        class="text-xs text-blue-600 hover:text-blue-800">
                                                    Validar
                                                </button>
                                            </div>
                                            <!-- Validation feedback -->
                                            <div x-show="prop.validationError" 
                                                x-text="prop.validationError"
                                                class="text-xs text-red-600 mt-1"></div>
                                        </div>
                                    </template>
                                    
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
                                           @change="markAsChanged(); updatePreview()"
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
                          @input="markAsChanged(); debouncedUpdatePreview()"
                          class="flex-1 bg-gray-900 text-green-400 font-mono text-sm p-4 resize-none border-0 outline-none"></textarea>
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
        // Component data - cargado de forma ultra segura
        component: {
            id: {{ $component->id }},
            name: "{{ addslashes($component->name ?? '') }}",
            identifier: "{{ addslashes($component->identifier ?? '') }}",
            category: "{{ addslashes($component->category ?? 'content') }}",
            description: "{{ addslashes($component->description ?? '') }}",
            blade_template: `{!! addslashes($component->blade_template ?? '') !!}`,
            external_assets: @json($component->external_assets ?? []),
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

        // Available assets
        availableAssets: @json($availableAssets ?? []),

        // Init
        init() {
            console.log('Component Editor initialized');
            this.updatePreview();
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
                type: 'string'
            });
        },

        removeStateKey(index) {
            this.component.communication_config.state.splice(index, 1);
        },

        // Preview updates
            updatePreview() {
            // Cambiar para que siempre use props
            this.updatePreviewWithProps();
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
            this.updatePreviewWithProps();
        },

        // Update preview with current props
         updatePreviewWithProps() {
            clearTimeout(this.previewTimeout);
            this.previewTimeout = setTimeout(() => {
                this.generateUnifiedPreview(); // ← Usar el método unificado
            }, 500);
        },




        // Generate preview with test props
      generatePreviewWithProps() {
            return this.generateUnifiedPreview(); // ← Usar el método unificado
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
                
                // DEBUG TEMPORAL - agrega estas líneas
                console.log('🔍 Test Data enviado:', testData);
                console.log('🔍 Props configurados:', this.testProps);
                
                return testData;
            },


            parseArrayValue(arrayString) {
                try {
                    // Intentar parsear como JSON primero
                    const parsed = JSON.parse(arrayString);
                    return Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    // Si falla, split por comas
                    return arrayString.split(',').map(item => item.trim()).filter(item => item !== '');
                }
            },


            validateArrayFormat(prop) {
                prop.validationError = '';
                
                try {
                    const parsed = JSON.parse(prop.value);
                    if (Array.isArray(parsed)) {
                        prop.validationError = '';
                        this.showNotification('success', 'Array válido');
                    } else {
                        prop.validationError = 'Debe ser un array';
                    }
                } catch (e) {
                    // Verificar si es formato simple (comma-separated)
                    const simpleArray = prop.value.split(',').map(item => item.trim());
                    if (simpleArray.length > 0 && simpleArray.every(item => item !== '')) {
                        prop.validationError = '';
                        this.showNotification('success', 'Formato simple válido');
                    } else {
                        prop.validationError = 'Formato inválido. Use ["item1", "item2"] o item1, item2';
                    }
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
                        // Si es JSON válido, usarlo directamente
                        const parsed = JSON.parse(prop.value);
                        return JSON.stringify(parsed);
                    } catch (e) {
                        // Si es formato simple, convertir a array de strings
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
                console.error('Error copying to clipboard:', err);
                this.showNotification('error', 'Error al copiar código');
            }
        },

        // Get placeholder text for input types
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
                    this.updatePreviewWithProps();
                },

        // Generate preview
         async generatePreview() {
    // Redirigir al método que usa props
            return this.generatePreviewWithProps();
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

        // Publish component
        async publishComponent() {
            if (!confirm('¿Estás seguro de que quieres publicar este componente?')) {
                return;
            }

            try {
                this.component.is_active = true;
                await this.saveComponent();
                this.showNotification('success', 'Componente publicado exitosamente');
            } catch (error) {
                this.showNotification('error', 'Error al publicar componente');
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

        async showComponentPreview() {
            try {
                // Usar los datos del componente actual
                this.previewComponent = {
                    id: this.component.id,
                    name: this.component.name,
                    description: this.component.description,
                    external_assets: this.component.external_assets
                };

                // Generar preview con el código actual
                const previewResponse = await fetch(`/admin/page-builder/components/${this.component.id}/preview`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        blade_template: this.component.blade_template,
                        external_assets: this.component.external_assets,
                        test_data: {
                            title: 'Título de Ejemplo',
                            description: 'Descripción de ejemplo para el preview.',
                            content: 'Contenido de prueba para verificar el componente.',
                            image: 'https://via.placeholder.com/400x200/6366f1/ffffff?text=Preview',
                            url: '#',
                            button_text: 'Ver más'
                        }
                    })
                });

                if (!previewResponse.ok) {
                    throw new Error(`Preview error: ${previewResponse.status}`);
                }

                const previewHtml = await previewResponse.text();
                
                // Mostrar el modal
                this.showPreviewModal = true;
                
                // Cargar el HTML en el iframe después de que el modal se muestre
                this.$nextTick(() => {
                    const iframe = this.$refs.modalPreviewFrame;
                    if (iframe) {
                        iframe.srcdoc = previewHtml;
                    }
                });

            } catch (error) {
                console.error('Error in showComponentPreview:', error);
                this.showNotification('error', 'Error al cargar preview: ' + error.message);
            }
        },

        // Agregar método faltante
        markAsChanged() {
            this.hasChanges = true;
        },

        // Debounced update preview (faltaba)
        debouncedUpdatePreview() {
            clearTimeout(this.previewTimeout);
            this.previewTimeout = setTimeout(() => {
                this.updatePreviewWithProps(); // ← Cambiar aquí
            }, 1000);
        },
        // Handle form submission
        async submitForm() {
            await this.saveComponent();
        },


        async generateUnifiedPreview() {
            if (this.isUpdatingPreview) return;
            
            this.isUpdatingPreview = true;
            
            try {
                // SIEMPRE incluir props de test
                const testData = this.convertPropsToTestData();
                
                // Debug
                console.log('🔍 Unified Preview - Test Data:', testData);
                
                const response = await fetch(`/admin/page-builder/components/${this.component.id}/preview`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        blade_template: this.component.blade_template,
                        external_assets: this.component.external_assets,
                        test_data: testData // ← SIEMPRE incluir props
                    })
                });

                if (!response.ok) {
                    throw new Error(`Preview error: ${response.status}`);
                }

                const previewHtml = await response.text();
                
                // Update preview iframe
                this.$nextTick(() => {
                    const iframe = this.$refs.previewFrame;
                    if (iframe) {
                        iframe.srcdoc = previewHtml;
                    }
                });

            } catch (error) {
                console.error('Unified preview error:', error);
                this.showNotification('error', 'Error al generar preview: ' + error.message);
            } finally {
                this.isUpdatingPreview = false;
            }
},


        // Navigate back
        goBack() {
            window.location.href = '{{ route("component-builder.index") }}';
        }
    };
}
</script>
@endsection