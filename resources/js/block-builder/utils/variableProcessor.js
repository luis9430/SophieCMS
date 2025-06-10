// ===================================================================
// utils/variableProcessor.js
// Responsabilidad: SOLO procesamiento de variables
// ===================================================================

/**
 * Obtiene todas las variables disponibles del sistema
 * @returns {Object} Variables organizadas por categorías
 */
export const getAvailableVariables = () => {
    const user = window.initialData?.user || {};
    const templates = window.initialData?.templates || [];
    const stats = window.initialData?.stats || {};
    
    return {
        user: {
            title: '👤 Usuario',
            variables: {
                'user.name': user.name || 'Nombre del  susuario',
                'user.email': user.email || 'email@ejemplo.com',
                'user.id': user.id || 1,
                'user.role': user.role || 'user',
                'user.avatar': user.avatar || '/default-avatar.png'
            }
        },
        system: {
            title: '⚙️ Sistema',
            variables: {
                'app.name': 'Page Builder',
                'app.version': '1.0.0',
                'current.time': new Date().toLocaleTimeString(),
                'current.date': new Date().toLocaleDateString(),
                'current.year': new Date().getFullYear(),
                'current.month': new Date().toLocaleDateString('es', { month: 'long' }),
                'current.timestamp': Date.now()
            }
        },
        templates: {
            title: '📝 Templates',
            variables: {
                'templates.count': templates.length,
                'templates.latest': templates[0]?.name || 'Sin templates',
                'templates.total': templates.length
            }
        },
        site: {
            title: '🎨 Sitio',
            variables: {
                'site.title': 'Mi Sitio Web',
                'site.description': 'Descripción de mi sitio',
                'site.url': window.location.origin,
                'site.domain': window.location.hostname
            }
        }
    };
};

/**
 * Procesa un string HTML reemplazando variables por sus valores
 * @param {string} htmlCode - Código HTML con variables {{ variable }}
 * @returns {string} HTML procesado con variables reemplazadas
 */
export const processVariables = (htmlCode) => {
    if (!htmlCode || typeof htmlCode !== 'string') {
        return htmlCode || '';
    }
    
    // Si no hay variables, retornar tal como está (optimización)
    if (!htmlCode.includes('{{')) {
        return htmlCode;
    }

    let processedCode = htmlCode;
    const variables = getAvailableVariables();
    
    // Procesar cada categoría de variables
    Object.values(variables).forEach(category => {
        Object.entries(category.variables).forEach(([path, value]) => {
            // Crear regex para encontrar {{ variable }} con espacios opcionales
            const regex = new RegExp(`\\{\\{\\s*${escapeRegExp(path)}\\s*\\}\\}`, 'g');
            processedCode = processedCode.replace(regex, String(value));
        });
    });
    
    return processedCode;
};

/**
 * Extrae todas las variables usadas en un código HTML
 * @param {string} htmlCode - Código HTML
 * @returns {Array} Array de variables encontradas
 */
export const extractVariables = (htmlCode) => {
    if (!htmlCode || typeof htmlCode !== 'string') {
        return [];
    }
    
    const variablePattern = /\{\{\s*([^}]+)\s*\}\}/g;
    const variables = [];
    let match;
    
    while ((match = variablePattern.exec(htmlCode)) !== null) {
        const variableName = match[1].trim();
        if (!variables.includes(variableName)) {
            variables.push(variableName);
        }
    }
    
    return variables;
};

/**
 * Valida si una variable existe en el sistema
 * @param {string} variablePath - Path de la variable (ej: 'user.name')
 * @returns {boolean} True si existe, false si no
 */
export const validateVariable = (variablePath) => {
    if (!variablePath || typeof variablePath !== 'string') {
        return false;
    }
    
    const variables = getAvailableVariables();
    
    // Buscar en todas las categorías
    for (const category of Object.values(variables)) {
        if (category.variables.hasOwnProperty(variablePath)) {
            return true;
        }
    }
    
    return false;
};

/**
 * Obtiene el valor de una variable específica
 * @param {string} variablePath - Path de la variable
 * @returns {any} Valor de la variable o null si no existe
 */
export const getVariableValue = (variablePath) => {
    if (!validateVariable(variablePath)) {
        return null;
    }
    
    const variables = getAvailableVariables();
    
    for (const category of Object.values(variables)) {
        if (category.variables.hasOwnProperty(variablePath)) {
            return category.variables[variablePath];
        }
    }
    
    return null;
};

/**
 * Genera el texto de una variable para insertar en el editor
 * @param {string} variablePath - Path de la variable
 * @returns {string} Texto formateado {{ variable }}
 */
export const formatVariableForInsertion = (variablePath) => {
    return `{{ ${variablePath} }}`;
};

/**
 * Encuentra variables no válidas en el código
 * @param {string} htmlCode - Código HTML
 * @returns {Array} Array de variables que no existen
 */
export const findInvalidVariables = (htmlCode) => {
    const usedVariables = extractVariables(htmlCode);
    const invalidVariables = [];
    
    usedVariables.forEach(variable => {
        if (!validateVariable(variable)) {
            invalidVariables.push(variable);
        }
    });
    
    return invalidVariables;
};

/**
 * Escapa caracteres especiales para regex
 * @private
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
