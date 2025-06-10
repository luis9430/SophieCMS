// ===================================================================
// utils/alpineEditorHelpers.js  
// Responsabilidad: Funciones específicas para CodeMirror + Alpine
// ===================================================================

import {
    getAllAlpineDirectives,
    alpineMagicProperties,
    alpineSnippets,
    alpineModifiers,
    isValidAlpineDirective,
    getDirectiveInfo,
    getDirectivesByCategory
} from './alpineMetadata.js';

// 🎯 IMPORTAR SISTEMA DE VARIABLES
import {
    getVariableCompletions,
    getVariableContentCompletions,
    validateVariablesInCode,
    analyzeVariableUsage
} from './variableCompletionHelpers.js';

/**
 * 🎯 AUTOCOMPLETADO ALPINE PARA CODEMIRROR
 */

/**
 * Obtener sugerencias de directivas Alpine basadas en contexto
 */
const getAlpineCompletions = (context) => {
    if (!context || !context.state) return [];

    const suggestions = [];
    const word = context.matchBefore(/[\w-:@.${}]*/);
    
    if (!word || (word.from === word.to && !context.explicit)) {
        return [];
    }

    const searchText = word.text.toLowerCase();
    const allDirectives = getAllAlpineDirectives();

    // 🎯 1. SUGERENCIAS DE VARIABLES (PRIMERA PRIORIDAD)
    const variableSuggestions = getVariableCompletions(context);
    suggestions.push(...variableSuggestions);

    // 🎯 2. SUGERENCIAS DENTRO DE {{ }} (CONTENIDO DE VARIABLES)
    const variableContentSuggestions = getVariableContentCompletions(context);
    suggestions.push(...variableContentSuggestions);

    // 📝 3. SUGERENCIAS DE DIRECTIVAS ALPINE
    Object.entries(allDirectives).forEach(([name, directive]) => {
        if (name.toLowerCase().includes(searchText) && suggestions.length < 40) {
            suggestions.push({
                label: name,
                type: 'alpine-directive',
                info: `Alpine.js - ${directive.category}`,
                detail: directive.description,
                boost: getDirectiveBoost(directive.category),
                apply: (view, completion, from, to) => {
                    // Insertar directiva con formato correcto
                    let insertText = name;
                    
                    if (directive.expectsValue) {
                        insertText += '=""';
                        // Mover cursor dentro de las comillas
                        view.dispatch({
                            changes: { from, to, insert: insertText },
                            selection: { anchor: from + insertText.length - 1 }
                        });
                        return;
                    }
                    
                    view.dispatch({
                        changes: { from, to, insert: insertText }
                    });
                }
            });
        }
    });

    // 🎭 4. SUGERENCIAS DE VARIABLES MÁGICAS ($el, $refs, etc.)
    if (searchText.startsWith('$') || searchText === '') {
        Object.entries(alpineMagicProperties).forEach(([name, prop]) => {
            if (name.toLowerCase().includes(searchText) && suggestions.length < 45) {
                suggestions.push({
                    label: name,
                    type: 'alpine-magic',
                    info: `Alpine Magic - ${prop.category}`,
                    detail: `${prop.description} → ${prop.returnType}`,
                    boost: 90 // Alta prioridad para variables mágicas
                });
            }
        });
    }

    // 🔧 5. SUGERENCIAS CONTEXTUALES
    const contextualSuggestions = getContextualAlpineSuggestions(context, searchText);
    suggestions.push(...contextualSuggestions);

    // ⚡ 6. SNIPPETS DE ALPINE
    if (searchText.length >= 2) {
        const snippetSuggestions = getAlpineSnippetSuggestions(searchText);
        suggestions.push(...snippetSuggestions);
    }

    return suggestions.slice(0, 50); // Aumentado para incluir variables
};

/**
 * Obtener sugerencias contextuales basadas en dónde está el cursor
 */
