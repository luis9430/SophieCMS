{{-- resources/views/page-builder/partials/page-builder-script.blade.php --}}

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
        
        // UI State
        isSaving: false,
        showHelp: false,
        
        // Notificaciones
        notification: {
            show: false,
            type: 'info', // success, error, info, warning
            title: '',
            message: '',
            autoHide: true,
            progress: 100
        },
        
        // Nombres de categorías para mostrar
        categoryNames: {
            'layout': 'Layout',
            'content': 'Contenido',
            'interactive': 'Interactivos',
            'ecommerce': 'E-commerce',
            'marketing': 'Marketing',
            'forms': 'Formularios'
        },
        
        // Estilos por categoría
        categoryStyles: {
            'layout': 'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
            'content': 'border-green-200 hover:border-green-300 hover:bg-green-50',
            'interactive': 'border-purple-200 hover:border-purple-300 hover:bg-purple-50',
            'ecommerce': 'border-orange-200 hover:border-orange-300 hover:bg-orange-50',
            'marketing': 'border-pink-200 hover:border-pink-300 hover:bg-pink-50',
            'forms': 'border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50'
        },

        // Inicialización
        init() {
            this.updatePreview();
            this.setupKeyboardShortcuts();
            this.setupAutoSave();
            
            // Mostrar notificación de bienvenida
            this.showNotification('info', 'Editor cargado', 'Page Builder listo para usar');
        },

        // Componentes filtrados por búsqueda
        get filteredComponents() {
            const filtered = {};
            
            Object.keys(this.components).forEach(category => {
                const categoryComponents = this.components[category].filter(component => {
                    if (!this.componentSearch) return true;
                    
                    const search = this.componentSearch.toLowerCase();
                    return component.name.toLowerCase().includes(search) ||
                           component.description.toLowerCase().includes(search) ||
                           category.toLowerCase().includes(search);
                });
                
                if (categoryComponents.length > 0) {
                    filtered[category] = categoryComponents;
                }
            });
            
            return filtered;
        },

        // Obtener estilo por categoría
        getCategoryStyle(category) {
            return this.categoryStyles[category] || 'border-gray-200 hover:border-gray-300 hover:bg-gray-50';
        },

        // Agregar componente al contenido
        addComponent(component) {
            const template = component.blade_template || `<x-page-builder.${component.identifier} />`;
            const cursor = this.$refs ? this.$refs.contentTextarea?.selectionStart || this.content.length : this.content.length;
            
            // Insertar en la posición del cursor o al final
            this.content = this.content.slice(0, cursor) + '\n' + template + '\n' + this.content.slice(cursor);
            
            this.updatePreview();
            this.showNotification('success', 'Componente agregado', `${component.name} ha sido agregado al editor`);
        },

        // Variables para debouncing y estado
        previewTimeout: null,
        isUpdatingPreview: false,
        lastContent: '',

        // Actualizar preview con debouncing mejorado
        updatePreview() {
            // No actualizar si ya está en proceso o si el contenido no cambió
            if (this.isUpdatingPreview || this.lastContent === this.content) {
                return;
            }

            // Cancelar timeout anterior
            if (this.previewTimeout) {
                clearTimeout(this.previewTimeout);
            }

            // Configurar nuevo timeout con debouncing de 800ms
            this.previewTimeout = setTimeout(() => {
                this.performPreviewUpdate();
            }, 800);
        },

        // Ejecutar actualización real del preview
        async performPreviewUpdate() {
            if (this.isUpdatingPreview) return;
            
            this.isUpdatingPreview = true;
            this.lastContent = this.content;

            try {
                // Si está vacío, mostrar mensaje simple
                if (!this.content.trim()) {
                    this.previewHtml = '<div class="p-8 text-center text-gray-500">El contenido está vacío</div>';
                    this.renderPreview();
                    return;
                }

                // Crear AbortController para cancelar requests anteriores
                if (this.previewController) {
                    this.previewController.abort();
                }
                this.previewController = new AbortController();

                const response = await fetch('/api/page-builder/preview', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        content: this.content,
                        page_id: this.page.id
                    }),
                    signal: this.previewController.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data.success) {
                    this.previewHtml = data.html;
                } else {
                    this.previewHtml = `<div class="p-8 text-center text-red-500">
                        <h3 class="font-bold mb-2">Error en el contenido</h3>
                        <p class="text-sm">${data.error || 'Error desconocido'}</p>
                    </div>`;
                }
            } catch (error) {
                // Ignorar errores de abort (cuando se cancela un request)
                if (error.name === 'AbortError') {
                    return;
                }
                
                console.error('Error updating preview:', error);
                this.previewHtml = `<div class="p-8 text-center text-red-500">
                    <h3 class="font-bold mb-2">Error de conexión</h3>
                    <p class="text-sm">${error.message}</p>
                    <button onclick="this.closest('[x-data]').__x.$data.performPreviewUpdate()" 
                            class="mt-2 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">
                        Reintentar
                    </button>
                </div>`;
            } finally {
                this.isUpdatingPreview = false;
                this.renderPreview();
            }
        },

        // Renderizar preview en iframe
        renderPreview() {
            const iframe = this.$refs.previewFrame;
            if (!iframe) return;

            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(this.previewHtml);
            doc.close();
        },

        // Refrescar preview manualmente
        refreshPreview() {
            this.lastContent = ''; // Forzar actualización
            this.performPreviewUpdate();
            this.showNotification('info', 'Preview actualizado', 'El preview ha sido recargado');
        },

        // Guardar página
        async savePage() {
            if (this.isSaving) return;
            
            this.isSaving = true;
            
            try {
                // Usar la ruta de save que ya tienes funcionando
                const url = this.page.id 
                    ? `/api/pages/${this.page.id}/save`
                    : '{{ route("page-builder.create") }}';
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify({
                        content: this.content,
                        title: this.page.title,
                        status: this.page.status
                    })
                });

                const data = await response.json();

                if (data.success) {
                    this.page = data.page;
                    this.showNotification('success', 'Guardado exitoso', 'La página ha sido guardada correctamente');
                    
                    // Actualizar URL si es una página nueva
                    if (!this.page.id && data.page.id) {
                        window.history.replaceState({}, '', `/admin/page-builder/${data.page.id}/edit`);
                    }
                } else {
                    throw new Error(data.error || 'Error al guardar');
                }
            } catch (error) {
                console.error('Error saving page:', error);
                this.showNotification('error', 'Error al guardar', error.message);
            } finally {
                this.isSaving = false;
            }
        },

        // Sistema de notificaciones
        showNotification(type, title, message = '', autoHide = true) {
            this.notification = {
                show: true,
                type,
                title,
                message,
                autoHide,
                progress: 100
            };

            if (autoHide) {
                this.startNotificationProgress();
                setTimeout(() => this.hideNotification(), 4000);
            }
        },

        hideNotification() {
            this.notification.show = false;
        },

        getNotificationTitle() {
            const titles = {
                'success': 'Éxito',
                'error': 'Error',
                'info': 'Información',
                'warning': 'Advertencia'
            };
            return titles[this.notification.type] || 'Notificación';
        },

        startNotificationProgress() {
            if (!this.notification.autoHide) return;
            
            const duration = 4000;
            const interval = 50;
            let elapsed = 0;
            
            const timer = setInterval(() => {
                elapsed += interval;
                this.notification.progress = Math.max(0, 100 - (elapsed / duration * 100));
                
                if (elapsed >= duration) {
                    clearInterval(timer);
                }
            }, interval);
        },

        // Configurar atajos de teclado
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                // Ctrl+S - Guardar
                if (e.ctrlKey && e.key === 's') {
                    e.preventDefault();
                    this.savePage();
                }
                
                // Ctrl+P - Toggle Preview
                if (e.ctrlKey && e.key === 'p') {
                    e.preventDefault();
                    this.viewMode = this.viewMode === 'preview' ? 'editor' : 'preview';
                }
                
                // Ctrl+H - Ayuda
                if (e.ctrlKey && e.key === 'h') {
                    e.preventDefault();
                    this.showHelp = true;
                }
                
                // Escape - Cerrar modales
                if (e.key === 'Escape') {
                    this.showHelp = false;
                    this.hideNotification();
                }
            });
        },

        // Configurar auto-guardado
        setupAutoSave() {
            let autoSaveTimer;
            
            this.$watch('content', () => {
                clearTimeout(autoSaveTimer);
                autoSaveTimer = setTimeout(() => {
                    if (this.page.id) { // Solo auto-guardar si ya existe la página
                        this.savePage();
                    }
                }, 30000); // Auto-guardar cada 30 segundos
            });
        },

        // Exportar página
        async exportPage(format = 'html') {
            try {
                const response = await fetch(`{{ route("pagebuilder.export", $page->id ?? "new") }}?format=${format}`, {
                    method: 'GET',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${this.page.slug || 'page'}.${format}`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    this.showNotification('success', 'Exportación exitosa', `Página exportada como ${format.toUpperCase()}`);
                } else {
                    throw new Error('Error en la exportación');
                }
            } catch (error) {
                console.error('Error exporting page:', error);
                this.showNotification('error', 'Error al exportar', error.message);
            }
        }
    }
}
</script>