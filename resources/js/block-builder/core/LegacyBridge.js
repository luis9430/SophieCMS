// ===================================================================
// core/LegacyBridge.js - ACTUALIZADO PARA FASE 2
// Responsabilidad: Mantener compatibilidad durante migración gradual
// ===================================================================

import pluginManager from './pluginManager.js';

// Importar hooks legacy (durante la migración)
import { useVariables as legacyUseVariables } from '../hooks/useVariables.js';
import { useApi as legacyUseApi } from '../hooks/useApi.js';
import { useAlpinePreview as legacyUseAlpinePreview } from '../hooks/useAlpinePreview.js';

// Importar funciones legacy SOLO como fallback
import { 
    getAvailableVariables as legacyGetAvailableVariables,
    processVariables as legacyProcessVariables,
    validateVariable as legacyValidateVariable 
} from '../utils/variableProcessor.js';

import {
    getAlpineCompletions as legacyGetAlpineCompletions,
    validateAlpineSyntax as legacyValidateAlpineSyntax,
    analyzeAlpineCode as legacyAnalyzeAlpineCode
} from '../utils/alpineEditorHelpers.js';

/**
 * Bridge para mantener compatibilidad durante la migración
 * Decide automáticamente si usar plugin o sistema legacy
 * 🎯 FASE 2: Detecta automáticamente el plugin de Variables
 */
class LegacyBridge {
    constructor() {
        this.migrationStatus = {
            variables: false,
            alpine: false,
            gsap: false,
            api: false
        };
        
        // 🎯 NUEVO: Estado específico de plugins
        this.pluginStatus = {
            variablesPluginDetected: false,
            alpinePluginDetected: false,
            lastCheck: null
        };
        
        // Auto-detectar plugins disponibles
        this._updateMigrationStatus();
        
        // Actualizar cuando se registren nuevos plugins
        pluginManager.on('pluginRegistered', (data) => {
            console.log(`🌉 LegacyBridge detected new plugin: ${data.name}`);
            this._updateMigrationStatus();
            this._onPluginRegistered(data.name);
        });
        
        pluginManager.on('pluginUnregistered', (data) => {
            console.log(`🌉 LegacyBridge detected plugin removal: ${data.name}`);
            this._updateMigrationStatus();
        });
        
        console.log('🌉 LegacyBridge initialized (Phase 2) with status:', this.migrationStatus);
    }

    // ===================================================================
    // HOOKS BRIDGE - Interfaces principales para componentes
    // ===================================================================

