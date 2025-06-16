// ===================================================================
// resources/js/block-builder/debug/plugin-dependencies-debug.js
// Helper para resolver problemas de dependencias de plugins
// ===================================================================

/**
 * Verificar y resolver problemas de dependencias de plugins
 */
export function debugPluginDependencies() {
    console.group('🔍 Plugin Dependencies Debug');
    
    try {
        const pluginManager = window.pluginManager;
        
        if (!pluginManager) {
            console.error('❌ PluginManager no está disponible');
            console.groupEnd();
            return false;
        }

        // 1. Listar todos los plugins registrados
        const registeredPlugins = pluginManager.list();
        console.log('📋 Plugins registrados:');
        registeredPlugins.forEach(plugin => {
            console.log(`   ✓ ${plugin.name} v${plugin.version}`);
        });

        // 2. Verificar dependencias específicas
        console.log('\n🔗 Verificación de dependencias:');

        // Verificar Variables
        const variablesPlugin = pluginManager.get('variables');
        if (variablesPlugin) {
            console.log('   ✅ Variables plugin: Disponible');
            console.log(`   📊 Versión: ${variablesPlugin.version || 'N/A'}`);
        } else {
            console.log('   ❌ Variables plugin: NO DISPONIBLE');
        }

        console.groupEnd();
        return true;

    } catch (error) {
        console.error('❌ Error en debug de dependencias:', error);
        console.groupEnd();
        return false;
    }
}

/**
 * Resolver dependencias faltantes automáticamente
 */
export async function fixPluginDependencies() {
    console.group('🔧 Fixing Plugin Dependencies');
    
    try {
        const pluginManager = window.pluginManager;
        
        if (!pluginManager) {
            console.error('❌ PluginManager no disponible');
            console.groupEnd();
            return false;
        }

        // 1. Verificar y arreglar Variables plugin
        let variablesPlugin = pluginManager.get('variables');
        if (!variablesPlugin) {
            console.log('🔧 Creando Variables plugin básico...');
            
            const basicVariablesPlugin = {
                name: 'variables',
                version: '1.0.0-basic',
                dependencies: [],
                
                async init() {
                    console.log('✅ Basic Variables Plugin initialized');
                    
                    // Crear funciones básicas
                    this.variables = {};
                    
                    return this;
                },
                
                getAllVariables() {
                    return this.variables || {};
                },
                
                getVariable(key) {
                    return this.variables?.[key] || null;
                },
                
                getVariableKeys() {
                    return Object.keys(this.variables || {});
                },
                
                setVariable(key, value) {
                    if (!this.variables) this.variables = {};
                    this.variables[key] = value;
                },
                
                // Agregar algunas variables de ejemplo
                addSampleVariables() {
                    this.variables = {
                        'site.name': 'Mi Sitio Web',
                        'site.url': 'https://mi-sitio.com',
                        'user.name': 'Usuario Demo',
                        'app.version': '1.0.0',
                        'current.date': new Date().toLocaleDateString(),
                        'current.time': new Date().toLocaleTimeString()
                    };
                }
            };
            
            await pluginManager.register('variables', basicVariablesPlugin, { replace: true });
            
            // Inicializar y agregar variables de ejemplo
            const registeredVariables = pluginManager.get('variables');
            await registeredVariables.init();
            registeredVariables.addSampleVariables();
            
            console.log('✅ Basic Variables plugin creado y registrado');
            variablesPlugin = registeredVariables;
        }

        // 2. Verificar y arreglar Alpine plugin
        let alpinePlugin = pluginManager.get('alpine');
        if (!alpinePlugin) {
            console.log('🔧 Registrando Alpine plugin básico...');
            
            const basicAlpinePlugin = {
                name: 'alpine',
                version: '1.0.0-basic',
                dependencies: [], // Sin dependencias obligatorias
                
                async init() {
                    console.log('✅ Basic Alpine Plugin initialized');
                    return this;
                },
                
                getPreviewTemplate() {
                    return '<script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>';
                }
            };
            
            await pluginManager.register('alpine', basicAlpinePlugin, { replace: true });
            await pluginManager.get('alpine').init();
            console.log('✅ Basic Alpine plugin registrado');
        } else {
            // Si existe, verificar que no tenga dependencias problemáticas
            if (alpinePlugin.dependencies && alpinePlugin.dependencies.includes('variables')) {
                console.log('🔧 Actualizando dependencias de Alpine plugin...');
                alpinePlugin.dependencies = alpinePlugin.dependencies.filter(dep => dep !== 'variables');
                console.log('✅ Dependencias de Alpine actualizadas');
            }
        }

         // 4. Verificar estado final
        console.log('\n📊 Estado final:');
        const finalPlugins = pluginManager.list();
        finalPlugins.forEach(plugin => {
            console.log(`   ✓ ${plugin.name} v${plugin.version}`);
        });

        console.log('✅ Dependencias arregladas exitosamente');
        console.groupEnd();
        return true;

    } catch (error) {
        console.error('❌ Error arreglando dependencias:', error);
        console.groupEnd();
        return false;
    }
}

