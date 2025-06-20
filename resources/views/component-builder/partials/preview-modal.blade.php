{{-- resources/views/component-builder/partials/preview-modal.blade.php --}}

<!-- Preview Modal - SOLO para Index (no se incluye en Edit) -->
<div x-show="showPreviewModal" 
     x-transition:enter="ease-out duration-300"
     x-transition:enter-start="opacity-0"
     x-transition:enter-end="opacity-100"
     x-transition:leave="ease-in duration-200"
     x-transition:leave-start="opacity-100"
     x-transition:leave-end="opacity-0"
     class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50"
     @click.self="showPreviewModal = false"
     style="display: none;"
     x-data="{
        // Variables locales para el modal por si no existen en el contexto padre
        get modalData() {
            return this.previewComponent || {
                name: 'Preview',
                description: 'Vista previa del componente',
                external_assets: []
            };
        }
     }">
     
    <div class="flex items-center justify-center min-h-screen p-4">
        <div @click.stop 
             class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-full overflow-hidden">
             
            <!-- Header -->
            <div class="p-6 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900" x-text="modalData.name"></h3>
                        <p class="text-sm text-gray-600" x-text="modalData.description"></p>
                    </div>
                    <button @click="showPreviewModal = false" 
                            class="text-gray-400 hover:text-gray-600">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="p-6 bg-gray-50 max-h-96 overflow-y-auto">
                <div class="bg-white rounded-lg shadow-sm border p-4">
                    <!-- Preview iframe -->
                    <iframe x-ref="modalPreviewFrame"
                            class="w-full border-0 rounded"
                            style="height: 400px;"
                            sandbox="allow-scripts allow-same-origin"></iframe>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <template x-if="modalData.external_assets && modalData.external_assets.length > 0">
                        <div class="flex gap-1">
                            <span>Assets:</span>
                            <template x-for="asset in modalData.external_assets" :key="asset">
                                <span class="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs" x-text="asset"></span>
                            </template>
                        </div>
                    </template>
                    
                    <template x-if="!modalData.external_assets || modalData.external_assets.length === 0">
                        <span class="text-gray-400">Sin assets externos</span>
                    </template>
                </div>
                
                <div class="flex gap-2">
                    <template x-if="modalData.id">
                        <a :href="`/admin/page-builder/components/${modalData.id}/edit`" 
                           class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                            Editar
                        </a>
                    </template>
                    <button @click="showPreviewModal = false" 
                            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>