    /**
     * Hook Variables - 🎯 PRIORIZA PLUGIN DE VARIABLES EN FASE 2
     */
    useVariables() {
        // 🎯 PRIMERA PRIORIDAD: Plugin de Variables
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.useVariables) {
                console.log('🔌 Using Variables Plugin (Phase 2)');
                
                try {
                    return variablesPlugin.useVariables();
                } catch (error) {
                    console.error('❌ Error using Variables Plugin, falling back to legacy:', error);
                    // Continuar al fallback legacy
                }
            }
        }
        
        // 🔄 FALLBACK: Sistema Legacy
        console.log('🔄 Using Legacy useVariables');
        return legacyUseVariables();
    }

    /**
     * Hook Alpine Preview - Decide entre plugin o legacy
     */
    useAlpinePreview() {
        if (this.migrationStatus.alpine) {
            const alpinePlugin = pluginManager.get('alpine');
            if (alpinePlugin && alpinePlugin.usePreview) {
                console.log('🔌 Using Alpine Plugin');
                
                try {
                    return alpinePlugin.usePreview();
                } catch (error) {
                    console.error('❌ Error using Alpine Plugin, falling back to legacy:', error);
                    // Continuar al fallback legacy
                }
            }
        }
        
        console.log('🔄 Using Legacy useAlpinePreview');
        return legacyUseAlpinePreview();
    }

    /**
     * Hook API - Mantiene legacy por ahora (no necesita migración urgente)
     */
    useApi() {
        // API hook es genérico, no necesita ser plugin por ahora
        console.log('🔄 Using Legacy useApi');
        return legacyUseApi();
    }

    // ===================================================================
    // FUNCIONES BRIDGE - 🎯 NUEVAS FUNCIONES PARA VARIABLES PLUGIN
    // ===================================================================

    /**
     * Procesamiento de Variables - 🎯 PRIORIZA PLUGIN
     */
    getAvailableVariables() {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.getAvailableVariables) {
                try {
                    const pluginVars = variablesPlugin.getAvailableVariables();
                    console.log('🎯 Variables from plugin:', Object.keys(pluginVars).length, 'categories');
                    return pluginVars;
                } catch (error) {
                    console.error('❌ Error getting variables from plugin:', error);
                    // Continuar al fallback
                }
            }
        }
        
        console.log('🔄 Variables from legacy system');
        return legacyGetAvailableVariables();
    }

    processVariables(htmlCode) {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.processVariables) {
                try {
                    const processed = variablesPlugin.processVariables(htmlCode);
                    console.log('🎯 Code processed with Variables Plugin');
                    return processed;
                } catch (error) {
                    console.error('❌ Error processing with plugin:', error);
                    // Continuar al fallback
                }
            }
        }
        
        console.log('🔄 Code processed with legacy system');
        return legacyProcessVariables(htmlCode);
    }

    validateVariable(variablePath) {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.validateVariable) {
                try {
                    return variablesPlugin.validateVariable(variablePath);
                } catch (error) {
                    console.error('❌ Error validating with plugin:', error);
                    // Continuar al fallback
                }
            }
        }
        
        return legacyValidateVariable(variablePath);
    }

    // 🎯 NUEVAS FUNCIONES ESPECÍFICAS DEL PLUGIN DE VARIABLES
    
    /**
     * Extraer variables usando plugin o legacy
     */
    extractVariables(htmlCode) {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.extractVariables) {
                try {
                    return variablesPlugin.extractVariables(htmlCode);
                } catch (error) {
                    console.error('❌ Error extracting variables with plugin:', error);
                }
            }
        }
        
        // Fallback legacy (implementar si no existe)
        const variablePattern = /\{\{\s*([^}]+)\s*\}\}/g;
        const variables = [];
        let match;
        
        while ((match = variablePattern.exec(htmlCode)) !== null) {
            const variableName = match[1].trim();
            if (!variables.includes(variableName)) {
                variables.push(variableName);
            }
        }
        
        return variables;
    }

    /**
     * Encontrar variables inválidas
     */
    findInvalidVariables(htmlCode) {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.findInvalidVariables) {
                try {
                    return variablesPlugin.findInvalidVariables(htmlCode);
                } catch (error) {
                    console.error('❌ Error finding invalid variables with plugin:', error);
                }
            }
        }
        
        // Fallback legacy
        const usedVariables = this.extractVariables(htmlCode);
        const invalidVariables = [];
        
        usedVariables.forEach(variable => {
            if (!this.validateVariable(variable)) {
                invalidVariables.push(variable);
            }
        });
        
        return invalidVariables;
    }

    /**
     * Formatear variable para inserción
     */
    formatVariableForInsertion(variablePath) {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.formatVariableForInsertion) {
                try {
                    return variablesPlugin.formatVariableForInsertion(variablePath);
                } catch (error) {
                    console.error('❌ Error formatting variable with plugin:', error);
                }
            }
        }
        
        // Fallback simple
        return `{{ ${variablePath} }}`;
    }

    /**
     * Obtener valor específico de variable
     */
    getVariableValue(variablePath) {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.getVariableValue) {
                try {
                    return variablesPlugin.getVariableValue(variablePath);
                } catch (error) {
                    console.error('❌ Error getting variable value with plugin:', error);
                }
            }
        }
        
        // Fallback legacy
        const allVars = this.getAvailableVariables();
        for (const category of Object.values(allVars)) {
            if (category.variables && category.variables.hasOwnProperty(variablePath)) {
                return category.variables[variablePath];
            }
        }
        
        return null;
    }

    // ===================================================================
    // FUNCIONES ALPINE (Sin cambios significativos)
    // ===================================================================

    /**
     * Funciones Alpine para CodeMirror
     */
    getAlpineCompletions(context) {
        if (this.migrationStatus.alpine) {
            const alpinePlugin = pluginManager.get('alpine');
            if (alpinePlugin && alpinePlugin.getCompletions) {
                try {
                    return alpinePlugin.getCompletions(context);
                } catch (error) {
                    console.error('❌ Error getting Alpine completions from plugin:', error);
                }
            }
        }
        
        return legacyGetAlpineCompletions(context);
    }

    validateAlpineSyntax(code) {
        if (this.migrationStatus.alpine) {
            const alpinePlugin = pluginManager.get('alpine');
            if (alpinePlugin && alpinePlugin.validateSyntax) {
                try {
                    return alpinePlugin.validateSyntax(code);
                } catch (error) {
                    console.error('❌ Error validating Alpine syntax with plugin:', error);
                }
            }
        }
        
        return legacyValidateAlpineSyntax(code);
    }

    analyzeAlpineCode(code) {
        if (this.migrationStatus.alpine) {
            const alpinePlugin = pluginManager.get('alpine');
            if (alpinePlugin && alpinePlugin.analyzeCode) {
                try {
                    return alpinePlugin.analyzeCode(code);
                } catch (error) {
                    console.error('❌ Error analyzing Alpine code with plugin:', error);
                }
            }
        }
        
        return legacyAnalyzeAlpineCode(code);
    }

    // ===================================================================
    // FUNCIONES COMBINADAS - Para usar múltiples plugins
    // ===================================================================

    /**
     * Procesar código con todos los plugins activos
     */
    async processCodeWithAllPlugins(code) {
        let processedCode = code;
        
        try {
            // 🎯 USAR PLUGIN DE VARIABLES PRIMERO (SI ESTÁ DISPONIBLE)
            if (this.migrationStatus.variables) {
                const variablesPlugin = pluginManager.get('variables');
                if (variablesPlugin && variablesPlugin.processVariables) {
                    processedCode = variablesPlugin.processVariables(processedCode);
                    console.log('🎯 Code processed with Variables Plugin');
                }
            } else {
                // Fallback a procesamiento legacy de variables
                processedCode = this.processVariables(processedCode);
            }
            
            // Ejecutar hook de procesamiento para otros plugins
            const results = await pluginManager.executeHook('processCode', { code: processedCode });
            
            // Aplicar resultados en orden de prioridad
            for (const { result, error, pluginName } of results) {
                if (error) {
                    console.warn(`❌ Plugin processing error in ${pluginName}:`, error);
                    continue;
                }
                if (result && typeof result === 'string') {
                    processedCode = result;
                    console.log(`🔌 Code processed by plugin: ${pluginName}`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error in processCodeWithAllPlugins:', error);
            // Fallback a procesamiento básico
            if (processedCode === code) {
                processedCode = this.processVariables(code);
            }
        }
        
        return processedCode;
    }

    /**
     * Obtener completions de todos los plugins para CodeMirror
     */
    async getAllCompletions(context) {
        const allCompletions = [];
        
        try {
            // 🎯 OBTENER COMPLETIONS DE VARIABLES PLUGIN PRIMERO
            if (this.migrationStatus.variables) {
                const variablesPlugin = pluginManager.get('variables');
                if (variablesPlugin && variablesPlugin.getCompletions) {
                    const varCompletions = variablesPlugin.getCompletions(context);
                    if (Array.isArray(varCompletions)) {
                        allCompletions.push(...varCompletions);
                        console.log(`🎯 Added ${varCompletions.length} variable completions`);
                    }
                }
            }
            
            // Obtener completions de otros plugins
            const results = await pluginManager.executeHook('getCompletions', { context });
            
            for (const { result, error, pluginName } of results) {
                if (error) {
                    console.warn(`❌ Completions error in ${pluginName}:`, error);
                    continue;
                }
                if (Array.isArray(result)) {
                    allCompletions.push(...result);
                    console.log(`🔌 Added ${result.length} completions from ${pluginName}`);
                }
            }
            
            // Si no hay plugins, usar legacy
            if (allCompletions.length === 0) {
                const alpineCompletions = this.getAlpineCompletions(context);
                allCompletions.push(...alpineCompletions);
                console.log('🔄 Using legacy Alpine completions');
            }
            
        } catch (error) {
            console.error('❌ Error getting all completions:', error);
        }
        
        return allCompletions;
    }

    /**
     * Validar código con todos los plugins
     */
    async validateCodeWithAllPlugins(code) {
        const allErrors = [];
        
        try {
            // 🎯 VALIDAR CON PLUGIN DE VARIABLES PRIMERO
            if (this.migrationStatus.variables) {
                const variablesPlugin = pluginManager.get('variables');
                if (variablesPlugin) {
                    const invalidVars = variablesPlugin.findInvalidVariables(code);
                    const varErrors = invalidVars.map(variable => ({
                        type: 'invalid-variable',
                        message: `Variable desconocida: "{{ ${variable} }}"`,
                        severity: 'warning',
                        source: 'variables-plugin',
                        variable
                    }));
                    allErrors.push(...varErrors);
                }
            }
            
            // Validar con otros plugins
            const results = await pluginManager.executeHook('validateCode', { code });
            
            for (const { result, error, pluginName } of results) {
                if (error) {
                    console.warn(`❌ Validation error in ${pluginName}:`, error);
                    continue;
                }
                if (Array.isArray(result)) {
                    allErrors.push(...result.map(err => ({ ...err, source: pluginName })));
                }
            }
            
            // Si no hay plugins activos, usar legacy
            if (results.length === 0 && !this.migrationStatus.variables) {
                const alpineErrors = this.validateAlpineSyntax(code);
                allErrors.push(...alpineErrors.map(err => ({ ...err, source: 'legacy-alpine' })));
            }
            
        } catch (error) {
            console.error('❌ Error validating with all plugins:', error);
        }
        
        return allErrors;
    }

    // ===================================================================
    // GESTIÓN DE MIGRACIÓN - 🎯 ACTUALIZADA PARA FASE 2
    // ===================================================================

    /**
     * Actualizar estado de migración basado en plugins disponibles
     * @private
     */
    _updateMigrationStatus() {
        const oldStatus = { ...this.migrationStatus };
        
        this.migrationStatus = {
            variables: pluginManager.has('variables'),
            alpine: pluginManager.has('alpine'),
            gsap: pluginManager.has('gsap'),
            api: pluginManager.has('api')
        };
        
        // 🎯 ACTUALIZAR ESTADO ESPECÍFICO DE PLUGINS
        this.pluginStatus = {
            variablesPluginDetected: this.migrationStatus.variables,
            alpinePluginDetected: this.migrationStatus.alpine,
            lastCheck: new Date().toISOString()
        };
        
        // Log cambios importantes
        if (oldStatus.variables !== this.migrationStatus.variables) {
            if (this.migrationStatus.variables) {
                console.log('🎯 Variables Plugin DETECTED - Legacy bridge will prioritize plugin functions');
            } else {
                console.log('🔄 Variables Plugin REMOVED - Legacy bridge falling back to legacy functions');
            }
        }
        
        console.log('🌉 Migration status updated:', this.migrationStatus);
    }

    /**
     * Callback cuando se registra un plugin
     * @private
     */
    _onPluginRegistered(pluginName) {
        if (pluginName === 'variables') {
            console.log('🎯 Variables Plugin registered - running compatibility check...');
            this._testVariablesPluginCompatibility();
        }
        
        if (pluginName === 'alpine') {
            console.log('🔌 Alpine Plugin registered - running compatibility check...');
            this._testAlpinePluginCompatibility();
        }
    }

    /**
     * Probar compatibilidad del plugin de variables
     * @private
     */
    _testVariablesPluginCompatibility() {
        try {
            const variablesPlugin = pluginManager.get('variables');
            if (!variablesPlugin) return;

            // Test funciones básicas
            const methods = [
                'getAvailableVariables',
                'processVariables', 
                'validateVariable',
                'extractVariables',
                'findInvalidVariables'
            ];

            const missing = methods.filter(method => typeof variablesPlugin[method] !== 'function');
            
            if (missing.length > 0) {
                console.warn('⚠️ Variables Plugin missing methods:', missing);
            } else {
                console.log('✅ Variables Plugin compatibility check passed');
                
                // Test funcional básico
                const testVars = variablesPlugin.getAvailableVariables();
                const testProcess = variablesPlugin.processVariables('Hello {{ user.name }}');
                
                console.log('🧪 Variables Plugin functional test:', {
                    variableCategories: Object.keys(testVars).length,
                    processedLength: testProcess.length
                });
            }
            
        } catch (error) {
            console.error('❌ Variables Plugin compatibility test failed:', error);
        }
    }

    /**
     * Probar compatibilidad del plugin de Alpine
     * @private
     */
    _testAlpinePluginCompatibility() {
        try {
            const alpinePlugin = pluginManager.get('alpine');
            if (!alpinePlugin) return;

            // Test funciones básicas
            const methods = ['getCompletions', 'validateSyntax', 'analyzeCode'];
            const missing = methods.filter(method => typeof alpinePlugin[method] !== 'function');
            
            if (missing.length > 0) {
                console.warn('⚠️ Alpine Plugin missing methods:', missing);
            } else {
                console.log('✅ Alpine Plugin compatibility check passed');
            }
            
        } catch (error) {
            console.error('❌ Alpine Plugin compatibility test failed:', error);
        }
    }

    /**
     * Obtener información sobre el estado de la migración
     */
    getMigrationInfo() {
        const pluginList = pluginManager.list();
        
        return {
            status: this.migrationStatus,
            pluginStatus: this.pluginStatus, // 🎯 NUEVO
            availablePlugins: pluginList,
            recommendedMigrations: this._getRecommendedMigrations(),
            legacyFunctions: this._getLegacyFunctionUsage(),
            phase: 2, // 🎯 INDICAR FASE ACTUAL
            compatibility: this._getCompatibilityInfo() // 🎯 NUEVO
        };
    }

    /**
     * Obtener información de compatibilidad
     * @private
     */
    _getCompatibilityInfo() {
        const info = {
            variablesPlugin: {
                available: this.migrationStatus.variables,
                functional: false,
                coverage: 0
            },
            alpinePlugin: {
                available: this.migrationStatus.alpine,
                functional: false,
                coverage: 0
            }
        };

        // Test Variables Plugin
        if (this.migrationStatus.variables) {
            try {
                const variablesPlugin = pluginManager.get('variables');
                const requiredMethods = [
                    'getAvailableVariables', 'processVariables', 'validateVariable',
                    'extractVariables', 'findInvalidVariables', 'formatVariableForInsertion'
                ];
                
                const availableMethods = requiredMethods.filter(method => 
                    typeof variablesPlugin[method] === 'function'
                );
                
                info.variablesPlugin.functional = availableMethods.length === requiredMethods.length;
                info.variablesPlugin.coverage = Math.round((availableMethods.length / requiredMethods.length) * 100);
                
            } catch (error) {
                console.error('Error testing variables plugin compatibility:', error);
            }
        }

        // Test Alpine Plugin
        if (this.migrationStatus.alpine) {
            try {
                const alpinePlugin = pluginManager.get('alpine');
                const requiredMethods = ['getCompletions', 'validateSyntax', 'analyzeCode'];
                
                const availableMethods = requiredMethods.filter(method => 
                    typeof alpinePlugin[method] === 'function'
                );
                
                info.alpinePlugin.functional = availableMethods.length === requiredMethods.length;
                info.alpinePlugin.coverage = Math.round((availableMethods.length / requiredMethods.length) * 100);
                
            } catch (error) {
                console.error('Error testing alpine plugin compatibility:', error);
            }
        }

        return info;
    }

    /**
     * Obtener recomendaciones de migración actualizadas
     * @private
     */
    _getRecommendedMigrations() {
        const recommendations = [];
        
        if (!this.migrationStatus.variables) {
            recommendations.push({
                plugin: 'variables',
                priority: 'high',
                reason: 'Variables system is core functionality in Phase 2',
                impact: 'Major: Unified variable processing, better performance, extensible providers',
                status: 'ready'
            });
        } else {
            recommendations.push({
                plugin: 'variables',
                priority: 'completed',
                reason: 'Variables Plugin is active and functional',
                impact: 'System successfully migrated to plugin architecture',
                status: 'complete'
            });
        }
        
        if (!this.migrationStatus.alpine) {
            recommendations.push({
                plugin: 'alpine',
                priority: 'medium',
                reason: 'Large hardcoded HTML in useAlpinePreview',
                impact: 'Better maintainability and template editing',
                status: 'ready',
                depends: this.migrationStatus.variables ? [] : ['variables']
            });
        }
        
        return recommendations;
    }

    /**
     * Rastrear uso de funciones legacy (para debugging)
     * @private
     */
    _getLegacyFunctionUsage() {
        // En una implementación real, esto rastrearía llamadas reales
        return {
            variableProcessorCalls: this.migrationStatus.variables ? 0 : '↑ Active',
            alpineHelperCalls: this.migrationStatus.alpine ? 0 : '↑ Active',
            previewHookCalls: this.migrationStatus.alpine ? 0 : '↑ Active',
            recommendation: this.migrationStatus.variables ? 
                'Variables migrated successfully to plugin system' :
                'Consider migrating to Variables Plugin for better performance'
        };
    }

    // ===================================================================
    // TESTING Y DEBUGGING - 🎯 ACTUALIZADO PARA FASE 2
    // ===================================================================

    /**
     * Test de compatibilidad actualizado
     */
    async testCompatibility() {
        const tests = [];
        
        // Test Variables - 🎯 PRIORIZAR PLUGIN
        try {
            const vars = this.getAvailableVariables();
            const processed = this.processVariables('Hello {{ user.name }}!');
            const isValid = this.validateVariable('user.name');
            
            tests.push({ 
                module: 'variables', 
                status: 'pass', 
                method: this.migrationStatus.variables ? 'plugin' : 'legacy',
                details: { 
                    varsCount: Object.keys(vars).length, 
                    processed, 
                    validationWorking: isValid
                }
            });
        } catch (error) {
            tests.push({ 
                module: 'variables', 
                status: 'fail', 
                error: error.message,
                method: this.migrationStatus.variables ? 'plugin' : 'legacy'
            });
        }
        
        // Test Alpine
        try {
            const completions = this.getAlpineCompletions({ 
                pos: 0, 
                state: { doc: { lineAt: () => ({ text: 'x-' }) } } 
            });
            tests.push({ 
                module: 'alpine', 
                status: 'pass',
                method: this.migrationStatus.alpine ? 'plugin' : 'legacy',
                details: { completionsCount: completions.length }
            });
        } catch (error) {
            tests.push({ 
                module: 'alpine', 
                status: 'fail', 
                error: error.message,
                method: this.migrationStatus.alpine ? 'plugin' : 'legacy'
            });
        }
        
        return {
            overall: tests.every(t => t.status === 'pass') ? 'pass' : 'fail',
            tests,
            migrationStatus: this.migrationStatus,
            pluginStatus: this.pluginStatus, // 🎯 NUEVO
            compatibility: this._getCompatibilityInfo(),
            phase: 2,
            timestamp: new Date().toISOString()
        };
    }

    // ===================================================================
    // NUEVAS FUNCIONES ESPECÍFICAS PARA FASE 2
    // ===================================================================

    /**
     * Forzar recarga del plugin de variables
     */
    async reloadVariablesPlugin() {
        if (!this.migrationStatus.variables) {
            throw new Error('Variables plugin not available');
        }

        try {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.refreshAllProviders) {
                await variablesPlugin.refreshAllProviders();
                console.log('🎯 Variables plugin reloaded successfully');
                return true;
            }
            throw new Error('Variables plugin does not support reloading');
        } catch (error) {
            console.error('❌ Error reloading variables plugin:', error);
            throw error;
        }
    }

    /**
     * Obtener estadísticas del plugin de variables
     */
    getVariablesPluginStats() {
        if (!this.migrationStatus.variables) {
            return { available: false, reason: 'Plugin not loaded' };
        }

        try {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.getStats) {
                return {
                    available: true,
                    stats: variablesPlugin.getStats(),
                    providers: variablesPlugin.listProviders?.() || []
                };
            }
            return { available: false, reason: 'Plugin does not expose stats' };
        } catch (error) {
            return { available: false, reason: error.message };
        }
    }

    // ===================================================================
    // MANTENER FUNCIONES LEGACY EXISTENTES PARA COMPATIBILIDAD
    // ===================================================================

    /**
     * Forzar uso de legacy para testing (sin cambios)
     */
    forceLegacy(modules = []) {
        const backup = { ...this.migrationStatus };
        
        if (modules.length === 0) {
            Object.keys(this.migrationStatus).forEach(key => {
                this.migrationStatus[key] = false;
            });
        } else {
            modules.forEach(module => {
                this.migrationStatus[module] = false;
            });
        }
        
        console.log('🔄 Forced legacy mode for:', modules.length ? modules : 'all modules');
        return backup;
    }

    /**
     * Restaurar estado de migración (sin cambios)
     */
    restoreMigrationStatus(backup) {
        this.migrationStatus = backup;
        console.log('🔄 Migration status restored');
    }
}

