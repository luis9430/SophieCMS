// ===================================================================
// plugins/alpine-methods/processor.js
// Responsabilidad: Procesamiento y generación de código Alpine
// ===================================================================

/**
 * Procesador de métodos Alpine
 * Convierte sintaxis @method({}) a código Alpine.data() completo
 */
export class MethodProcessor {
    constructor(config = {}) {
        this.config = {
            triggerPrefix: '@',
            placeholderPattern: /\{\{(\w+)\}\}/g,
            enableValidation: true,
            enableOptimization: true,
            ...config
        };
    }

    // ===================================================================
    // PROCESAMIENTO PRINCIPAL
    // ===================================================================

    /**
     * Procesar código completo reemplazando métodos Alpine
     * @param {string} code - Código fuente
     * @param {Map} methods - Map de métodos disponibles
     * @returns {string} Código procesado
     */
    processCode(code, methods) {
        try {
            // Extraer todos los métodos del código
            const methodCalls = this.extractMethods(code);
            
            if (methodCalls.length === 0) {
                return code; // No hay métodos que procesar
            }

            let processedCode = code;
            
            // Procesar métodos de atrás hacia adelante para mantener posiciones
            methodCalls.reverse().forEach(methodCall => {
                try {
                    const method = methods.get(methodCall.trigger);
                    if (!method) {
                        console.warn(`⚠️ Method ${methodCall.trigger} not found`);
                        return;
                    }

                    const alpineCode = this.generateCode(method, methodCall.parameters);
                    
                    // Reemplazar en el código
                    processedCode = processedCode.substring(0, methodCall.start) +
                                   alpineCode +
                                   processedCode.substring(methodCall.end);

                } catch (error) {
                    console.error(`❌ Error processing method ${methodCall.trigger}:`, error);
                }
            });

            return processedCode;

        } catch (error) {
            console.error('❌ Error processing Alpine methods in code:', error);
            return code; // Devolver código original en caso de error
        }
    }

    /**
     * Generar código Alpine completo para un método
     * @param {Object} method - Configuración del método
     * @param {Object} parameters - Parámetros proporcionados
     * @returns {string} Código Alpine.data() completo
     */
    generateCode(method, parameters = {}) {
        try {
            // Validar parámetros si está habilitado
            if (this.config.enableValidation) {
                const validation = this.validateParameters(parameters, method);
                if (validation.errors.length > 0) {
                    throw new Error(`Parameter validation failed: ${validation.errors[0].message}`);
                }
            }

            // Combinar parámetros con valores por defecto
            const finalParameters = this.mergeWithDefaults(parameters, method);

            // Procesar template del método
            const processedTemplate = this.processTemplate(method.template, finalParameters);

            // Extraer nombre del componente desde el trigger
            const componentName = method.trigger.replace(this.config.triggerPrefix, '');

            // Generar código Alpine.data completo
            const alpineCode = this.buildAlpineDataCode(componentName, processedTemplate);

            // Optimizar si está habilitado
            if (this.config.enableOptimization) {
                return this.optimizeCode(alpineCode);
            }

            return alpineCode;

        } catch (error) {
            console.error(`❌ Error generating code for method ${method.trigger}:`, error);
            throw error;
        }
    }

    // ===================================================================
    // EXTRACCIÓN DE MÉTODOS
    // ===================================================================

