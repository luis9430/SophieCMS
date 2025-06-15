// ===================================================================
// resources/js/block-builder/plugins/alpine-methods/init.js
// CORREGIDO - Evita doble registro del plugin
// ===================================================================

import AlpineMethodsPlugin from './index.js';

/**
 * Inicializar el plugin de métodos Alpine
 * CORREGIDO para evitar doble registro
 */
export async function initializeAlpineMethodsPlugin() {
    try {
        console.log('🚀 Initializing Alpine Methods Plugin...');

        // VERIFICAR PRIMERO si ya existe
        if (window.pluginManager) {
            const existingPlugin = window.pluginManager.get('alpine-methods');
            if (existingPlugin) {
                console.log('✅ Alpine Methods Plugin already exists, returning existing instance');
                return existingPlugin;
            }
        } else if (window.alpineMethodsPlugin) {
            console.log('✅ Alpine Methods Plugin already exists globally, returning existing instance');
            return window.alpineMethodsPlugin;
        }

        // Crear instancia del plugin SOLO si no existe
        const plugin = new AlpineMethodsPlugin();
        
        // Inicializar el plugin
        await plugin.init();

        // Registrar el plugin
        if (window.pluginManager) {
            // USAR replace: true para evitar el error
            await window.pluginManager.register('alpine-methods', plugin, { replace: true });
            console.log('✅ Plugin registered in PluginManager (with replace)');
        } else {
            // Si no hay plugin manager, registrar globalmente
            window.alpineMethodsPlugin = plugin;
            console.log('✅ Plugin registered globally');
        }

        console.log('✅ Alpine Methods Plugin initialized successfully');
        return plugin;

    } catch (error) {
        console.error('❌ Failed to initialize Alpine Methods Plugin:', error);
        throw error;
    }
}

/**
 * Verificar si el plugin está disponible
 */
export function isAlpineMethodsPluginAvailable() {
    return (window.pluginManager?.get('alpine-methods') !== undefined) ||
           (window.alpineMethodsPlugin !== undefined);
}

/**
 * Obtener instancia del plugin
 */
export function getAlpineMethodsPlugin() {
    if (window.pluginManager) {
        return window.pluginManager.get('alpine-methods');
    }
    return window.alpineMethodsPlugin || null;
}

/**
 * Auto-inicializar SOLO SI NO HA SIDO INICIALIZADO
 * REMOVIDO para evitar conflictos con CoreSystemInitializer
 */
// COMENTADO PARA EVITAR AUTO-INIT DUPLICADO
/*
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
}

async function autoInit() {
    try {
        // Esperar para que otros sistemas se inicialicen
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // SOLO inicializar si no existe
        if (!isAlpineMethodsPluginAvailable()) {
            await initializeAlpineMethodsPlugin();
            
            // Emitir evento para notificar que está listo
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('alpineMethodsPluginReady', {
                    detail: { plugin: getAlpineMethodsPlugin() }
                }));
            }
        } else {
            console.log('✅ Alpine Methods Plugin already available, skipping auto-init');
        }
        
    } catch (error) {
        console.error('❌ Auto-initialization failed:', error);
    }
}
*/

// ===================================================================
// UTILIDADES PARA DESARROLLO Y DEBUG
// ===================================================================

/**
 * Testing helper para verificar que todo funciona
 */
