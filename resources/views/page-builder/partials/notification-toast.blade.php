{{-- resources/views/page-builder/partials/notification-toast.blade.php --}}

<!-- Notification Toast -->
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
                    <p class="font-medium" x-text="notification.title || getNotificationTitle()"></p>
                    <p class="text-sm opacity-90 mt-1" x-text="notification.message" x-show="notification.message"></p>
                </div>
                
                <!-- Botón cerrar -->
                <button @click="hideNotification()" 
                        class="flex-shrink-0 ml-3 text-white hover:text-gray-200 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        <!-- Barra de progreso para auto-hide -->
        <div x-show="notification.autoHide" 
             class="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30 transition-all duration-300 ease-linear"
             :style="'width: ' + notification.progress + '%'"></div>
    </div>
</div>