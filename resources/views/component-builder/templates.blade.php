{{-- resources/views/component-builder/templates.blade.php --}}
@extends('layouts.page-builder')

@section('title', 'Gestionar Templates: ' . $component->name)

@section('content')
<div x-data="templateManager()" x-init="init()" class="min-h-screen bg-gray-50">
    
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
                <div class="flex items-center gap-4">
                    <a href="{{ route('component-builder.edit', $component) }}" 
                       class="text-gray-600 hover:text-gray-900">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                    </a>
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">Gestionar Templates</h1>
                        <p class="text-gray-600">{{ $component->name }} - {{ $component->identifier }}</p>
                    </div>
                </div>
                
                <div class="flex gap-3">
                    <button @click="regenerateTemplate()" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        🔄 Regenerar Template Corto
                    </button>
                    
                    <button @click="saveChanges()" 
                            :disabled="isSaving"
                            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                        💾 Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <!-- Settings Card -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">⚙️ Configuración del Sistema Dual</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="flex items-center">
                        <input type="checkbox" 
                               x-model="autoGenerate"
                               @change="toggleAutoGenerate()"
                               class="rounded border-gray-300 text-blue-600">
                        <span class="ml-3 text-sm font-medium text-gray-700">
                            Auto-generar template corto al guardar
                        </span>
                    </label>
                    <p class="mt-1 text-sm text-gray-500">
                        Genera automáticamente el template corto basado en el template completo
                    </p>
                </div>
                
                <div class="text-sm text-gray-600">
                    <div class="space-y-1">
                        <div><strong>Estado:</strong> 
                            <span :class="autoGenerate ? 'text-green-600' : 'text-yellow-600'">
                                <span x-text="autoGenerate ? 'Automático' : 'Manual'"></span>
                            </span>
                        </div>
                        <div><strong>Última actualización:</strong> {{ $component->updated_at->diffForHumans() }}</div>
                        <div><strong>Versión:</strong> {{ $component->version }}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Templates Comparison -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <!-- Template Completo -->
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">📝 Template Completo</h3>
                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Component Builder</span>
                </div>
                
                <p class="text-sm text-gray-600 mb-4">
                    Template usado en el Component Builder para desarrollo y edición.
                </p>
                
                <div class="border rounded-lg">
                    <div class="bg-gray-50 px-3 py-2 border-b text-sm font-medium text-gray-700">
                        Código Fuente (Solo lectura)
                    </div>
                    <div class="p-4 max-h-96 overflow-y-auto">
                        <pre class="text-sm text-gray-800 whitespace-pre-wrap font-mono">{{ $fullTemplate }}</pre>
                    </div>
                </div>
                
                <div class="mt-4 text-xs text-gray-500">
                    ✏️ Para editar este template, ve al editor principal del componente.
                </div>
            </div>

            <!-- Template Corto -->
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">⚡ Template Corto</h3>
                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Page Builder</span>
                </div>
                
                <p class="text-sm text-gray-600 mb-4">
                    Template optimizado para uso en el Page Builder.
                </p>
                
                <div class="border rounded-lg">
                    <div class="bg-gray-50 px-3 py-2 border-b text-sm font-medium text-gray-700">
                        Template Corto (Editable)
                    </div>
                    <div class="p-4">
                        <textarea x-model="shortTemplate"
                                  @input="markAsChanged()"
                                  rows="8"
                                  placeholder="<x-page-builder.{{ $component->identifier }} />"
                                  class="w-full px-3 py-2 border border-gray-300 rounded font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>
                </div>

                <!-- Preview del uso -->
                <div class="mt-4 p-3 bg-gray-100 rounded-lg">
                    <p class="text-xs text-gray-600 mb-2">Preview del uso en Page Builder:</p>
                    <code class="text-sm text-gray-800 break-all" x-text="shortTemplate || 'Sin template definido'"></code>
                </div>

                <!-- Acciones -->
                <div class="mt-4 flex gap-2">
                    <button @click="validateTemplate()" 
                            class="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">
                        ✅ Validar
                    </button>
                    
                    <button @click="copyTemplate()" 
                            class="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
                        📋 Copiar
                    </button>
                    
                    <button @click="testTemplate()" 
                            class="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200">
                        🧪 Probar
                    </button>
                </div>
            </div>
        </div>

        <!-- Template Analysis -->
        <div class="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">📊 Análisis de Templates</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600" x-text="fullTemplateStats.lines"></div>
                    <div class="text-sm text-gray-600">Líneas en template completo</div>
                </div>
                
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600" x-text="shortTemplateStats.length"></div>
                    <div class="text-sm text-gray-600">Caracteres en template corto</div>
                </div>
                
                <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600" x-text="compressionRatio + '%'"></div>
                    <div class="text-sm text-gray-600">Ratio de compresión</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Notification Toast -->
    <div x-show="notification.show" 
         x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="opacity-0 transform translate-y-2"
         x-transition:enter-end="opacity-100 transform translate-y-0"
         x-transition:leave="transition ease-in duration-200"
         x-transition:leave-start="opacity-100 transform translate-y-0"
         x-transition:leave-end="opacity-0 transform translate-y-2"
         class="fixed bottom-4 right-4 z-50">
        <div :class="`bg-${notification.type === 'success' ? 'green' : notification.type === 'error' ? 'red' : 'blue'}-500 text-white px-6 py-3 rounded-lg shadow-lg`">
            <div class="flex items-center">
                <span x-text="notification.message"></span>
                <button @click="notification.show = false" class="ml-4 text-white hover:text-gray-200">
                    ×
                </button>
            </div>
        </div>
    </div>
