// ===================================================================
// resources/js/block-builder/plugins/alpine-methods/index.js
// Plugin Alpine Methods integrado con tu sistema
// ===================================================================

/**
 * Plugin de Métodos Alpine
 * Se integra perfectamente con tu CoreSystemInitializer
 */
export default class AlpineMethodsPlugin {
    constructor() {
        this.name = 'alpine-methods';
        this.version = '1.0.0';
        this.dependencies = [];
        
        // Configuración
        this.config = {
            apiUrl: '/api/templates/alpine-methods',
            cacheTimeout: 5 * 60 * 1000, // 5 minutos
            enableValidation: true,
            triggerPrefix: '@',
            maxSuggestions: 15
        };

        // Estado
        this.methods = new Map();
        this.loading = false;
        this.lastSync = null;
        
        console.log('🔧 Alpine Methods Plugin constructed');
    }

    // ===================================================================
    // INIT - Compatible con tu PluginManager
    // ===================================================================

    async init() {
        console.log('🚀 Initializing Alpine Methods Plugin...');

        try {
            // Cargar métodos desde API
            await this.loadMethods();

            // Configurar integración con editor
            this.setupEditorIntegration();

            console.log(`✅ Alpine Methods Plugin initialized with ${this.methods.size} methods`);
            return this;

        } catch (error) {
            console.error('❌ Failed to initialize Alpine Methods Plugin:', error);
            // No fallar, solo continuar sin métodos
            return this;
        }
    }

    // ===================================================================
    // CARGA DE MÉTODOS DESDE API
    // ===================================================================

