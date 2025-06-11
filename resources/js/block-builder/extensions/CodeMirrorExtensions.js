// ===================================================================
// extensions/CodeMirrorExtensions.js
// Extensiones especializadas de CodeMirror para Alpine.js y Variables
// ===================================================================

import { autocompletion } from '@codemirror/autocomplete';
import { EditorView, keymap, Decoration, ViewPlugin } from '@codemirror/view';
import { StateField, StateEffect, RangeSetBuilder } from '@codemirror/state';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// ===================================================================
// AUTOCOMPLETADO VISUAL AVANZADO
// ===================================================================

/**
 * Crear sistema de autocompletado visual con iconos y categorías
 */
export const createVisualAutocompletion = (options = {}) => {
    const {
        maxOptions = 50,
        showIcons = true,
        showDetails = true,
        categories = true,
        fuzzyMatch = true
    } = options;

    return autocompletion({
        maxRenderedOptions: maxOptions,
        activateOnTyping: true,
        closeOnBlur: true,
        defaultKeymap: true,
        
        // Filtro personalizado con fuzzy matching
        filterComplete: fuzzyMatch ? fuzzyFilter : null,
        
        // Renderizado personalizado de opciones
        optionClass: (completion) => {
            const baseClass = 'cm-completion-item';
            const typeClass = `cm-completion-${completion.type || 'default'}`;
            const boostClass = completion.boost > 90 ? 'cm-completion-high-priority' : '';
            return `${baseClass} ${typeClass} ${boostClass}`.trim();
        },
        
        // Template personalizado para cada opción
        render: (completion, state) => {
            const option = document.createElement('div');
            option.className = 'cm-completion-option';
            
            if (showIcons) {
                const icon = getCompletionIcon(completion.type);
                const iconSpan = document.createElement('span');
                iconSpan.className = 'cm-completion-icon';
                iconSpan.textContent = icon;
                option.appendChild(iconSpan);
            }
            
            const label = document.createElement('span');
            label.className = 'cm-completion-label';
            label.textContent = completion.label;
            option.appendChild(label);
            
            if (showDetails && completion.detail) {
                const detail = document.createElement('span');
                detail.className = 'cm-completion-detail';
                detail.textContent = completion.detail;
                option.appendChild(detail);
            }
            
            if (completion.info) {
                const info = document.createElement('span');
                info.className = 'cm-completion-info';
                info.textContent = completion.info;
                option.appendChild(info);
            }
            
            return option;
        },
        
        // Agrupación por categorías
        ...(categories && {
            sectioning: (completions) => {
                const sections = new Map();
                
                completions.forEach((completion, index) => {
                    const section = completion.section || completion.info || 'General';
                    if (!sections.has(section)) {
                        sections.set(section, []);
                    }
                    sections.get(section).push({ completion, index });
                });
                
                return Array.from(sections.entries()).map(([name, items]) => ({
                    name,
                    header: createSectionHeader(name),
                    items: items.map(item => item.index)
                }));
            }
        })
    });
};

/**
 * Crear encabezado de sección para categorías
 */
const createSectionHeader = (sectionName) => {
    const header = document.createElement('div');
    header.className = 'cm-completion-section-header';
    
    const icon = getSectionIcon(sectionName);
    header.innerHTML = `
        <span class="cm-completion-section-icon">${icon}</span>
        <span class="cm-completion-section-name">${sectionName}</span>
        <span class="cm-completion-section-line"></span>
    `;
    
    return header;
};

/**
 * Filtro fuzzy para autocompletado
 */
