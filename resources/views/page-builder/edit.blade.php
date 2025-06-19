<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Builder - {{ $page->title ?? 'Nueva Página' }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body class="bg-gray-50">
    <div x-data="pageBuilder()" class="h-screen flex" x-init="init()">
        
        <!-- Sidebar de componentes -->
        <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
            <!-- Header del sidebar -->
            <div class="p-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-800">Componentes</h2>
                <div class="mt-2">
                    <input type="text" 
                           x-model="componentSearch" 
                           placeholder="Buscar componentes..."
                           class="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            
            <!-- Lista de componentes -->
            <div class="flex-1 p-4 overflow-y-auto">
                <div class="space-y-4">
                    <!-- Componentes por categoría -->
                    <template x-for="(components, category) in filteredComponents" :key="category">
                        <div>
                            <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2" x-text="categoryNames[category]"></h3>
                            <div class="grid grid-cols-1 gap-2">
                                <template x-for="component in components" :key="component.id">
                                    <button @click="addComponent(component)" 
                                            class="text-left p-3 rounded-lg border transition-colors hover:shadow-md"
                                            :class="getCategoryStyle(category)">
                                        <div class="font-medium" x-text="component.name"></div>
                                        <div class="text-xs opacity-75" x-text="component.description"></div>
                                    </button>
                                </template>
                            </div>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        
        <!-- Área principal -->
        <div class="flex-1 flex flex-col">
            <!-- Toolbar -->
            <div class="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <h1 class="text-xl font-semibold text-gray-800">
                        {{ $page->title ?? 'Nueva Página' }}
                    </h1>
                    <span class="px-2 py-1 text-xs rounded"
                          :class="page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                          x-text="page.status === 'published' ? 'Publicada' : 'Borrador'"></span>
                </div>
                
                <div class="flex gap-2">
                    <!-- Botones de acción -->
                    <button @click="savePage()" 
                            :disabled="saving"
                            class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50">
                        <span x-show="!saving">Guardar</span>
                        <span x-show="saving">Guardando...</span>
                    </button>
                    
                    <button @click="togglePreview()" 
                            class="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            x-text="showPreview ? 'Editor' : 'Preview'">
                    </button>
                    
                    <template x-if="page.status === 'draft'">
                        <button @click="publishPage()" 
                                class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                            Publicar
                        </button>
                    </template>
                    
                    <template x-if="page.status === 'published'">
                        <button @click="unpublishPage()" 
                                class="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors">
                            Despublicar
                        </button>
                    </template>
                    
                    <button @click="clearEditor()" 
                            class="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                        Limpiar
                    </button>
                </div>
            </div>
            
            <!-- Editor y Preview -->
            <div class="flex-1 flex">
                <!-- Editor de código -->
                <div class="flex-1 p-4" x-show="!showPreview">
                    <div class="h-full bg-gray-900 rounded-lg overflow-hidden">
                        <div class="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700 flex items-center justify-between">
                            <span>{{ $page->slug ?? 'nueva-pagina' }}.blade.php</span>
                            <div class="flex gap-2 text-xs">
                                <button @click="formatContent()" 
                                        class="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                                    Formatear
                                </button>
                                <button @click="showHelp = !showHelp" 
                                        class="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 transition-colors">
                                    Ayuda
                                </button>
                            </div>
                        </div>
                        
                        <!-- Editor de texto -->
                        <textarea 
                            x-model="content"
                            @input.debounce.1000ms="updatePreview()"
                            class="w-full h-full bg-gray-900 text-green-400 font-mono text-sm p-4 resize-none border-0 outline-none"
                            placeholder="El contenido de tu página aparecerá aquí..."></textarea>
                    </div>
                </div>
                
                <!-- Preview -->
                <div class="flex-1 p-4" x-show="showPreview">
                    <div class="h-full bg-white rounded-lg shadow-lg overflow-hidden">
                        <div class="bg-gray-100 px-4 py-2 text-sm text-gray-600 border-b flex items-center justify-between">
                            <span>Preview</span>
                            <div class="flex gap-2">
                                <button @click="previewMode = 'desktop'" 
                                        :class="previewMode === 'desktop' ? 'bg-blue-500 text-white' : 'bg-white'"
                                        class="px-2 py-1 text-xs rounded border transition-colors">
                                    Desktop
                                </button>
                                <button @click="previewMode = 'tablet'" 
                                        :class="previewMode === 'tablet' ? 'bg-blue-500 text-white' : 'bg-white'"
                                        class="px-2 py-1 text-xs rounded border transition-colors">
                                    Tablet
                                </button>
                                <button @click="previewMode = 'mobile'" 
                                        :class="previewMode === 'mobile' ? 'bg-blue-500 text-white' : 'bg-white'"
                                        class="px-2 py-1 text-xs rounded border transition-colors">
                                    Mobile
                                </button>
                                <button @click="openInNewTab()" 
                                        class="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50 transition-colors">
                                    Nueva pestaña
                                </button>
                            </div>
                        </div>
                        
                        <div class="h-full p-4 overflow-auto bg-gray-50">
                            <div x-html="previewHtml" 
                                 :class="getPreviewClass()"
                                 class="transition-all duration-300 bg-white shadow-sm rounded"></div>
                        </div>
                    </div>
                </div>
                
                <!-- Split view -->
                <div class="flex-1 flex" x-show="viewMode === 'split'">
                    <!-- Editor -->
                    <div class="w-1/2 p-2">
                        <div class="h-full bg-gray-900 rounded-lg overflow-hidden">
                            <div class="bg-gray-800 px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                                Editor
                            </div>
                            <textarea 
                                x-model="content"
                                @input.debounce.500ms="updatePreview()"
                                class="w-full h-full bg-gray-900 text-green-400 font-mono text-sm p-4 resize-none border-0 outline-none"></textarea>
                        </div>
                    </div>
                    
                    <!-- Preview -->
                    <div class="w-1/2 p-2">
                        <div class="h-full bg-white rounded-lg shadow-lg overflow-hidden">
                            <div class="bg-gray-100 px-4 py-2 text-sm text-gray-600 border-b">
                                Preview
                            </div>
                            <div class="h-full p-4 overflow-auto">
                                <div x-html="previewHtml" class="transition-all duration-300"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Modal de ayuda -->
        <div x-show="showHelp" 
             x-transition:enter="ease-out duration-300"
             x-transition:enter-start="opacity-0"
             x-transition:enter-end="opacity-100"
             x-transition:leave="ease-in duration-200"
             x-transition:leave-start="opacity-100"
             x-transition:leave-end="opacity-0"
             class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50"
             @click="showHelp = false">
            
            <div class="flex items-center justify-center min-h-screen p-4">
                <div @click.stop 
                     class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold">Ayuda del Page Builder</h3>
                            <button @click="showHelp = false" 
                                    class="text-gray-400 hover:text-gray-600">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                        
                        <div class="space-y-4 text-sm">
                            <div>
                                <h4 class="font-medium mb-2">Componentes Disponibles:</h4>
                                <ul class="space-y-1 text-gray-600">
                                    <li><strong>Layout:</strong> Container, Grid - Para estructurar el contenido</li>
                                    <li><strong>Contenido:</strong> Hero, Card, Testimonial - Para mostrar información</li>
                                    <li><strong>Interactivos:</strong> Button, Form, Modal - Para la interacción del usuario</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 class="font-medium mb-2">Atajos de teclado:</h4>
                                <ul class="space-y-1 text-gray-600">
                                    <li><kbd class="px-1 py-0.5 text-xs bg-gray-100 rounded">Ctrl+S</kbd> - Guardar</li>
                                    <li><kbd class="px-1 py-0.5 text-xs bg-gray-100 rounded">Ctrl+P</kbd> - Toggle Preview</li>
                                    <li><kbd class="px-1 py-0.5 text-xs bg-gray-100 rounded">Ctrl+H</kbd> - Ayuda</li>
                                </ul>
                            </div>
                            
                            <div>
                                <h4 class="font-medium mb-2">Tips:</h4>
                                <ul class="space-y-1 text-gray-600">
                                    <li>• Arrastra componentes desde el sidebar al editor</li>
                                    <li>• El preview se actualiza automáticamente</li>
                                    <li>• Usa clases de Tailwind CSS para el styling</li>
                                    <li>• Los componentes son compatibles con Alpine.js</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Notification toast -->
        <div x-show="notification.show" 
             x-transition:enter="ease-out duration-300"
             x-transition:enter-start="opacity-0 transform translate-y-2"
             x-transition:enter-end="opacity-100 transform translate-y-0"
             x-transition:leave="ease-in duration-200"
             x-transition:leave-start="opacity-100 transform translate-y-0"
             x-transition:leave-end="opacity-0 transform translate-y-2"
             class="fixed top-4 right-4 z-50">
            <div class="px-4 py-3 rounded-lg shadow-lg text-white"
                 :class="notification.type === 'success' ? 'bg-green-500' : notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'">
                <p x-text="notification.message"></p>
            </div>
        </div>
    </div>

    <script>
        function pageBuilder() {
            return {
                // Estado principal
                content: @json($page->content ?? ''),
                previewHtml: '',
                showPreview: false,
                viewMode: 'editor', // editor, preview, split
                previewMode: 'desktop', // desktop, tablet, mobile
                
                // Datos de la página
                page: @json($page ?? ['status' => 'draft']),
                
                // Componentes disponibles
                components: @json($components ?? []),
                componentSearch: '',
                
                // Estados UI
                saving: false,
                showHelp: false,
                notification: {
                    show: false,
                    message: '',
                    type: 'info'
                },
                
                // Nombres de categorías
                categoryNames: {
                    'layout': 'Layout',
                    'content': 'Contenido',
                    'interactive': 'Interactivos'
                },
                
                // Computed
                get filteredComponents() {
                    if (!this.componentSearch.trim()) {
                        return this.components;
                    }
                    
                    const search = this.componentSearch.toLowerCase();
                    const filtered = {};
                    
                    Object.keys(this.components).forEach(category => {
                        const matchingComponents = this.components[category].filter(component => 
                            component.name.toLowerCase().includes(search) ||
                            component.description.toLowerCase().includes(search)
                        );
                        
                        if (matchingComponents.length > 0) {
                            filtered[category] = matchingComponents;
                        }
                    });
                    
                    return filtered;
                },
                
                // Métodos principales
                init() {
                    this.updatePreview();
                    this.setupKeyboardShortcuts();
                    this.setupAutoSave();
                },
                
                addComponent(component) {
                    // Obtener template del componente
                    fetch(`/api/components/${component.id}/template`)
                        .then(response => response.json())
                        .then(data => {
                            this.content += '\n\n' + data.template;
                            this.updatePreview();
                            this.showNotification('Componente agregado', 'success');
                        })
                        .catch(error => {
                            this.showNotification('Error al agregar componente', 'error');
                        });
                },
                
                async savePage() {
                    this.saving = true;
                    
                    try {
                        const response = await fetch(`/api/pages/${this.page.id}/save`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                            },
                            body: JSON.stringify({
                                content: this.content
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            this.page = data.page;
                            this.showNotification('Página guardada correctamente', 'success');
                        } else {
                            throw new Error(data.message || 'Error al guardar');
                        }
                    } catch (error) {
                        this.showNotification('Error al guardar la página', 'error');
                    } finally {
                        this.saving = false;
                    }
                },
                
                async updatePreview() {
                    try {
                        const response = await fetch('/api/page-builder/preview', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                            },
                            body: JSON.stringify({
                                content: this.content,
                                page_id: this.page.id
                            })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            this.previewHtml = data.html;
                        }
                    } catch (error) {
                        console.error('Error updating preview:', error);
                    }
                },
                
                togglePreview() {
                    this.showPreview = !this.showPreview;
                    if (this.showPreview) {
                        this.updatePreview();
                    }
                },
                
                async publishPage() {
                    try {
                        const response = await fetch(`/api/pages/${this.page.id}/publish`, {
                            method: 'POST',
                            headers: {
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                            }
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            this.page.status = 'published';
                            this.showNotification('Página publicada correctamente', 'success');
                        }
                    } catch (error) {
                        this.showNotification('Error al publicar la página', 'error');
                    }
                },
                
                async unpublishPage() {
                    try {
                        const response = await fetch(`/api/pages/${this.page.id}/unpublish`, {
                            method: 'POST',
                            headers: {
                                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                            }
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            this.page.status = 'draft';
                            this.showNotification('Página despublicada correctamente', 'success');
                        }
                    } catch (error) {
                        this.showNotification('Error al despublicar la página', 'error');
                    }
                },
                
                clearEditor() {
                    if (confirm('¿Estás seguro de que quieres limpiar todo el contenido?')) {
                        this.content = '<div class="container mx-auto p-8">\n    <!-- Agrega componentes desde el sidebar -->\n</div>';
                        this.updatePreview();
                        this.showNotification('Editor limpiado', 'success');
                    }
                },
                
                formatContent() {
                    // Formateo básico del HTML
                    try {
                        // Aquí podrías integrar un formateador HTML más sofisticado
                        this.showNotification('Contenido formateado', 'success');
                    } catch (error) {
                        this.showNotification('Error al formatear', 'error');
                    }
                },
                
                openInNewTab() {
                    const blob = new Blob([this.previewHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                },
                
                // Utilidades
                getCategoryStyle(category) {
                    const styles = {
                        'layout': 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900',
                        'content': 'bg-green-50 hover:bg-green-100 border-green-200 text-green-900',
                        'interactive': 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-900'
                    };
                    return styles[category] || 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-900';
                },
                
                getPreviewClass() {
                    const classes = {
                        'desktop': 'w-full',
                        'tablet': 'max-w-3xl mx-auto',
                        'mobile': 'max-w-sm mx-auto'
                    };
                    return classes[this.previewMode] || 'w-full';
                },
                
                showNotification(message, type = 'info') {
                    this.notification = { show: true, message, type };
                    setTimeout(() => {
                        this.notification.show = false;
                    }, 3000);
                },
                
                setupKeyboardShortcuts() {
                    document.addEventListener('keydown', (e) => {
                        if (e.ctrlKey || e.metaKey) {
                            switch (e.key) {
                                case 's':
                                    e.preventDefault();
                                    this.savePage();
                                    break;
                                case 'p':
                                    e.preventDefault();
                                    this.togglePreview();
                                    break;
                                case 'h':
                                    e.preventDefault();
                                    this.showHelp = !this.showHelp;
                                    break;
                            }
                        }
                    });
                },
                
                setupAutoSave() {
                    // Auto-guardar cada 30 segundos si hay cambios
                    setInterval(() => {
                        if (this.content && !this.saving) {
                            this.savePage();
                        }
                    }, 30000);
                }
            }
        }
    </script>
</body>
</html>