    async loadMethods() {
        if (this.loading) return;

        try {
            this.loading = true;
            console.log('📥 Loading Alpine methods from API...');

            const response = await fetch(this.config.apiUrl, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'API returned success: false');
            }

            const methods = data.data || [];

            // Limpiar cache actual
            this.methods.clear();

            // Cargar métodos en cache
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
                        content: method.content
                    });
                }
            });

            this.lastSync = Date.now();
            console.log(`✅ Loaded ${this.methods.size} Alpine methods`);

        } catch (error) {
            console.error('❌ Error loading Alpine methods:', error);
            // Continuar sin métodos si falla la carga
        } finally {
            this.loading = false;
        }
    }

    // ===================================================================
    // GESTIÓN DE MÉTODOS
    // ===================================================================

    getMethod(trigger) {
        if (!trigger.startsWith(this.config.triggerPrefix)) {
            trigger = this.config.triggerPrefix + trigger;
        }
        return this.methods.get(trigger);
    }

    getAllMethods() {
        return Array.from(this.methods.values());
    }

    getMethodsByCategory(category) {
        return this.getAllMethods().filter(method => method.category === category);
    }

    searchMethods(searchTerm) {
        if (!searchTerm) return this.getAllMethods();
        
        const term = searchTerm.toLowerCase();
        return this.getAllMethods().filter(method => 
            method.name.toLowerCase().includes(term) ||
            method.description.toLowerCase().includes(term) ||
            method.trigger.toLowerCase().includes(term)
        );
    }

    // ===================================================================
    // PROCESAMIENTO DE CÓDIGO
    // ===================================================================

    processCode(code) {
        const methodCalls = this.extractMethods(code);
        
        if (methodCalls.length === 0) {
            return code;
        }

        let processedCode = code;
        
        // Procesar métodos de atrás hacia adelante
        methodCalls.reverse().forEach(methodCall => {
            try {
                const method = this.getMethod(methodCall.trigger);
                if (!method) {
                    console.warn(`⚠️ Method ${methodCall.trigger} not found`);
                    return;
                }

                const alpineCode = this.generateCode(method, methodCall.parameters);
                
                // Reemplazar en el código
                processedCode = processedCode.substring(0, methodCall.start) +
                               alpineCode +
                               processedCode.substring(methodCall.end);

                // Incrementar uso de manera asíncrona
                this.incrementMethodUsage(methodCall.trigger);

            } catch (error) {
                console.error(`❌ Error processing method ${methodCall.trigger}:`, error);
            }
        });

        return processedCode;
    }

    extractMethods(code) {
        const methods = [];
        const methodRegex = /@(\w+)\s*\(\s*(\{[^}]*\})?\s*\)/g;
        let match;

        while ((match = methodRegex.exec(code)) !== null) {
            const [fullMatch, methodName, parametersStr] = match;
            
            try {
                const parameters = parametersStr ? this.parseParameters(parametersStr) : {};
                
                methods.push({
                    trigger: '@' + methodName,
                    parameters,
                    start: match.index,
                    end: match.index + fullMatch.length,
                    raw: fullMatch
                });
            } catch (error) {
                console.warn(`⚠️ Error parsing method ${methodName}:`, error);
            }
        }

        return methods;
    }

    generateCode(method, parameters = {}) {
        try {
            // Combinar con parámetros por defecto
            const finalParameters = this.mergeWithDefaults(parameters, method);

            // Procesar template
            const processedTemplate = this.processTemplate(method.template, finalParameters);

            // Extraer nombre del componente
            const componentName = method.trigger.replace(this.config.triggerPrefix, '');

            // Generar código Alpine.data
            return `Alpine.data('${componentName}', () => ({
    ${this.indentCode(processedTemplate, 4)}
}))`;

        } catch (error) {
            console.error(`❌ Error generating code for ${method.trigger}:`, error);
            throw error;
        }
    }

    // ===================================================================
    // INTEGRACIÓN CON CODEMIRROR
    // ===================================================================

    setupEditorIntegration() {
        if (typeof window !== 'undefined') {
            // Funciones globales para CodeMirror
            window.getAlpineMethodCompletions = (context) => {
                return this.getEditorCompletions(context);
            };

            window.validateAlpineMethodSyntax = (code) => {
                return this.validateEditorSyntax(code);
            };

            window.processAlpineMethodCode = (code) => {
                return this.processCode(code);
            };

            console.log('🌐 Global functions exposed for CodeMirror');
        }
    }

    getEditorCompletions(context) {
        try {
            const beforeCursor = this.getTextBeforeCursor(context, 50);
            const methodContext = this.detectMethodContext(beforeCursor);
            
            if (!methodContext) return [];

            switch (methodContext.type) {
                case 'trigger':
                    return this.getMethodTriggerCompletions(methodContext);
                case 'parameters':
                    return this.getMethodParameterCompletions(methodContext);
                default:
                    return [];
            }

        } catch (error) {
            console.warn('⚠️ Error getting method completions:', error);
            return [];
        }
    }

    validateEditorSyntax(code) {
        const errors = [];
        const warnings = [];

        try {
            const methods = this.extractMethods(code);
            
            methods.forEach(methodCall => {
                const method = this.getMethod(methodCall.trigger);
                
                if (!method) {
                    errors.push({
                        type: 'unknown-method',
                        message: `Unknown Alpine method: ${methodCall.trigger}`,
                        severity: 'error'
                    });
                }
            });

        } catch (error) {
            errors.push({
                type: 'validation-error',
                message: `Error validating Alpine methods: ${error.message}`,
                severity: 'error'
            });
        }

        return { errors, warnings };
    }

    // ===================================================================
    // UTILIDADES Y HELPERS
    // ===================================================================

    parseParameters(parametersStr) {
        try {
            const cleanStr = parametersStr.trim().replace(/^{|}$/g, '');
            if (!cleanStr) return {};
            
            const objectStr = `{ ${cleanStr} }`;
            return Function(`"use strict"; return (${objectStr})`)();
        } catch (error) {
            console.error('❌ Error parsing parameters:', error);
            throw new Error(`Invalid parameter syntax: ${parametersStr}`);
        }
    }

    processTemplate(template, parameters) {
        let processed = template;

        // Reemplazar placeholders {{parameter}}
        processed = processed.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
            if (paramName in parameters) {
                const value = parameters[paramName];
                return this.formatParameterValue(value);
            } else {
                console.warn(`⚠️ Placeholder {{${paramName}}} not found`);
                return match;
            }
        });

        return processed;
    }

    formatParameterValue(value) {
        if (typeof value === 'string') {
            return `"${value.replace(/"/g, '\\"')}"`;
        } else if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        } else if (typeof value === 'number') {
            return value.toString();
        } else if (Array.isArray(value)) {
            return JSON.stringify(value);
        } else if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        } else {
            return 'null';
        }
    }

    mergeWithDefaults(parameters, method) {
        const merged = { ...parameters };

        Object.entries(method.parameters || {}).forEach(([paramName, paramConfig]) => {
            if (!(paramName in merged) && paramConfig.default !== undefined) {
                merged[paramName] = paramConfig.default;
            }
        });

        return merged;
    }

    indentCode(code, spaces) {
        const indent = ' '.repeat(spaces);
        return code
            .split('\n')
            .map(line => line.trim() ? indent + line : line)
            .join('\n');
    }

    // ===================================================================
    // MÉTODOS AUXILIARES PARA COMPLETIONS
    // ===================================================================

    detectMethodContext(beforeCursor) {
        // Detectar @trigger
        const triggerMatch = beforeCursor.match(/@(\w*)$/);
        if (triggerMatch) {
            return {
                type: 'trigger',
                searchTerm: triggerMatch[1] || '',
                position: beforeCursor.length - triggerMatch[0].length
            };
        }

        // Detectar parámetros @method({...
        const parameterMatch = beforeCursor.match(/@(\w+)\s*\(\s*\{([^}]*?)(\w*)$/);
        if (parameterMatch) {
            const [, trigger, params, currentParam] = parameterMatch;
            return {
                type: 'parameters',
                trigger: '@' + trigger,
                currentParams: this.parsePartialParameters(params),
                searchTerm: currentParam || '',
                position: beforeCursor.length - currentParam.length
            };
        }

        return null;
    }

    getMethodTriggerCompletions(methodContext) {
        const methods = this.searchMethods(methodContext.searchTerm);
        
        return methods.map(method => ({
            label: method.trigger,
            type: 'alpine-method',
            info: method.category,
            detail: method.description,
            apply: this.createMethodApplication(method),
            boost: this.calculateMethodBoost(method)
        }));
    }

    getMethodParameterCompletions(methodContext) {
        const method = this.getMethod(methodContext.trigger);
        if (!method) return [];

        const availableParams = Object.keys(method.parameters);
        const usedParams = Object.keys(methodContext.currentParams);
        const remainingParams = availableParams.filter(param => !usedParams.includes(param));

        return remainingParams.map(paramName => {
            const paramConfig = method.parameters[paramName];
            return {
                label: paramName,
                type: 'alpine-parameter',
                info: paramConfig.type,
                detail: paramConfig.description,
                apply: this.createParameterApplication(paramName, paramConfig),
                boost: paramConfig.required ? 100 : 50
            };
        });
    }

    getTextBeforeCursor(context, maxLength = 100) {
        if (context.state && context.state.doc) {
            // CodeMirror 6
            const pos = context.pos || context.state.selection.main.head;
            const start = Math.max(0, pos - maxLength);
            return context.state.doc.sliceString(start, pos);
        } else if (context.getLine) {
            // CodeMirror 5
            const cursor = context.getCursor();
            const line = context.getLine(cursor.line);
            const start = Math.max(0, cursor.ch - maxLength);
            return line.substring(start, cursor.ch);
        }
        return '';
    }

    createMethodApplication(method) {
        const requiredParams = Object.entries(method.parameters)
            .filter(([, config]) => config.required)
            .map(([name, config]) => `${name}: ${this.getDefaultValueForType(config.type)}`)
            .join(', ');

        if (requiredParams) {
            return `${method.trigger}({ ${requiredParams} })`;
        } else {
            return `${method.trigger}()`;
        }
    }

    createParameterApplication(paramName, paramConfig) {
        const defaultValue = paramConfig.default !== undefined 
            ? JSON.stringify(paramConfig.default)
            : this.getDefaultValueForType(paramConfig.type);
        
        return `${paramName}: ${defaultValue}`;
    }

    getDefaultValueForType(type) {
        switch (type) {
            case 'string': return '""';
            case 'number': return '0';
            case 'boolean': return 'false';
            case 'array': return '[]';
            case 'object': return '{}';
            default: return 'null';
        }
    }

    calculateMethodBoost(method) {
        let boost = 50;
        if (method.usage_count > 10) boost += 30;
        else if (method.usage_count > 5) boost += 20;
        else if (method.usage_count > 0) boost += 10;
        return boost;
    }

    parsePartialParameters(paramsStr) {
        const params = {};
        try {
            const parts = paramsStr.split(',');
            parts.forEach(part => {
                const colonIndex = part.indexOf(':');
                if (colonIndex > 0) {
                    const key = part.substring(0, colonIndex).trim();
                    const value = part.substring(colonIndex + 1).trim();
                    try {
                        params[key] = Function(`"use strict"; return (${value})`)();
                    } catch {
                        params[key] = value;
                    }
                }
            });
        } catch (error) {
            console.warn('⚠️ Error parsing partial parameters:', error);
        }
        return params;
    }

    // ===================================================================
    // API INTERACTIONS
    // ===================================================================

    async incrementMethodUsage(trigger) {
        const method = this.getMethod(trigger);
        if (!method) return;

        try {
            await fetch(`/api/templates/${method.id}/increment-usage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            // Actualizar cache local
            method.usage_count++;
            
        } catch (error) {
            console.warn('⚠️ Failed to increment method usage:', error);
        }
    }

    async syncIfNeeded() {
        const fiveMinutesAgo = Date.now() - this.config.cacheTimeout;
        
        if (!this.lastSync || this.lastSync < fiveMinutesAgo) {
            await this.loadMethods();
        }
    }

    // ===================================================================
    // ESTADÍSTICAS Y DEBUG
    // ===================================================================

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
    }

    getDebugInfo() {
        return {
            config: this.config,
            methodsCount: this.methods.size,
            loading: this.loading,
            lastSync: this.lastSync ? new Date(this.lastSync).toISOString() : null,
            cacheAge: this.lastSync ? Date.now() - this.lastSync : null,
            stats: this.getUsageStats()
        };
    }

    // ===================================================================
    // CLEANUP
    // ===================================================================

    cleanup() {
        this.methods.clear();
        
        if (typeof window !== 'undefined') {
            delete window.getAlpineMethodCompletions;
            delete window.validateAlpineMethodSyntax;
            delete window.processAlpineMethodCode;
        }

        console.log('🧹 Alpine Methods Plugin cleaned up');
    }
}