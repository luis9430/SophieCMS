// ===================================================================
// plugins/alpine-methods/index.js
// Responsabilidad: Plugin principal para métodos Alpine
// ===================================================================

import { createPlugin } from '../../core/PluginManager.js';
import { MethodProvider } from './providers.js';
import { getMethodCompletions, validateMethodSyntax, processMethodCode } from './editor.js';
import { MethodProcessor } from './processor.js';

/**
 * Plugin de Métodos Alpine
 * Permite usar sintaxis simplificada como @timer({}) en lugar de Alpine.data()
 */
const AlpineMethodsPlugin = createPlugin({
    name: 'alpine-methods',
    version: '1.0.0',
    dependencies: [],
    metadata: {
        title: 'Métodos Alpine',
        description: 'Sintaxis simplificada para componentes Alpine.js',
        category: 'editor',
        priority: 85
    },

    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================

    async init() {
        console.log('🔧 Initializing Alpine Methods Plugin...');

        // Configuración del plugin
        this.config = {
            apiUrl: '/api/templates/alpine-methods',
            cacheTimeout: 5 * 60 * 1000, // 5 minutos
            enableValidation: true,
            enablePreview: true,
            triggerPrefix: '@',
            maxSuggestions: 15
        };

        // Estado del plugin
        this.methods = new Map(); // Cache de métodos cargados
        this.loading = false;
        this.lastSync = null;

        // Inicializar componentes
        this.provider = new MethodProvider(this.config);
        this.processor = new MethodProcessor(this.config);

        // Cargar métodos desde BD
        await this.loadMethods();

        // Configurar editor
        this.setupEditorIntegration();

        console.log(`✅ Alpine Methods Plugin initialized with ${this.methods.size} methods`);
        return this;
    },

    // ===================================================================
    // GESTIÓN DE MÉTODOS
    // ===================================================================

    /**
     * Cargar métodos desde la base de datos
     */
    async loadMethods() {
        if (this.loading) return;

        try {
            this.loading = true;
            console.log('📥 Loading Alpine methods from database...');

            const response = await fetch(this.config.apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const methods = data.data || [];

            // Limpiar cache actual
            this.methods.clear();

            // Cargar métodos en el cache
            methods.forEach(method => {
                if (method.is_active && method.trigger_syntax) {
                    this.methods.set(method.trigger_syntax, {
                        id: method.id,
                        name: method.name,
                        trigger: method.trigger_syntax,
                        description: method.description,
                        category: method.category,
                        template: method.method_template,
                        parameters: method.method_parameters || {},
                        config: method.method_config || {},
                        usage_count: method.usage_count || 0,
                        content: method.content // Para preview
                    });
                }
            });

            this.lastSync = Date.now();
            console.log(`✅ Loaded ${this.methods.size} Alpine methods`);

        } catch (error) {
            console.error('❌ Error loading Alpine methods:', error);
            // Continuar con métodos en cache si los hay
        } finally {
            this.loading = false;
        }
    },

    /**
     * Obtener método por trigger
     */
    getMethod(trigger) {
        // Asegurar que el trigger tenga el prefijo @
        if (!trigger.startsWith(this.config.triggerPrefix)) {
            trigger = this.config.triggerPrefix + trigger;
        }
        
        return this.methods.get(trigger);
    },

    /**
     * Obtener todos los métodos disponibles
     */
    getAllMethods() {
        return Array.from(this.methods.values());
    },

    /**
     * Obtener métodos por categoría
     */
    getMethodsByCategory(category) {
        return this.getAllMethods().filter(method => method.category === category);
    },

    /**
     * Buscar métodos por término
     */
    searchMethods(searchTerm) {
        if (!searchTerm) return this.getAllMethods();
        
        const term = searchTerm.toLowerCase();
        return this.getAllMethods().filter(method => 
            method.name.toLowerCase().includes(term) ||
            method.description.toLowerCase().includes(term) ||
            method.trigger.toLowerCase().includes(term)
        );
    },

    // ===================================================================
    // PROCESAMIENTO DE CÓDIGO
    // ===================================================================

    /**
     * Procesar código que contiene métodos Alpine
     */
    processCode(code) {
        return this.processor.processCode(code, this.methods);
    },

    /**
     * Generar código Alpine desde sintaxis de método
     */
    generateAlpineCode(trigger, parameters = {}) {
        const method = this.getMethod(trigger);
        if (!method) {
            throw new Error(`Method "${trigger}" not found`);
        }

        return this.processor.generateCode(method, parameters);
    },

    /**
     * Extraer métodos usados en código
     */
    extractMethods(code) {
        return this.processor.extractMethods(code);
    },

    // ===================================================================
    // INTEGRACIÓN CON EDITOR
    // ===================================================================

    /**
     * Configurar integración con CodeMirror
     */
    setupEditorIntegration() {
        // Exponer funciones globales para CodeMirror
        if (typeof window !== 'undefined') {
            // Autocompletado
            window.getAlpineMethodCompletions = (context) => {
                return this.getEditorCompletions(context);
            };

            // Validación
            window.validateAlpineMethodSyntax = (code) => {
                return this.validateEditorSyntax(code);
            };

            // Procesamiento
            window.processAlpineMethodCode = (code) => {
                return this.processCode(code);
            };
        }

        console.log('🔧 Editor integration configured');
    },

    /**
     * Obtener sugerencias para el editor
     */
    getEditorCompletions(context) {
        return getMethodCompletions(context, this);
    },

    /**
     * Validar sintaxis en el editor
     */
    validateEditorSyntax(code) {
        return validateMethodSyntax(code, this);
    },

    /**
     * Formatear código en el editor
     */
    formatEditorCode(code) {
        return processMethodCode(code, this);
    },

    // ===================================================================
    // UTILIDADES Y HELPERS
    // ===================================================================

    /**
     * Incrementar contador de uso de un método
     */
    async incrementMethodUsage(trigger) {
        const method = this.getMethod(trigger);
        if (!method) return;

        try {
            await fetch(`${this.config.apiUrl}/${method.id}/increment-usage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                }
            });

            // Actualizar cache local
            method.usage_count++;
            
        } catch (error) {
            console.warn('⚠️ Failed to increment method usage:', error);
        }
    },

    /**
     * Sincronizar con servidor si es necesario
     */
    async syncIfNeeded() {
        const fiveMinutesAgo = Date.now() - this.config.cacheTimeout;
        
        if (!this.lastSync || this.lastSync < fiveMinutesAgo) {
            await this.loadMethods();
        }
    },

    /**
     * Obtener estadísticas de uso
     */
    getUsageStats() {
        const methods = this.getAllMethods();
        
        return {
            totalMethods: methods.length,
            totalUsage: methods.reduce((sum, method) => sum + method.usage_count, 0),
            categoryCounts: methods.reduce((acc, method) => {
                acc[method.category] = (acc[method.category] || 0) + 1;
                return acc;
            }, {}),
            mostUsed: methods
                .sort((a, b) => b.usage_count - a.usage_count)
                .slice(0, 5)
                .map(method => ({
                    trigger: method.trigger,
                    name: method.name,
                    usage: method.usage_count
                }))
        };
    },

    /**
     * Obtener información de debugging
     */
    getDebugInfo() {
        return {
            config: this.config,
            methodsCount: this.methods.size,
            loading: this.loading,
            lastSync: this.lastSync ? new Date(this.lastSync).toISOString() : null,
            cacheAge: this.lastSync ? Date.now() - this.lastSync : null,
            stats: this.getUsageStats()
        };
    },

    // ===================================================================
    // LIMPIEZA
    // ===================================================================

    cleanup() {
        // Limpiar cache
        this.methods.clear();
        
        // Limpiar funciones globales
        if (typeof window !== 'undefined') {
            delete window.getAlpineMethodCompletions;
            delete window.validateAlpineMethodSyntax;
            delete window.processAlpineMethodCode;
        }

        console.log('🧹 Alpine Methods Plugin cleaned up');
    }
});

export default AlpineMethodsPlugin;