// ===================================================================
// INSTANCIA SINGLETON
// ===================================================================

const legacyBridge = new LegacyBridge();

export default legacyBridge;
export { LegacyBridge };

// ===================================================================
// WRAPPERS LEGACY PARA IMPORTACIÓN DIRECTA (COMPATIBILIDAD TOTAL)
// ===================================================================

// Exportar funciones que se usan directamente en otros archivos
export const useVariables = () => legacyBridge.useVariables();
export const useAlpinePreview = () => legacyBridge.useAlpinePreview();
export const useApi = () => legacyBridge.useApi();

export const getAvailableVariables = () => legacyBridge.getAvailableVariables();
export const processVariables = (code) => legacyBridge.processVariables(code);
export const validateVariable = (path) => legacyBridge.validateVariable(path);

// 🎯 NUEVAS EXPORTACIONES PARA FASE 2
export const extractVariables = (code) => legacyBridge.extractVariables(code);
export const findInvalidVariables = (code) => legacyBridge.findInvalidVariables(code);
export const formatVariableForInsertion = (path) => legacyBridge.formatVariableForInsertion(path);
export const getVariableValue = (path) => legacyBridge.getVariableValue(path);

export const getAlpineCompletions = (context) => legacyBridge.getAlpineCompletions(context);
export const validateAlpineSyntax = (code) => legacyBridge.validateAlpineSyntax(code);
export const analyzeAlpineCode = (code) => legacyBridge.analyzeAlpineCode(code);

// ===================================================================
// DEBUGGING EN DESARROLLO - 🎯 ACTUALIZADO PARA FASE 2
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer para debugging
    window.legacyBridge = legacyBridge;
    
    // 🎯 NUEVAS FUNCIONES DE DEBUG PARA FASE 2
    window.testVariablesPlugin = () => legacyBridge.getVariablesPluginStats();
    window.reloadVariables = () => legacyBridge.reloadVariablesPlugin();
    window.checkMigrationStatus = () => legacyBridge.getMigrationInfo();
    
    // Auto-test al cargar
    legacyBridge.testCompatibility().then(results => {
        console.log('🧪 LegacyBridge compatibility test (Phase 2):', results);
        
        if (results.pluginStatus?.variablesPluginDetected) {
            console.log('🎯 Variables Plugin detected and functional!');
        } else {
            console.log('🔄 Variables Plugin not detected, using legacy system');
        }
    });
    
    console.log('🔧 LegacyBridge (Phase 2) exposed to window for debugging');
}