const fuzzyFilter = (completions, input) => {
    if (!input) return completions;
    
    const inputLower = input.toLowerCase();
    
    return completions
        .map(completion => {
            const score = calculateFuzzyScore(completion.label.toLowerCase(), inputLower);
            return { completion, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => {
            // Ordenar por score descendente, luego por boost, luego alfabéticamente
            if (b.score !== a.score) return b.score - a.score;
            if (b.completion.boost !== a.completion.boost) return (b.completion.boost || 0) - (a.completion.boost || 0);
            return a.completion.label.localeCompare(b.completion.label);
        })
        .map(item => item.completion);
};

/**
 * Calcular score de fuzzy matching
 */
const calculateFuzzyScore = (text, pattern) => {
    if (text.includes(pattern)) return 100; // Coincidencia exacta
    
    let score = 0;
    let textIndex = 0;
    
    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        const found = text.indexOf(char, textIndex);
        
        if (found === -1) return 0; // No encontrado
        
        // Bonus por coincidencias consecutivas
        if (found === textIndex) score += 10;
        score += 1;
        textIndex = found + 1;
    }
    
    return score;
};

/**
 * Obtener icono para tipo de completion
 */
const getCompletionIcon = (type) => {
    const icons = {
        'variable': '🎯',
        'alpine-directive': '⚡',
        'alpine-magic': '🪄',
        'alpine-event': '🖱️',
        'alpine-modifier': '🔧',
        'plugin': '🔌',
        'class': '🎨',
        'html-tag': '🏷️',
        'html-attribute': '📝',
        'css-property': '🎨',
        'javascript': '⚙️',
        'snippet': '📋',
        'recent': '🕒',
        'favorite': '⭐',
        'custom': '✨',
        'template': '📄',
        'function': '🔧',
        'method': '⚡',
        'property': '🎯',
        'default': '💡'
    };
    return icons[type] || icons.default;
};

/**
 * Obtener icono para sección
 */
const getSectionIcon = (sectionName) => {
    const icons = {
        'Variables': '🎯',
        'Alpine.js': '⚡',
        'HTML': '🏷️',
        'CSS': '🎨',
        'JavaScript': '⚙️',
        'Plugins': '🔌',
        'Snippets': '📋',
        'Templates': '📄',
        'Recent': '🕒',
        'General': '💡'
    };
    return icons[sectionName] || '📁';
};

// ===================================================================
// SYNTAX HIGHLIGHTING AVANZADO
// ===================================================================

/**
 * Crear syntax highlighting especializado para Alpine.js + Variables
 */
export const createAlpineVariableSyntaxHighlighting = (theme = 'light') => {
    const isDark = theme === 'dark';
    
    return syntaxHighlighting(HighlightStyle.define([
        // 🎨 BASE COLORS
        { 
            tag: t.content, 
            color: isDark ? '#f3f4f6' : '#111827' 
        },
        { 
            tag: t.comment, 
            color: isDark ? '#6b7280' : '#9ca3af', 
            fontStyle: 'italic' 
        },
        
        // 🏷️ HTML ELEMENTS
        { 
            tag: t.tagName, 
            color: isDark ? '#f87171' : '#dc2626', 
            fontWeight: 'bold' 
        },
        { 
            tag: t.angleBracket, 
            color: isDark ? '#d1d5db' : '#6b7280' 
        },
        
        // ⚡ ALPINE DIRECTIVES - Highlighting especial
        { 
            tag: [t.attributeName],
            color: isDark ? '#10b981' : '#059669',
            fontWeight: '600'
        },
        
        // 🎯 ALPINE ATTRIBUTES CON REGEX AVANZADO
        {
            tag: t.special(t.attributeName), // Para x-data, x-show, etc.
            color: isDark ? '#34d399' : '#047857',
            fontWeight: 'bold',
            textDecoration: 'underline',
            textDecorationColor: isDark ? '#10b981' : '#047857',
            textDecorationStyle: 'dotted'
        },
        
        // 🪄 ALPINE MAGIC PROPERTIES
        {
            tag: t.variableName, // Para $el, $refs, etc.
            color: isDark ? '#fbbf24' : '#d97706',
            fontWeight: 'bold',
            textShadow: isDark ? '0 0 2px rgba(251, 191, 36, 0.3)' : 'none'
        },
        
        // 🎯 VARIABLES DEL SISTEMA {{ variable }}
        {
            tag: t.special(t.string), // Variables entre {{ }}
            color: isDark ? '#a78bfa' : '#7c3aed',
            backgroundColor: isDark ? 'rgba(167, 139, 250, 0.1)' : 'rgba(124, 58, 237, 0.05)',
            fontWeight: '600',
            borderRadius: '3px',
            padding: '1px 3px'
        },
        
        // 📝 ATTRIBUTE VALUES
        { 
            tag: t.attributeValue, 
            color: isDark ? '#60a5fa' : '#2563eb' 
        },
        { 
            tag: t.string, 
            color: isDark ? '#a78bfa' : '#7c3aed' 
        },
        
        // 🔢 NUMBERS AND LITERALS
        { 
            tag: t.number, 
            color: isDark ? '#34d399' : '#10b981' 
        },
        { 
            tag: t.bool, 
            color: isDark ? '#f472b6' : '#ec4899',
            fontWeight: 'bold'
        },
        { 
            tag: t.null, 
            color: isDark ? '#9ca3af' : '#6b7280',
            fontStyle: 'italic'
        },
        
        // 🔧 OPERATORS
        { 
            tag: t.operator, 
            color: isDark ? '#fb7185' : '#e11d48',
            fontWeight: 'bold'
        },
        { 
            tag: t.punctuation, 
            color: isDark ? '#d1d5db' : '#6b7280' 
        },
        { 
            tag: t.bracket, 
            color: isDark ? '#c084fc' : '#8b5cf6',
            fontWeight: 'bold'
        },
        { 
            tag: t.brace, 
            color: isDark ? '#f59e0b' : '#d97706',
            fontWeight: 'bold'
        },
        
        // 🎪 CSS CLASSES (Tailwind, etc.)
        { 
            tag: t.className, 
            color: isDark ? '#06b6d4' : '#0891b2',
            fontWeight: '500'
        },
        
        // 🔑 KEYWORDS
        { 
            tag: t.keyword, 
            color: isDark ? '#f472b6' : '#ec4899',
            fontWeight: 'bold'
        },
        
        // 🎨 FUNCTION NAMES
        { 
            tag: t.function(t.variableName), 
            color: isDark ? '#fbbf24' : '#d97706',
            fontWeight: '600'
        },
        
        // 🏷️ PROPERTY NAMES
        { 
            tag: t.propertyName, 
            color: isDark ? '#60a5fa' : '#2563eb',
            fontWeight: '500'
        }
    ]));
};

// ===================================================================
// DECORACIONES VISUALES PARA VARIABLES Y ALPINE
// ===================================================================

/**
 * Plugin para resaltar variables dinámicamente
 */
export const variableHighlighter = ViewPlugin.fromClass(class {
    constructor(view) {
        this.decorations = this.buildDecorations(view);
    }
    
    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
        }
    }
    
    buildDecorations(view) {
        const builder = new RangeSetBuilder();
        const doc = view.state.doc;
        
        // Buscar y decorar variables {{ variable }}
        const variableRegex = /\{\{\s*([^}]+)\s*\}\}/g;
        let match;
        const text = doc.toString();
        
        while ((match = variableRegex.exec(text)) !== null) {
            const from = match.index;
            const to = match.index + match[0].length;
            const variableName = match[1].trim();
            
            // Verificar si la variable es válida
            const isValid = this.isValidVariable(variableName);
            const decorationClass = isValid ? 'cm-variable-valid' : 'cm-variable-invalid';
            
            builder.add(
                from,
                to,
                Decoration.mark({
                    class: decorationClass,
                    attributes: {
                        title: isValid ? `Variable: ${variableName}` : `Variable inválida: ${variableName}`
                    }
                })
            );
        }
        
        // Buscar y decorar directivas Alpine
        const alpineRegex = /(x-[\w-]+|@[\w-]+(?:\.[\w-]+)*)/g;
        while ((match = alpineRegex.exec(text)) !== null) {
            const from = match.index;
            const to = match.index + match[0].length;
            const directive = match[1];
            
            builder.add(
                from,
                to,
                Decoration.mark({
                    class: 'cm-alpine-directive',
                    attributes: {
                        title: `Alpine.js: ${directive}`
                    }
                })
            );
        }
        
        return builder.finish();
    }
    
    isValidVariable(variableName) {
        // Verificar si la variable existe en el sistema
        if (window.pluginManager) {
            const variablesPlugin = window.pluginManager.get('variables');
            if (variablesPlugin && variablesPlugin.validateVariable) {
                return variablesPlugin.validateVariable(variableName);
            }
        }
        
        // Fallback: verificar formato básico
        return /^[\w.-]+$/.test(variableName) && 
               !variableName.startsWith('.') && 
               !variableName.endsWith('.');
    }
}, {
    decorations: v => v.decorations
});