    /**
     * Extraer métodos Alpine del código
     * @param {string} code - Código fuente
     * @returns {Array} Array de métodos encontrados
     */
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
                // Continuar con otros métodos
            }
        }

        return methods;
    }

    // ===================================================================
    // PROCESAMIENTO DE TEMPLATES
    // ===================================================================

    /**
     * Procesar template reemplazando placeholders
     * @param {string} template - Template del método
     * @param {Object} parameters - Parámetros finales
     * @returns {string} Template procesado
     */
    processTemplate(template, parameters) {
        let processed = template;

        // Reemplazar placeholders {{parameter}}
        processed = processed.replace(this.config.placeholderPattern, (match, paramName) => {
            if (paramName in parameters) {
                const value = parameters[paramName];
                return this.formatParameterValue(value);
            } else {
                console.warn(`⚠️ Placeholder {{${paramName}}} not found in parameters`);
                return match; // Mantener placeholder si no se encuentra
            }
        });

        return processed;
    }

    /**
     * Formatear valor de parámetro para JavaScript
     * @param {*} value - Valor a formatear
     * @returns {string} Valor formateado
     */
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
        } else if (value === null || value === undefined) {
            return 'null';
        } else {
            return String(value);
        }
    }

    // ===================================================================
    // CONSTRUCCIÓN DE CÓDIGO
    // ===================================================================

    /**
     * Construir código Alpine.data completo
     * @param {string} componentName - Nombre del componente
     * @param {string} template - Template procesado
     * @returns {string} Código Alpine.data
     */
    buildAlpineDataCode(componentName, template) {
        // Detectar si el template ya tiene estructura de función
        const hasReturnStructure = template.includes('return {') || template.includes('return{');
        
        if (hasReturnStructure) {
            // Template ya tiene estructura completa
            return `Alpine.data('${componentName}', () => ${template})`;
        } else {
            // Template es solo el contenido del objeto
            return `Alpine.data('${componentName}', () => ({
    ${this.indentCode(template, 4)}
}))`;
        }
    }

    /**
     * Indentar código
     * @param {string} code - Código a indentar
     * @param {number} spaces - Número de espacios
     * @returns {string} Código indentado
     */
    indentCode(code, spaces) {
        const indent = ' '.repeat(spaces);
        return code
            .split('\n')
            .map(line => line.trim() ? indent + line : line)
            .join('\n');
    }

    // ===================================================================
    // VALIDACIÓN Y MERGING
    // ===================================================================

    /**
     * Validar parámetros contra la configuración del método
     * @param {Object} parameters - Parámetros proporcionados
     * @param {Object} method - Configuración del método
     * @returns {Object} Resultado de validación
     */
    validateParameters(parameters, method) {
        const errors = [];
        const warnings = [];

        // Verificar parámetros requeridos
        Object.entries(method.parameters || {}).forEach(([paramName, paramConfig]) => {
            if (paramConfig.required && !(paramName in parameters)) {
                errors.push({
                    type: 'missing-required',
                    message: `Required parameter '${paramName}' is missing`,
                    parameter: paramName
                });
            }
        });

        // Verificar parámetros existentes
        Object.entries(parameters).forEach(([paramName, value]) => {
            const paramConfig = method.parameters?.[paramName];
            
            if (!paramConfig) {
                warnings.push({
                    type: 'unknown-parameter',
                    message: `Unknown parameter '${paramName}'`,
                    parameter: paramName
                });
                return;
            }

            // Validar tipo
            const typeValidation = this.validateParameterType(value, paramConfig);
            if (!typeValidation.valid) {
                errors.push({
                    type: 'invalid-type',
                    message: `Parameter '${paramName}' must be of type ${paramConfig.type}`,
                    parameter: paramName,
                    expected: paramConfig.type,
                    actual: typeof value
                });
            }

            // Validar restricciones
            const constraintErrors = this.validateParameterConstraints(value, paramConfig);
            errors.push(...constraintErrors);
        });

        return { errors, warnings, valid: errors.length === 0 };
    }

    /**
     * Validar tipo de parámetro
     * @param {*} value - Valor a validar
     * @param {Object} paramConfig - Configuración del parámetro
     * @returns {Object} Resultado de validación
     */
    validateParameterType(value, paramConfig) {
        const expectedType = paramConfig.type;
        
        switch (expectedType) {
            case 'string':
                return { valid: typeof value === 'string' };
            case 'number':
                return { valid: typeof value === 'number' && !isNaN(value) };
            case 'boolean':
                return { valid: typeof value === 'boolean' };
            case 'array':
                return { valid: Array.isArray(value) };
            case 'object':
                return { valid: typeof value === 'object' && value !== null && !Array.isArray(value) };
            default:
                return { valid: true }; // Tipo desconocido, permitir
        }
    }

    /**
     * Validar restricciones de parámetro
     * @param {*} value - Valor a validar
     * @param {Object} paramConfig - Configuración del parámetro
     * @returns {Array} Array de errores
     */
    validateParameterConstraints(value, paramConfig) {
        const errors = [];
        const validation = paramConfig.validation || {};

        // Validar rango numérico
        if (typeof value === 'number') {
            if (validation.min !== undefined && value < validation.min) {
                errors.push({
                    type: 'value-below-minimum',
                    message: `Value ${value} is below minimum ${validation.min}`,
                    parameter: paramConfig.name,
                    value,
                    constraint: validation.min
                });
            }
            if (validation.max !== undefined && value > validation.max) {
                errors.push({
                    type: 'value-above-maximum',
                    message: `Value ${value} is above maximum ${validation.max}`,
                    parameter: paramConfig.name,
                    value,
                    constraint: validation.max
                });
            }
        }

        // Validar enum
        if (validation.enum && !validation.enum.includes(value)) {
            errors.push({
                type: 'invalid-enum-value',
                message: `Value '${value}' is not one of: ${validation.enum.join(', ')}`,
                parameter: paramConfig.name,
                value,
                validOptions: validation.enum
            });
        }

        return errors;
    }

    /**
     * Combinar parámetros con valores por defecto
     * @param {Object} parameters - Parámetros proporcionados
     * @param {Object} method - Configuración del método
     * @returns {Object} Parámetros finales
     */
    mergeWithDefaults(parameters, method) {
        const merged = { ...parameters };

        // Agregar valores por defecto para parámetros no proporcionados
        Object.entries(method.parameters || {}).forEach(([paramName, paramConfig]) => {
            if (!(paramName in merged) && paramConfig.default !== undefined) {
                merged[paramName] = paramConfig.default;
            }
        });

        return merged;
    }

    // ===================================================================
    // PARSING Y OPTIMIZACIÓN
    // ===================================================================

    /**
     * Parsear parámetros de string JSON
     * @param {string} parametersStr - String de parámetros
     * @returns {Object} Objeto de parámetros
     */
    parseParameters(parametersStr) {
        try {
            // Remover llaves externas y evaluar como objeto JavaScript
            const cleanStr = parametersStr.trim().replace(/^{|}$/g, '');
            if (!cleanStr) return {};
            
            // Crear función que evalúe el objeto de forma segura
            const objectStr = `{ ${cleanStr} }`;
            return Function(`"use strict"; return (${objectStr})`)();
        } catch (error) {
            console.error('❌ Error parsing parameters:', error);
            throw new Error(`Invalid parameter syntax: ${parametersStr}`);
        }
    }

    /**
     * Optimizar código generado
     * @param {string} code - Código a optimizar
     * @returns {string} Código optimizado
     */
    optimizeCode(code) {
        let optimized = code;

        // Remover espacios extras entre tokens
        optimized = optimized.replace(/\s+/g, ' ');

        // Remover espacios alrededor de operadores
        optimized = optimized.replace(/\s*([(){}:,;])\s*/g, '$1');

        // Mantener espacios necesarios para legibilidad
        optimized = optimized.replace(/([(){}:,;])/g, '$1 ');
        optimized = optimized.replace(/\s+/g, ' ');

        // Formatear correctamente las funciones
        optimized = optimized.replace(/(\w+)\s*\(/g, '$1(');
        optimized = optimized.replace(/\)\s*{/g, ') {');

        return optimized.trim();
    }

    // ===================================================================
    // UTILIDADES DE ANÁLISIS
    // ===================================================================

    /**
     * Analizar métodos usados en código
     * @param {string} code - Código a analizar
     * @returns {Object} Análisis de métodos
     */
    analyzeMethodUsage(code) {
        const methods = this.extractMethods(code);
        
        const analysis = {
            totalMethods: methods.length,
            uniqueMethods: new Set(methods.map(m => m.trigger)).size,
            methodCounts: {},
            parameters: {},
            complexity: 'low'
        };

        // Contar uso por método
        methods.forEach(method => {
            analysis.methodCounts[method.trigger] = (analysis.methodCounts[method.trigger] || 0) + 1;
            
            // Analizar parámetros
            if (!analysis.parameters[method.trigger]) {
                analysis.parameters[method.trigger] = new Set();
            }
            Object.keys(method.parameters).forEach(param => {
                analysis.parameters[method.trigger].add(param);
            });
        });

        // Determinar complejidad
        if (analysis.totalMethods > 10) analysis.complexity = 'high';
        else if (analysis.totalMethods > 5) analysis.complexity = 'medium';

        // Convertir Sets a Arrays para serialización
        Object.keys(analysis.parameters).forEach(method => {
            analysis.parameters[method] = Array.from(analysis.parameters[method]);
        });

        return analysis;
    }

    /**
     * Obtener dependencias de métodos
     * @param {Array} methods - Array de métodos usados
     * @param {Map} availableMethods - Map de métodos disponibles
     * @returns {Object} Información de dependencias
     */
    getMethodDependencies(methods, availableMethods) {
        const dependencies = {
            found: [],
            missing: [],
            frameworks: new Set(),
            plugins: new Set()
        };

        methods.forEach(methodCall => {
            const method = availableMethods.get(methodCall.trigger);
            
            if (method) {
                dependencies.found.push({
                    trigger: method.trigger,
                    name: method.name,
                    category: method.category
                });

                // Analizar dependencias del método
                if (method.config) {
                    if (method.config.css_framework) {
                        dependencies.frameworks.add(method.config.css_framework);
                    }
                    if (method.config.alpine_plugins) {
                        method.config.alpine_plugins.forEach(plugin => {
                            dependencies.plugins.add(plugin);
                        });
                    }
                }
            } else {
                dependencies.missing.push(methodCall.trigger);
            }
        });

        // Convertir Sets a Arrays
        dependencies.frameworks = Array.from(dependencies.frameworks);
        dependencies.plugins = Array.from(dependencies.plugins);

        return dependencies;
    }

    // ===================================================================
    // GENERACIÓN DE CÓDIGO AVANZADA
    // ===================================================================

    /**
     * Generar código con comentarios de documentación
     * @param {Object} method - Configuración del método
     * @param {Object} parameters - Parámetros
     * @param {Object} options - Opciones de generación
     * @returns {string} Código con documentación
     */
    generateCodeWithDocs(method, parameters = {}, options = {}) {
        const baseCode = this.generateCode(method, parameters);
        
        if (!options.includeDocs) {
            return baseCode;
        }

        const docs = this.generateMethodDocumentation(method, parameters);
        return `${docs}\n${baseCode}`;
    }

    /**
     * Generar documentación JSDoc para método
     * @param {Object} method - Configuración del método
     * @param {Object} parameters - Parámetros usados
     * @returns {string} Documentación JSDoc
     */
    generateMethodDocumentation(method, parameters) {
        let docs = `/**\n * ${method.name}\n * ${method.description}\n *\n`;

        // Documentar parámetros
        if (Object.keys(parameters).length > 0) {
            docs += ' * Parameters:\n';
            Object.entries(parameters).forEach(([name, value]) => {
                const paramConfig = method.parameters[name];
                const type = paramConfig ? paramConfig.type : typeof value;
                docs += ` * @param {${type}} ${name} - ${paramConfig?.description || 'Parameter value'}\n`;
            });
            docs += ' *\n';
        }

        // Documentar configuración
        if (method.config) {
            if (method.config.requires_cleanup) {
                docs += ' * @note This component requires cleanup on destroy\n';
            }
            if (method.config.css_framework) {
                docs += ` * @requires ${method.config.css_framework}\n`;
            }
        }

        docs += ' */';
        return docs;
    }

    // ===================================================================
    // TRANSFORMACIONES ESPECIALES
    // ===================================================================

    /**
     * Convertir método a función standalone
     * @param {Object} method - Configuración del método
     * @param {Object} parameters - Parámetros
     * @returns {string} Función JavaScript standalone
     */
    generateStandaloneFunction(method, parameters = {}) {
        const finalParameters = this.mergeWithDefaults(parameters, method);
        const processedTemplate = this.processTemplate(method.template, finalParameters);
        
        const componentName = method.trigger.replace(this.config.triggerPrefix, '');
        
        return `function create${this.capitalize(componentName)}Component() {
    return {
        ${this.indentCode(processedTemplate, 8)}
    };
}`;
    }

    /**
     * Convertir método a clase ES6
     * @param {Object} method - Configuración del método
     * @param {Object} parameters - Parámetros
     * @returns {string} Clase ES6
     */
    generateES6Class(method, parameters = {}) {
        const finalParameters = this.mergeWithDefaults(parameters, parameters);
        const componentName = this.capitalize(method.trigger.replace(this.config.triggerPrefix, ''));
        
        // Extraer propiedades y métodos del template
        const { properties, methods: methodsCode } = this.parseTemplateStructure(method.template, finalParameters);
        
        let classCode = `class ${componentName}Component {\n`;
        
        // Constructor
        classCode += '    constructor() {\n';
        properties.forEach(prop => {
            classCode += `        this.${prop.name} = ${prop.value};\n`;
        });
        classCode += '    }\n\n';
        
        // Métodos
        methodsCode.forEach(methodCode => {
            classCode += `    ${methodCode}\n\n`;
        });
        
        classCode += '}';
        
        return classCode;
    }

    /**
     * Parsear estructura del template
     * @param {string} template - Template del método
     * @param {Object} parameters - Parámetros finales
     * @returns {Object} Estructura parseada
     */
    parseTemplateStructure(template, parameters) {
        const processed = this.processTemplate(template, parameters);
        const properties = [];
        const methods = [];
        
        // Regex simple para extraer propiedades y métodos
        const propertyRegex = /(\w+):\s*([^,\n]+)/g;
        const methodRegex = /(\w+)\s*\([^)]*\)\s*\{[^}]*\}/g;
        
        let match;
        
        // Extraer propiedades
        while ((match = propertyRegex.exec(processed)) !== null) {
            const [, name, value] = match;
            if (!value.includes('(') || !value.includes('{')) { // No es una función
                properties.push({ name, value: value.trim().replace(/,$/, '') });
            }
        }
        
        // Extraer métodos
        while ((match = methodRegex.exec(processed)) !== null) {
            methods.push(match[0]);
        }
        
        return { properties, methods };
    }

    // ===================================================================
    // UTILIDADES AUXILIARES
    // ===================================================================

    /**
     * Capitalizar primera letra
     * @param {string} str - String a capitalizar
     * @returns {string} String capitalizado
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Obtener estadísticas del procesador
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            config: this.config,
            version: '1.0.0',
            features: {
                validation: this.config.enableValidation,
                optimization: this.config.enableOptimization,
                documentation: true,
                transformations: true
            }
        };
    }

    /**
     * Resetear estado del procesador
     */
    reset() {
        // Este procesador no mantiene estado, pero podría ser útil para extensiones futuras
        console.log('🔄 Method processor reset');
    }
}