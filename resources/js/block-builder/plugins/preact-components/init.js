// ===================================================================
// resources/js/block-builder/plugins/preact-components/init.js
// NUEVO: Inicializador con ComponentSystem en lugar de SimpleSyntax
// ===================================================================

import preactComponentsPlugin from './index.js';
import { initializeComponentSystem, getComponentSystem } from './ComponentSystem.js';
import { createComponentCompletionsExtension } from './ComponentCompletions.js';

let pluginInstance = null;
let isInitialized = false;
let componentSystem = null;

/**
 * Inicializar el plugin Preact Components con ComponentSystem
 */

preactComponentsPlugin.init = async function(context) {
    console.log('✅ Preact Components Plugin Initialized');
    
    // Configuración original
    this.registerComponentTypes();
    this.setupHooksSystem();
    
    // NUEVO: Conectar con ComponentSystem
    try {
        if (context.componentSystem) {
            this.componentSystem = context.componentSystem;
            
            // Agregar métodos del ComponentSystem al plugin
            this.getAllComponents = () => this.componentSystem.getAllComponents();
            this.getComponent = (name) => this.componentSystem.getComponent(name);
            this.renderComponentsInHTML = (html) => this.componentSystem.renderComponentsInHTML(html);
            this.validateComponentTags = (html) => {
                const components = this.componentSystem.parseComponentTags(html);
                return components.map(({ componentName, props }) => 
                    this.componentSystem.validateComponentProps(componentName, props)
                );
            };
            
            console.log('✅ ComponentSystem integrado con plugin');
        } else {
            console.warn('⚠️ ComponentSystem no disponible en contexto');
        }
    } catch (error) {
        console.error('❌ Error integrando ComponentSystem:', error);
    }
    
    return this;
};

export async function initializePreactComponentsPlugin() {
    if (isInitialized && pluginInstance) {
        console.log('✅ Preact Components Plugin ya inicializado');
        return pluginInstance;
    }

    try {
        console.log('🚀 Inicializando Preact Components Plugin con ComponentSystem...');

        // ===================================================================
        // 1. VERIFICAR DEPENDENCIAS
        // ===================================================================
        await verifyDependencies();

        // ===================================================================
        // 2. INICIALIZAR COMPONENT SYSTEM
        // ===================================================================
        componentSystem = await initializeComponentSystem();
        console.log('✅ ComponentSystem inicializado');

        // ===================================================================
        // 3. INICIALIZAR PLUGIN BASE
        // ===================================================================
        const context = {
            editorInstance: window.editorInstance || null,
            pluginManager: window.pluginManager || null,
            templateValidator: window.templateValidator || null,
            componentSystem: componentSystem
        };

        pluginInstance = await preactComponentsPlugin.init(context);
        
        // ===================================================================
        // 4. EXTENDER PLUGIN CON COMPONENTSYSTEM
        // ===================================================================
        extendPluginWithComponentSystem();

        // ===================================================================
        // 5. REGISTRAR EN PLUGIN MANAGER
        // ===================================================================
        if (window.pluginManager && typeof window.pluginManager.register === 'function') {
            await window.pluginManager.register('preact-components', pluginInstance, { replace: true });
            console.log('✅ Plugin registrado en PluginManager');
        } else {
            window.preactComponentsPlugin = pluginInstance;
            console.log('✅ Plugin registrado globalmente');
        }

        // ===================================================================
        // 6. CONFIGURAR SISTEMAS ADICIONALES
        // ===================================================================
        await setupPreviewSystem();
        await setupCodeMirrorExtensions();

        isInitialized = true;
        console.log('✅ Preact Components Plugin con ComponentSystem inicializado exitosamente');

        return pluginInstance;

    } catch (error) {
        console.error('❌ Error inicializando Preact Components Plugin:', error);
        throw error;
    }
}

/**
 * Extender plugin con métodos del ComponentSystem
 */
function extendPluginWithComponentSystem() {
    // Método para renderizar componentes en HTML
    pluginInstance.renderComponentsInHTML = (html) => {
        return componentSystem.renderComponentsInHTML(html);
    };

    // Método para obtener todos los componentes
    pluginInstance.getAllComponents = () => {
        return componentSystem.getAllComponents();
    };

    // Método para obtener componente específico
    pluginInstance.getComponent = (name) => {
        return componentSystem.getComponent(name);
    };

    // Método para registrar nuevo componente
    pluginInstance.registerComponent = (name, component, metadata) => {
        return componentSystem.registerComponent(name, component, metadata);
    };

    // Método para validar component tags
    pluginInstance.validateComponentTags = (html) => {
        const components = componentSystem.parseComponentTags(html);
        return components.map(({ componentName, props }) => 
            componentSystem.validateComponentProps(componentName, props)
        );
    };

    // Método para obtener completions
    pluginInstance.getComponentCompletions = (context) => {
        // Se implementará con el sistema de completions
        return [];
    };

    console.log('✅ Plugin extendido con métodos ComponentSystem');
}

/**
 * Configurar sistema de preview para componentes
 */