const getContextualAlpineSuggestions = (context, searchText) => {
    const suggestions = [];
    const pos = context.pos;
    const doc = context.state.doc;
    const line = doc.lineAt(pos);
    const beforeCursor = line.text.slice(0, pos - line.from);

    // 🎯 Si estamos dentro de una directiva x-bind: o :
    if (beforeCursor.includes('x-bind:') || beforeCursor.includes(' :')) {
        const bindableAttributes = [
            'class', 'style', 'src', 'href', 'title', 'alt', 'disabled', 'hidden',
            'value', 'placeholder', 'data-*', 'aria-*', 'id'
        ];
        
        bindableAttributes.forEach(attr => {
            if (attr.includes(searchText)) {
                suggestions.push({
                    label: attr,
                    type: 'html-attribute',
                    info: 'Bindeable attribute',
                    detail: `Atributo que puede ser vinculado: ${attr}`,
                    boost: 85
                });
            }
        });
    }

    // 🎯 Si estamos después de @ (eventos)
    if (beforeCursor.includes('@') && !beforeCursor.includes('="')) {
        const commonEvents = [
            'click', 'input', 'change', 'submit', 'focus', 'blur',
            'mouseenter', 'mouseleave', 'keydown', 'keyup', 'scroll'
        ];
        
        commonEvents.forEach(event => {
            const eventName = `@${event}`;
            if (eventName.includes(searchText)) {
                suggestions.push({
                    label: eventName,
                    type: 'alpine-event',
                    info: 'Alpine Event',
                    detail: `Evento: ${event}`,
                    boost: 88
                });
            }
        });
    }

    // 🎯 Si estamos dentro de comillas de una directiva
    if (isInsideDirectiveValue(beforeCursor)) {
        // Sugerir expresiones JavaScript comunes
        const jsExpressions = [
            'true', 'false', 'null', 'undefined',
            '!', '!!', '&&', '||', '?', ':',
            '$el', '$refs', '$store', '$data'
        ];
        
        jsExpressions.forEach(expr => {
            if (expr.includes(searchText)) {
                suggestions.push({
                    label: expr,
                    type: 'javascript',
                    info: 'JavaScript',
                    detail: `Expresión JavaScript: ${expr}`,
                    boost: 70
                });
            }
        });
    }

    return suggestions;
};

/**
 * Obtener sugerencias de snippets Alpine
 */
const getAlpineSnippetSuggestions = (searchText) => {
    const suggestions = [];
    
    Object.entries(alpineSnippets).forEach(([key, snippet]) => {
        if (key.includes(searchText) || snippet.label.toLowerCase().includes(searchText)) {
            suggestions.push({
                label: `alpine:${key}`,
                type: 'alpine-snippet',
                info: `Snippet - ${snippet.category}`,
                detail: snippet.description,
                boost: 95, // Alta prioridad para snippets
                apply: (view, completion, from, to) => {
                    // Procesar template con placeholders
                    const processedTemplate = processSnippetTemplate(snippet.template);
                    
                    view.dispatch({
                        changes: { from, to, insert: processedTemplate },
                        selection: { anchor: from + findFirstPlaceholder(processedTemplate) }
                    });
                }
            });
        }
    });
    
    return suggestions;
};

/**
 * 🔍 VALIDACIÓN DE SINTAXIS ALPINE
 */

/**
 * Validar código Alpine + Variables y devolver errores
 */
const validateAlpineSyntax = (code) => {
    const errors = [];
    
    try {
        // 1. Validar directivas Alpine
        const directiveErrors = validateAlpineDirectives(code);
        errors.push(...directiveErrors);
        
        // 2. Validar expresiones JavaScript dentro de directivas
        const expressionErrors = validateAlpineExpressions(code);
        errors.push(...expressionErrors);
        
        // 3. Validar estructura x-if/x-for con templates
        const structureErrors = validateAlpineStructure(code);
        errors.push(...structureErrors);
        
        // 4. Validar uso correcto de modificadores
        const modifierErrors = validateAlpineModifiers(code);
        errors.push(...modifierErrors);

        // 🎯 5. VALIDAR VARIABLES DEL SISTEMA
        const variableErrors = validateVariablesInCode(code);
        errors.push(...variableErrors);
        
    } catch (error) {
        errors.push({
            type: 'validation-error',
            message: `Error validando Alpine + Variables: ${error.message}`,
            severity: 'error'
        });
    }
    
    return errors;
};

/**
 * Validar directivas Alpine en el código
 */
