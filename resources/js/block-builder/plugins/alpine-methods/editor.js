// ===================================================================
// plugins/alpine-methods/editor.js
// Responsabilidad: Integración con CodeMirror para métodos Alpine
// ===================================================================

/**
 * Obtener sugerencias de métodos Alpine para CodeMirror
 * @param {Object} context - Contexto de CodeMirror
 * @param {Object} plugin - Instancia del plugin de métodos Alpine
 * @returns {Array} Sugerencias de autocompletado
 */
export const getMethodCompletions = (context, plugin) => {
    if (!context || !plugin) return [];

    const completions = [];
    
    try {
        // Obtener texto antes del cursor
        const beforeCursor = getTextBeforeCursor(context, 50);
        
        // Detectar contexto de método Alpine
        const methodContext = detectMethodContext(beforeCursor);
        
        if (!methodContext) return [];

        switch (methodContext.type) {
            case 'trigger':
                return getMethodTriggerCompletions(methodContext, plugin);
            
            case 'parameters':
                return getMethodParameterCompletions(methodContext, plugin);
            
            case 'parameter_value':
                return getParameterValueCompletions(methodContext, plugin);
            
            default:
                return [];
        }

    } catch (error) {
        console.warn('⚠️ Error getting method completions:', error);
        return [];
    }
};

/**
 * Validar sintaxis de métodos Alpine en código
 * @param {string} code - Código a validar
 * @param {Object} plugin - Instancia del plugin
 * @returns {Object} Resultado de validación
 */
export const validateMethodSyntax = (code, plugin) => {
    const errors = [];
    const warnings = [];

    try {
        // Extraer métodos del código
        const methods = extractMethodsFromCode(code);
        
        methods.forEach(methodCall => {
            const validation = validateMethodCall(methodCall, plugin);
            errors.push(...validation.errors);
            warnings.push(...validation.warnings);
        });

    } catch (error) {
        errors.push({
            type: 'validation-error',
            message: `Error validating Alpine methods: ${error.message}`,
            severity: 'error'
        });
    }

    return { errors, warnings };
};

/**
 * Procesar código reemplazando métodos Alpine
 * @param {string} code - Código a procesar
 * @param {Object} plugin - Instancia del plugin
 * @returns {string} Código procesado
 */
export const processMethodCode = (code, plugin) => {
    try {
        // Extraer métodos del código
        const methods = extractMethodsFromCode(code);
        
        let processedCode = code;
        
        // Procesar cada método de atrás hacia adelante para mantener posiciones
        methods.reverse().forEach(methodCall => {
            try {
                const alpineCode = plugin.generateAlpineCode(
                    methodCall.trigger, 
                    methodCall.parameters
                );
                
                // Reemplazar en el código
                processedCode = processedCode.substring(0, methodCall.start) +
                               alpineCode +
                               processedCode.substring(methodCall.end);
                               
                // Incrementar contador de uso
                plugin.incrementMethodUsage(methodCall.trigger);
                
            } catch (error) {
                console.warn(`⚠️ Error processing method ${methodCall.trigger}:`, error);
            }
        });

        return processedCode;

    } catch (error) {
        console.error('❌ Error processing method code:', error);
        return code; // Devolver código original si hay error
    }
};

// ===================================================================
// DETECCIÓN DE CONTEXTO
// ===================================================================

/**
 * Detectar contexto de método Alpine en el cursor
 */
function detectMethodContext(beforeCursor) {
    // Contexto 1: Empezando a escribir trigger (@timer)
    const triggerMatch = beforeCursor.match(/@(\w*)$/);
    if (triggerMatch) {
        return {
            type: 'trigger',
            searchTerm: triggerMatch[1] || '',
            position: beforeCursor.length - triggerMatch[0].length
        };
    }

    // Contexto 2: Dentro de parámetros (@timer({ interval: |))
    const parameterMatch = beforeCursor.match(/@(\w+)\s*\(\s*\{([^}]*?)(\w*)$/);
    if (parameterMatch) {
        const [, trigger, params, currentParam] = parameterMatch;
        return {
            type: 'parameters',
            trigger: '@' + trigger,
            currentParams: parsePartialParameters(params),
            searchTerm: currentParam || '',
            position: beforeCursor.length - currentParam.length
        };
    }

    // Contexto 3: Valor de parámetro (@timer({ interval: |value))
    const valueMatch = beforeCursor.match(/@(\w+)\s*\(\s*\{[^}]*?(\w+)\s*:\s*([^,}]*)$/);
    if (valueMatch) {
        const [, trigger, paramName, currentValue] = valueMatch;
        return {
            type: 'parameter_value',
            trigger: '@' + trigger,
            paramName,
            currentValue: currentValue.trim(),
            position: beforeCursor.length - currentValue.length
        };
    }

    return null;
}

/**
 * Obtener texto antes del cursor
 */
function getTextBeforeCursor(context, maxLength = 100) {
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

// ===================================================================
// GENERADORES DE COMPLETIONS
// ===================================================================

/**
 * Generar completions para triggers de métodos
 */
function getMethodTriggerCompletions(methodContext, plugin) {
    const methods = plugin.searchMethods(methodContext.searchTerm);
    
    return methods.map(method => ({
        label: method.trigger,
        type: 'alpine-method',
        info: method.category,
        detail: method.description,
        documentation: createMethodDocumentation(method),
        apply: createMethodApplication(method),
        boost: calculateMethodBoost(method)
    }));
}

/**
 * Generar completions para parámetros de métodos
 */
function getMethodParameterCompletions(methodContext, plugin) {
    const method = plugin.getMethod(methodContext.trigger);
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
            documentation: createParameterDocumentation(paramName, paramConfig),
            apply: createParameterApplication(paramName, paramConfig),
            boost: paramConfig.required ? 100 : 50
        };
    });
}