async function setupPreviewSystem() {
    try {
        window.PreactComponentRenderer = {
            render: async (html, container, props = {}) => {
                try {
                    // Procesar component tags en el HTML
                    const processedHTML = componentSystem.renderComponentsInHTML(html);
                    
                    // Por ahora, mostrar HTML procesado
                    container.innerHTML = processedHTML;
                    
                    // TODO: Implementar renderizado real de componentes Preact
                    await renderPreactComponents(container);
                    
                    return true;
                } catch (error) {
                    container.innerHTML = `<div class="error-display p-4 bg-red-50 border border-red-200 rounded">
                        <h3 class="text-red-800 font-bold">Preview Error:</h3>
                        <pre class="text-red-600 text-sm mt-2">${error.message}</pre>
                    </div>`;
                    return false;
                }
            },

            // Renderizar componentes específicos
            renderComponent: async (componentName, props, container) => {
                const component = componentSystem.getComponent(componentName);
                if (!component) {
                    throw new Error(`Component ${componentName} not found`);
                }

                // Crear elemento con el componente
                const element = component.component(props);
                
                // Renderizar usando Preact si está disponible
                if (window.preact && window.preact.render) {
                    window.preact.render(element, container);
                    return true;
                }

                throw new Error('Preact no está disponible para renderizado');
            }
        };

        console.log('✅ Preview system configurado para ComponentSystem');

    } catch (error) {
        console.warn('⚠️ Error configurando preview system:', error);
    }
}

/**
 * Renderizar componentes Preact reales en el container
 */
async function renderPreactComponents(container) {
    const componentElements = container.querySelectorAll('[data-preact-component]');
    
    for (const element of componentElements) {
        try {
            const componentName = element.getAttribute('data-preact-component');
            const propsJson = element.getAttribute('data-props');
            const props = JSON.parse(propsJson || '{}');
            
            const component = componentSystem.getComponent(componentName);
            if (component && window.preact) {
                // Crear componente real
                const componentElement = component.component(props);
                
                // Crear container para el componente
                const componentContainer = document.createElement('div');
                element.appendChild(componentContainer);
                
                // Renderizar componente Preact
                window.preact.render(componentElement, componentContainer);
                
                // Limpiar el placeholder
                const placeholder = element.querySelector('.border-dashed');
                if (placeholder) {
                    placeholder.remove();
                }
            }
        } catch (error) {
            console.warn(`⚠️ Error renderizando componente ${element.getAttribute('data-preact-component')}:`, error);
            
            // Mostrar error en el elemento
            element.innerHTML = `
                <div class="p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                    <strong>Error:</strong> ${error.message}
                </div>
            `;
        }
    }
}

/**
 * Configurar extensiones de CodeMirror para componentes
 */
async function setupCodeMirrorExtensions() {
    try {
        if (window.editorInstance && typeof window.editorInstance.addExtensions === 'function') {
            const componentExtensions = createComponentCompletionsExtension();
            const originalExtensions = pluginInstance.getEditorExtensions ? pluginInstance.getEditorExtensions() : [];
            
            const allExtensions = [
                ...originalExtensions,
                ...componentExtensions
            ];
            
            window.editorInstance.addExtensions(allExtensions);
            console.log('✅ CodeMirror extensions configuradas para ComponentSystem');
        } else {
            console.log('ℹ️ CodeMirror no disponible, extensiones no configuradas');
        }
    } catch (error) {
        console.warn('⚠️ Error configurando CodeMirror extensions:', error);
    }
}

/**
 * Verificar dependencias necesarias
 */
async function verifyDependencies() {
    const dependencies = [
        { name: 'Preact', check: () => window.preact || window.h },
        { name: 'Preact Hooks', check: () => window.preact?.hooks || window.preactHooks }
    ];

    const missing = dependencies.filter(dep => !dep.check());
    
    if (missing.length > 0) {
        console.warn('⚠️ Dependencias faltantes:', missing.map(d => d.name));
        await loadMissingDependencies(missing);
    }

    console.log('✅ Dependencias verificadas');
}

/**
 * Cargar dependencias faltantes
 */
async function loadMissingDependencies(missing) {
    for (const dependency of missing) {
        try {
            if (dependency.name === 'Preact') {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/preact/10.19.3/preact.umd.js');
                console.log('✅ Preact cargado');
            } else if (dependency.name === 'Preact Hooks') {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/preact/10.19.3/hooks.umd.js');
                console.log('✅ Preact Hooks cargado');
            }
        } catch (error) {
            console.warn(`⚠️ No se pudo cargar ${dependency.name}:`, error);
        }
    }
}

/**
 * Cargar script dinámicamente
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        // Verificar si ya está cargado
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}


/**
 * Obtener instancia del plugin
 */
export function getPreactComponentsPlugin() {
    return pluginInstance;
}

/**
 * Obtener instancia del ComponentSystem
 */
export function getPreactComponentSystem() {
    return componentSystem;
}

/**
 * Reset del plugin
 */
