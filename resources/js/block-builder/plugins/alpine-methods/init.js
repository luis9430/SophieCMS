// ===================================================================
// plugins/alpine-methods/init.js
// Responsabilidad: Inicialización del plugin de métodos Alpine
// ===================================================================

import AlpineMethodsPlugin from './index.js';

/**
 * Inicializar plugin de métodos Alpine
 * Función helper para registrar el plugin en el sistema
 */
export async function initializeAlpineMethodsPlugin() {
    try {
        console.log('🚀 Initializing Alpine Methods Plugin...');

        // Verificar que el plugin manager esté disponible
        if (!window.pluginManager) {
            throw new Error('Plugin Manager not available. Make sure it\'s loaded first.');
        }

        // Registrar el plugin
        await window.pluginManager.register('alpine-methods', AlpineMethodsPlugin);

        console.log('✅ Alpine Methods Plugin initialized successfully');
        return window.pluginManager.get('alpine-methods');

    } catch (error) {
        console.error('❌ Failed to initialize Alpine Methods Plugin:', error);
        throw error;
    }
}

/**
 * Verificar si el plugin está disponible
 */
export function isAlpineMethodsPluginAvailable() {
    return window.pluginManager?.get('alpine-methods') !== undefined;
}

/**
 * Obtener instancia del plugin (helper)
 */
export function getAlpineMethodsPlugin() {
    if (!isAlpineMethodsPluginAvailable()) {
        console.warn('⚠️ Alpine Methods Plugin not available');
        return null;
    }
    
    return window.pluginManager.get('alpine-methods');
}

/**
 * Auto-inicializar cuando se carga el DOM
 */
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Esperar a que el plugin manager esté listo
        if (window.pluginManager) {
            await initializeAlpineMethodsPlugin();
        } else {
            // Escuchar el evento de plugin manager listo
            window.addEventListener('pluginManagerReady', async () => {
                await initializeAlpineMethodsPlugin();
            });
        }
    });
}

export default { 
    initializeAlpineMethodsPlugin, 
    isAlpineMethodsPluginAvailable, 
    getAlpineMethodsPlugin 
};