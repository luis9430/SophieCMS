// ===================================================================
// resources/js/block-builder/plugins/tailwind/editor.js
// Editor Tailwind con safelist completo y autocompletado inteligente
// ===================================================================

/**
 * Provee sugerencias de autocompletado para clases de Tailwind usando safelist
 * @param {import('@codemirror/autocomplete').CompletionContext} context
 * @param {Array} availableClasses - Clases del safelist generado
 * @returns {import('@codemirror/autocomplete').CompletionResult | null}
 */
export function getTailwindCompletions(context, availableClasses = []) {
    // Verificar si estamos en el contexto correcto (dentro de class="...")
    if (!isInClassAttribute(context)) {
        return null;
    }

    const word = context.matchBefore(/[\w-:@${}./]*/);
    if (!word || (word.from === word.to && !context.explicit)) {
        return null;
    }

    const searchText = word.text.toLowerCase();
    
    // Si no hay clases disponibles, usar fallback básico
    if (!availableClasses || availableClasses.length === 0) {
        return getBasicTailwindCompletions(context, searchText);
    }

    // Obtener sugerencias del safelist
    const suggestions = getAdvancedCompletions(searchText, availableClasses);
    
    if (suggestions.length === 0) {
        return null;
    }

    return {
        from: word.from,
        options: suggestions,
        validFor: /^[\w-:./]*$/,
        span: /[\w-:./]*/
    };
}

/**
 * Verificar si el cursor está dentro de un atributo class
 * @private
 */