/**
 * Generar completions para valores de parámetros
 */
function getParameterValueCompletions(methodContext, plugin) {
    const method = plugin.getMethod(methodContext.trigger);
    if (!method) return [];

    const paramConfig = method.parameters[methodContext.paramName];
    if (!paramConfig) return [];

    const completions = [];

    // Valor por defecto
    if (paramConfig.default !== undefined) {
        completions.push({
            label: JSON.stringify(paramConfig.default),
            type: 'default-value',
            info: 'Default',
            detail: `Default value for ${methodContext.paramName}`,
            boost: 90
        });
    }

    // Valores sugeridos por tipo
    switch (paramConfig.type) {
        case 'boolean':
            completions.push(
                {
                    label: 'true',
                    type: 'boolean-value',
                    info: 'Boolean',
                    detail: 'True value',
                    boost: 80
                },
                {
                    label: 'false',
                    type: 'boolean-value',
                    info: 'Boolean',
                    detail: 'False value',
                    boost: 80
                }
            );
            break;

        case 'number':
            if (paramConfig.min !== undefined && paramConfig.max !== undefined) {
                // Sugerir valores comunes en el rango
                const suggestions = generateNumberSuggestions(paramConfig.min, paramConfig.max);
                suggestions.forEach(value => {
                    completions.push({
                        label: value.toString(),
                        type: 'number-value',
                        info: 'Number',
                        detail: `Suggested value for ${methodContext.paramName}`,
                        boost: 70
                    });
                });
            }
            break;

        case 'string':
            if (paramConfig.options) {
                // Opciones predefinidas
                paramConfig.options.forEach(option => {
                    completions.push({
                        label: `"${option}"`,
                        type: 'string-option',
                        info: 'Option',
                        detail: `Predefined option: ${option}`,
                        boost: 85
                    });
                });
            }
            break;
    }

    // Valores de validación específicos
    if (paramConfig.validation && paramConfig.validation.enum) {
        paramConfig.validation.enum.forEach(value => {
            completions.push({
                label: JSON.stringify(value),
                type: 'enum-value',
                info: 'Valid option',
                detail: `Valid value: ${value}`,
                boost: 95
            });
        });
    }

    return completions;
}

// ===================================================================
// UTILIDADES DE APLICACIÓN
// ===================================================================

/**
 * Crear aplicación de método completo
 */
function createMethodApplication(method) {
    const requiredParams = Object.entries(method.parameters)
        .filter(([, config]) => config.required)
        .map(([name, config]) => `${name}: ${getDefaultValueForType(config.type)}`)
        .join(', ');

    if (requiredParams) {
        return `${method.trigger}({ ${requiredParams} })`;
    } else {
        return `${method.trigger}()`;
    }
}

/**
 * Crear aplicación de parámetro
 */
function createParameterApplication(paramName, paramConfig) {
    const defaultValue = paramConfig.default !== undefined 
        ? JSON.stringify(paramConfig.default)
        : getDefaultValueForType(paramConfig.type);
    
    return `${paramName}: ${defaultValue}`;
}

/**
 * Obtener valor por defecto para un tipo
 */
function getDefaultValueForType(type) {
    switch (type) {
        case 'string': return '""';
        case 'number': return '0';
        case 'boolean': return 'false';
        case 'array': return '[]';
        case 'object': return '{}';
        default: return 'null';
    }
}

// ===================================================================
// UTILIDADES DE DOCUMENTACIÓN
// ===================================================================

/**
 * Crear documentación de método
 */