const validateAlpineDirectives = (code) => {
    const errors = [];
    const directivePattern = /(x-[\w-]+(?::[^=\s]*)?|@[\w-]+(?:\.[\w-]+)*?)(?:="([^"]*)"|='([^']*)'|\s|>)/g;
    let match;
    
    while ((match = directivePattern.exec(code)) !== null) {
        const [fullMatch, directive, doubleQuoteValue, singleQuoteValue] = match;
        const value = doubleQuoteValue || singleQuoteValue;
        
        // Verificar si la directiva existe
        if (!isValidAlpineDirective(directive)) {
            errors.push({
                type: 'unknown-directive',
                message: `Directiva Alpine desconocida: "${directive}"`,
                position: match.index,
                length: directive.length,
                severity: 'error',
                suggestion: getSimilarDirectives(directive)
            });
            continue;
        }
        
        const directiveInfo = getDirectiveInfo(directive);
        
        // Verificar si la directiva requiere valor
        if (directiveInfo?.expectsValue && !value) {
            errors.push({
                type: 'missing-value',
                message: `La directiva "${directive}" requiere un valor`,
                position: match.index,
                length: fullMatch.length,
                severity: 'error'
            });
        }
        
        // Verificar si la directiva no debe tener valor
        if (!directiveInfo?.expectsValue && value) {
            errors.push({
                type: 'unexpected-value',
                message: `La directiva "${directive}" no debe tener valor`,
                position: match.index,
                length: fullMatch.length,
                severity: 'warning'
            });
        }
    }
    
    return errors;
};

/**
 * Validar expresiones JavaScript dentro de directivas Alpine
 */
const validateAlpineExpressions = (code) => {
    const errors = [];
    const expressionPattern = /(x-[\w-]+|@[\w-]+(?:\.[\w-]+)*)="([^"]+)"/g;
    let match;
    
    while ((match = expressionPattern.exec(code)) !== null) {
        const [fullMatch, directive, expression] = match;
        
        // Saltar directivas que no contienen JavaScript
        if (['x-cloak', 'x-ignore'].includes(directive)) continue;
        
        // Validar expresión JavaScript básica
        const jsErrors = validateJavaScriptExpression(expression, match.index + directive.length + 2);
        errors.push(...jsErrors);
    }
    
    return errors;
};

/**
 * Validar estructura Alpine (x-if necesita template, etc.)
 */
const validateAlpineStructure = (code) => {
    const errors = [];
    
    // Verificar x-if dentro de template
    const xIfPattern = /<(\w+)[^>]*x-if="[^"]*"[^>]*>/g;
    let match;
    
    while ((match = xIfPattern.exec(code)) !== null) {
        const tagName = match[1];
        
        if (tagName !== 'template') {
            errors.push({
                type: 'invalid-structure',
                message: 'x-if debe usarse en elementos <template>',
                position: match.index,
                length: match[0].length,
                severity: 'error',
                suggestion: `Cambia <${tagName}> por <template>`
            });
        }
    }
    
    // Verificar x-for dentro de template
    const xForPattern = /<(\w+)[^>]*x-for="[^"]*"[^>]*>/g;
    while ((match = xForPattern.exec(code)) !== null) {
        const tagName = match[1];
        
        if (tagName !== 'template') {
            errors.push({
                type: 'invalid-structure',
                message: 'x-for debe usarse en elementos <template>',
                position: match.index,
                length: match[0].length,
                severity: 'error',
                suggestion: `Cambia <${tagName}> por <template>`
            });
        }
    }
    
    return errors;
};

/**
 * Validar modificadores Alpine
 */
const validateAlpineModifiers = (code) => {
    const errors = [];
    const modifierPattern = /@([\w-]+)\.([\w.-]+)/g;
    let match;
    
    while ((match = modifierPattern.exec(code)) !== null) {
        const [fullMatch, eventName, modifierChain] = match;
        const modifiers = modifierChain.split('.');
        
        modifiers.forEach(modifier => {
            if (!alpineModifiers[modifier]) {
                errors.push({
                    type: 'unknown-modifier',
                    message: `Modificador desconocido: "${modifier}"`,
                    position: match.index,
                    length: fullMatch.length,
                    severity: 'warning',
                    suggestion: getKnownModifiers(eventName)
                });
            }
        });
    }
    
    return errors;
};

