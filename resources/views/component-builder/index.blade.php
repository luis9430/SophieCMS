{{-- resources/views/component-builder/index.blade.php --}}
@extends('layouts.page-builder')

@section('title', 'Component Builder - Mis Componentes')

@section('content')
<div x-data="componentIndex()" class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">Component Builder</h1>
                    <p class="text-gray-600">Crea y gestiona tus componentes avanzados</p>
                </div>
                <div class="flex gap-4">
                    <a href="{{ route('page-builder.index') }}" 
                       class="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                        ← Volver al Page Builder
                    </a>
                    <a href="{{ route('component-builder.create') }}" 
                       class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Crear Componente
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- Filters & Search -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <form method="GET" class="flex flex-wrap gap-4 items-end">
                <!-- Search -->
                <div class="flex-1 min-w-64">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Buscar componentes
                    </label>
                    <input type="text" 
                           name="search" 
                           value="{{ request('search') }}"
                           placeholder="Buscar por nombre o descripción..."
                           class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                </div>
                
                <!-- Category Filter -->
                <div class="min-w-48">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Categoría
                    </label>
                    <select name="category" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Todas las categorías</option>
                        <option value="layout" {{ request('category') === 'layout' ? 'selected' : '' }}>Layout</option>
                        <option value="content" {{ request('category') === 'content' ? 'selected' : '' }}>Contenido</option>
                        <option value="form" {{ request('category') === 'form' ? 'selected' : '' }}>Formularios</option>
                        <option value="navigation" {{ request('category') === 'navigation' ? 'selected' : '' }}>Navegación</option>
                        <option value="media" {{ request('category') === 'media' ? 'selected' : '' }}>Media</option>
                        <option value="interactive" {{ request('category') === 'interactive' ? 'selected' : '' }}>Interactivo</option>
                        <option value="ecommerce" {{ request('category') === 'ecommerce' ? 'selected' : '' }}>E-commerce</option>
                    </select>
                </div>
                
                <!-- Status Filter -->
                <div class="min-w-32">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Estado
                    </label>
                    <select name="status" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Todos</option>
                        <option value="active" {{ request('status') === 'active' ? 'selected' : '' }}>Activos</option>
                        <option value="inactive" {{ request('status') === 'inactive' ? 'selected' : '' }}>Inactivos</option>
                    </select>
                </div>
                
                <!-- Filter Button -->
                <div>
                    <button type="submit" 
                            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        Filtrar
                    </button>
                </div>
                
                <!-- Clear Filters -->
                @if(request()->anyFilled(['search', 'category', 'status']))
                    <div>
                        <a href="{{ route('component-builder.index') }}" 
                           class="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                            Limpiar filtros
                        </a>
                    </div>
                @endif
            </form>
        </div>

        <!-- Components Grid -->
        @if($components->count() > 0)
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @foreach($components as $component)
                    <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                        <div class="p-6">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex-1">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-1">{{ $component->name }}</h3>
                                    <span class="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                        {{ $component->identifier }}
                                    </span>
                                </div>
                                <span class="ml-3 px-2 py-1 text-xs rounded-full {{ $component->is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }}">
                                    {{ $component->is_active ? 'Activo' : 'Inactivo' }}
                                </span>
                            </div>

                            <p class="text-gray-600 text-sm mb-3 line-clamp-2">{{ $component->description ?: 'Sin descripción' }}</p>

                            <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
                                <span class="bg-gray-100 px-2 py-1 rounded">{{ ucfirst($component->category) }}</span>
                                <span>v{{ $component->version }}</span>
                            </div>

                            <!-- Assets indicators -->
                            @if(count($component->external_assets) > 0)
                                <div class="flex flex-wrap gap-1 mb-3">
                                    @foreach($component->external_assets as $asset)
                                        <span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">{{ $asset }}</span>
                                    @endforeach
                                </div>
                            @endif

                            <!-- Actions -->
                            <div class="flex items-center justify-between">
                                <div class="flex gap-2">
                                    <a href="{{ route('component-builder.edit', $component) }}" 
                                       class="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors">
                                        Editar
                                    </a>
                                    <button @click="duplicateComponent({{ $component->id }})" 
                                            class="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors">
                                        Duplicar
                                    </button>
                                </div>

                                <div class="flex gap-1">
                                    <button @click="showComponentPreview({{ $component->id }})" 
                                            class="p-1 text-gray-400 hover:text-gray-600">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                        </svg>
                                    </button>
                                    <button @click="deleteComponent({{ $component->id }})" 
                                            class="p-1 text-red-400 hover:text-red-600">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div class="text-xs text-gray-400 mt-2">
                                Editado {{ $component->last_edited_at?->diffForHumans() ?? $component->updated_at->diffForHumans() }}
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>

            <!-- Pagination -->
            <div class="mt-8">
                {{ $components->links() }}
            </div>

        @else
            <!-- Empty State -->
            <div class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">No hay componentes</h3>
                <p class="mt-1 text-sm text-gray-500">Comienza creando tu primer componente avanzado.</p>
                <div class="mt-6">
                    <a href="{{ route('component-builder.create') }}" 
                       class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Crear Componente
                    </a>
                </div>
            </div>
        @endif
    </div>

    @include('component-builder.partials.preview-modal')
    @include('component-builder.partials.notification-toast')
