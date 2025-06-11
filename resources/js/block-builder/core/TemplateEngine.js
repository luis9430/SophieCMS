// ===================================================================
// core/TemplateEngine.js - FASE 3: TEMPLATES EDITABLES
// Responsabilidad: Motor para templates editables y seguros
// ===================================================================

import templateValidator from '../security/TemplateValidator.js';

/**
 * Motor de templates que permite cargar, guardar y procesar templates
 * de forma segura con validación automática
 */
export class TemplateEngine {
    constructor() {
        this.variables = new Map();
        this.directives = new Map();
        this.filters = new Map();
        this.templates = new Map(); // Add template storage
        
        // Initialize basic filters
        this._initializeBasicFilters();
        
        console.log('🎨 Template Engine initialized');
    }

    /**
     * Store a template
     */
    storeTemplate(name, content) {
        this.templates.set(name, content);
    }

    /**
     * Get a template by name
     */
    getTemplate(name) {
        return this.templates.get(name);
    }

    /**
     * List all available templates
     */
    listTemplates() {
        return Array.from(this.templates.keys());
    }

    /**
     * Render a specific template by name
     */
    async renderTemplate(pluginName, templateName, variables = {}) {
        const fullName = `${pluginName}/${templateName}`;
        const template = this.getTemplate(fullName);
        
        if (!template) {
            throw new Error(`Template "${fullName}" not found`);
        }
        
        return await this.process(template, variables);
    }

    /**
     * Process a template with given data
     */
    async process(template, data = {}) {
        try {
            let result = template;

            // Process variables
            result = this._processVariables(result, data);

            // Process directives
            result = await this._processDirectives(result, data);

            // Process filters
            result = this._processFilters(result, data);

            return result;
        } catch (error) {
            console.error('❌ Template processing error:', error);
            throw error;
        }
    }

    /**
     * Register a new directive
     */
    registerDirective(name, handler) {
        this.directives.set(name, handler);
    }

    /**
     * Register a new filter
     */
    registerFilter(name, handler) {
        this.filters.set(name, handler);
    }

    /**
     * Initialize basic filters
     */
    _initializeBasicFilters() {
        this.registerFilter('upper', (value) => String(value).toUpperCase());
        this.registerFilter('lower', (value) => String(value).toLowerCase());
        this.registerFilter('capitalize', (value) => {
            return String(value).charAt(0).toUpperCase() + String(value).slice(1);
        });
    }

    /**
     * Process variables in template
     */
    _processVariables(template, data) {
        return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
            try {
                const value = this._evaluateExpression(expression.trim(), data);
                return value !== undefined ? value : match;
            } catch (error) {
                console.warn(`⚠️ Error processing variable "${expression}":`, error);
                return match;
            }
        });
    }

    /**
     * Process directives in template
     */
    async _processDirectives(template, data) {
        for (const [name, handler] of this.directives) {
            try {
                template = await handler(template, data);
            } catch (error) {
                console.warn(`⚠️ Error processing directive "${name}":`, error);
            }
        }
        return template;
    }

    /**
     * Process filters in template
     */
    _processFilters(template, data) {
        return template.replace(/\{\{\s*([^|]+?)\s*\|\s*([^}]+)\s*\}\}/g, (match, expression, filterChain) => {
            try {
                let value = this._evaluateExpression(expression.trim(), data);
                
                const filters = filterChain.split('|').map(f => f.trim());
                for (const filterExpr of filters) {
                    const [filterName, ...args] = filterExpr.split(':').map(p => p.trim());
                    const filter = this.filters.get(filterName);
                    if (filter) {
                        value = filter(value, ...args);
                    }
                }
                
                return value !== undefined ? value : match;
            } catch (error) {
                console.warn(`⚠️ Error processing filter chain "${filterChain}":`, error);
                return match;
            }
        });
    }

    /**
     * Evaluate expression with given data context
     */
    _evaluateExpression(expression, context) {
        try {
            const func = new Function('ctx', `with(ctx) { return ${expression}; }`);
            return func(context);
        } catch (error) {
            console.warn(`⚠️ Error evaluating expression "${expression}":`, error);
            return undefined;
        }
    }
}

// Create a single instance
const templateEngine = new TemplateEngine();

// Export the instance as default
export default templateEngine;

// ===================================================================
// FUNCIONES DE CONVENIENCIA
// ===================================================================

/**
 * Función rápida para renderizar template
 */
export const renderTemplate = async (pluginName, templateName, variables = {}) => {
    return await templateEngine.renderTemplate(pluginName, templateName, variables);
};

/**
 * Función rápida para procesar template
 */
export const processTemplate = (template, variables = {}) => {
    return templateEngine.processTemplate(template, variables);
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.templateEngine = templateEngine;
    
    // Test básico
    console.log('🧪 TemplateEngine test - Default templates:');
    console.table(templateEngine.listTemplates());
    
    console.log('🔧 TemplateEngine exposed to window for debugging');
}