function createMethodDocumentation(method) {
    let doc = `**${method.name}**\n\n${method.description}\n\n`;
    
    // Parámetros
    if (Object.keys(method.parameters).length > 0) {
        doc += '**Parameters:**\n';
        Object.entries(method.parameters).forEach(([name, config]) => {
            const required = config.required ? '*(required)*' : '*(optional)*';
            doc += `- \`${name}\` (${config.type}) ${required}: ${config.description}\n`;
        });
        doc += '\n';
    }

    // Ejemplo de uso
    const example = method.config.examples?.[0] || createMethodApplication(method);
    doc += `**Example:**\n\`\`\`\n${example}\n\`\`\``;

    return doc;
}

/**
 * Crear documentación de parámetro
 */
function createParameterDocumentation(paramName, paramConfig) {
    let doc = `**${paramName}** (${paramConfig.type})\n\n${paramConfig.description}\n\n`;
    
    if (paramConfig.default !== undefined) {
        doc += `**Default:** \`${JSON.stringify(paramConfig.default)}\`\n\n`;
    }

    if (paramConfig.validation) {
        doc += '**Validation:**\n';
        if (paramConfig.validation.min !== undefined) {
            doc += `- Minimum: ${paramConfig.validation.min}\n`;
        }
        if (paramConfig.validation.max !== undefined) {
            doc += `- Maximum: ${paramConfig.validation.max}\n`;
        }
        if (paramConfig.validation.enum) {
            doc += `- Valid options: ${paramConfig.validation.enum.join(', ')}\n`;
        }
    }

    return doc;
}

// ===================================================================
// EXTRACCIÓN Y VALIDACIÓN
// ===================================================================

/**
 * Extraer métodos Alpine del código
 */
function extractMethodsFromCode(code) {
    const methods = [];
    const methodRegex = /@(\w+)\s*\(\s*(\{[^}]*\})?\s*\)/g;
    let match;

    while ((match = methodRegex.exec(code)) !== null) {
        const [fullMatch, methodName, parametersStr] = match;
        
        try {
            const parameters = parametersStr ? parseParameters(parametersStr) : {};
            
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

/**
 * Validar llamada de método individual
 */
function validateMethodCall(methodCall, plugin) {
    const errors = [];
    const warnings = [];

    try {
        const method = plugin.getMethod(methodCall.trigger);
        
        if (!method) {
            errors.push({
                type: 'unknown-method',
                message: `Unknown Alpine method: ${methodCall.trigger}`,
                severity: 'error',
                start: methodCall.start,
                end: methodCall.end
            });
            return { errors, warnings };
        }

        // Validar parámetros
        const paramValidation = validateMethodParameters(methodCall.parameters, method);
        errors.push(...paramValidation.errors);
        warnings.push(...paramValidation.warnings);

    } catch (error) {
        errors.push({
            type: 'validation-error',
            message: `Error validating method ${methodCall.trigger}: ${error.message}`,
            severity: 'error',
            start: methodCall.start,
            end: methodCall.end
        });
    }

    return { errors, warnings };
}

/**
 * Validar parámetros de método
 */
function validateMethodParameters(parameters, method) {
    const errors = [];
    const warnings = [];

    // Verificar parámetros requeridos
    Object.entries(method.parameters).forEach(([paramName, paramConfig]) => {
        if (paramConfig.required && !(paramName in parameters)) {
            errors.push({
                type: 'missing-parameter',
                message: `Required parameter '${paramName}' is missing`,
                severity: 'error'
            });
        }
    });

    // Verificar parámetros existentes
    Object.entries(parameters).forEach(([paramName, value]) => {
        const paramConfig = method.parameters[paramName];
        
        if (!paramConfig) {
            warnings.push({
                type: 'unknown-parameter',
                message: `Unknown parameter '${paramName}' for method ${method.trigger}`,
                severity: 'warning'
            });
            return;
        }

        // Validar tipo
        const typeValidation = validateParameterType(value, paramConfig);
        if (!typeValidation.valid) {
            errors.push({
                type: 'invalid-type',
                message: `Parameter '${paramName}' must be of type ${paramConfig.type}, got ${typeof value}`,
                severity: 'error'
            });
        }

        // Validar restricciones
        const constraintValidation = validateParameterConstraints(value, paramConfig);
        errors.push(...constraintValidation.errors);
        warnings.push(...constraintValidation.warnings);
    });

    return { errors, warnings };
}

/**
 * Validar tipo de parámetro
 */
function validateParameterType(value, paramConfig) {
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
            return { valid: true }; // Tipo desconocido, aceptar
    }
}

/**
 * Validar restricciones de parámetro
 */
function validateParameterConstraints(value, paramConfig) {
    const errors = [];
    const warnings = [];

    if (!paramConfig.validation) return { errors, warnings };

    const validation = paramConfig.validation;

    // Validar rango numérico
    if (typeof value === 'number') {
        if (validation.min !== undefined && value < validation.min) {
            errors.push({
                type: 'value-too-small',
                message: `Value ${value} is below minimum ${validation.min}`,
                severity: 'error'
            });
        }
        if (validation.max !== undefined && value > validation.max) {
            errors.push({
                type: 'value-too-large',
                message: `Value ${value} is above maximum ${validation.max}`,
                severity: 'error'
            });
        }
    }

    // Validar enum
    if (validation.enum && !validation.enum.includes(value)) {
        errors.push({
            type: 'invalid-enum-value',
            message: `Value '${value}' is not one of: ${validation.enum.join(', ')}`,
            severity: 'error'
        });
    }

    // Validar longitud de string
    if (typeof value === 'string' && validation.length) {
        if (validation.length.min && value.length < validation.length.min) {
            warnings.push({
                type: 'string-too-short',
                message: `String length ${value.length} is below recommended minimum ${validation.length.min}`,
                severity: 'warning'
            });
        }
        if (validation.length.max && value.length > validation.length.max) {
            errors.push({
                type: 'string-too-long',
                message: `String length ${value.length} exceeds maximum ${validation.length.max}`,
                severity: 'error'
            });
        }
    }

    return { errors, warnings };
}

// ===================================================================
// UTILIDADES DE PARSING
// ===================================================================

/**
 * Parsear parámetros completos
 */
function parseParameters(parametersStr) {
    try {
        // Remover llaves externas y evaluar como objeto JavaScript
        const cleanStr = parametersStr.trim().replace(/^{|}$/g, '');
        if (!cleanStr) return {};
        
        // Crear función que evalúe el objeto de forma segura
        const objectStr = `{ ${cleanStr} }`;
        return Function(`"use strict"; return (${objectStr})`)();
    } catch (error) {
        console.warn('⚠️ Error parsing parameters:', error);
        return {};
    }
}

/**
 * Parsear parámetros parciales (para autocompletado)
 */
function parsePartialParameters(paramsStr) {
    const params = {};
    
    try {
        // Split por comas, pero respetando objetos y strings
        const parts = smartSplit(paramsStr, ',');
        
        parts.forEach(part => {
            const colonIndex = part.indexOf(':');
            if (colonIndex > 0) {
                const key = part.substring(0, colonIndex).trim();
                const value = part.substring(colonIndex + 1).trim();
                
                try {
                    params[key] = Function(`"use strict"; return (${value})`)();
                } catch {
                    params[key] = value; // Mantener como string si no se puede parsear
                }
            }
        });
    } catch (error) {
        console.warn('⚠️ Error parsing partial parameters:', error);
    }
    
    return params;
}

/**
 * Split inteligente que respeta comillas y llaves
 */
function smartSplit(str, delimiter) {
    const parts = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    let braceLevel = 0;
    
    for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const prevChar = i > 0 ? str[i - 1] : '';
        
        if ((char === '"' || char === "'") && prevChar !== '\\') {
            if (!inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar) {
                inQuotes = false;
                quoteChar = '';
            }
        } else if (!inQuotes) {
            if (char === '{') braceLevel++;
            else if (char === '}') braceLevel--;
            else if (char === delimiter && braceLevel === 0) {
                parts.push(current.trim());
                current = '';
                continue;
            }
        }
        
        current += char;
    }
    
    if (current.trim()) {
        parts.push(current.trim());
    }
    
    return parts;
}

