// ===================================================================
// resources/js/block-builder/plugins/preact-components/init.js
// Inicializador del plugin Preact Components - CORREGIDO
// ===================================================================

import preactComponentsPlugin from './index.js';

let pluginInstance = null;
let isInitialized = false;

/**
 * Inicializar el plugin Preact Components
 */
export async function initializePreactComponentsPlugin() {
    if (isInitialized && pluginInstance) {
        console.log('✅ Preact Components Plugin ya inicializado');
        return pluginInstance;
    }

    try {
        console.log('🚀 Inicializando Preact Components Plugin...');

        // Verificar dependencias
        await verifyDependencies();

        // Inicializar plugin
        const context = {
            editorInstance: window.editorInstance || null,
            pluginManager: window.pluginManager || null,
            templateValidator: window.templateValidator || null
        };

        pluginInstance = await preactComponentsPlugin.init(context);
        
        // CORREGIDO: Usar el método correcto del pluginManager
        if (window.pluginManager && typeof window.pluginManager.register === 'function') {
            await window.pluginManager.register('preact-components', pluginInstance, { replace: true });
            console.log('✅ Plugin registrado en PluginManager');
        } else {
            // Fallback: registrar globalmente si no hay pluginManager
            window.preactComponentsPlugin = pluginInstance;
            console.log('✅ Plugin registrado globalmente');
        }

        // Configurar preview system
        await setupPreviewSystem();

        // Configurar CodeMirror extensions
        await setupCodeMirrorExtensions();

        isInitialized = true;
        console.log('✅ Preact Components Plugin inicializado exitosamente');

        return pluginInstance;

    } catch (error) {
        console.error('❌ Error inicializando Preact Components Plugin:', error);
        throw error;
    }
}

/**
 * Obtener instancia del plugin (sin inicializar)
 */
export function getPreactComponentsPlugin() {
    if (window.pluginManager && typeof window.pluginManager.get === 'function') {
        return window.pluginManager.get('preact-components');
    }
    return window.preactComponentsPlugin || pluginInstance;
}

/**
 * Verificar si el plugin está disponible
 */
export function isPreactComponentsPluginAvailable() {
    return getPreactComponentsPlugin() !== null;
}

/**
 * Verificar dependencias del plugin
 */
async function verifyDependencies() {
    const dependencies = [
        { 
            name: 'PluginManager', 
            check: () => typeof window.pluginManager !== 'undefined',
            critical: false // No es crítico
        },
        { 
            name: 'Tailwind', 
            check: () => typeof window.tailwind !== 'undefined' || document.querySelector('script[src*="tailwindcss"]'),
            critical: false
        },
        {
            name: 'DOM Ready',
            check: () => document.readyState === 'complete' || document.readyState === 'interactive',
            critical: true
        }
    ];

    for (const dep of dependencies) {
        if (!dep.check()) {
            if (dep.critical) {
                throw new Error(`Dependencia crítica faltante: ${dep.name}`);
            } else {
                console.warn(`⚠️ Dependencia opcional faltante: ${dep.name}`);
            }
        } else {
            console.log(`✅ Dependencia verificada: ${dep.name}`);
        }
    }

    // Cargar Preact dinámicamente si no está disponible
    if (typeof window.preact === 'undefined') {
        try {
            console.log('📦 Cargando Preact dinámicamente...');
            
            // Cargar desde CDN como fallback
            await loadScript('https://unpkg.com/preact@10.26.8/dist/preact.umd.js');
            await loadScript('https://unpkg.com/preact@10.26.8/hooks/dist/hooks.umd.js');
            
            // Verificar que se cargó correctamente
            if (window.preact) {
                console.log('✅ Preact cargado desde CDN');
            } else {
                console.warn('⚠️ Preact no se pudo cargar dinámicamente');
            }
        } catch (error) {
            console.warn('⚠️ Error cargando Preact:', error);
        }
    }
}

/**
 * Cargar script dinámicamente
 */
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Configurar sistema de preview
 */
