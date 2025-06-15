// ===================================================================
// resources/js/block-builder/debug/plugin-connection-verifier.js
// Verificador para asegurar que los plugins se conecten correctamente
// ===================================================================

/**
 * Verificar que todos los plugins estén correctamente conectados
 */
export function verifyPluginConnections() {
    console.group('🔍 Verificando Conexiones de Plugins');
    
    const results = {
        success: true,
        pluginManager: false,
        variables: false,
        alpine: false,
        alpineMethods: false,
        dependencies: {},
        issues: [],
        recommendations: []
    };

    try {
        // 1. Verificar PluginManager
        if (!window.pluginManager) {
            results.issues.push('PluginManager no está disponible');
            results.success = false;
        } else {
            results.pluginManager = true;
            console.log('✅ PluginManager disponible');
        }

        // 2. Verificar Variables Plugin (CRÍTICO)
        const variablesPlugin = window.pluginManager?.get('variables');
        if (!variablesPlugin) {
            results.issues.push('Variables plugin no está registrado');
            results.success = false;
        } else {
            results.variables = true;
            console.log('✅ Variables plugin conectado');
            
            // Verificar funcionalidad básica
            try {
                const testVariables = variablesPlugin.getAllVariables?.();
                const testKeys = variablesPlugin.getVariableKeys?.();
                
                if (testVariables && testKeys) {
                    console.log(`   📊 Variables disponibles: ${testKeys.length}`);
                } else {
                    results.issues.push('Variables plugin no tiene métodos esperados');
                }
            } catch (error) {
                results.issues.push(`Error probando Variables plugin: ${error.message}`);
            }
        }

        // 3. Verificar Alpine Plugin
        const alpinePlugin = window.pluginManager?.get('alpine');
        if (!alpinePlugin) {
            results.issues.push('Alpine plugin no está registrado');
        } else {
            results.alpine = true;
            console.log('✅ Alpine plugin conectado');
            
            // Verificar dependencias de Alpine
            const alpineDeps = alpinePlugin.dependencies || [];
            results.dependencies.alpine = alpineDeps;
            
            if (alpineDeps.includes('variables')) {
                if (results.variables) {
                    console.log('   🔗 Dependencia de Variables satisfecha');
                } else {
                    results.issues.push('Alpine depende de Variables pero no está disponible');
                    results.success = false;
                }
            }
        }

        // 4. Verificar Alpine Methods Plugin
        const alpineMethodsPlugin = window.pluginManager?.get('alpine-methods') || window.alpineMethodsPlugin;
        if (!alpineMethodsPlugin) {
            results.issues.push('Alpine Methods plugin no está disponible');
        } else {
            results.alpineMethods = true;
            console.log('✅ Alpine Methods plugin conectado');
            
            // Verificar funcionalidad
            try {
                const methods = alpineMethodsPlugin.getAllMethods?.();
                if (methods) {
                    console.log(`   📊 Alpine Methods disponibles: ${methods.length}`);
                }
            } catch (error) {
                results.issues.push(`Error probando Alpine Methods: ${error.message}`);
            }
        }

        // 5. Verificar orden de inicialización
        if (results.variables && results.alpine) {
            console.log('✅ Orden de plugins correcto (Variables → Alpine)');
        }

        // 6. Recomendaciones
        if (!results.variables) {
            results.recommendations.push('Verificar que el archivo plugins/variables/index.js existe y es válido');
        }
        
        if (results.variables && !results.alpine) {
            results.recommendations.push('Verificar dependencias de Alpine plugin');
        }

        // 7. Resultado final
        if (results.success) {
            console.log('🎉 Todas las conexiones verificadas exitosamente');
        } else {
            console.log('❌ Se encontraron problemas en las conexiones');
            results.issues.forEach(issue => console.log(`   ❌ ${issue}`));
        }

        console.groupEnd();
        return results;

    } catch (error) {
        console.error('❌ Error durante verificación:', error);
        results.success = false;
        results.issues.push(`Error crítico: ${error.message}`);
        console.groupEnd();
        return results;
    }
}

/**
 * Verificar específicamente el plugin Variables
 */