// ===================================================================
// UTILIDADES AUXILIARES
// ===================================================================

/**
 * Calcular boost para método (prioridad en sugerencias)
 */
function calculateMethodBoost(method) {
    let boost = 50; // Base
    
    // Boost por uso frecuente
    if (method.usageCount > 10) boost += 30;
    else if (method.usageCount > 5) boost += 20;
    else if (method.usageCount > 0) boost += 10;
    
    // Boost por métodos globales
    if (method.isGlobal) boost += 15;
    
    // Boost por categoría (UI components más prioritarios)
    if (method.category === 'ui') boost += 10;
    
    return boost;
}

/**
 * Generar sugerencias numéricas para un rango
 */
function generateNumberSuggestions(min, max) {
    const suggestions = [];
    const range = max - min;
    
    if (range <= 10) {
        // Si el rango es pequeño, sugerir todos los valores
        for (let i = min; i <= max; i++) {
            suggestions.push(i);
        }
    } else {
        // Si el rango es grande, sugerir valores comunes
        suggestions.push(min, Math.floor((min + max) / 2), max);
        
        // Agregar algunos valores redondos en el rango
        const step = Math.pow(10, Math.floor(Math.log10(range)) - 1);
        for (let i = Math.ceil(min / step) * step; i < max; i += step) {
            if (!suggestions.includes(i)) {
                suggestions.push(i);
            }
        }
    }
    
    return suggestions.sort((a, b) => a - b).slice(0, 5); // Máximo 5 sugerencias
}