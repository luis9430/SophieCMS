{{-- resources/views/component-builder/partials/notification-toast.blade.php --}}

<!-- Notification Toast para Component Builder -->
<div x-show="notification.show" 
     x-transition:enter="ease-out duration-300"
     x-transition:enter-start="opacity-0 transform translate-y-2 scale-95"
     x-transition:enter-end="opacity-100 transform translate-y-0 scale-100"
     x-transition:leave="ease-in duration-200"
     x-transition:leave-start="opacity-100 transform translate-y-0 scale-100"
     x-transition:leave-end="opacity-0 transform translate-y-2 scale-95"
     class="fixed top-4 right-4 z-50 max-w-sm w-full"
     style="display: none;">
     
    <div class="relative rounded-lg shadow-lg overflow-hidden"
         :class="{
             'bg-green-500': notification.type === 'success',
             'bg-red-500': notification.type === 'error', 
             'bg-blue-500': notification.type === 'info',
             'bg-yellow-500': notification.type === 'warning'
         }">
         
        <!-- Contenido de la notificación -->
        <div class="p-4 text-white">
            <div class="flex items-start">
                <!-- Icono -->
                <div class="flex-shrink-0 mr-3">
                    <!-- Success Icon -->
                    <svg x-show="notification.type === 'success'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    
                    <!-- Error Icon -->
                    <svg x-show="notification.type === 'error'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                    
                    <!-- Info Icon -->
                    <svg x-show="notification.type === 'info'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    
                    <!-- Warning Icon -->
                    <svg x-show="notification.type === 'warning'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                    </svg>
                </div>
                
                <!-- Mensaje -->
                <div class="flex-1">
                    <p class="font-medium text-sm" x-text="notification.message"></p>
                </div>
                
                <!-- Botón cerrar -->
                <button @click="notification.show = false" 
                        class="flex-shrink-0 ml-3 text-white hover:text-gray-200 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>
</div>


{{-- resources/views/component-builder/partials/preview-modal.blade.php --}}

<!-- Preview Modal para Index -->
<div x-show="showPreviewModal" 
     x-transition:enter="ease-out duration-300"
     x-transition:enter-start="opacity-0"
     x-transition:enter-end="opacity-100"
     x-transition:leave="ease-in duration-200"
     x-transition:leave-start="opacity-100"
     x-transition:leave-end="opacity-0"
     class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50"
     @click.self="showPreviewModal = false"
     style="display: none;">
     
    <div class="flex items-center justify-center min-h-screen p-4">
        <div @click.stop 
             class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-full overflow-hidden">
             
            <!-- Header -->
            <div class="p-6 border-b border-gray-200">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-medium text-gray-900" x-text="previewComponent?.name || 'Preview'"></h3>
                        <p class="text-sm text-gray-600" x-text="previewComponent?.description || 'Vista previa del componente'"></p>
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
                    <!-- Aquí se cargaría el preview del componente -->
                    <div class="text-center text-gray-500 py-8">
                        Preview del componente se cargaría aquí
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <div class="flex items-center gap-2 text-sm text-gray-600">
                    <template x-if="previewComponent?.external_assets?.length > 0">
                        <div class="flex gap-1">
                            <span>Assets:</span>
                            <template x-for="asset in previewComponent.external_assets" :key="asset">
                                <span class="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs" x-text="asset"></span>
                            </template>
                        </div>
                    </template>
                </div>
                
                <div class="flex gap-2">
                    <template x-if="previewComponent">
                        <a :href="`/admin/page-builder/components/${previewComponent.id}/edit`" 
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