<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Builder</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Alpine.js -->
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    <style>
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ===== ALPINE.JS COMPONENT ===== -->
    <div x-data="pageBuilder(@json($initialData))" 
         x-init="init()" 
         x-cloak
         class="min-h-screen">
        
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <div class="flex items-center space-x-4">
                        <h1 class="text-xl font-semibold text-gray-900">Page Builder</h1>
                        <span class="text-sm text-gray-500" x-text="`Hola, ${user.name}`"></span>
                    </div>
                    
                    <div class="flex items-center space-x-3">
                        <!-- Status -->
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 rounded-full" 
                                 :class="isDirty ? 'bg-orange-400' : 'bg-green-400'"></div>
                            <span class="text-sm text-gray-600" 
                                  x-text="isDirty ? 'Sin guardar' : 'Guardado'"></span>
                        </div>
                        
                        <!-- Actions -->
                        <button @click="saveTemplate()" 
                                :disabled="!isDirty"
                                class="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors">
                            <span x-show="!saving">Guardar</span>
                            <span x-show="saving">Guardando...</span>
                        </button>
                        
                        <button @click="newTemplate()" 
                                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                            Nuevo
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <div class="flex h-[calc(100vh-64px)]">
            <!-- Sidebar - Templates -->
            <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div class="p-4 border-b border-gray-200">
                    <h2 class="text-lg font-medium text-gray-900 mb-3">Templates</h2>
                    
                    <!-- Search -->
                    <input type="text" 
                           x-model="searchTerm"
                           placeholder="Buscar templates..."
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                
                <!-- Templates List -->
                <div class="flex-1 overflow-y-auto p-4">
                    <div x-show="loading" class="text-center py-8 text-gray-500">
                        Cargando templates...
                    </div>
                    
                    <div x-show="!loading" class="space-y-2">
                        <template x-for="template in filteredTemplates" :key="template.id">
                            <div class="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                 :class="{ 'bg-blue-50 border-blue-300': currentTemplate?.id === template.id }"
                                 @click="loadTemplate(template.id)">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <h3 class="font-medium text-gray-900" x-text="template.name"></h3>
                                        <p class="text-sm text-gray-500" x-text="formatDate(template.created_at)"></p>
                                        <span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded mt-1" 
                                              x-text="template.type.toUpperCase()"></span>
                                    </div>
                                    <button @click.stop="deleteTemplate(template.id)"
                                            class="text-red-600 hover:text-red-800 text-sm">
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </template>
                        
                        <!-- Empty state -->
                        <div x-show="filteredTemplates.length === 0" 
                             class="text-center py-8 text-gray-500">
                            <p>No hay templates</p>
                            <button @click="newTemplate()" 
                                    class="mt-2 text-blue-600 hover:text-blue-800">
                                Crear el primero
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Stats -->
                <div class="p-4 border-t border-gray-200 bg-gray-50">
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div class="text-lg font-semibold text-gray-900" x-text="stats.user_templates || 0"></div>
                            <div class="text-xs text-gray-600">Mis Templates</div>
                        </div>
                        <div>
                            <div class="text-lg font-semibold text-gray-900" x-text="stats.total_users || 0"></div>
                            <div class="text-xs text-gray-600">Usuarios</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Editor Area -->
            <div class="flex-1 flex flex-col">
                <!-- Editor Toolbar -->
                <div class="bg-white border-b border-gray-200 p-4">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <input type="text" 
                                   x-model="currentTemplate ? currentTemplate.name : newTemplateName"
                                   placeholder="Nombre del template"
                                   class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            
                            <select x-model="selectedType" 
                                    class="px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="html">HTML</option>
                                <option value="css">CSS</option>
                                <option value="js">JavaScript</option>
                            </select>
                        </div>
                        
                        <div class="text-sm text-gray-500">
                            <span x-show="autoSaving">Auto-guardando...</span>
                            <span x-show="!autoSaving && currentTemplate">
                                Última edición: <span x-text="formatDate(currentTemplate.updated_at)"></span>
                            </span>
                        </div>
                    </div>
                </div>
                
                <!-- Code Editor Area -->
                <div class="flex-1 bg-gray-900 text-white font-mono">
                    <!-- Aquí va tu CodeMirror component -->
                    <textarea x-model="currentCode"
                              @input="onCodeChange($event.target.value)"
                              class="w-full h-full bg-gray-900 text-green-400 font-mono p-4 resize-none focus:outline-none"
                              placeholder="Escribe tu código aquí..."></textarea>
                </div>
            </div>

            <!-- Preview Panel -->
            <div class="w-1/2 bg-white border-l border-gray-200">
                <div class="p-4 border-b border-gray-200">
                    <h3 class="text-lg font-medium text-gray-900">Preview</h3>
                </div>
                <div class="h-full">
                    <iframe x-ref="preview" 
                            class="w-full h-full border-none"
                            srcdoc="<html><body><h1>Preview aparecerá aquí</h1></body></html>">
                    </iframe>
                </div>
            </div>
        </div>
        
        <!-- Messages/Notifications -->
        <div x-show="message" 
             x-transition
             class="fixed bottom-4 right-4 max-w-sm bg-white border border-gray-200 rounded-lg shadow-lg p-4"
             :class="{
                 'border-green-200 bg-green-50': messageType === 'success',
                 'border-red-200 bg-red-50': messageType === 'error',
                 'border-yellow-200 bg-yellow-50': messageType === 'warning'
             }">
            <div class="flex justify-between items-start">
                <p class="text-sm" 
                   :class="{
                       'text-green-800': messageType === 'success',
                       'text-red-800': messageType === 'error',
                       'text-yellow-800': messageType === 'warning'
                   }"
                   x-text="message"></p>
                <button @click="message = ''" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>
        </div>
    </div>

    <script>
        function pageBuilder(initialData) {
            return {
                // ===== DATOS INICIALES (SIN FETCH) =====
                user: initialData.user,
                templates: initialData.templates,
                stats: initialData.stats,
                config: initialData.config,
                
                // ===== ESTADO DEL EDITOR =====
                currentCode: '',
                savedCode: '',
                currentTemplate: null,
                newTemplateName: '',
                selectedType: 'html',
                isDirty: false,
                
                // ===== ESTADOS DE CARGA =====
                loading: false,
                saving: false,
                autoSaving: false,
                
                // ===== FILTROS =====
                searchTerm: '',
                
                // ===== MENSAJES =====
                message: '',
                messageType: 'info',
                
                // ===== INIT =====
                init() {
                    console.log('🚀 PageBuilder inicializado con datos:', initialData);
                    this.setupAutoSave();
                    this.showMessage('Editor listo', 'success');
                },
                
                // ===== COMPUTED =====
                get filteredTemplates() {
                    if (!this.searchTerm) return this.templates;
                    
                    return this.templates.filter(t => 
                        t.name.toLowerCase().includes(this.searchTerm.toLowerCase())
                    );
                },
                
                // ===== API CALLS =====
                async apiCall(endpoint, options = {}) {
                    const defaultOptions = {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
                        }
                    };
                    
                    try {
                        const response = await fetch(`/api${endpoint}`, { ...defaultOptions, ...options });
                        const data = await response.json();
                        
                        if (!response.ok) {
                            throw new Error(data.error || 'Error en la petición');
                        }
                        
                        return data;
                    } catch (error) {
                        this.showMessage(error.message, 'error');
                        throw error;
                    }
                },
                
                // ===== TEMPLATE ACTIONS =====
                async loadTemplate(templateId) {
                    // Buscar en datos existentes primero
                    const template = this.templates.find(t => t.id === templateId);
                    if (template) {
                        this.currentTemplate = template;
                        this.currentCode = template.code || '';
                        this.savedCode = this.currentCode;
                        this.isDirty = false;
                        this.selectedType = template.type;
                        this.updatePreview();
                    }
                },
                
                async saveTemplate() {
                    if (!this.currentCode.trim()) {
                        this.showMessage('No hay código para guardar', 'warning');
                        return;
                    }
                    
                    this.saving = true;
                    try {
                        const data = {
                            name: this.currentTemplate ? this.currentTemplate.name : this.newTemplateName,
                            code: this.currentCode,
                            type: this.selectedType
                        };
                        
                        if (this.currentTemplate) {
                            // Actualizar
                            const response = await this.apiCall(`/templates/${this.currentTemplate.id}`, {
                                method: 'PUT',
                                body: JSON.stringify(data)
                            });
                            this.currentTemplate = response.template;
                        } else {
                            // Crear nuevo
                            if (!data.name) {
                                this.showMessage('Necesitas un nombre para el template', 'warning');
                                return;
                            }
                            
                            const response = await this.apiCall('/templates', {
                                method: 'POST',
                                body: JSON.stringify(data)
                            });
                            
                            this.currentTemplate = response.template;
                            this.templates.unshift(response.template);
                            this.newTemplateName = '';
                        }
                        
                        this.savedCode = this.currentCode;
                        this.isDirty = false;
                        this.showMessage('Template guardado', 'success');
                        
                    } catch (error) {
                        // Error ya manejado en apiCall
                    } finally {
                        this.saving = false;
                    }
                },
                
                async deleteTemplate(templateId) {
                    if (!confirm('¿Eliminar este template?')) return;
                    
                    try {
                        await this.apiCall(`/templates/${templateId}`, { method: 'DELETE' });
                        this.templates = this.templates.filter(t => t.id !== templateId);
                        
                        if (this.currentTemplate?.id === templateId) {
                            this.newTemplate();
                        }
                        
                        this.showMessage('Template eliminado', 'success');
                    } catch (error) {
                        // Error ya manejado
                    }
                },
                
                newTemplate() {
                    this.currentTemplate = null;
                    this.currentCode = '';
                    this.savedCode = '';
                    this.newTemplateName = '';
                    this.isDirty = false;
                    this.selectedType = 'html';
                    this.updatePreview();
                },
                
                // ===== EDITOR EVENTS =====
                onCodeChange(newCode) {
                    this.currentCode = newCode;
                    this.isDirty = newCode !== this.savedCode;
                    this.scheduleAutoSave();
                    this.updatePreview();
                },
                
                // ===== AUTO-SAVE =====
                autoSaveTimeout: null,
                
                setupAutoSave() {
                    console.log(`🔄 Auto-save cada ${this.config.auto_save_delay}ms`);
                },
                
                scheduleAutoSave() {
                    if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
                    
                    this.autoSaveTimeout = setTimeout(() => {
                        if (this.isDirty && this.currentTemplate) {
                            this.autoSave();
                        }
                    }, this.config.auto_save_delay);
                },
                
                async autoSave() {
                    if (!this.currentTemplate) return;
                    
                    this.autoSaving = true;
                    try {
                        await this.apiCall(`/templates/${this.currentTemplate.id}`, {
                            method: 'PUT',
                            body: JSON.stringify({
                                code: this.currentCode
                            })
                        });
                        
                        this.savedCode = this.currentCode;
                        this.isDirty = false;
                        
                    } catch (error) {
                        console.warn('Auto-save failed');
                    } finally {
                        this.autoSaving = false;
                    }
                },
                
                // ===== PREVIEW =====
                updatePreview() {
                    if (this.$refs.preview) {
                        const html = this.selectedType === 'html' ? this.currentCode : 
                                    `<pre style="background:#1f2937;color:#10b981;padding:1rem;font-family:monospace;">${this.currentCode}</pre>`;
                        this.$refs.preview.srcdoc = html;
                    }
                },
                
                // ===== UTILITIES =====
                showMessage(text, type = 'info') {
                    this.message = text;
                    this.messageType = type;
                    setTimeout(() => this.message = '', 3000);
                },
                
                formatDate(dateString) {
                    return new Date(dateString).toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
            }
        }
    </script>
</body>
</html>