/**
 * Reinicializar todo el sistema de plugins
 */
export async function resetPluginSystem() {
    console.group('🔄 Resetting Plugin System');
    
    try {
        const pluginManager = window.pluginManager;
        
        if (!pluginManager) {
            console.error('❌ PluginManager no disponible');
            console.groupEnd();
            return false;
        }

        // 1. Obtener lista de plugins actuales
        const currentPlugins = pluginManager.list();
        console.log(`📋 Desregistrando ${currentPlugins.length} plugins...`);

        // 2. Desregistrar todos los plugins
        for (const plugin of currentPlugins) {
            try {
                await pluginManager.unregister(plugin.name);
                console.log(`   ✓ ${plugin.name} desregistrado`);
            } catch (error) {
                console.warn(`   ⚠️ Error desregistrando ${plugin.name}:`, error.message);
            }
        }

        // 3. Reinicializar el sistema
        console.log('🔄 Reinicializando sistema...');
        const { initializeCoreSystem } = await import('../core/CoreSystemInitializer.js');
        await initializeCoreSystem();

        console.log('✅ Sistema de plugins reinicializado');
        console.groupEnd();
        return true;

    } catch (error) {
        console.error('❌ Error reinicializando sistema:', error);
        console.groupEnd();
        return false;
    }
}

/**
 * Quick fix para el error específico de dependencias
 */
export async function quickFixDependencies() {
    console.log('🚀 Quick Fix - Dependencias de Plugins');
    
    try {
        // 1. Verificar problema
        const hasIssue = !window.pluginManager?.get('variables') && window.pluginManager?.get('alpine');
        
        if (!hasIssue) {
            console.log('✅ No se detectaron problemas de dependencias');
            return true;
        }

        // 2. Fix rápido
        console.log('🔧 Aplicando fix rápido...');
        await fixPluginDependencies();
        
        // 3. Verificar resultado
        const variablesFixed = !!window.pluginManager?.get('variables');
        const alpineFixed = !!window.pluginManager?.get('alpine');
        
        if (variablesFixed && alpineFixed) {
            console.log('✅ Fix aplicado exitosamente');
            return true;
        } else {
            console.log('❌ Fix no completamente exitoso');
            return false;
        }

    } catch (error) {
        console.error('❌ Error en quick fix:', error);
        return false;
    }
}

// ===================================================================
// AUTO-EXPORT TO WINDOW FOR DEBUGGING
// ===================================================================

if (typeof window !== 'undefined') {
    window.pluginDependenciesDebug = {
        debug: debugPluginDependencies,
        fix: fixPluginDependencies,
        reset: resetPluginSystem,
        quickFix: quickFixDependencies
    };
    
    // Función de ayuda
    window.fixPlugins = quickFixDependencies;
    
    console.log('🔧 Plugin Dependencies Debug Tools loaded');
    console.log('💡 Use: fixPlugins() para arreglar dependencias rápidamente');
}

export default {
    debugPluginDependencies,
    fixPluginDependencies,
    resetPluginSystem,
    quickFixDependencies
};