export function resetPreactComponentsPlugin() {
    pluginInstance = null;
    isInitialized = false;
    componentSystem = null;
    
    if (window.pluginManager && typeof window.pluginManager.unregister === 'function') {
        try {
            window.pluginManager.unregister('preact-components');
        } catch (error) {
            console.warn('Warning al desregistrar plugin:', error);
        }
    }
    
    // Limpiar globales
    delete window.preactComponentsPlugin;
    delete window.PreactComponentRenderer;
    delete window.renderComponentsInHTML;
    delete window.getAllComponents;
    delete window.getComponent;
    delete window.registerComponent;
    
    console.log('🔄 Preact Components Plugin reset completamente');
}

/**
 * Debug info del plugin
 */
export function debugPreactComponentsPlugin() {
    const debugInfo = {
        // Estado del plugin
        isInitialized,
        pluginInstance: !!pluginInstance,
        componentSystem: !!componentSystem,
        
        // Dependencias
        hasPluginManager: typeof window.pluginManager !== 'undefined',
        hasPreact: typeof window.preact !== 'undefined',
        hasPreactHooks: typeof window.preact?.hooks !== 'undefined',
        
        // Sistemas
        hasRenderer: typeof window.PreactComponentRenderer !== 'undefined',
        
        // Registros
        pluginInManager: window.pluginManager?.get('preact-components') !== undefined,
        globalPlugin: typeof window.preactComponentsPlugin !== 'undefined',
        
        // ComponentSystem específico
        componentSystemMethods: null,
        
        // Plugin methods
        pluginMethods: null
    };

    // Agregar info del ComponentSystem si está disponible
    if (componentSystem) {
        debugInfo.componentSystemMethods = {
            componentsRegistered: componentSystem.getComponentNames().length,
            availableComponents: componentSystem.getComponentNames(),
            isInitialized: componentSystem.isInitialized,
            categories: [...new Set(componentSystem.getAllComponents().map(c => c.metadata.category))]
        };
    }

    // Agregar info del plugin si está disponible
    if (pluginInstance) {
        debugInfo.pluginMethods = {
            renderComponentsInHTML: typeof pluginInstance.renderComponentsInHTML === 'function',
            getAllComponents: typeof pluginInstance.getAllComponents === 'function',
            getComponent: typeof pluginInstance.getComponent === 'function',
            registerComponent: typeof pluginInstance.registerComponent === 'function',
            validateComponentTags: typeof pluginInstance.validateComponentTags === 'function'
        };
    }

    return debugInfo;
}

/**
 * Funciones de conveniencia para ComponentSystem
 */
export function renderComponentsInHTML(html) {
    if (!pluginInstance || !pluginInstance.renderComponentsInHTML) {
        throw new Error('ComponentSystem no está disponible. ¿Está inicializado el plugin?');
    }
    
    return pluginInstance.renderComponentsInHTML(html);
}

export function getAllComponents() {
    if (!pluginInstance || !pluginInstance.getAllComponents) {
        return []; // Fallback seguro
    }
    
    return pluginInstance.getAllComponents();
}

export function getComponent(name) {
    if (!pluginInstance || !pluginInstance.getComponent) {
        throw new Error('ComponentSystem no está disponible. ¿Está inicializado el plugin?');
    }
    
    return pluginInstance.getComponent(name);
}

export function registerComponent(name, component, metadata) {
    if (!pluginInstance || !pluginInstance.registerComponent) {
        throw new Error('ComponentSystem no está disponible. ¿Está inicializado el plugin?');
    }
    
    return pluginInstance.registerComponent(name, component, metadata);
}

export function validateComponentTags(html) {
    if (!pluginInstance || !pluginInstance.validateComponentTags) {
        console.warn('⚠️ validateComponentTags no disponible');
        return [];
    }
    
    return pluginInstance.validateComponentTags(html);
}

// ===================================================================
// FUNCIONES DE DESARROLLO (solo en development)
// ===================================================================

if (typeof window !== 'undefined') {
    // Exponer funciones de debug
    window.debugPreactComponents = debugPreactComponentsPlugin;
    window.resetPreactComponents = resetPreactComponentsPlugin;
    
    // Funciones de conveniencia globales para ComponentSystem
    window.renderComponentsInHTML = renderComponentsInHTML;
    window.getAllComponents = getAllComponents;
    window.getComponent = getComponent;
    window.registerComponent = registerComponent;
    window.validateComponentTags = validateComponentTags;
    
    // Log de estado al cargar en desarrollo
    if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
            console.log('🔍 Debug Preact Components (ComponentSystem):', debugPreactComponentsPlugin());
        }, 2000);
    }
}

// ===================================================================
// EXPORT DEFAULT
// ===================================================================

export default {
    initializePreactComponentsPlugin,
    getPreactComponentsPlugin,
    getPreactComponentSystem,
    resetPreactComponentsPlugin,
    debugPreactComponentsPlugin,
    renderComponentsInHTML,
    getAllComponents,
    getComponent,
    registerComponent,
    validateComponentTags
};