export function verifyVariablesPlugin() {
    console.group('🎯 Verificando Plugin Variables');
    
    try {
        // 1. Verificar existencia
        const plugin = window.pluginManager?.get('variables');
        if (!plugin) {
            console.error('❌ Variables plugin no encontrado');
            console.groupEnd();
            return false;
        }

        console.log('✅ Variables plugin encontrado');
        console.log(`   📦 Versión: ${plugin.version || 'N/A'}`);

        // 2. Verificar métodos esenciales
        const essentialMethods = [
            'getAllVariables',
            'getVariable',
            'getVariableKeys'
        ];

        const missingMethods = essentialMethods.filter(method => 
            typeof plugin[method] !== 'function'
        );

        if (missingMethods.length > 0) {
            console.error('❌ Métodos faltantes:', missingMethods);
            console.groupEnd();
            return false;
        }

        console.log('✅ Todos los métodos esenciales disponibles');

        // 3. Probar funcionalidad
        try {
            const allVars = plugin.getAllVariables();
            const keys = plugin.getVariableKeys();
            
            console.log(`✅ Funcionalidad verificada:`);
            console.log(`   📊 Variables totales: ${keys.length}`);
            console.log(`   📋 Proveedores: ${Object.keys(allVars).length}`);

            // Probar obtener variable específica
            if (keys.length > 0) {
                const testKey = keys[0];
                const testValue = plugin.getVariable(testKey);
                console.log(`   🧪 Test variable "${testKey}": ${testValue !== null ? '✅' : '❌'}`);
            }

        } catch (error) {
            console.error('❌ Error probando funcionalidad:', error);
            console.groupEnd();
            return false;
        }

        console.log('🎉 Variables plugin completamente funcional');
        console.groupEnd();
        return true;

    } catch (error) {
        console.error('❌ Error verificando Variables plugin:', error);
        console.groupEnd();
        return false;
    }
}

/**
 * Auto-fix para conexiones de plugins
 */
export async function fixPluginConnections() {
    console.group('🔧 Reparando Conexiones de Plugins');
    
    try {
        const verification = verifyPluginConnections();
        
        if (verification.success) {
            console.log('✅ No se necesitan reparaciones');
            console.groupEnd();
            return true;
        }

        console.log('🔧 Aplicando reparaciones...');

        // 1. Si falta Variables, intentar reconectarlo
        if (!verification.variables) {
            console.log('🔄 Intentando reconectar Variables plugin...');
            try {
                const variablesModule = await import('../plugins/variables/index.js');
                await window.pluginManager.register('variables', variablesModule.default, { replace: true });
                console.log('✅ Variables plugin reconectado');
            } catch (error) {
                console.error('❌ No se pudo reconectar Variables plugin:', error);
                console.groupEnd();
                return false;
            }
        }

        // 2. Si falta Alpine, intentar reconectarlo
        if (!verification.alpine && verification.variables) {
            console.log('🔄 Intentando reconectar Alpine plugin...');
            try {
                const alpineModule = await import('../plugins/alpine/index.js');
                await window.pluginManager.register('alpine', alpineModule.default, { replace: true });
                console.log('✅ Alpine plugin reconectado');
            } catch (error) {
                console.error('❌ No se pudo reconectar Alpine plugin:', error);
            }
        }

        // 3. Verificar resultado
        const finalVerification = verifyPluginConnections();
        
        if (finalVerification.success) {
            console.log('🎉 Reparaciones exitosas');
            console.groupEnd();
            return true;
        } else {
            console.log('❌ Algunas reparaciones fallaron');
            console.groupEnd();
            return false;
        }

    } catch (error) {
        console.error('❌ Error durante reparación:', error);
        console.groupEnd();
        return false;
    }
}

// ===================================================================
// FUNCIONES DE CONVENIENCIA
// ===================================================================

/**
 * Verificación rápida - solo muestra estado básico
 */
export function quickConnectionCheck() {
    const pm = !!window.pluginManager;
    const vars = !!window.pluginManager?.get('variables');
    const alpine = !!window.pluginManager?.get('alpine');
    const alpineMethods = !!(window.pluginManager?.get('alpine-methods') || window.alpineMethodsPlugin);

    console.log('🚀 Quick Connection Check:');
    console.log(`   PluginManager: ${pm ? '✅' : '❌'}`);
    console.log(`   Variables: ${vars ? '✅' : '❌'}`);
    console.log(`   Alpine: ${alpine ? '✅' : '❌'}`);
    console.log(`   Alpine Methods: ${alpineMethods ? '✅' : '❌'}`);

    const allGood = pm && vars && alpine;
    console.log(`   Estado: ${allGood ? '✅ TODO OK' : '❌ HAY PROBLEMAS'}`);

    return { pm, vars, alpine, alpineMethods, allGood };
}

// ===================================================================
// AUTO-EXPORT PARA DEBUGGING
// ===================================================================

if (typeof window !== 'undefined') {
    window.verifyPlugins = quickConnectionCheck;
    window.pluginConnectionTools = {
        verify: verifyPluginConnections,
        verifyVariables: verifyVariablesPlugin,
        fix: fixPluginConnections,
        quick: quickConnectionCheck
    };

    console.log('🔧 Plugin Connection Tools loaded');
    console.log('💡 Use: verifyPlugins() para verificación rápida');
}

export default {
    verifyPluginConnections,
    verifyVariablesPlugin,
    fixPluginConnections,
    quickConnectionCheck
};