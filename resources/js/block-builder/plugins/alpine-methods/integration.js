// ===================================================================
// resources/js/block-builder/plugins/alpine-methods/integration.js
// Integración del editor Alpine Methods con tu sistema existente
// ===================================================================

import AlpineMethodsInterface from './components/AlpineMethodsInterface.jsx';
import { getAlpineMethodsPlugin } from './init.js';

/**
 * Configurar e integrar el editor Alpine Methods
 * Este archivo conecta el componente con tu plugin y sistema existente
 */
export class AlpineMethodsEditorIntegration {
    constructor(options = {}) {
        this.options = {
            container: null,
            pluginName: 'alpine-methods',
            autoMount: true,
            apiEndpoint: '/api/templates/alpine-methods',
            ...options
        };
        
        this.plugin = null;
        this.editorInstance = null;
        this.isInitialized = false;
    }

    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================

    /**
     * Inicializar la integración completa
     */
    async init() {
        try {
            console.log('🚀 Initializing Alpine Methods Editor Integration...');

            // 1. Obtener el plugin
            await this.setupPlugin();

            // 2. Configurar callbacks
            this.setupCallbacks();

            // 3. Montar el componente si es necesario
            if (this.options.autoMount && this.options.container) {
                await this.mount(this.options.container);
            }

            this.isInitialized = true;
            console.log('✅ Alpine Methods Editor Integration initialized');

            return this;

        } catch (error) {
            console.error('❌ Failed to initialize Alpine Methods Editor Integration:', error);
            throw error;
        }
    }

    /**
     * Configurar el plugin Alpine Methods
     */
    async setupPlugin() {
        try {
            // Intentar obtener el plugin del PluginManager
            if (window.pluginManager) {
                this.plugin = window.pluginManager.get(this.options.pluginName);
            }

            // Si no está disponible, intentar obtenerlo directamente
            if (!this.plugin) {
                this.plugin = getAlpineMethodsPlugin();
            }

            // Si aún no está disponible, inicializarlo
            if (!this.plugin) {
                const { initializeAlpineMethodsPlugin } = await import('./init.js');
                this.plugin = await initializeAlpineMethodsPlugin();
            }

            if (!this.plugin) {
                throw new Error('Alpine Methods plugin not available');
            }

            console.log('✅ Alpine Methods plugin connected');

        } catch (error) {
            console.warn('⚠️ Plugin not available, editor will work in standalone mode');
            this.plugin = null;
        }
    }

    /**
     * Configurar callbacks para integración con el sistema
     */
    setupCallbacks() {
        this.callbacks = {
            onSave: async (method) => {
                return await this.saveMethod(method);
            },

            onLoad: (method) => {
                console.log('📄 Method loaded in editor:', method.name);
                this.emitEvent('methodLoaded', method);
            },

            onDelete: async (methodId) => {
                return await this.deleteMethod(methodId);
            },

            onExport: (method) => {
                console.log('📤 Method exported:', method.name);
                this.emitEvent('methodExported', method);
            }
        };
    }

    // ===================================================================
    // MONTAJE Y DESMONTAJE
    // ===================================================================

    /**
     * Montar el editor en un contenedor específico
     */
    async mount(container) {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }

        if (!container) {
            throw new Error('Container not found for Alpine Methods Editor');
        }