</div>
@endsection

@section('custom-scripts')
<script>
function templateManager() {
    return {
        // State
        autoGenerate: {{ $autoGenerate ? 'true' : 'false' }},
        shortTemplate: `{!! addslashes($shortTemplate ?? '') !!}`,
        hasChanges: false,
        isSaving: false,
        
        // Notification
        notification: {
            show: false,
            type: 'info',
            message: ''
        },

        // Computed properties
        get fullTemplateStats() {
            const fullTemplate = `{!! addslashes($fullTemplate) !!}`;
            return {
                lines: fullTemplate.split('\n').length,
                characters: fullTemplate.length
            };
        },

        get shortTemplateStats() {
            return {
                length: this.shortTemplate.length,
                lines: this.shortTemplate.split('\n').length
            };
        },

        get compressionRatio() {
            const full = this.fullTemplateStats.characters;
            const short = this.shortTemplateStats.length;
            return full > 0 ? Math.round((1 - short/full) * 100) : 0;
        },

        // Init
        init() {
            console.log('Template Manager initialized');
        },

        // Mark as changed
        markAsChanged() {
            this.hasChanges = true;
        },

        // Toggle auto-generate
        toggleAutoGenerate() {
            this.markAsChanged();
        },

        // Regenerate template
        async regenerateTemplate() {
            try {
                const response = await fetch(`/admin/page-builder/components/{{ $component->id }}/regenerate-template`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                        'Content-Type': 'application/json'
                    }
                });

                const result = await response.json();
                
                if (result.success) {
                    this.shortTemplate = result.short_template;
                    this.showNotification('success', 'Template regenerado exitosamente');
                } else {
                    this.showNotification('error', result.message);
                }
            } catch (error) {
                this.showNotification('error', 'Error al regenerar template');
            }
        },

        // Save changes
        async saveChanges() {
            if (!this.hasChanges) return;
            
            this.isSaving = true;
            
            try {
                const response = await fetch(`/admin/page-builder/components/{{ $component->id }}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({
                        page_builder_template: this.shortTemplate,
                        auto_generate_short: this.autoGenerate
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.hasChanges = false;
                    this.showNotification('success', 'Cambios guardados exitosamente');
                } else {
                    throw new Error(data.message || 'Error al guardar');
                }

            } catch (error) {
                this.showNotification('error', 'Error al guardar: ' + error.message);
            } finally {
                this.isSaving = false;
            }
        },

        // Validate template
        async validateTemplate() {
            try {
                const response = await fetch(`/admin/page-builder/components/{{ $component->id }}/validate-template`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                    },
                    body: JSON.stringify({
                        template: this.shortTemplate
                    })
                });

                const result = await response.json();
                
                if (result.valid) {
                    this.showNotification('success', 'Template válido ✅');
                } else {
                    this.showNotification('error', 'Errores: ' + result.errors.join(', '));
                }
            } catch (error) {
                this.showNotification('error', 'Error al validar template');
            }
        },

        // Copy template
        async copyTemplate() {
            try {
                await navigator.clipboard.writeText(this.shortTemplate);
                this.showNotification('success', 'Template copiado al portapapeles');
            } catch (err) {
                this.showNotification('error', 'Error al copiar template');
            }
        },

        // Test template
        testTemplate() {
            const params = new URLSearchParams();
            params.append('template', this.shortTemplate);
            params.append('test_data', JSON.stringify({}));
            
            const testUrl = `/admin/page-builder/test-component?${params.toString()}`;
            window.open(testUrl, '_blank');
        },

        // Show notification
        showNotification(type, message) {
            this.notification = { show: true, type, message };
            setTimeout(() => this.notification.show = false, 5000);
        }
    };
}
</script>
@endsection