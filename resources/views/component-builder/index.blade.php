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
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- Category Filter -->
                <div class="w-48">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Categoría
                    </label>
                    <select name="category" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Todas las categorías</option>
                        @foreach($categories as $category)
                            <option value="{{ $category }}" {{ request('category') === $category ? 'selected' : '' }}>
                                {{ ucfirst($category) }}
                            </option>
                        @endforeach
                    </select>
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                    <button type="submit" 
                            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        Filtrar
                    </button>
                    <a href="{{ route('component-builder.index') }}" 
                       class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        Limpiar
                    </a>
                </div>
            </form>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="p-2 bg-blue-500 rounded-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-semibold text-gray-900">{{ $components->total() }}</p>
                        <p class="text-gray-600">Total Componentes</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="p-2 bg-green-500 rounded-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-semibold text-gray-900">{{ $components->where('is_active', true)->count() }}</p>
                        <p class="text-gray-600">Activos</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="p-2 bg-purple-500 rounded-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-semibold text-gray-900">{{ $components->where('external_assets', '!=', '[]')->count() }}</p>
                        <p class="text-gray-600">Con Librerías</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6">
                <div class="flex items-center">
                    <div class="p-2 bg-orange-500 rounded-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-semibold text-gray-900">{{ $categories->count() }}</p>
                        <p class="text-gray-600">Categorías</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Components Grid -->
        @if($components->count() > 0)
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @foreach($components as $component)
                    <div class="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
                        <!-- Preview Image -->
                        <div class="aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
                            @if($component->preview_image)
                                <img src="{{ asset('storage/' . $component->preview_image) }}" 
                                     alt="{{ $component->name }}" 
                                     class="w-full h-full object-cover">
                            @else
                                <div class="w-full h-full flex items-center justify-center text-gray-400">
                                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                    </svg>
                                </div>
                            @endif
                        </div>

                        <!-- Content -->
                        <div class="p-4">
                            <div class="flex items-start justify-between mb-2">
                                <h3 class="text-lg font-semibold text-gray-900 truncate">{{ $component->name }}</h3>
                                <span class="px-2 py-1 text-xs rounded {{ $component->is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800' }}">
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
                                    <button @click="previewComponent({{ $component->id }})" 
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
// Reemplazar todo el script del index.blade.php con esto:

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

        // Preview component
        async previewComponent(componentId) {
            console.log('Preview component ID:', componentId); // Debug
            
            if (!componentId) {
                this.showNotification('error', 'ID del componente no válido');
                return;
            }

            try {
                const response = await fetch(`/api/component-builder/components/${componentId}/preview`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        test_data: {
                            title: 'Título de Prueba',
                            description: 'Esta es una descripción de prueba para el componente.'
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data.success) {
                    this.previewComponent = data.component;
                    this.showPreviewModal = true;
                    
                    // Renderizar preview en el iframe del modal
                    this.$nextTick(() => {
                        this.renderModalPreview(data.html);
                    });
                } else {
                    this.showNotification('error', 'Error al cargar preview: ' + data.error);
                }
            } catch (error) {
                console.error('Error previewing component:', error);
                this.showNotification('error', 'Error al cargar preview del componente');
            }
        },

        // Renderizar preview en modal
        renderModalPreview(html) {
            const iframe = this.$refs.modalPreviewFrame;
            if (!iframe) {
                console.error('Modal preview iframe not found');
                return;
            }

            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();
        },

        // Duplicate component
        async duplicateComponent(componentId) {
            if (!componentId) {
                this.showNotification('error', 'ID del componente no válido');
                return;
            }

            if (!confirm('¿Estás seguro de que quieres duplicar este componente?')) {
                return;
            }

            try {
                const response = await fetch(`/admin/page-builder/components/${componentId}/duplicate`, {
                    method: 'POST',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                const data = await response.json();

                if (data.success) {
                    this.showNotification('success', 'Componente duplicado exitosamente');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    this.showNotification('error', data.error || 'Error al duplicar');
                }
            } catch (error) {
                this.showNotification('error', 'Error de conexión');
            }
        },

        // Delete component
        async deleteComponent(componentId) {
            if (!componentId) {
                this.showNotification('error', 'ID del componente no válido');
                return;
            }

            if (!confirm('¿Estás seguro de que quieres eliminar este componente? Esta acción no se puede deshacer.')) {
                return;
            }

            try {
                const response = await fetch(`/admin/page-builder/components/${componentId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                const data = await response.json();

                if (data.success) {
                    this.showNotification('success', 'Componente eliminado exitosamente');
                    setTimeout(() => location.reload(), 1500);
                } else {
                    this.showNotification('error', data.error || 'Error al eliminar');
                }
            } catch (error) {
                this.showNotification('error', 'Error de conexión');
            }
        },

        // Notifications
        showNotification(type, message) {
            this.notification = { show: true, type, message };
            setTimeout(() => {
                this.notification.show = false;
            }, 3000);
        }
    }
}

</script>
@endsection