        try {
            // Importar React y ReactDOM si no están disponibles globalmente
            const React = window.React || (await import('react')).default;
            const ReactDOM = window.ReactDOM || (await import('react-dom')).default;

            // Crear el elemento del editor
            const editorElement = React.createElement(AlpineMethodsInterface, {
                pluginInstance: this.plugin,
                onSave: this.callbacks.onSave,
                onLoad: this.callbacks.onLoad,
                onDelete: this.callbacks.onDelete,
                onExport: this.callbacks.onExport
            });

            // Montar el componente
            if (ReactDOM.createRoot) {
                // React 18+
                const root = ReactDOM.createRoot(container);
                root.render(editorElement);
                this.editorInstance = root;
            } else {
                // React < 18
                ReactDOM.render(editorElement, container);
                this.editorInstance = container;
            }

            console.log('✅ Alpine Methods Editor mounted');

        } catch (error) {
            console.error('❌ Error mounting Alpine Methods Editor:', error);
            throw error;
        }
    }

    /**
     * Desmontar el editor
     */
    unmount() {
        if (this.editorInstance) {
            try {
                if (typeof this.editorInstance.unmount === 'function') {
                    // React 18+
                    this.editorInstance.unmount();
                } else {
                    // React < 18
                    const ReactDOM = window.ReactDOM || require('react-dom');
                    ReactDOM.unmountComponentAtNode(this.editorInstance);
                }

                this.editorInstance = null;
                console.log('✅ Alpine Methods Editor unmounted');

            } catch (error) {
                console.error('❌ Error unmounting Alpine Methods Editor:', error);
            }
        }
    }

    // ===================================================================
    // MÉTODOS DE API
    // ===================================================================

    /**
     * Guardar método usando la API del plugin o endpoint directo
     */
    async saveMethod(method) {
        try {
            // Intentar usar el plugin primero
            if (this.plugin && typeof this.plugin.saveMethod === 'function') {
                return await this.plugin.saveMethod(method);
            }

            // Fallback: llamada directa a la API
            const response = await fetch(this.options.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({
                    name: method.name,
                    description: method.description,
                    category: method.category,
                    trigger_syntax: `@${method.name}`,
                    method_template: method.inputCode,
                    method_parameters: method.parameters || {},
                    is_active: true
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to save method');
            }

            console.log('✅ Method saved via API:', method.name);
            this.emitEvent('methodSaved', method);

            return result.data;

        } catch (error) {
            console.error('❌ Error saving method:', error);
            throw error;
        }
    }

    /**
     * Eliminar método
     */
    async deleteMethod(methodId) {
        try {
            // Intentar usar el plugin primero
            if (this.plugin && typeof this.plugin.deleteMethod === 'function') {
                return await this.plugin.deleteMethod(methodId);
            }

            // Fallback: llamada directa a la API
            const response = await fetch(`${this.options.apiEndpoint}/${methodId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to delete method');
            }

            console.log('✅ Method deleted via API:', methodId);
            this.emitEvent('methodDeleted', methodId);

            return result.data;

        } catch (error) {
            console.error('❌ Error deleting method:', error);
            throw error;
        }
    }

    /**
     * Cargar todos los métodos
     */
    async loadMethods() {
        try {
            // Intentar usar el plugin primero
            if (this.plugin && typeof this.plugin.getAllMethods === 'function') {
                return await this.plugin.getAllMethods();
            }

            // Fallback: llamada directa a la API
            const response = await fetch(this.options.apiEndpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to load methods');
            }

            return result.data || [];

        } catch (error) {
            console.error('❌ Error loading methods:', error);
            return [];
        }
    }

    // ===================================================================
    // SISTEMA DE EVENTOS
    // ===================================================================

    /**
     * Emitir evento personalizado
     */
    emitEvent(eventName, data) {
        const event = new CustomEvent(`alpineMethods:${eventName}`, {
            detail: data,
            bubbles: true
        });

        document.dispatchEvent(event);

        // También emitir en el contexto del plugin si está disponible
        if (this.plugin && typeof this.plugin.emit === 'function') {
            this.plugin.emit(eventName, data);
        }
    }

    /**
     * Escuchar eventos específicos
     */
    on(eventName, callback) {
        const handler = (event) => callback(event.detail);
        document.addEventListener(`alpineMethods:${eventName}`, handler);

        // Retornar función para remover el listener
        return () => {
            document.removeEventListener(`alpineMethods:${eventName}`, handler);
        };
    }

    // ===================================================================
    // MÉTODOS PÚBLICOS PARA CONTROL EXTERNO
    // ===================================================================

    /**
     * Abrir el editor con un método específico
     */
    openMethod(methodId) {
        this.emitEvent('openMethod', { methodId });
    }

    /**
     * Crear nuevo método con datos iniciales
     */
    createMethod(initialData = {}) {
        this.emitEvent('createMethod', initialData);
    }

    /**
     * Exportar método específico
     */
    exportMethod(methodId) {
        this.emitEvent('exportMethod', { methodId });
    }

    /**
     * Refrescar lista de métodos
     */
    async refresh() {
        try {
            if (this.plugin && typeof this.plugin.loadMethods === 'function') {
                await this.plugin.loadMethods();
            }
            this.emitEvent('refresh');
        } catch (error) {
            console.error('❌ Error refreshing methods:', error);
        }
    }

    // ===================================================================
    // CLEANUP
    // ===================================================================

    /**
     * Limpiar la integración
     */
    destroy() {
        this.unmount();
        this.isInitialized = false;
        this.plugin = null;
        console.log('🧹 Alpine Methods Editor Integration destroyed');
    }
}

// ===================================================================
// FUNCIONES DE CONVENIENCIA
// ===================================================================

/**
 * Crear e inicializar la integración en un solo paso
 */
export async function createAlpineMethodsEditor(containerSelector, options = {}) {
    const integration = new AlpineMethodsEditorIntegration({
        container: containerSelector,
        ...options
    });

    await integration.init();
    return integration;
}

/**
 * Integración automática para cuando el DOM esté listo
 */
export function autoInitAlpineMethodsEditor(options = {}) {
    const defaultContainer = options.container || '#alpine-methods-editor';
    
    const init = async () => {
        try {
            const container = document.querySelector(defaultContainer);
            if (container) {
                return await createAlpineMethodsEditor(container, options);
            } else {
                console.warn(`⚠️ Container ${defaultContainer} not found for Alpine Methods Editor`);
            }
        } catch (error) {
            console.error('❌ Auto-init Alpine Methods Editor failed:', error);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}

// ===================================================================
// INTEGRACIÓN CON SISTEMAS EXISTENTES
// ===================================================================

/**
 * Integrar con tu PageBuilder existente
 */
export function integrateWithPageBuilder(pageBuilderInstance) {
    if (!pageBuilderInstance) {
        console.warn('⚠️ PageBuilder instance not provided');
        return;
    }

    // Agregar botón para abrir Alpine Methods Editor
    const addAlpineMethodsButton = () => {
        const toolbar = pageBuilderInstance.getToolbar?.();
        if (toolbar) {
            const button = document.createElement('button');
            button.innerHTML = `
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Alpine Methods
            `;
            button.className = 'alpine-methods-btn';
            button.onclick = () => {
                // Abrir Alpine Methods Editor en modal o panel
                openAlpineMethodsModal();
            };
            toolbar.appendChild(button);
        }
    };

    // Función para abrir el editor en modal
    const openAlpineMethodsModal = async () => {
        const modal = document.createElement('div');
        modal.className = 'alpine-methods-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000;">
                <div class="modal-container" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 95vw; height: 90vh; background: white; border-radius: 8px; overflow: hidden;">
                    <div class="modal-header" style="padding: 16px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: between; align-items: center;">
                        <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Alpine Methods Editor</h2>
                        <button class="close-btn" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
                    </div>
                    <div id="alpine-methods-editor-modal" style="height: calc(100% - 60px);"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Cerrar modal
        modal.querySelector('.close-btn').onclick = () => {
            document.body.removeChild(modal);
        };

        modal.querySelector('.modal-backdrop').onclick = (e) => {
            if (e.target === e.currentTarget) {
                document.body.removeChild(modal);
            }
        };

        // Inicializar editor en el modal
        await createAlpineMethodsEditor('#alpine-methods-editor-modal');
    };

    // Ejecutar integración
    addAlpineMethodsButton();

    console.log('✅ Alpine Methods Editor integrated with PageBuilder');
}

/**
 * Integrar con tu sistema de bloques
 */
export function integrateWithBlockSystem(blockSystem) {
    if (!blockSystem) return;

    // Registrar bloque Alpine Method
    if (typeof blockSystem.registerBlock === 'function') {
        blockSystem.registerBlock('alpine-method', {
            name: 'Alpine Method',
            category: 'interactive',
            description: 'Bloque con funcionalidad Alpine.js reutilizable',
            icon: '⚡',
            attributes: {
                methodName: {
                    type: 'string',
                    default: ''
                },
                methodCode: {
                    type: 'string',
                    default: ''
                }
            },
            edit: (props) => {
                // Componente de edición que abre Alpine Methods Editor
                return `
                    <div class="alpine-method-block-edit">
                        <button onclick="openAlpineMethodsForBlock('${props.clientId}')">
                            ⚡ Editar Método Alpine
                        </button>
                        <div class="method-preview">
                            ${props.attributes.methodName ? `Método: ${props.attributes.methodName}` : 'Sin método seleccionado'}
                        </div>
                    </div>
                `;
            },
            save: (props) => {
                // HTML final del bloque
                return `
                    <div x-data="${props.attributes.methodName}()">
                        <script>${props.attributes.methodCode}</script>
                        <!-- Contenido del método Alpine -->
                    </div>
                `;
            }
        });
    }

    console.log('✅ Alpine Methods Editor integrated with Block System');
}

// ===================================================================
// EXPORT DEFAULT
// ===================================================================

export default AlpineMethodsEditorIntegration;