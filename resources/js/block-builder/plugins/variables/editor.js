// ===================================================================
// plugins/variables/editor.js
// Responsabilidad: Autocompletado específico para variables en CodeMirror
// ===================================================================

/**
 * Obtener sugerencias de variables para CodeMirror
 * @param {Object} context - Contexto de CodeMirror
 * @param {Object} plugin - Instancia del plugin de variables
 * @returns {Array} Sugerencias de autocompletado
 */
export const getVariableCompletions = (context, plugin) => {
    if (!context || !context.state || !plugin) return [];

    const suggestions = [];
    const word = context.matchBefore(/\{\{[\w\s.]*\}?/);
    
    // Solo sugerir si estamos dentro de {{ o acabamos de escribir {{
    if (!word && !isStartingVariable(context)) {
        return [];
    }

    const searchText = extractSearchFromVariable(word?.text || '');
    const allVariables = plugin.getAvailableVariables();

    // 📝 SUGERENCIAS POR PROVIDER CON PRIORIDAD
    const sortedProviders = getSortedProvidersByPriority(allVariables);
    
    for (const [providerKey, providerData] of sortedProviders) {
        if (suggestions.length >= 25) break; // Límite de sugerencias
        
        Object.entries(providerData.variables).forEach(([variablePath, value]) => {
            if (matchesSearch(variablePath, searchText) && suggestions.length < 25) {
                suggestions.push({
                    label: plugin.formatVariableForInsertion(variablePath),
                    type: 'variable',
                    info: `${providerData.title} - Variable`,
                    detail: `${variablePath} → ${truncateValue(value)}`,
                    boost: getProviderBoost(providerData.priority),
                    section: providerData.title,
                    apply: (view, completion, from, to) => {
                        // Insertar variable completa con {{ }}
                        const variableText = plugin.formatVariableForInsertion(variablePath);
                        view.dispatch({
                            changes: { from, to, insert: variableText }
                        });
                    }
                });
            }
        });
    }

    // 🔍 SUGERENCIAS DE VARIABLES RECIENTES (si están disponibles)
    const recentSuggestions = getRecentVariableSuggestions(searchText, plugin);
    suggestions.push(...recentSuggestions);

    // 📊 SUGERENCIAS CONTEXTUALES
    const contextualSuggestions = getContextualVariableSuggestions(context, searchText, plugin);
    suggestions.push(...contextualSuggestions);

    return suggestions;
};

/**
 * Obtener sugerencias cuando el usuario escribe dentro de {{ }}
 * @param {Object} context - Contexto de CodeMirror
 * @param {Object} plugin - Instancia del plugin de variables
 * @returns {Array} Sugerencias de nombres de variables
 */
export const getVariableContentCompletions = (context, plugin) => {
    if (!context || !context.state || !plugin) return [];

    const suggestions = [];
    const pos = context.pos;
    const doc = context.state.doc;
    const line = doc.lineAt(pos);
    const beforeCursor = line.text.slice(0, pos - line.from);

    // Verificar si estamos dentro de {{ }}
    const variableMatch = beforeCursor.match(/\{\{\s*([^}]*?)$/);
    if (!variableMatch) return [];

    const searchText = variableMatch[1].trim();
    const allVariables = plugin.getAvailableVariables();

    // Sugerir solo el nombre de la variable (sin {{ }})
    const sortedProviders = getSortedProvidersByPriority(allVariables);
    
    for (const [providerKey, providerData] of sortedProviders) {
        if (suggestions.length >= 20) break;
        
        Object.entries(providerData.variables).forEach(([variablePath, value]) => {
            if (matchesSearch(variablePath, searchText) && suggestions.length < 20) {
                suggestions.push({
                    label: variablePath,
                    type: 'variable-name',
                    info: providerData.title,
                    detail: `${truncateValue(value)}`,
                    boost: getProviderBoost(providerData.priority) + 10, // Mayor boost cuando ya está en {{ }}
                    section: providerData.title
                });
            }
        });
    }

    // Añadir sugerencias de autocompletado inteligente
    const smartSuggestions = getSmartCompletions(searchText, allVariables);
    suggestions.push(...smartSuggestions);

    return suggestions;
};

/**
 * Validar variables en tiempo real para CodeMirror
 * @param {string} code - Código a validar
 * @param {Object} plugin - Instancia del plugin de variables
 * @returns {Array} Errores de validación
 */
export const validateVariablesInCode = (code, plugin) => {
    const errors = [];
    
    try {
        // Encontrar variables inválidas
        const invalidVariables = plugin.findInvalidVariables(code);
        
        invalidVariables.forEach(variable => {
            const position = findVariablePosition(code, variable);
            const similarVars = plugin.processor.getSimilarVariables(variable);
            
            errors.push({
                type: 'invalid-variable',
                message: `Variable desconocida: "{{ ${variable} }}"`,
                position: position,
                length: variable.length + 4, // incluir {{ }}
                severity: 'warning',
                suggestion: similarVars.length > 0 ? 
                    `¿Quisiste decir: ${similarVars.slice(0, 3).join(', ')}?` : 
                    'Revisa las variables disponibles',
                fixes: similarVars.slice(0, 3).map(similarVar => ({
                    title: `Cambiar a "{{ ${similarVar} }}"`,
                    changes: [{
                        from: position,
                        to: position + variable.length + 4,
                        insert: plugin.formatVariableForInsertion(similarVar)
                    }]
                }))
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
 * Obtener análisis detallado para el editor
 * @param {string} code - Código a analizar
 * @param {Object} plugin - Instancia del plugin de variables
 * @returns {Object} Análisis detallado
 */
export const analyzeVariableUsage = (code, plugin) => {
    const analysis = {
        totalVariables: 0,
        validVariables: 0,
        invalidVariables: 0,
        variablesByProvider: {},
        unusedProviders: [],
        recommendations: [],
        editorHints: []
    };

    try {
        const usedVariables = plugin.extractVariables(code);
        const invalidVariables = plugin.findInvalidVariables(code);
        const allVariables = plugin.getAvailableVariables();

        analysis.totalVariables = usedVariables.length;
        analysis.invalidVariables = invalidVariables.length;
        analysis.validVariables = analysis.totalVariables - analysis.invalidVariables;

        // Analizar por provider
        Object.entries(allVariables).forEach(([providerKey, providerData]) => {
            const providerVars = Object.keys(providerData.variables);
            const usedFromProvider = usedVariables.filter(v => providerVars.includes(v));
            
            if (usedFromProvider.length > 0) {
                analysis.variablesByProvider[providerKey] = {
                    title: providerData.title,
                    used: usedFromProvider.length,
                    available: providerVars.length,
                    variables: usedFromProvider,
                    coverage: Math.round((usedFromProvider.length / providerVars.length) * 100)
                };
            } else {
                analysis.unusedProviders.push({
                    key: providerKey,
                    title: providerData.title,
                    availableCount: providerVars.length
                });
            }
        });

        // Generar recomendaciones específicas para el editor
        analysis.recommendations = generateEditorRecommendations(analysis, usedVariables, allVariables);
        
        // Generar hints específicos para el editor
        analysis.editorHints = generateEditorHints(analysis, invalidVariables, plugin);

    } catch (error) {
        console.warn('Error analyzing variable usage:', error);
    }

    return analysis;
};

// ===================================================================
// FUNCIONES AUXILIARES
// ===================================================================

/**
 * Verificar si estamos empezando a escribir una variable
 * @private
 */
function isStartingVariable(context) {
    const pos = context.pos;
    const doc = context.state.doc;
    const line = doc.lineAt(pos);
    const beforeCursor = line.text.slice(Math.max(0, pos - line.from - 2), pos - line.from);
    
    return beforeCursor.endsWith('{{');
}

/**
 * Extraer texto de búsqueda de una variable parcial
 * @private
 */
function extractSearchFromVariable(text) {
    if (!text) return '';
    
    // Extraer contenido entre {{ }}
    const match = text.match(/\{\{\s*([^}]*)/);
    return match ? match[1].trim() : '';
}

/**
 * Verificar si una variable coincide con la búsqueda
 * @private
 */
function matchesSearch(variablePath, searchText) {
    if (!searchText) return true;
    
    const path = variablePath.toLowerCase();
    const search = searchText.toLowerCase();
    
    // Coincidencia exacta tiene prioridad
    if (path.includes(search)) return true;
    
    // Coincidencia por partes (user.name coincide con "user" o "name")
    const pathParts = path.split('.');
    const searchParts = search.split('.');
    
    return searchParts.every(searchPart => 
        pathParts.some(pathPart => pathPart.includes(searchPart))
    );
}

/**
 * Truncar valor para mostrar en sugerencias
 * @private
 */
function truncateValue(value) {
    const str = String(value);
    if (str.length > 40) {
        return str.substring(0, 40) + '...';
    }
    return str;
}

/**
 * Obtener boost de prioridad para provider
 * @private
 */
function getProviderBoost(priority) {
    // Convertir prioridad del provider a boost de CodeMirror
    return Math.min(100, Math.max(50, priority || 50));
}

/**
 * Obtener providers ordenados por prioridad
 * @private
 */
function getSortedProvidersByPriority(allVariables) {
    return Object.entries(allVariables)
        .sort(([, a], [, b]) => (b.priority || 50) - (a.priority || 50));
}

/**
 * Obtener sugerencias de variables recientes
 * @private
 */
function getRecentVariableSuggestions(searchText, plugin) {
    const suggestions = [];
    
    // Intentar obtener variables recientes del localStorage o algún cache
    try {
        const recent = JSON.parse(localStorage.getItem('recentVariables') || '[]');
        
        recent
            .filter(variable => matchesSearch(variable, searchText))
            .slice(0, 3)
            .forEach(variable => {
                if (plugin.validateVariable(variable)) {
                    suggestions.push({
                        label: plugin.formatVariableForInsertion(variable),
                        type: 'recent-variable',
                        info: 'Reciente',
                        detail: `${variable} (usado recientemente)`,
                        boost: 95 // Alta prioridad para variables recientes
                    });
                }
            });
    } catch (error) {
        // Ignorar errores de localStorage
    }
    
    return suggestions;
}

/**
 * Obtener sugerencias contextuales
 * @private
 */
function getContextualVariableSuggestions(context, searchText, plugin) {
    const suggestions = [];
    
    // Análisis contextual básico
    const pos = context.pos;
    const doc = context.state.doc;
    const line = doc.lineAt(pos);
    const lineText = line.text.toLowerCase();
    
    // Sugerir variables basadas en el contexto de la línea
    const contextMappings = {
        'nombre': ['user.name', 'user.firstName', 'site.title'],
        'email': ['user.email'],
        'fecha': ['current.date', 'current.datetime'],
        'tiempo': ['current.time', 'current.datetime'],
        'usuario': ['user.name', 'user.email', 'user.role'],
        'sitio': ['site.title', 'site.description', 'site.url'],
        'página': ['site.title', 'site.url'],
        'aplicación': ['app.name', 'app.version']
    };
    
    for (const [keyword, variables] of Object.entries(contextMappings)) {
        if (lineText.includes(keyword)) {
            variables
                .filter(variable => plugin.validateVariable(variable))
                .filter(variable => matchesSearch(variable, searchText))
                .forEach(variable => {
                    suggestions.push({
                        label: plugin.formatVariableForInsertion(variable),
                        type: 'contextual-variable',
                        info: 'Contextual',
                        detail: `${variable} (sugerido por contexto: "${keyword}")`,
                        boost: 85
                    });
                });
            break; // Solo usar el primer contexto encontrado
        }
    }
    
    return suggestions.slice(0, 3); // Limitar sugerencias contextuales
}

/**
 * Obtener sugerencias inteligentes
 * @private
 */
function getSmartCompletions(searchText, allVariables) {
    const suggestions = [];
    
    if (!searchText) return suggestions;
    
    // Auto-completado de rutas parciales
    const parts = searchText.split('.');
    if (parts.length > 1) {
        const prefix = parts[0];
        const incomplete = parts[parts.length - 1];
        
        // Buscar variables que empiecen con el prefijo
        Object.entries(allVariables).forEach(([providerKey, providerData]) => {
            Object.keys(providerData.variables).forEach(variablePath => {
                if (variablePath.startsWith(prefix + '.') && 
                    variablePath.split('.').length === parts.length) {
                    
                    const lastPart = variablePath.split('.')[parts.length - 1];
                    if (lastPart.includes(incomplete)) {
                        suggestions.push({
                            label: variablePath,
                            type: 'smart-completion',
                            info: 'Auto-completado',
                            detail: `Completar: ${searchText} → ${variablePath}`,
                            boost: 80
                        });
                    }
                }
            });
        });
    }
    
    return suggestions.slice(0, 5);
}

/**
 * Validar sintaxis de variables
 * @private
 */
function validateVariableSyntax(code) {
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

        // Verificar formato válido (no empezar/terminar con punto)
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

        // Verificar puntos dobles
        if (trimmedContent.includes('..')) {
            errors.push({
                type: 'double-dots',
                message: `Variable con puntos dobles: "{{ ${trimmedContent} }}"`,
                position: match.index,
                length: fullMatch.length,
                severity: 'error',
                suggestion: 'No usar puntos dobles consecutivos'
            });
        }
    }

    return errors;
}

/**
 * Encontrar posición de una variable en el código
 * @private
 */
function findVariablePosition(code, variable) {
    const pattern = new RegExp(`\\{\\{\\s*${escapeRegExp(variable)}\\s*\\}\\}`, 'g');
    const match = pattern.exec(code);
    return match ? match.index : 0;
}

/**
 * Generar recomendaciones específicas para el editor
 * @private
 */
function generateEditorRecommendations(analysis, usedVariables, allVariables) {
    const recommendations = [];

    if (analysis.totalVariables === 0) {
        recommendations.push({
            type: 'usage',
            message: 'Añade variables para hacer tu contenido dinámico',
            action: 'Escribe {{ para ver las variables disponibles',
            priority: 'medium'
        });
    }

    if (analysis.invalidVariables > 0) {
        recommendations.push({
            type: 'error',
            message: `${analysis.invalidVariables} variable(s) inválida(s) encontrada(s)`,
            action: 'Usa autocompletado para variables válidas',
            priority: 'high'
        });
    }

    // Sugerir variables populares no usadas
    const popularVariables = ['user.name', 'current.date', 'site.title'];
    const notUsed = popularVariables.filter(v => 
        !usedVariables.includes(v) && 
        Object.values(allVariables).some(provider => 
            Object.keys(provider.variables).includes(v)
        )
    );
    
    if (notUsed.length > 0) {
        recommendations.push({
            type: 'suggestion',
            message: `Variables útiles disponibles: ${notUsed.slice(0, 2).join(', ')}`,
            action: 'Considera añadirlas a tu contenido',
            priority: 'low'
        });
    }

    return recommendations;
}

/**
 * Generar hints específicos para el editor
 * @private
 */
function generateEditorHints(analysis, invalidVariables, plugin) {
    const hints = [];

    // Hints para variables inválidas
    invalidVariables.forEach(variable => {
        const similar = plugin.processor.getSimilarVariables(variable);
        hints.push({
            type: 'error',
            variable,
            message: `"${variable}" no existe`,
            suggestions: similar.slice(0, 3),
            quickFix: similar.length > 0 ? similar[0] : null
        });
    });

    // Hints de rendimiento
    if (analysis.totalVariables > 20) {
        hints.push({
            type: 'performance',
            message: 'Muchas variables en uso - considera optimizar',
            suggestion: 'Revisa si todas las variables son necesarias'
        });
    }

    return hints;
}

/**
 * Escapa caracteres especiales para regex
 * @private
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ===================================================================
// FUNCIONES DE GESTIÓN DE VARIABLES RECIENTES
// ===================================================================

/**
 * Registrar variable como usada recientemente
 */
export const recordRecentVariable = (variable) => {
    try {
        const recent = JSON.parse(localStorage.getItem('recentVariables') || '[]');
        
        // Remover si ya existe
        const filtered = recent.filter(v => v !== variable);
        
        // Añadir al principio
        filtered.unshift(variable);
        
        // Mantener solo los últimos 10
        const updated = filtered.slice(0, 10);
        
        localStorage.setItem('recentVariables', JSON.stringify(updated));
    } catch (error) {
        // Ignorar errores de localStorage
    }
};

/**
 * Obtener variables recientes
 */
export const getRecentVariables = () => {
    try {
        return JSON.parse(localStorage.getItem('recentVariables') || '[]');
    } catch (error) {
        return [];
    }
};

/**
 * Limpiar variables recientes
 */
export const clearRecentVariables = () => {
    try {
        localStorage.removeItem('recentVariables');
    } catch (error) {
        // Ignorar errores
    }
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.variableEditorHelpers = {
        getVariableCompletions,
        getVariableContentCompletions,
        validateVariablesInCode,
        analyzeVariableUsage,
        recordRecentVariable,
        getRecentVariables,
        clearRecentVariables
    };
    
    console.log('🔧 Variable editor helpers exposed to window for debugging');
}