/**
 * 🎨 ANÁLISIS DE CÓDIGO ALPINE
 */

/**
 * Extraer información Alpine + Variables del código
 */
const analyzeAlpineCode = (code) => {
    const analysis = {
        components: [],
        directives: new Set(),
        events: new Set(),
        magicProperties: new Set(),
        variables: {}, // 🎯 AÑADIR ANÁLISIS DE VARIABLES
        complexity: 0,
        suggestions: []
    };
    
    try {
        // Encontrar componentes (elementos con x-data)
        const componentPattern = /<[^>]+x-data="([^"]*)"[^>]*>/g;
        let match;
        
        while ((match = componentPattern.exec(code)) !== null) {
            analysis.components.push({
                position: match.index,
                data: match[1],
                element: match[0]
            });
        }
        
        // Encontrar todas las directivas
        const directivePattern = /(x-[\w-]+|@[\w-]+)/g;
        while ((match = directivePattern.exec(code)) !== null) {
            analysis.directives.add(match[1]);
        }
        
        // Encontrar variables mágicas
        const magicPattern = /\$[\w]+/g;
        while ((match = magicPattern.exec(code)) !== null) {
            analysis.magicProperties.add(match[0]);
        }

        // 🎯 ANALIZAR VARIABLES DEL SISTEMA
        analysis.variables = analyzeVariableUsage(code);
        
        // Calcular complejidad (incluyendo variables)
        analysis.complexity = calculateAlpineComplexity(analysis);
        
        // Generar sugerencias (incluyendo variables)
        analysis.suggestions = generateAlpineSuggestions(analysis);
        
    } catch (error) {
        console.warn('Error analyzing Alpine + Variables code:', error);
    }
    
    return analysis;
};

/**
 * 🛠️ FUNCIONES AUXILIARES
 */

/**
 * Determinar boost de prioridad basado en categoría
 */
const getDirectiveBoost = (category) => {
    const boosts = {
        'core': 100,
        'events': 95,
        'forms': 90,
        'display': 85,
        'lifecycle': 80,
        'attributes': 75,
        'animations': 70,
        'utility': 65,
        'advanced': 60
    };
    return boosts[category] || 50;
};

/**
 * Verificar si el cursor está dentro del valor de una directiva
 */
const isInsideDirectiveValue = (beforeCursor) => {
    const lastQuote = Math.max(
        beforeCursor.lastIndexOf('"'),
        beforeCursor.lastIndexOf("'")
    );
    const lastEquals = beforeCursor.lastIndexOf('=');
    
    return lastEquals > -1 && lastQuote > lastEquals;
};

/**
 * Procesar template de snippet con placeholders
 */
const processSnippetTemplate = (template) => {
    // Convertir ${1:placeholder} a placeholder simple
    return template.replace(/\$\{(\d+):([^}]*)\}/g, '$2');
};

/**
 * Encontrar primera posición de placeholder en snippet
 */
const findFirstPlaceholder = (processedTemplate) => {
    // Buscar primer placeholder procesado
    const match = processedTemplate.match(/\$\{\d+:[^}]*\}/);
    return match ? match.index : processedTemplate.length;
};

/**
 * Obtener directivas similares para sugerencias
 */
const getSimilarDirectives = (directive) => {
    const allDirectives = Object.keys(getAllAlpineDirectives());
    
    // Algoritmo simple de distancia para encontrar similares
    return allDirectives
        .filter(d => levenshteinDistance(directive, d) <= 3)
        .slice(0, 3);
};

/**
 * Obtener modificadores conocidos para un evento
 */
const getKnownModifiers = (eventName) => {
    const eventModifiers = Object.keys(alpineModifiers)
        .filter(mod => {
            const modInfo = alpineModifiers[mod];
            return modInfo.applies?.includes('events') || 
                   modInfo.applies?.includes(`@${eventName}`);
        })
        .slice(0, 5);
    
    return eventModifiers.length > 0 ? 
        `Modificadores disponibles: ${eventModifiers.join(', ')}` : 
        'No hay modificadores específicos disponibles';
};

