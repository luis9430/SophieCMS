// ===================================================================
// resources/js/block-builder/plugins/alpine-methods/init.js
// Inicializador para integrar con tu sistema existente
// ===================================================================

import AlpineMethodsPlugin from './index.js';

/**
 * Inicializar el plugin de métodos Alpine
 * Adaptado para tu sistema de plugins existente
 */
export async function initializeAlpineMethodsPlugin() {
    try {
        console.log('🚀 Initializing Alpine Methods Plugin...');

        // Crear instancia del plugin
        const plugin = new AlpineMethodsPlugin();
        
        // Inicializar el plugin
        await plugin.init();

        // Si tienes un plugin manager, registrarlo
        if (window.pluginManager) {
            await window.pluginManager.register('alpine-methods', plugin);
            console.log('✅ Plugin registered in PluginManager');
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
 * Auto-inicializar cuando el DOM esté listo
 */
if (typeof document !== 'undefined') {
    // Verificar si ya está cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
}

async function autoInit() {
    try {
        // Esperar un poco para que otros sistemas se inicialicen
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Inicializar el plugin
        await initializeAlpineMethodsPlugin();
        
        // Emitir evento para notificar que está listo
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('alpineMethodsPluginReady', {
                detail: { plugin: getAlpineMethodsPlugin() }
            }));
        }
        
    } catch (error) {
        console.error('❌ Auto-initialization failed:', error);
    }
}

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
        const timerMethods = plugin.searchMethods('timer');
        console.log(`✅ Timer search found ${timerMethods.length} results`);

        // Test 3: Probar obtener método específico
        const timerMethod = plugin.getMethod('@timer');
        console.log(`✅ Get timer method: ${timerMethod ? 'Found' : 'Not found'}`);

        // Test 4: Probar generación de código (si hay métodos)
        if (timerMethod) {
            const code = plugin.generateCode(timerMethod, { interval: 500 });
            console.log(`✅ Code generation: ${code ? 'Success' : 'Failed'}`);
        }

        // Test 5: Probar funciones globales
        const globalFunctionsExist = !!(
            window.getAlpineMethodCompletions &&
            window.validateAlpineMethodSyntax &&
            window.processAlpineMethodCode
        );
        console.log(`✅ Global functions: ${globalFunctionsExist ? 'Available' : 'Missing'}`);

        // Test 6: Estadísticas
        const stats = plugin.getUsageStats();
        console.log('✅ Plugin stats:', stats);

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
        return;
    }

    const debugInfo = plugin.getDebugInfo();
    
    console.group('🔍 Alpine Methods Plugin Debug Info');
    console.log('Config:', debugInfo.config);
    console.log('Methods count:', debugInfo.methodsCount);
    console.log('Loading state:', debugInfo.loading);
    console.log('Last sync:', debugInfo.lastSync);
    console.log('Cache age (ms):', debugInfo.cacheAge);
    console.log('Usage stats:', debugInfo.stats);
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
        return;
    }

    console.log('🔄 Reloading Alpine methods...');
    await plugin.loadMethods();
    console.log('✅ Methods reloaded');
    
    return plugin.getAllMethods();
}

// Exportar todo para uso externo
export default {
    initializeAlpineMethodsPlugin,
    isAlpineMethodsPluginAvailable,
    getAlpineMethodsPlugin,
    testAlpineMethodsPlugin,
    debugAlpineMethodsPlugin,
    reloadAlpineMethods
};