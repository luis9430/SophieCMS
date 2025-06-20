{{-- resources/views/page-builder/partials/help-modal.blade.php --}}

<!-- Help Modal -->
<div x-show="showHelp" 
     x-transition:enter="ease-out duration-300"
     x-transition:enter-start="opacity-0"
     x-transition:enter-end="opacity-100"
     x-transition:leave="ease-in duration-200"
     x-transition:leave-start="opacity-100"
     x-transition:leave-end="opacity-0"
     class="fixed inset-0 z-50 overflow-y-auto"
     @click.self="showHelp = false"
     style="display: none;">
     
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
             x-transition:enter="ease-out duration-300"
             x-transition:enter-start="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
             x-transition:enter-end="opacity-100 translate-y-0 sm:scale-100"
             x-transition:leave="ease-in duration-200"
             x-transition:leave-start="opacity-100 translate-y-0 sm:scale-100"
             x-transition:leave-end="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95">
             
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div class="flex items-start">
                    <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                        <svg class="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                            Ayuda del Page Builder
                        </h3>
                        
                        <div class="space-y-4 text-sm text-gray-600">
                            <div>
                                <h4 class="font-medium mb-2 text-gray-800">Atajos de teclado:</h4>
                                <ul class="space-y-1">
                                    <li class="flex justify-between">
                                        <span>Guardar página</span>
                                        <kbd class="px-1 py-0.5 text-xs bg-gray-100 rounded">Ctrl+S</kbd>
                                    </li>
                                    <li class="flex justify-between">
                                        <span>Toggle Preview</span>
                                        <kbd class="px-1 py-0.5 text-xs bg-gray-100 rounded">Ctrl+P</kbd>
                                    </li>
                                    <li class="flex justify-between">
                                        <span>Mostrar ayuda</span>
                                        <kbd class="px-1 py-0.5 text-xs bg-gray-100 rounded">Ctrl+H</kbd>
                                    </li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 class="font-medium mb-2 text-gray-800">Componentes disponibles:</h4>
                                <div class="grid grid-cols-2 gap-2 text-xs">
                                    <template x-for="(components, category) in components" :key="category">
                                        <div class="p-2 bg-gray-50 rounded">
                                            <div class="font-medium capitalize mb-1" x-text="category"></div>
                                            <div class="text-gray-500" x-text="components.length + ' componentes'"></div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                            
                            <div>
                                <h4 class="font-medium mb-2 text-gray-800">Tips de uso:</h4>
                                <ul class="space-y-1 list-disc list-inside">
                                    <li>Arrastra componentes desde el sidebar al editor</li>
                                    <li>El preview se actualiza automáticamente</li>
                                    <li>Usa clases de Tailwind CSS para el styling</li>
                                    <li>Los componentes son compatibles con Alpine.js</li>
                                    <li>Puedes alternar entre modo editor, preview y split</li>
                                </ul>
                            </div>

                            <div>
                                <h4 class="font-medium mb-2 text-gray-800">Sintaxis de componentes:</h4>
                                <div class="bg-gray-50 p-2 rounded font-mono text-xs">
                                    &lt;x-page-builder.hero<br>
                                    &nbsp;&nbsp;title="Mi título"<br>
                                    &nbsp;&nbsp;subtitle="Subtítulo" /&gt;
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button @click="showHelp = false"
                        class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                    Entendido
                </button>
            </div>
        </div>
    </div>
</div>