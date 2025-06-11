// ===================================================================
// core/LegacyBridge.js
// Responsabilidad: Mantener compatibilidad durante migración gradual
// ===================================================================

import pluginManager from './pluginManager.js';

// Importar hooks legacy (durante la migración)
import { useVariables as legacyUseVariables } from '../hooks/useVariables.js';
import { useApi as legacyUseApi } from '../hooks/useApi.js';
import { useAlpinePreview as legacyUseAlpinePreview } from '../hooks/useAlpinePreview.js';

// Importar funciones legacy
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
 */
class LegacyBridge {
    constructor() {
        this.migrationStatus = {
            variables: false,
            alpine: false,
            gsap: false,
            api: false
        };
        
        // Auto-detectar plugins disponibles
        this._updateMigrationStatus();
        
        // Actualizar cuando se registren nuevos plugins
        pluginManager.on('pluginRegistered', () => {
            this._updateMigrationStatus();
        });
        
        console.log('🌉 LegacyBridge initialized with status:', this.migrationStatus);
    }

    // ===================================================================
    // HOOKS BRIDGE - Interfaces principales para componentes
    // ===================================================================

    /**
     * Hook Variables - Decide entre plugin o legacy
     */
    useVariables() {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.useVariables) {
                console.log('🔌 Using Variables Plugin');
                return variablesPlugin.useVariables();
            }
        }
        
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
                return alpinePlugin.usePreview();
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
    // FUNCIONES BRIDGE - Wrappers para funciones independientes
    // ===================================================================

    /**
     * Procesamiento de Variables
     */
    getAvailableVariables() {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.getAvailableVariables) {
                return variablesPlugin.getAvailableVariables();
            }
        }
        
        return legacyGetAvailableVariables();
    }

    processVariables(htmlCode) {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.processVariables) {
                return variablesPlugin.processVariables(htmlCode);
            }
        }
        
        return legacyProcessVariables(htmlCode);
    }

    validateVariable(variablePath) {
        if (this.migrationStatus.variables) {
            const variablesPlugin = pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.validateVariable) {
                return variablesPlugin.validateVariable(variablePath);
            }
        }
        
        return legacyValidateVariable(variablePath);
    }

    /**
     * Funciones Alpine para CodeMirror
     */
    getAlpineCompletions(context) {
        if (this.migrationStatus.alpine) {
            const alpinePlugin = pluginManager.get('alpine');
            if (alpinePlugin && alpinePlugin.getCompletions) {
                return alpinePlugin.getCompletions(context);
            }
        }
        
        return legacyGetAlpineCompletions(context);
    }

    validateAlpineSyntax(code) {
        if (this.migrationStatus.alpine) {
            const alpinePlugin = pluginManager.get('alpine');
            if (alpinePlugin && alpinePlugin.validateSyntax) {
                return alpinePlugin.validateSyntax(code);
            }
        }
        
        return legacyValidateAlpineSyntax(code);
    }

    analyzeAlpineCode(code) {
        if (this.migrationStatus.alpine) {
            const alpinePlugin = pluginManager.get('alpine');
            if (alpinePlugin && alpinePlugin.analyzeCode) {
                return alpinePlugin.analyzeCode(code);
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
        
        // Ejecutar hook de procesamiento para todos los plugins
        const results = await pluginManager.executeHook('processCode', { code: processedCode });
        
        // Aplicar resultados en orden de prioridad
        for (const { result, error } of results) {
            if (error) {
                console.warn('❌ Plugin processing error:', error);
                continue;
            }
            if (result && typeof result === 'string') {
                processedCode = result;
            }
        }
        
        // Si no hay plugins, usar legacy
        if (results.length === 0) {
            processedCode = this.processVariables(processedCode);
        }
        
        return processedCode;
    }

    /**
     * Obtener completions de todos los plugins para CodeMirror
     */
    async getAllCompletions(context) {
        const allCompletions = [];
        
        // Obtener completions de todos los plugins
        const results = await pluginManager.executeHook('getCompletions', { context });
        
        for (const { result, error, pluginName } of results) {
            if (error) {
                console.warn(`❌ Completions error in ${pluginName}:`, error);
                continue;
            }
            if (Array.isArray(result)) {
                allCompletions.push(...result);
            }
        }
        
        // Si no hay plugins, usar legacy
        if (allCompletions.length === 0) {
            const alpineCompletions = this.getAlpineCompletions(context);
            allCompletions.push(...alpineCompletions);
        }
        
        return allCompletions;
    }

    /**
     * Validar código con todos los plugins
     */
    async validateCodeWithAllPlugins(code) {
        const allErrors = [];
        
        // Validar con todos los plugins
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
        
        // Si no hay plugins, usar legacy
        if (results.length === 0) {
            const alpineErrors = this.validateAlpineSyntax(code);
            allErrors.push(...alpineErrors.map(err => ({ ...err, source: 'legacy-alpine' })));
        }
        
        return allErrors;
    }

    // ===================================================================
    // GESTIÓN DE MIGRACIÓN
    // ===================================================================

    /**
     * Actualizar estado de migración basado en plugins disponibles
     * @private
     */
    _updateMigrationStatus() {
        this.migrationStatus = {
            variables: pluginManager.has('variables'),
            alpine: pluginManager.has('alpine'),
            gsap: pluginManager.has('gsap'),
            api: pluginManager.has('api')
        };
        
        console.log('🌉 Migration status updated:', this.migrationStatus);
    }

    /**
     * Obtener información sobre el estado de la migración
     */
    getMigrationInfo() {
        const pluginList = pluginManager.list();
        
        return {
            status: this.migrationStatus,
            availablePlugins: pluginList,
            recommendedMigrations: this._getRecommendedMigrations(),
            legacyFunctions: this._getLegacyFunctionUsage()
        };
    }

    /**
     * Obtener recomendaciones de migración
     * @private
     */
    _getRecommendedMigrations() {
        const recommendations = [];
        
        if (!this.migrationStatus.variables) {
            recommendations.push({
                plugin: 'variables',
                priority: 'high',
                reason: 'Variables system is core functionality',
                impact: 'Major performance improvement'
            });
        }
        
        if (!this.migrationStatus.alpine) {
            recommendations.push({
                plugin: 'alpine',
                priority: 'medium',
                reason: 'Large hardcoded HTML in useAlpinePreview',
                impact: 'Better maintainability and template editing'
            });
        }
        
        return recommendations;
    }

    /**
     * Rastrear uso de funciones legacy (para debugging)
     * @private
     */
    _getLegacyFunctionUsage() {
        // En una implementación real, esto podría rastrear llamadas
        return {
            variableProcessorCalls: 0,
            alpineHelperCalls: 0,
            previewHookCalls: 0
        };
    }

    // ===================================================================
    // TESTING Y DEBUGGING
    // ===================================================================

    /**
     * Forzar uso de legacy para testing
     */
    forceLegacy(modules = []) {
        const backup = { ...this.migrationStatus };
        
        if (modules.length === 0) {
            // Forzar todo a legacy
            Object.keys(this.migrationStatus).forEach(key => {
                this.migrationStatus[key] = false;
            });
        } else {
            // Forzar módulos específicos
            modules.forEach(module => {
                this.migrationStatus[module] = false;
            });
        }
        
        console.log('🔄 Forced legacy mode for:', modules.length ? modules : 'all modules');
        return backup;
    }

    /**
     * Restaurar estado de migración
     */
    restoreMigrationStatus(backup) {
        this.migrationStatus = backup;
        console.log('🔄 Migration status restored');
    }

    /**
     * Test de compatibilidad
     */
    async testCompatibility() {
        const tests = [];
        
        // Test Variables
        try {
            const vars = this.getAvailableVariables();
            const processed = this.processVariables('{{ user.name }}');
            tests.push({ 
                module: 'variables', 
                status: 'pass', 
                details: { varsCount: Object.keys(vars).length, processed }
            });
        } catch (error) {
            tests.push({ module: 'variables', status: 'fail', error: error.message });
        }
        
        // Test Alpine
        try {
            const completions = this.getAlpineCompletions({ pos: 0, state: { doc: { lineAt: () => ({ text: 'x-' }) } } });
            tests.push({ 
                module: 'alpine', 
                status: 'pass', 
                details: { completionsCount: completions.length }
            });
        } catch (error) {
            tests.push({ module: 'alpine', status: 'fail', error: error.message });
        }
        
        return {
            overall: tests.every(t => t.status === 'pass') ? 'pass' : 'fail',
            tests,
            migrationStatus: this.migrationStatus,
            timestamp: new Date().toISOString()
        };
    }
}

// ===================================================================
// INSTANCIA SINGLETON
// ===================================================================

const legacyBridge = new LegacyBridge();

export default legacyBridge;
export { LegacyBridge };

// ===================================================================
// WRAPPERS LEGACY PARA IMPORTACIÓN DIRECTA (COMPATIBILIDAD)
// ===================================================================

// Exportar funciones que se usan directamente en otros archivos
export const useVariables = () => legacyBridge.useVariables();
export const useAlpinePreview = () => legacyBridge.useAlpinePreview();
export const useApi = () => legacyBridge.useApi();

export const getAvailableVariables = () => legacyBridge.getAvailableVariables();
export const processVariables = (code) => legacyBridge.processVariables(code);
export const validateVariable = (path) => legacyBridge.validateVariable(path);

export const getAlpineCompletions = (context) => legacyBridge.getAlpineCompletions(context);
export const validateAlpineSyntax = (code) => legacyBridge.validateAlpineSyntax(code);
export const analyzeAlpineCode = (code) => legacyBridge.analyzeAlpineCode(code);

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer para debugging
    window.legacyBridge = legacyBridge;
    
    // Auto-test al cargar
    legacyBridge.testCompatibility().then(results => {
        console.log('🧪 LegacyBridge compatibility test:', results);
    });
    
    console.log('🔧 LegacyBridge exposed to window for debugging');
}