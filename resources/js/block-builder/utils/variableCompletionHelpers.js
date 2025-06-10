// ===================================================================
// utils/variableCompletionHelpers.js
// Responsabilidad: Autocompletado de variables para CodeMirror
// ===================================================================

import { 
    getAvailableVariables, 
    processVariables,
    validateVariable,
    extractVariables,
    findInvalidVariables,
    formatVariableForInsertion
} from './variableProcessor.js';

/**
 * 🎯 AUTOCOMPLETADO DE VARIABLES PARA CODEMIRROR
 */

/**
 * Obtener sugerencias de variables para autocompletado
 */
const getVariableCompletions = (context) => {
    if (!context || !context.state) return [];

    const suggestions = [];
    const word = context.matchBefore(/\{\{[\w\s.]*\}?/);
    
    // Solo sugerir si estamos dentro de {{ o acabamos de escribir {{
    if (!word && !isStartingVariable(context)) {
        return [];
    }

    const searchText = extractSearchFromVariable(word?.text || '');
    const allVariables = getAvailableVariables();

    // 📝 SUGERENCIAS POR CATEGORÍA
    Object.entries(allVariables).forEach(([categoryKey, category]) => {
        Object.entries(category.variables).forEach(([variablePath, value]) => {
            if (matchesSearch(variablePath, searchText) && suggestions.length < 20) {
                suggestions.push({
                    label: formatVariableForInsertion(variablePath),
                    type: 'variable',
                    info: `${category.title} - Variable`,
                    detail: `${variablePath} → ${truncateValue(value)}`,
                    boost: getVariableBoost(categoryKey),
                    apply: (view, completion, from, to) => {
                        // Insertar variable completa con {{ }}
                        const variableText = formatVariableForInsertion(variablePath);
                        view.dispatch({
                            changes: { from, to, insert: variableText }
                        });
                    }
                });
            }
        });
    });

    // 🔍 SUGERENCIAS DE VARIABLES PERSONALIZADAS SI EXISTEN
    const customSuggestions = getCustomVariableSuggestions(searchText);
    suggestions.push(...customSuggestions);

    return suggestions;
};

/**
 * Obtener sugerencias cuando el usuario escribe dentro de {{ }}
 */
const getVariableContentCompletions = (context) => {
    if (!context || !context.state) return [];

    const suggestions = [];
    const pos = context.pos;
    const doc = context.state.doc;
    const line = doc.lineAt(pos);
    const beforeCursor = line.text.slice(0, pos - line.from);

    // Verificar si estamos dentro de {{ }}
    const variableMatch = beforeCursor.match(/\{\{\s*([^}]*?)$/);
    if (!variableMatch) return [];

    const searchText = variableMatch[1].trim();
    const allVariables = getAvailableVariables();

    // Sugerir solo el nombre de la variable (sin {{ }})
    Object.entries(allVariables).forEach(([categoryKey, category]) => {
        Object.entries(category.variables).forEach(([variablePath, value]) => {
            if (matchesSearch(variablePath, searchText) && suggestions.length < 15) {
                suggestions.push({
                    label: variablePath,
                    type: 'variable-name',
                    info: `${category.title}`,
                    detail: `${truncateValue(value)}`,
                    boost: getVariableBoost(categoryKey) + 10 // Mayor boost cuando ya está en {{ }}
                });
            }
        });
    });

    return suggestions;
};

/**
 * 🔍 VALIDACIÓN DE VARIABLES PARA CODEMIRROR
 */

/**
 * Validar variables en código y devolver errores/warnings
 */
const validateVariablesInCode = (code) => {
    const errors = [];
    
    try {
        // Encontrar variables inválidas
        const invalidVariables = findInvalidVariables(code);
        
        invalidVariables.forEach(variable => {
            const position = findVariablePosition(code, variable);
            errors.push({
                type: 'invalid-variable',
                message: `Variable desconocida: "{{ ${variable} }}"`,
                position: position,
                length: variable.length + 4, // incluir {{ }}
                severity: 'warning',
                suggestion: getSimilarVariables(variable)
            });
        });

        // Verificar sintaxis de variables
        const syntaxErrors = validateVariableSyntax(code);
        errors.push(...syntaxErrors);

    } catch (error) {
        errors.push({
            type: 'validation-error',
            message: `Error validando variables: ${error.message}`,
            severity: 'error'
        });
    }

    return errors;
};

/**
 * Validar sintaxis de variables {{ }}
 */
const validateVariableSyntax = (code) => {
    const errors = [];
    const variablePattern = /\{\{([^}]*)\}\}/g;
    let match;

    while ((match = variablePattern.exec(code)) !== null) {
        const [fullMatch, content] = match;
        const trimmedContent = content.trim();

        // Verificar que no esté vacía
        if (!trimmedContent) {
            errors.push({
                type: 'empty-variable',
                message: 'Variable vacía: {{ }}',
                position: match.index,
                length: fullMatch.length,
                severity: 'error'
            });
            continue;
        }

        // Verificar caracteres válidos
        if (!/^[\w.-]+$/.test(trimmedContent)) {
            errors.push({
                type: 'invalid-characters',
                message: `Variable con caracteres inválidos: "{{ ${trimmedContent} }}"`,
                position: match.index,
                length: fullMatch.length,
                severity: 'warning',
                suggestion: 'Las variables solo pueden contener letras, números, puntos y guiones'
            });
        }

        // Verificar formato válido (ej: user.name, no .name o name.)
        if (trimmedContent.startsWith('.') || trimmedContent.endsWith('.')) {
            errors.push({
                type: 'malformed-variable',
                message: `Variable mal formada: "{{ ${trimmedContent} }}"`,
                position: match.index,
                length: fullMatch.length,
                severity: 'error',
                suggestion: 'Las variables no pueden empezar o terminar con punto'
            });
        }
    }

    return errors;
};

/**
 * 📊 ANÁLISIS DE VARIABLES
 */

/**
 * Analizar uso de variables en el código
 */
const analyzeVariableUsage = (code) => {
    const analysis = {
        totalVariables: 0,
        validVariables: 0,
        invalidVariables: 0,
        variablesByCategory: {},
        unusedCategories: [],
        recommendations: []
    };

    try {
        const usedVariables = extractVariables(code);
        const invalidVariables = findInvalidVariables(code);
        const allVariables = getAvailableVariables();

        analysis.totalVariables = usedVariables.length;
        analysis.invalidVariables = invalidVariables.length;
        analysis.validVariables = analysis.totalVariables - analysis.invalidVariables;

        // Analizar por categoría
        Object.entries(allVariables).forEach(([categoryKey, category]) => {
            const categoryUsage = usedVariables.filter(variable => 
                Object.keys(category.variables).includes(variable)
            );
            
            if (categoryUsage.length > 0) {
                analysis.variablesByCategory[categoryKey] = {
                    title: category.title,
                    used: categoryUsage.length,
                    available: Object.keys(category.variables).length,
                    variables: categoryUsage
                };
            } else {
                analysis.unusedCategories.push(categoryKey);
            }
        });

        // Generar recomendaciones
        analysis.recommendations = generateVariableRecommendations(analysis, usedVariables, allVariables);

    } catch (error) {
        console.warn('Error analyzing variable usage:', error);
    }

    return analysis;
};

/**
 * 🛠️ FUNCIONES AUXILIARES
 */

/**
 * Verificar si estamos empezando a escribir una variable
 */
const isStartingVariable = (context) => {
    const pos = context.pos;
    const doc = context.state.doc;
    const line = doc.lineAt(pos);
    const beforeCursor = line.text.slice(Math.max(0, pos - line.from - 2), pos - line.from);
    
    return beforeCursor.endsWith('{{');
};

/**
 * Extraer texto de búsqueda de una variable parcial
 */
const extractSearchFromVariable = (text) => {
    if (!text) return '';
    
    // Extraer contenido entre {{ }}
    const match = text.match(/\{\{\s*([^}]*)/);
    return match ? match[1].trim() : '';
};

/**
 * Verificar si una variable coincide con la búsqueda
 */
const matchesSearch = (variablePath, searchText) => {
    if (!searchText) return true;
    return variablePath.toLowerCase().includes(searchText.toLowerCase());
};

/**
 * Truncar valor para mostrar en sugerencias
 */
const truncateValue = (value) => {
    const str = String(value);
    return str.length > 30 ? str.substring(0, 30) + '...' : str;
};

/**
 * Obtener boost de prioridad por categoría
 */
const getVariableBoost = (categoryKey) => {
    const boosts = {
        'user': 100,
        'system': 90,
        'site': 85,
        'templates': 80
    };
    return boosts[categoryKey] || 70;
};

/**
 * Obtener sugerencias de variables personalizadas
 */
const getCustomVariableSuggestions = (searchText) => {
    // Aquí podrías añadir lógica para variables personalizadas
    // del usuario, recientes, favoritas, etc.
    const suggestions = [];
    
    // Variables de ejemplo/template comunes
    const templateVariables = [
        { name: 'title', value: 'Título de ejemplo', category: 'Template' },
        { name: 'content', value: 'Contenido de ejemplo', category: 'Template' },
        { name: 'image.url', value: '/example.jpg', category: 'Template' },
        { name: 'button.text', value: 'Click aquí', category: 'Template' }
    ];

    templateVariables.forEach(variable => {
        if (matchesSearch(variable.name, searchText)) {
            suggestions.push({
                label: formatVariableForInsertion(variable.name),
                type: 'template-variable',
                info: `${variable.category} - Plantilla`,
                detail: `${variable.name} → ${variable.value}`,
                boost: 75
            });
        }
    });

    return suggestions;
};

/**
 * Encontrar posición de una variable en el código
 */
const findVariablePosition = (code, variable) => {
    const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(variable)}\\s*\\}\\}`, 'g');
    const match = pattern.exec(code);
    return match ? match.index : 0;
};

/**
 * Obtener variables similares para sugerencias
 */
const getSimilarVariables = (variable) => {
    const allVariables = getAvailableVariables();
    const allPaths = [];
    
    Object.values(allVariables).forEach(category => {
        allPaths.push(...Object.keys(category.variables));
    });

    // Algoritmo simple de distancia para encontrar similares
    const similar = allPaths
        .filter(path => levenshteinDistance(variable, path) <= 2)
        .slice(0, 3);

    return similar.length > 0 ? 
        `¿Quisiste decir: ${similar.join(', ')}?` : 
        'Revisa las variables disponibles';
};

/**
 * Generar recomendaciones sobre variables
 */
const generateVariableRecommendations = (analysis, usedVariables, allVariables) => {
    const recommendations = [];

    // Si no usa variables
    if (analysis.totalVariables === 0) {
        recommendations.push('Considera usar variables para hacer tu contenido dinámico');
    }

    // Si tiene variables inválidas
    if (analysis.invalidVariables > 0) {
        recommendations.push(`Corrige ${analysis.invalidVariables} variable(s) inválida(s)`);
    }

    // Si solo usa una categoría
    const categoriesUsed = Object.keys(analysis.variablesByCategory).length;
    if (categoriesUsed === 1 && analysis.totalVariables > 1) {
        recommendations.push('Explora variables de otras categorías para más funcionalidad');
    }

    // Sugerir variables populares no usadas
    const popularVariables = ['user.name', 'current.date', 'site.title'];
    const notUsed = popularVariables.filter(v => !usedVariables.includes(v));
    if (notUsed.length > 0) {
        recommendations.push(`Variables útiles: ${notUsed.slice(0, 2).join(', ')}`);
    }

    return recommendations;
};

/**
 * Calcular distancia de Levenshtein
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
 * Escapa caracteres especiales para regex
 */
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * 📤 EXPORTAR FUNCIONES PRINCIPALES
 */
export {
    getVariableCompletions,
    getVariableContentCompletions,
    validateVariablesInCode,
    analyzeVariableUsage
};