</div>
@endsection

@section('custom-scripts')
<script>
function componentIndex() {
    return {
        // State
        showPreviewModal: false,
        previewComponent: null,
        notification: {
            show: false,
            type: 'info',
            message: ''
        },

        // Init method
        init() {
            console.log('ComponentIndex initialized');
        },

        // Preview component method - RENOMBRADO para evitar conflicto
        async showComponentPreview(componentId) {
            console.log('Preview component ID:', componentId);
            
            if (!componentId) {
                this.showNotification('error', 'ID del componente no válido');
                return;
            }

            try {
                // Crear datos mock del componente para el modal
                this.previewComponent = {
                    id: componentId,
                    name: 'Componente ' + componentId,
                    description: 'Vista previa del componente',
                    external_assets: []
                };

                // Hacer la preview con la URL CORRECTA
                const previewResponse = await fetch(`/admin/page-builder/components/${componentId}/preview`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        test_data: {
                            title: 'Título de Prueba',
                            description: 'Esta es una descripción de prueba para el componente.',
                            content: 'Contenido de ejemplo para testing.',
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

        // Duplicate component
        async duplicateComponent(componentId) {
            if (!confirm('¿Estás seguro de que quieres duplicar este componente?')) {
                return;
            }

            try {
                const response = await fetch(`/admin/page-builder/components/${componentId}/duplicate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                const data = await response.json();

                if (data.success) {
                    this.showNotification('success', 'Componente duplicado exitosamente');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    throw new Error(data.message || 'Error al duplicar componente');
                }

            } catch (error) {
                console.error('Error duplicating component:', error);
                this.showNotification('error', 'Error al duplicar componente: ' + error.message);
            }
        },

        // Delete component
        async deleteComponent(componentId) {
            if (!confirm('¿Estás seguro de que quieres eliminar este componente? Esta acción no se puede deshacer.')) {
                return;
            }

            try {
                const response = await fetch(`/admin/page-builder/components/${componentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                const data = await response.json();

                if (data.success) {
                    this.showNotification('success', 'Componente eliminado exitosamente');
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    throw new Error(data.message || 'Error al eliminar componente');
                }

            } catch (error) {
                console.error('Error deleting component:', error);
                this.showNotification('error', 'Error al eliminar componente: ' + error.message);
            }
        },

        // Show notification
        showNotification(type, message) {
            this.notification = {
                show: true,
                type: type,
                message: message
            };

            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.notification.show = false;
            }, 5000);
        },

        // Close notification
        closeNotification() {
            this.notification.show = false;
        }
    };
}
</script>
@endsection