// ===================================================================
// TEMA VISUAL PERSONALIZADO
// ===================================================================

/**
 * Crear tema visual completo para el editor
 */
export const createEditorTheme = (theme = 'light', options = {}) => {
    const isDark = theme === 'dark';
    const {
        fontFamily = 'JetBrains Mono, Monaco, Menlo, Consolas, monospace',
        fontSize = '14px',
        lineHeight = '1.6',
        borderRadius = '8px'
    } = options;
    
    return EditorView.theme({
        // 📝 EDITOR CONTAINER
        '&': {
            fontSize,
            fontFamily,
            color: isDark ? '#f3f4f6' : '#111827',
            backgroundColor: isDark ? '#111827' : '#ffffff'
        },
        
        // 📄 CONTENT AREA
        '.cm-content': {
            padding: '16px',
            minHeight: '400px',
            lineHeight,
            caretColor: isDark ? '#10b981' : '#059669'
        },
        
        // 🎯 CURSOR AND SELECTION
        '.cm-cursor': {
            borderColor: isDark ? '#10b981' : '#059669',
            borderWidth: '2px'
        },
        '.cm-focused .cm-selectionBackground': {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(5, 150, 105, 0.1)'
        },
        '.cm-selectionBackground': {
            backgroundColor: isDark ? 'rgba(156, 163, 175, 0.2)' : 'rgba(156, 163, 175, 0.1)'
        },
        
        // 📏 GUTTER
        '.cm-gutters': {
            backgroundColor: isDark ? '#1f2937' : '#f9fafb',
            borderRight: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            color: isDark ? '#9ca3af' : '#6b7280'
        },
        '.cm-lineNumbers .cm-gutterElement': {
            padding: '0 8px'
        },
        
        // 🎯 ACTIVE LINE
        '.cm-activeLine': {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.05)' : 'rgba(5, 150, 105, 0.02)'
        },
        '.cm-activeLineGutter': {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.05)'
        },
        
        // 🔍 SEARCH
        '.cm-searchMatch': {
            backgroundColor: isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(217, 119, 6, 0.2)',
            border: `1px solid ${isDark ? '#f59e0b' : '#d97706'}`
        },
        '.cm-searchMatch.cm-searchMatch-selected': {
            backgroundColor: isDark ? 'rgba(251, 191, 36, 0.5)' : 'rgba(217, 119, 6, 0.3)'
        },
        
        // 💡 AUTOCOMPLETION STYLES
        '.cm-tooltip-autocomplete': {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            boxShadow: isDark ? 
                '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' :
                '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxHeight: '400px',
            minWidth: '320px',
            overflow: 'hidden'
        },
        
        // 📋 COMPLETION ITEMS
        '.cm-completion-option': {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            borderBottom: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
        },
        '.cm-completion-option:hover': {
            backgroundColor: isDark ? '#374151' : '#f3f4f6'
        },
        '.cm-completion-option[aria-selected]': {
            backgroundColor: isDark ? '#10b981' : '#059669',
            color: 'white'
        },
        
        // 🎯 COMPLETION PARTS
        '.cm-completion-icon': {
            fontSize: '16px',
            minWidth: '20px',
            textAlign: 'center'
        },
        '.cm-completion-label': {
            fontWeight: '600',
            flex: 1
        },
        '.cm-completion-detail': {
            fontSize: '12px',
            color: isDark ? '#9ca3af' : '#6b7280',
            fontStyle: 'italic'
        },
        '.cm-completion-info': {
            fontSize: '11px',
            color: isDark ? '#6b7280' : '#9ca3af',
            backgroundColor: isDark ? '#374151' : '#f3f4f6',
            padding: '2px 6px',
            borderRadius: '12px',
            fontWeight: '500'
        },
        
        // 📂 SECTION HEADERS
        '.cm-completion-section-header': {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: isDark ? '#374151' : '#f9fafb',
            borderBottom: `2px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
            fontWeight: 'bold',
            fontSize: '12px',
            color: isDark ? '#d1d5db' : '#374151'
        },
        '.cm-completion-section-icon': {
            fontSize: '14px'
        },
        '.cm-completion-section-line': {
            flex: 1,
            height: '1px',
            backgroundColor: isDark ? '#4b5563' : '#d1d5db'
        },
        
        // 🎨 VARIABLE HIGHLIGHTING
        '.cm-variable-valid': {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(5, 150, 105, 0.1)',
            borderRadius: '3px',
            padding: '1px 2px',
            border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.2)'}`
        },
        '.cm-variable-invalid': {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.1)',
            borderRadius: '3px',
            padding: '1px 2px',
            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.2)'}`,
            textDecoration: 'underline wavy red'
        },
        
        // ⚡ ALPINE DIRECTIVE HIGHLIGHTING
        '.cm-alpine-directive': {
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(5, 150, 105, 0.05)',
            borderRadius: '3px',
            padding: '1px 2px',
            fontWeight: '600'
        },
        
        // 🚨 VALIDATION MARKS
        '.cm-diagnostic-error': {
            borderBottom: '2px wavy #ef4444'
        },
        '.cm-diagnostic-warning': {
            borderBottom: '2px wavy #f59e0b'
        },
        '.cm-diagnostic-info': {
            borderBottom: '2px wavy #3b82f6'
        },
        
        // 🎯 FOCUS STYLES
        '.cm-focused': {
            outline: `2px solid ${isDark ? '#10b981' : '#059669'}`,
            outlineOffset: '-1px',
            borderRadius
        },
        
        // 📱 RESPONSIVE
        '@media (max-width: 768px)': {
            '.cm-content': {
                padding: '12px'
            },
            '.cm-tooltip-autocomplete': {
                minWidth: '280px'
            }
        }
    }, { dark: isDark });
};

// ===================================================================
// EXPORTACIONES AGRUPADAS
// ===================================================================

/**
 * Creates all necessary editor extensions
 */
export const createEditorExtensions = (options = {}) => {
    const {
        theme = 'light',
        autocompletion: autocompletionOptions = {},
        highlighting: highlightingOptions = {},
        themeOptions = {}
    } = options;

    return [
        // Core extensions
        createVisualAutocompletion(autocompletionOptions),
        createAlpineVariableSyntaxHighlighting(theme),
        variableHighlighter,
        createEditorTheme(theme, themeOptions),

        // Basic editor settings
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                // Document changed handling
                console.log('🔄 Document updated');
            }
        })
    ];
};

export const AlpineCodeMirrorExtensions = {
    createEditorExtensions,
    autocompletion: createVisualAutocompletion,
    highlighting: createAlpineVariableSyntaxHighlighting,
    variableHighlighter,
    theme: createEditorTheme,
    icons: {
        getCompletionIcon,
        getSectionIcon
    },
    fuzzyFilter,
    calculateFuzzyScore
};