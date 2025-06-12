// ===================================================================
// resources/js/block-builder/plugins/variables/index.js - VERSIÓN COMPLETA
// ===================================================================

import { 
    SystemProvider, 
    UserProvider, 
    SiteProvider, 
    TemplatesProvider,
    createCustomProvider 
} from './providers.js';
import { VariableProcessor, VariableAnalyzer } from './processor.js';
import { 
    getVariableCompletions,
    getVariableContentCompletions,
    validateVariablesInCode,
    analyzeVariableUsage,
    recordRecentVariable 
} from './editor.js';

const variablesPlugin = {
    name: 'variables',
    version: '2.0.0',
    dependencies: [],
    previewPriority: 95,
    
    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================
    
    async init(context) {
        console.log('🎯 Initializing Variables Plugin v2.0.0...');
        
        try {
            // Inicializar el procesador con providers
            this.processor = new VariableProcessor();
            this.analyzer = new VariableAnalyzer(this.processor);
            
            // Registrar providers por defecto
            this.processor.addProvider('system', SystemProvider);
            this.processor.addProvider('user', UserProvider);
            this.processor.addProvider('site', SiteProvider);
            this.processor.addProvider('templates', TemplatesProvider);
            
            // Iniciar auto-refresh donde sea necesario
            SystemProvider.startAutoRefresh();
            
            // Configurar el procesador global
            window.processVariables = (content) => this.processVariables(content);
            
            // Configurar funciones de CodeMirror
            this._setupEditorIntegration();
            
            console.log('✅ Variables Plugin initialized successfully');
            return this;
            
        } catch (error) {
            console.error('❌ Error initializing Variables Plugin:', error);
            throw error;
        }
    },



    // ===================================================================
    // API PÚBLICA DEL PLUGIN
    // ===================================================================
    
    /**
     * Procesar variables en contenido HTML
     */
    processVariables(content) {
        return this.processor.processCode(content);
    },

    /**
     * Obtener todas las variables disponibles
     */
    getAvailableVariables() {
        return this.processor.getAllVariables();
    },

    /**
     * Validar una variable específica
     */
    validateVariable(variablePath) {
        return this.processor.validateVariable(variablePath);
    },

    /**
     * Extraer variables de código HTML
     */
    extractVariables(htmlCode) {
        return this.processor.extractVariables(htmlCode);
    },

    /**
     * Encontrar variables inválidas
     */
    findInvalidVariables(htmlCode) {
        return this.processor.findInvalidVariables(htmlCode);
    },

    /**
     * Formatear variable para inserción
     */
    formatVariableForInsertion(variablePath) {
        return `{{ \${variablePath} }}`;
    },

    /**
     * Analizar uso de variables en código
     */
    analyzeCode(htmlCode) {
        return this.analyzer.analyzeCode(htmlCode);
    },

    /**
     * Obtener completions para CodeMirror
     */
    getCompletions(context) {
        try {
            const completions = getVariableCompletions(context, this);
            
            // Registrar variables usadas para estadísticas
            completions.forEach(completion => {
                if (completion.type === 'variable') {
                    const variable = completion.label.replace(/\{\{\s*|\s*\}\}/g, '');
                    recordRecentVariable(variable);
                }
            });
            
            return completions;
        } catch (error) {
            console.error('Error getting variable completions:', error);
            return [];
        }
    },

    /**
     * Validar sintaxis para CodeMirror
     */
    validateSyntax(code) {
        try {
            const errors = validateVariablesInCode(code, this);
            const warnings = [];
            
            // Añadir análisis adicional
            const analysis = this.analyzeCode(code);
            
            if (analysis.invalidVariables > 0) {
                warnings.push({
                    type: 'invalid-variables',
                    message: `\${analysis.invalidVariables} variable(s) inválida(s) encontrada(s)`,
                    severity: 'warning'
                });
            }
            
            return { errors, warnings };
        } catch (error) {
            console.error('Error validating variables:', error);
            return { errors: [], warnings: [] };
        }
    },

    /**
     * Añadir provider personalizado
     */
    addProvider(name, provider) {
        this.processor.addProvider(name, provider);
    },

    /**
     * Remover provider
     */
    removeProvider(name) {
        return this.processor.removeProvider(name);
    },

    /**
     * Obtener estadísticas del plugin
     */
    getStats() {
        return {
            processor: this.processor.getStats(),
            performance: this.analyzer.getPerformanceMetrics(),
            providers: Array.from(this.processor.providers.keys())
        };
    },

    // ===================================================================
    // INTEGRACIÓN CON EDITOR
    // ===================================================================
    
    /**
     * Configurar integración con CodeMirror
     * @private
     */
    _setupEditorIntegration() {
        // Configurar window.editorBridge si existe
        if (window.editorBridge) {
            const originalGetCompletions = window.editorBridge.getCompletions;
            
            window.editorBridge.getCompletions = async (context) => {
                let completions = [];
                
                // Obtener completions originales
                if (originalGetCompletions) {
                    try {
                        completions = await originalGetCompletions.call(window.editorBridge, context);
                    } catch (error) {
                        console.warn('Error getting original completions:', error);
                    }
                }
                
                // Añadir completions de variables
                try {
                    const variableCompletions = this.getCompletions(context);
                    completions.push(...variableCompletions);
                } catch (error) {
                    console.warn('Error getting variable completions:', error);
                }
                
                return completions;
            };
            
            const originalValidateSyntax = window.editorBridge.validateSyntax;
            
            window.editorBridge.validateSyntax = async (code) => {
                let result = { errors: [], warnings: [] };
                
                // Obtener validación original
                if (originalValidateSyntax) {
                    try {
                        result = await originalValidateSyntax.call(window.editorBridge, code);
                    } catch (error) {
                        console.warn('Error in original validation:', error);
                    }
                }
                
                // Añadir validación de variables
                try {
                    const variableValidation = this.validateSyntax(code);
                    result.errors.push(...variableValidation.errors);
                    result.warnings.push(...variableValidation.warnings);
                } catch (error) {
                    console.warn('Error validating variables:', error);
                }
                
                return result;
            };
            
            console.log('✅ Variables plugin integrated with EditorBridge');
        }
        
        // Configurar funciones globales para debugging
        if (process.env.NODE_ENV === 'development') {
            window.debugVariables = {
                showAvailable: () => {
                    console.table(this.getAvailableVariables());
                },
                analyzeCode: (code) => {
                    console.log('Analysis:', this.analyzeCode(code));
                },
                getStats: () => {
                    console.log('Stats:', this.getStats());
                },
                testVariable: (variable) => {
                    console.log(`Variable "${variable}" is ${this.validateVariable(variable) ? 'valid' : 'invalid'}`);
                }
            };
            
            console.log('🔧 Variables debug helpers: window.debugVariables');
        }
    },

    // ===================================================================
    // CLEANUP
    // ===================================================================
    
    /**
     * Limpiar recursos del plugin
     */
    async cleanup() {
        try {
            // Detener auto-refresh de providers
            SystemProvider.stopAutoRefresh();
            
            // Limpiar providers
            for (const [name, provider] of this.processor.providers.entries()) {
                if (provider.cleanup) {
                    await provider.cleanup();
                }
            }
            
            // Limpiar procesador
            this.processor.clearCache();
            
            // Limpiar funciones globales
            delete window.processVariables;
            delete window.debugVariables;
            
            console.log('🧹 Variables plugin cleaned up');
        } catch (error) {
            console.error('Error cleaning up variables plugin:', error);
        }
    }
};

// ===================================================================
// DEBUGGING Y DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    // Exponer plugin para debugging
    window.variablesPlugin = variablesPlugin;
    
    console.log('🔧 Variables plugin exposed to window for debugging');
}

export default variablesPlugin;