function isInClassAttribute(context) {
    try {
        const pos = context.pos;
        const doc = context.state.doc;
        const line = doc.lineAt(pos);
        const beforeCursor = line.text.slice(0, pos - line.from);
        
        // Buscar el último atributo class abierto
        const classMatch = beforeCursor.match(/.*class\s*=\s*["']([^"']*)$/);
        
        return !!classMatch;
    } catch (error) {
        return false;
    }
}

/**
 * Obtener completions avanzados usando el safelist
 * @private
 */
function getAdvancedCompletions(searchText, availableClasses) {
    const suggestions = [];
    const maxSuggestions = 50;
    
    if (!searchText) {
        // Si no hay texto, mostrar clases más comunes
        const commonClasses = getCommonClasses(availableClasses);
        return commonClasses.slice(0, 20).map(cls => createCompletion(cls, 'common'));
    }
    
    // 1. COINCIDENCIAS EXACTAS (máxima prioridad)
    const exactMatches = availableClasses.filter(cls => 
        cls === searchText
    ).slice(0, 5);
    
    exactMatches.forEach(cls => {
        suggestions.push(createCompletion(cls, 'exact', 100));
    });
    
    // 2. COINCIDENCIAS QUE EMPIEZAN CON EL TEXTO
    const startMatches = availableClasses.filter(cls => 
        cls.startsWith(searchText) && cls !== searchText
    ).slice(0, 15);
    
    startMatches.forEach(cls => {
        suggestions.push(createCompletion(cls, 'start', 90));
    });
    
    // 3. COINCIDENCIAS QUE CONTIENEN EL TEXTO
    const containsMatches = availableClasses.filter(cls => 
        cls.includes(searchText) && 
        !cls.startsWith(searchText)
    ).slice(0, 20);
    
    containsMatches.forEach(cls => {
        suggestions.push(createCompletion(cls, 'contains', 70));
    });
    
    // 4. COINCIDENCIAS FUZZY (para palabras parciales)
    if (suggestions.length < 10) {
        const fuzzyMatches = getFuzzyMatches(searchText, availableClasses, 10);
        fuzzyMatches.forEach(match => {
            if (!suggestions.find(s => s.label === match.cls)) {
                suggestions.push(createCompletion(match.cls, 'fuzzy', match.score));
            }
        });
    }
    
    // 5. SUGERENCIAS CONTEXTUALES (basadas en patrones)
    const contextualSuggestions = getContextualSuggestions(searchText, availableClasses);
    contextualSuggestions.forEach(cls => {
        if (!suggestions.find(s => s.label === cls)) {
            suggestions.push(createCompletion(cls, 'contextual', 60));
        }
    });
    
    // Ordenar por boost y limitar
    return suggestions
        .sort((a, b) => (b.boost || 0) - (a.boost || 0))
        .slice(0, maxSuggestions);
}

/**
 * Crear objeto de completion
 * @private
 */
function createCompletion(className, type, boost = 50) {
    const completion = {
        label: className,
        type: 'class',
        info: getClassCategory(className),
        detail: getClassDescription(className),
        boost: boost + getCategoryBoost(className),
        section: getClassCategory(className)
    };
    
    // Agregar iconos visuales según el tipo
    const icons = {
        exact: '🎯',
        start: '▶️',
        contains: '🔍',
        fuzzy: '💫',
        contextual: '🎪',
        common: '⭐'
    };
    
    completion.detail = `${icons[type] || '💡'} ${completion.detail}`;
    
    return completion;
}

/**
 * Obtener clases más comunes para mostrar sin filtro
 * @private
 */
function getCommonClasses(availableClasses) {
    const commonPatterns = [
        'flex', 'block', 'hidden', 'grid',
        'w-full', 'h-full', 'w-auto', 'h-auto',
        'p-4', 'p-2', 'p-6', 'm-4', 'm-2', 'm-6',
        'text-center', 'text-left', 'text-right',
        'bg-white', 'bg-gray-100', 'bg-blue-500',
        'text-black', 'text-white', 'text-gray-700',
        'border', 'rounded', 'shadow',
        'cursor-pointer', 'transition',
        'hover:bg-gray-100', 'focus:outline-none'
    ];
    
    return availableClasses.filter(cls => 
        commonPatterns.some(pattern => cls.includes(pattern))
    );
}

/**
 * Obtener coincidencias fuzzy
 * @private
 */
function getFuzzyMatches(searchText, availableClasses, limit = 10) {
    const matches = [];
    
    availableClasses.forEach(cls => {
        const score = calculateFuzzyScore(cls, searchText);
        if (score > 0.3) { // Umbral mínimo
            matches.push({ cls, score: Math.round(score * 100) });
        }
    });
    
    return matches
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * Calcular score fuzzy simple
 * @private
 */
function calculateFuzzyScore(text, pattern) {
    if (text.includes(pattern)) return 1.0;
    
    let score = 0;
    let textIndex = 0;
    
    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        const found = text.indexOf(char, textIndex);
        
        if (found === -1) return 0;
        
        // Bonus por caracteres consecutivos
        if (found === textIndex) score += 0.3;
        score += 0.1;
        
        textIndex = found + 1;
    }
    
    // Penalizar por longitud de la clase
    return score / (text.length * 0.1);
}

/**
 * Obtener sugerencias contextuales basadas en patrones
 * @private
 */
function getContextualSuggestions(searchText, availableClasses) {
    const suggestions = [];
    
    // Mapeo de contextos a clases relacionadas
    const contextMaps = {
        'bg': ['bg-white', 'bg-gray-100', 'bg-blue-500', 'bg-red-500', 'bg-green-500'],
        'text': ['text-black', 'text-white', 'text-gray-700', 'text-blue-600', 'text-sm', 'text-lg'],
        'p': ['p-2', 'p-4', 'p-6', 'p-8', 'px-4', 'py-2'],
        'm': ['m-2', 'm-4', 'm-6', 'm-8', 'mx-auto', 'my-4'],
        'w': ['w-full', 'w-auto', 'w-1/2', 'w-1/3', 'w-1/4'],
        'h': ['h-full', 'h-auto', 'h-screen', 'h-64', 'h-32'],
        'border': ['border', 'border-2', 'border-gray-300', 'border-blue-500'],
        'rounded': ['rounded', 'rounded-md', 'rounded-lg', 'rounded-full'],
        'shadow': ['shadow', 'shadow-md', 'shadow-lg', 'shadow-xl'],
        'hover': ['hover:bg-gray-100', 'hover:text-blue-600', 'hover:shadow-lg'],
        'focus': ['focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500']
    };
    
    // Buscar contexto en el texto de búsqueda
    for (const [context, classes] of Object.entries(contextMaps)) {
        if (searchText.includes(context)) {
            const contextClasses = classes.filter(cls => 
                availableClasses.includes(cls) && 
                cls.includes(searchText)
            );
            suggestions.push(...contextClasses);
        }
    }
    
    return suggestions.slice(0, 8);
}

/**
 * Obtener categoría de una clase
 * @private
 */
function getClassCategory(className) {
    const categoryPatterns = {
        'Layout': /^(flex|grid|block|inline|hidden|static|fixed|absolute|relative|sticky)/,
        'Spacing': /^(p|m|gap|space)-/,
        'Sizing': /^(w|h|min-|max-)-/,
        'Colors': /^(bg|text|border|ring|decoration|outline|shadow)-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose|white|black)-/,
        'Typography': /^(text|font|leading|tracking|decoration|uppercase|lowercase|capitalize|italic)/,
        'Effects': /^(shadow|rounded|opacity|blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia)/,
        'Interactive': /^(cursor|select|pointer-events|outline)/,
        'Responsive': /^(sm|md|lg|xl|2xl):/,
        'States': /^(hover|focus|active|group-hover|focus-within):/
    };
    
    for (const [category, pattern] of Object.entries(categoryPatterns)) {
        if (pattern.test(className)) {
            return category;
        }
    }
    
    return 'Utilities';
}

/**
 * Obtener descripción de una clase
 * @private
 */
function getClassDescription(className) {
    // Descripciones específicas para patrones comunes
    const descriptions = {
        // Layout
        'flex': 'Display: flex',
        'grid': 'Display: grid',
        'block': 'Display: block',
        'hidden': 'Display: none',
        'inline': 'Display: inline',
        
        // Spacing patterns
        'p-': 'Padding',
        'm-': 'Margin',
        'px-': 'Horizontal padding',
        'py-': 'Vertical padding',
        'mx-': 'Horizontal margin',
        'my-': 'Vertical margin',
        
        // Colors
        'bg-': 'Background color',
        'text-': className.includes('-') && !className.startsWith('text-xs') && !className.startsWith('text-sm') ? 'Text color' : 'Text size',
        'border-': 'Border color/width',
        
        // Interactive
        'cursor-pointer': 'Pointer cursor',
        'cursor-move': 'Move cursor',
        'hover:': 'Hover state',
        'focus:': 'Focus state',
        
        // Responsive
        'sm:': 'Small screens and up',
        'md:': 'Medium screens and up',
        'lg:': 'Large screens and up',
        'xl:': 'Extra large screens and up'
    };
    
    // Buscar descripción específica
    for (const [pattern, description] of Object.entries(descriptions)) {
        if (className.startsWith(pattern) || className.includes(pattern)) {
            return description;
        }
    }
    
    return 'Tailwind utility class';
}

/**
 * Obtener boost adicional basado en categoría
 * @private
 */
function getCategoryBoost(className) {
    // Clases más importantes del page builder obtienen boost
    const boostPatterns = {
        30: /^(flex|grid|block|hidden)$/,              // Layout fundamental
        25: /^(cursor-|pointer-events-|select-)/,      // Interactividad del editor
        20: /^(p-[0-9]|m-[0-9]|w-|h-)/,               // Spacing y sizing común
        15: /^(bg-|text-|border-)/,                    // Colores comunes
        10: /^(hover:|focus:|transition)/,             // Estados e interactividad
        5: /^(rounded|shadow|opacity)/                 // Efectos visuales
    };
    
    for (const [boost, pattern] of Object.entries(boostPatterns)) {
        if (pattern.test(className)) {
            return parseInt(boost);
        }
    }
    
    return 0;
}

/**
 * Completions básicos como fallback
 * @private
 */
function getBasicTailwindCompletions(context, searchText) {
    const basicClasses = [
        // Layout básico
        { label: 'flex', type: 'class', info: 'Layout', detail: 'Display: flex' },
        { label: 'grid', type: 'class', info: 'Layout', detail: 'Display: grid' },
        { label: 'block', type: 'class', info: 'Layout', detail: 'Display: block' },
        { label: 'hidden', type: 'class', info: 'Layout', detail: 'Display: none' },
        
        // Spacing común
        { label: 'p-4', type: 'class', info: 'Spacing', detail: 'Padding: 1rem' },
        { label: 'm-4', type: 'class', info: 'Spacing', detail: 'Margin: 1rem' },
        { label: 'px-4', type: 'class', info: 'Spacing', detail: 'Horizontal padding: 1rem' },
        { label: 'py-2', type: 'class', info: 'Spacing', detail: 'Vertical padding: 0.5rem' },
        
        // Colores básicos
        { label: 'bg-white', type: 'class', info: 'Colors', detail: 'Background: white' },
        { label: 'bg-gray-100', type: 'class', info: 'Colors', detail: 'Background: light gray' },
        { label: 'text-black', type: 'class', info: 'Colors', detail: 'Text: black' },
        { label: 'text-gray-700', type: 'class', info: 'Colors', detail: 'Text: dark gray' },
        
        // Sizing
        { label: 'w-full', type: 'class', info: 'Sizing', detail: 'Width: 100%' },
        { label: 'h-full', type: 'class', info: 'Sizing', detail: 'Height: 100%' },
        
        // Interactive
        { label: 'cursor-pointer', type: 'class', info: 'Interactive', detail: 'Cursor: pointer' },
        { label: 'hover:bg-gray-100', type: 'class', info: 'Interactive', detail: 'Hover background' }
    ];
    
    if (!searchText) {
        return basicClasses.slice(0, 10);
    }
    
    return basicClasses
        .filter(cls => cls.label.includes(searchText))
        .slice(0, 10);
}

export { getAdvancedCompletions, getBasicTailwindCompletions };