/**
 * Validar expresión JavaScript básica
 */
const validateJavaScriptExpression = (expression, position) => {
    const errors = [];
    
    try {
        // Verificaciones básicas de sintaxis
        if (expression.includes('{{') || expression.includes('}}')) {
            errors.push({
                type: 'invalid-syntax',
                message: 'No usar {{ }} dentro de directivas Alpine',
                position,
                severity: 'error'
            });
        }
        
        // Verificar paréntesis balanceados
        if (!areParenthesesBalanced(expression)) {
            errors.push({
                type: 'syntax-error',
                message: 'Paréntesis no balanceados',
                position,
                severity: 'error'
            });
        }
        
    } catch (error) {
        errors.push({
            type: 'expression-error',
            message: `Error en expresión: ${error.message}`,
            position,
            severity: 'warning'
        });
    }
    
    return errors;
};

/**
 * Calcular complejidad del código Alpine + Variables
 */
const calculateAlpineComplexity = (analysis) => {
    let complexity = 0;
    
    complexity += analysis.components.length * 10;
    complexity += analysis.directives.size * 5;
    complexity += analysis.events.size * 3;
    complexity += analysis.magicProperties.size * 2;
    
    // 🎯 AÑADIR COMPLEJIDAD DE VARIABLES
    if (analysis.variables) {
        complexity += analysis.variables.totalVariables * 2;
        complexity += analysis.variables.invalidVariables * 5; // Mayor peso para variables inválidas
        complexity += Object.keys(analysis.variables.variablesByCategory).length * 3;
    }
    
    return complexity;
};

/**
 * Generar sugerencias de mejora (incluyendo variables)
 */
const generateAlpineSuggestions = (analysis) => {
    const suggestions = [];
    
    // Sugerencias Alpine existentes
    if (analysis.components.length === 0) {
        suggestions.push('Considera usar x-data para crear componentes reactivos');
    }
    
    if (analysis.directives.has('x-show') && analysis.directives.has('x-if')) {
        suggestions.push('Usa x-if para renderizado condicional y x-show para visibilidad');
    }
    
    if (analysis.complexity > 100) {
        suggestions.push('Considera dividir en componentes más pequeños');
    }

    // 🎯 SUGERENCIAS DE VARIABLES
    if (analysis.variables) {
        if (analysis.variables.totalVariables === 0) {
            suggestions.push('Añade variables {{ }} para hacer tu contenido dinámico');
        }

        if (analysis.variables.invalidVariables > 0) {
            suggestions.push(`Corrige ${analysis.variables.invalidVariables} variable(s) inválida(s)`);
        }

        if (analysis.variables.recommendations) {
            suggestions.push(...analysis.variables.recommendations.slice(0, 2));
        }

        // Si usa Alpine pero no variables, sugerir combinación
        if (analysis.components.length > 0 && analysis.variables.totalVariables === 0) {
            suggestions.push('Combina Alpine.js con variables para mayor dinamismo');
        }
    }
    
    return suggestions;
};

/**
 * Verificar paréntesis balanceados
 */
const areParenthesesBalanced = (str) => {
    let count = 0;
    for (let char of str) {
        if (char === '(') count++;
        if (char === ')') count--;
        if (count < 0) return false;
    }
    return count === 0;
};

/**
 * Calcular distancia de Levenshtein simple
 */
const levenshteinDistance = (str1, str2) => {
    if (str1.length === 0) return str2.length;
    if (str2.length === 0) return str1.length;
    
    const matrix = Array(str2.length + 1).fill(null).map(() => 
        Array(str1.length + 1).fill(null)
    );
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + cost
            );
        }
    }
    
    return matrix[str2.length][str1.length];
};

/**
 * 📤 EXPORTAR FUNCIONES PRINCIPALES
 */
export {
    getAlpineCompletions,
    validateAlpineSyntax,
    analyzeAlpineCode,
    isValidAlpineDirective,
    getDirectiveInfo,
    // 🎯 NUEVAS FUNCIONES DE VARIABLES
    getVariableCompletions,
    getVariableContentCompletions,
    validateVariablesInCode,
    analyzeVariableUsage
};