async function setupPreviewSystem() {
    try {
        // Inyectar template de preview en el sistema
        const previewTemplate = preactComponentsPlugin.getPreviewTemplate();
        
        if (window.pluginManager && typeof window.pluginManager.setPreviewTemplate === 'function') {
            window.pluginManager.setPreviewTemplate('preact-components', previewTemplate);
        }

        // Configurar renderer global
        window.PreactComponentRenderer = {
            async renderToString(componentCode, props = {}) {
                try {
                    const Component = await createComponentFromCode(componentCode);
                    // Para SSR necesitarías preact/ssr, por ahora retornar placeholder
                    return `<div data-preact-component="${Component.name || 'Component'}">${JSON.stringify(props)}</div>`;
                } catch (error) {
                    return `<div class="error">Error rendering component: ${error.message}</div>`;
                }
            },

            async renderToDOM(componentCode, container, props = {}) {
                try {
                    // Verificar que tenemos Preact disponible
                    if (!window.preact && !window.PreactRenderer) {
                        throw new Error('Preact no está disponible');
                    }

                    // Usar el renderer del preview template si está disponible
                    if (window.PreactRenderer) {
                        return window.PreactRenderer.renderComponent(componentCode, container, props);
                    }

                    // Fallback manual
                    const Component = await createComponentFromCode(componentCode);
                    if (window.preact && window.preact.render) {
                        window.preact.render(window.preact.h(Component, props), container);
                        return true;
                    }

                    throw new Error('No hay sistema de renderizado disponible');
                } catch (error) {
                    container.innerHTML = `<div class="error-display p-4 bg-red-50 border border-red-200 rounded">
                        <h3 class="text-red-800 font-bold">Error:</h3>
                        <pre class="text-red-600 text-sm mt-2">${error.message}</pre>
                    </div>`;
                    return false;
                }
            }
        };

        console.log('✅ Preview system configurado');

    } catch (error) {
        console.warn('⚠️ Error configurando preview system:', error);
    }
}

/**
 * Configurar extensiones de CodeMirror
 */
async function setupCodeMirrorExtensions() {
    try {
        if (window.editorInstance && typeof window.editorInstance.addExtensions === 'function') {
            const extensions = preactComponentsPlugin.getEditorExtensions();
            window.editorInstance.addExtensions(extensions);
            console.log('✅ CodeMirror extensions configuradas');
        } else {
            console.log('ℹ️ CodeMirror no disponible, extensiones no configuradas');
        }
    } catch (error) {
        console.warn('⚠️ Error configurando CodeMirror extensions:', error);
    }
}

/**
 * Crear componente desde código string
 */
async function createComponentFromCode(code) {
    try {
        // Transformar código JSX a función ejecutable
        const transformedCode = `
            // Simular imports para el contexto
            const h = window.preact?.h || window.PreactRenderer?.h;
            const Fragment = window.preact?.Fragment;
            const useState = window.preact?.hooks?.useState || window.PreactRenderer?.hooks?.useState;
            const useEffect = window.preact?.hooks?.useEffect || window.PreactRenderer?.hooks?.useEffect;
            const useCallback = window.preact?.hooks?.useCallback;
            const useMemo = window.preact?.hooks?.useMemo;
            const useRef = window.preact?.hooks?.useRef;
            
            ${code}
            
            // Retornar el componente definido
            const componentNames = Object.keys(this).filter(key => 
                typeof this[key] === 'function' && 
                key[0] === key[0].toUpperCase() &&
                key !== 'Object' && key !== 'Array'
            );
            
            return this[componentNames[componentNames.length - 1]] || (() => h('div', null, 'No component found'));
        `;

        // Crear función que retorna el componente
        const componentFunction = new Function(transformedCode);
        return componentFunction.call({});
    } catch (error) {
        throw new Error(`Error creating component: ${error.message}`);
    }
}

/**
 * Reset del plugin (para desarrollo/testing)
 */
export function resetPreactComponentsPlugin() {
    pluginInstance = null;
    isInitialized = false;
    
    if (window.pluginManager && typeof window.pluginManager.unregister === 'function') {
        try {
            window.pluginManager.unregister('preact-components');
        } catch (error) {
            console.warn('Warning al desregistrar plugin:', error);
        }
    }
    
    delete window.preactComponentsPlugin;
    delete window.PreactComponentRenderer;
    
    console.log('🔄 Preact Components Plugin reset');
}

/**
 * Debug info del plugin
 */
export function debugPreactComponentsPlugin() {
    return {
        isInitialized,
        pluginInstance: !!pluginInstance,
        hasPluginManager: typeof window.pluginManager !== 'undefined',
        hasPreact: typeof window.preact !== 'undefined',
        hasPreactHooks: typeof window.preact?.hooks !== 'undefined',
        hasRenderer: typeof window.PreactComponentRenderer !== 'undefined',
        pluginInManager: window.pluginManager?.get('preact-components') !== undefined,
        globalPlugin: typeof window.preactComponentsPlugin !== 'undefined'
    };
}

// Exponer funciones de debug en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.debugPreactComponents = debugPreactComponentsPlugin;
    window.resetPreactComponents = resetPreactComponentsPlugin;
}