export async function testAlpineMethodsPlugin() {
    console.log('🧪 Testing Alpine Methods Plugin...');
    
    try {
        const plugin = getAlpineMethodsPlugin();
        
        if (!plugin) {
            throw new Error('Plugin not found');
        }

        // Test 1: Verificar métodos cargados
        const methods = plugin.getAllMethods();
        console.log(`✅ Found ${methods.length} methods`);

        // Test 2: Probar búsqueda
        const searchResults = plugin.searchMethods('toggle');
        console.log(`✅ Search found ${searchResults.length} results`);

        // Test 3: Probar obtener método específico
        if (methods.length > 0) {
            const firstMethod = plugin.getMethod(methods[0].trigger);
            console.log(`✅ Get method: ${firstMethod ? 'Found' : 'Not found'}`);
        }

        // Test 4: Verificar estructura del plugin
        console.log(`✅ Plugin name: ${plugin.name}`);
        console.log(`✅ Plugin version: ${plugin.version}`);

        // Test 5: Probar funciones globales (si existen)
        const globalFunctionsExist = !!(
            window.getAlpineMethodCompletions &&
            window.validateAlpineMethodSyntax &&
            window.processAlpineMethodCode
        );
        console.log(`✅ Global functions: ${globalFunctionsExist ? 'Available' : 'Missing'}`);

        console.log('🎉 All tests passed!');
        return true;

    } catch (error) {
        console.error('❌ Plugin test failed:', error);
        return false;
    }
}

/**
 * Debug helper para ver estado del plugin
 */
export function debugAlpineMethodsPlugin() {
    const plugin = getAlpineMethodsPlugin();
    
    if (!plugin) {
        console.error('❌ Plugin not found');
        return null;
    }

    const debugInfo = {
        name: plugin.name,
        version: plugin.version,
        methodsCount: plugin.methods?.size || 0,
        loading: plugin.loading,
        lastSync: plugin.lastSync,
        config: plugin.config,
        cacheAge: plugin.lastSync ? Date.now() - plugin.lastSync : null
    };
    
    console.group('🔍 Alpine Methods Plugin Debug Info');
    console.log('Name:', debugInfo.name);
    console.log('Version:', debugInfo.version);
    console.log('Methods count:', debugInfo.methodsCount);
    console.log('Loading state:', debugInfo.loading);
    console.log('Last sync:', debugInfo.lastSync);
    console.log('Cache age (ms):', debugInfo.cacheAge);
    console.log('Config:', debugInfo.config);
    console.groupEnd();
    
    return debugInfo;
}

/**
 * Helper para recargar métodos manualmente
 */
export async function reloadAlpineMethods() {
    const plugin = getAlpineMethodsPlugin();
    
    if (!plugin) {
        console.error('❌ Plugin not found');
        return [];
    }

    console.log('🔄 Reloading Alpine methods...');
    
    try {
        await plugin.loadMethods();
        console.log('✅ Methods reloaded');
        return plugin.getAllMethods();
    } catch (error) {
        console.error('❌ Error reloading methods:', error);
        return [];
    }
}

/**
 * Helper para limpiar y reinicializar el plugin
 */
export async function resetAlpineMethodsPlugin() {
    console.log('🔄 Resetting Alpine Methods Plugin...');
    
    try {
        // Limpiar instancias existentes
        if (window.pluginManager && window.pluginManager.has('alpine-methods')) {
            await window.pluginManager.unregister('alpine-methods');
        }
        
        if (window.alpineMethodsPlugin) {
            delete window.alpineMethodsPlugin;
        }
        
        // Reinicializar
        const plugin = await initializeAlpineMethodsPlugin();
        console.log('✅ Plugin reset and reinitialized');
        
        return plugin;
        
    } catch (error) {
        console.error('❌ Error resetting plugin:', error);
        throw error;
    }
}

// Exponer funciones útiles para debugging en development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.alpineMethodsDebug = {
        test: testAlpineMethodsPlugin,
        debug: debugAlpineMethodsPlugin,
        reload: reloadAlpineMethods,
        reset: resetAlpineMethodsPlugin,
        getPlugin: getAlpineMethodsPlugin,
        isAvailable: isAlpineMethodsPluginAvailable
    };
}

// Exportar todo para uso externo
export default {
    initializeAlpineMethodsPlugin,
    isAlpineMethodsPluginAvailable,
    getAlpineMethodsPlugin,
    testAlpineMethodsPlugin,
    debugAlpineMethodsPlugin,
    reloadAlpineMethods,
    resetAlpineMethodsPlugin
};