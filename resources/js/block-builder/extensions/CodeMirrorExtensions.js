// ===================================================================
// resources/js/block-builder/extensions/CodeMirrorExtensions.js - VERSIÓN MEJORADA
// ===================================================================

import { basicSetup } from 'codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView, keymap, Decoration } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { autocompletion, snippetCompletion } from '@codemirror/autocomplete';
import { linter, lintGutter } from '@codemirror/lint';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// ===================================================================
// TEMAS PERSONALIZADOS
// ===================================================================

const lightTheme = EditorView.theme({
    '&': {
        color: '#333',
        backgroundColor: '#fff',
        fontSize: '14px',
        fontFamily: 'JetBrains Mono, Fira Code, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
    },
    '.cm-content': {
        padding: '16px',
        minHeight: '300px',
        caretColor: '#007acc',
        lineHeight: '1.6'
    },
    '.cm-focused': {
        outline: 'none'
    },
    '.cm-editor': {
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
    },
    '.cm-scroller': {
        overflow: 'auto'
    },
    '.cm-line': {
        lineHeight: '1.6'
    },
    '&.cm-focused .cm-selectionBackground': {
        backgroundColor: '#316ac5'
    },
    
    // 🎯 ESTILOS PARA VARIABLES
    '.cm-variable': {
        backgroundColor: 'rgba(251, 191, 36, 0.15)',
        color: '#d97706',
        fontWeight: '600',
        borderRadius: '3px',
        padding: '1px 2px'
    },
    '.cm-variable-brackets': {
        color: '#059669',
        fontWeight: 'bold'
    },
    '.cm-variable-invalid': {
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        color: '#dc2626',
        textDecoration: 'underline',
        textDecorationStyle: 'wavy'
    },
    
    // 🎨 AUTOCOMPLETADO MEJORADO
    '.cm-tooltip-autocomplete': {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        maxHeight: '400px',
        minWidth: '350px',
        fontSize: '13px'
    },
    '.cm-tooltip-autocomplete > ul': {
        maxHeight: '350px'
    },
    '.cm-tooltip-autocomplete > ul > li': {
        padding: '8px 12px',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: '#059669',
        color: 'white'
    },
    '.cm-tooltip-autocomplete .cm-completion-label': {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px'
    },
    '.cm-tooltip-autocomplete .cm-completion-detail': {
        fontSize: '11px',
        opacity: 0.8,
        marginLeft: 'auto'
    },
    
    // 🔧 TIPOS DE COMPLETIONS
    '.cm-completion-variable .cm-completion-label': {
        color: '#d97706',
        fontWeight: '600'
    },
    '.cm-completion-alpine-directive .cm-completion-label': {
        color: '#059669',
        fontWeight: '600'
    },
    '.cm-completion-snippet .cm-completion-label': {
        color: '#7c3aed',
        fontWeight: '600'
    }
}, { dark: false });

const darkTheme = [oneDark, EditorView.theme({
    '.cm-editor': {
        borderRadius: '8px',
        border: '1px solid #374151'
    },
    '.cm-content': {
        padding: '16px',
        minHeight: '300px',
        lineHeight: '1.6'
    },
    
    // 🎯 VARIABLES EN MODO OSCURO
    '.cm-variable': {
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
        color: '#fbbf24',
        fontWeight: '600',
        borderRadius: '3px',
        padding: '1px 2px'
    },
    '.cm-variable-brackets': {
        color: '#10b981',
        fontWeight: 'bold'
    },
    '.cm-variable-invalid': {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        color: '#f87171',
        textDecoration: 'underline',
        textDecorationStyle: 'wavy'
    },
    
    // 🎨 AUTOCOMPLETADO EN MODO OSCURO
    '.cm-tooltip-autocomplete': {
        backgroundColor: '#1f2937',
        border: '1px solid #374151',
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)'
    },
    '.cm-tooltip-autocomplete > ul > li': {
        borderBottom: '1px solid #374151',
        color: '#f3f4f6'
    },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: '#10b981'
    }
})];

// ===================================================================
// HIGHLIGHTING DE VARIABLES
// ===================================================================

const createVariableHighlighting = (theme) => {
    const isDark = theme === 'dark';
    
    return syntaxHighlighting(HighlightStyle.define([
        // 🎨 BASE COLORS
        { tag: t.content, color: isDark ? '#ffffff' : '#000000' },
        { tag: t.comment, color: isDark ? '#6b7280' : '#6b7280', fontStyle: 'italic' },
        
        // 🏷️ HTML TAGS
        { tag: t.tagName, color: isDark ? '#f87171' : '#dc2626', fontWeight: 'bold' },
        { tag: t.angleBracket, color: isDark ? '#d1d5db' : '#6b7280' },
        
        // ⚡ ALPINE DIRECTIVES
        { 
            tag: t.attributeName, 
            color: isDark ? '#10b981' : '#059669', 
            fontWeight: '600'
        },
        
        // 🎯 ATTRIBUTE VALUES & STRINGS
        { tag: t.attributeValue, color: isDark ? '#60a5fa' : '#2563eb' },
        { tag: t.string, color: isDark ? '#a78bfa' : '#7c3aed' },
        
        // 🎪 VARIABLES (custom highlighting se maneja por separado)
        { tag: t.special(t.string), color: isDark ? '#fbbf24' : '#d97706', fontWeight: 'bold' },
        
        // 🔢 NUMBERS AND LITERALS
        { tag: t.number, color: isDark ? '#34d399' : '#10b981' },
        { tag: t.bool, color: isDark ? '#f472b6' : '#ec4899' },
        { tag: t.null, color: isDark ? '#9ca3af' : '#6b7280' },
        
        // 🔧 OPERATORS
        { tag: t.operator, color: isDark ? '#fb7185' : '#e11d48' },
        { tag: t.punctuation, color: isDark ? '#d1d5db' : '#6b7280' },
        { tag: t.bracket, color: isDark ? '#c084fc' : '#8b5cf6' },
        
        // 🎪 CSS CLASSES
        { tag: t.className, color: isDark ? '#06b6d4' : '#0891b2' }
    ]));
};

// ===================================================================
// FIELD PARA DECORACIONES DE VARIABLES
// ===================================================================

const variableDecoration = Decoration.mark({
    class: 'cm-variable'
});

const variableBracketDecoration = Decoration.mark({
    class: 'cm-variable-brackets'
});

const invalidVariableDecoration = Decoration.mark({
    class: 'cm-variable-invalid'
});

const variableDecorations = StateField.define({
    create() {
        return Decoration.none;  // Instead of DecorationSet.empty
    },
    update(decorations, tr) {
        if (tr.docChanged) {
            return createVariableDecorations(tr.state);
        }
        return decorations.map(tr.changes);
    },
    provide(field) {
        return EditorView.decorations.from(field);
    }
});

function createVariableDecorations(state) {
    const decorations = [];
    const doc = state.doc;
    const text = doc.toString();
    
    // Buscar variables {{ variable }}
    const variableRegex = /\{\{\s*([^}]+)\s*\}\}/g;
    let match;
    
    // Collect all matches first
    const matches = [];
    while ((match = variableRegex.exec(text)) !== null) {
        matches.push({
            start: match.index,
            end: match.index + match[0].length,
            variableName: match[1].trim()
        });
    }

    // Process matches in order
    matches.forEach(({ start, end, variableName }) => {
        // Verificar si la variable es válida
        const isValid = validateVariableExists(variableName);
        
        // Crear decoraciones en orden
        decorations.push(variableBracketDecoration.range(start, start + 2)); // {{
        
        // Decorar el contenido de la variable
        const contentStart = start + 2;
        const contentEnd = end - 2;
        const decoration = isValid ? variableDecoration : invalidVariableDecoration;
        decorations.push(decoration.range(contentStart, contentEnd));
        
        // Cerrar brackets
        decorations.push(variableBracketDecoration.range(end - 2, end)); // }}
    });
    
    // Sort decorations by start position
    decorations.sort((a, b) => a.from - b.from);
    
    return Decoration.set(decorations, true); // true for "sorted"
}

function validateVariableExists(variableName) {
    // Verificar si existe el plugin de variables
    const variablesPlugin = window.pluginManager?.get('variables');
    if (variablesPlugin && variablesPlugin.validateVariable) {
        return variablesPlugin.validateVariable(variableName);
    }
    
    // Fallback: verificar variables básicas
    const basicVariables = [
        'user.name', 'user.email', 'user.role', 'user.firstName', 'user.lastName',
        'site.title', 'site.description', 'site.url', 'site.domain',
        'current.time', 'current.date', 'current.datetime', 'current.year',
        'app.name', 'app.version', 'app.environment'
    ];
    
    return basicVariables.includes(variableName);
}

// ===================================================================
// AUTOCOMPLETADO MEJORADO
// ===================================================================

const createVariableCompletions = () => {
    return autocompletion({
        override: [
            // 🎯 COMPLETIONS DE VARIABLES
            (context) => {
                const word = context.matchBefore(/\{\{[\w\s.]*\}?/);
                if (!word && !isStartingVariable(context)) {
                    return null;
                }

                const variablesPlugin = window.pluginManager?.get('variables');
                if (variablesPlugin && variablesPlugin.getCompletions) {
                    return {
                        from: word ? word.from : context.pos,
                        options: variablesPlugin.getCompletions(context)
                    };
                }
                
                return getBasicVariableCompletions(context, word);
            },
            
            // ⚡ COMPLETIONS DE ALPINE.JS
            (context) => {
                return getAlpineCompletions(context);
            },
            
            // 🔌 COMPLETIONS DE PLUGINS
            (context) => {
                return getPluginCompletions(context);
            }
        ],
        activateOnTyping: true,
        maxRenderedOptions: 25,
        closeOnBlur: true,
        defaultKeymap: true,
        interactionDelay: 75
    });
};

function isStartingVariable(context) {
    const pos = context.pos;
    const doc = context.state.doc;
    const line = doc.lineAt(pos);
    const beforeCursor = line.text.slice(Math.max(0, pos - line.from - 2), pos - line.from);
    
    return beforeCursor.endsWith('{{');
}

function getBasicVariableCompletions(context, word) {
    const suggestions = [
        // Variables de usuario
        { label: '{{ user.name }}', type: 'variable', info: 'Usuario', detail: 'Nombre del usuario' },
        { label: '{{ user.email }}', type: 'variable', info: 'Usuario', detail: 'Email del usuario' },
        { label: '{{ user.role }}', type: 'variable', info: 'Usuario', detail: 'Rol del usuario' },
        { label: '{{ user.firstName }}', type: 'variable', info: 'Usuario', detail: 'Nombre' },
        { label: '{{ user.lastName }}', type: 'variable', info: 'Usuario', detail: 'Apellido' },
        { label: '{{ user.initials }}', type: 'variable', info: 'Usuario', detail: 'Iniciales' },
        { label: '{{ user.isAdmin }}', type: 'variable', info: 'Usuario', detail: 'Es administrador' },
        { label: '{{ user.isLoggedIn }}', type: 'variable', info: 'Usuario', detail: 'Está logueado' },
        
        // Variables del sitio
        { label: '{{ site.title }}', type: 'variable', info: 'Sitio', detail: 'Título del sitio' },
        { label: '{{ site.description }}', type: 'variable', info: 'Sitio', detail: 'Descripción del sitio' },
        { label: '{{ site.url }}', type: 'variable', info: 'Sitio', detail: 'URL del sitio' },
        { label: '{{ site.domain }}', type: 'variable', info: 'Sitio', detail: 'Dominio' },
        { label: '{{ site.author }}', type: 'variable', info: 'Sitio', detail: 'Autor del sitio' },
        
        // Variables de tiempo
        { label: '{{ current.time }}', type: 'variable', info: 'Tiempo', detail: 'Hora actual' },
        { label: '{{ current.date }}', type: 'variable', info: 'Tiempo', detail: 'Fecha actual' },
        { label: '{{ current.datetime }}', type: 'variable', info: 'Tiempo', detail: 'Fecha y hora' },
        { label: '{{ current.year }}', type: 'variable', info: 'Tiempo', detail: 'Año actual' },
        { label: '{{ current.month }}', type: 'variable', info: 'Tiempo', detail: 'Mes actual' },
        { label: '{{ current.weekday }}', type: 'variable', info: 'Tiempo', detail: 'Día de la semana' },
        
        // Variables de la aplicación
        { label: '{{ app.name }}', type: 'variable', info: 'Aplicación', detail: 'Nombre de la app' },
        { label: '{{ app.version }}', type: 'variable', info: 'Aplicación', detail: 'Versión de la app' },
        { label: '{{ app.environment }}', type: 'variable', info: 'Aplicación', detail: 'Entorno (dev/prod)' },
        
        // Variables del sistema
        { label: '{{ system.timezone }}', type: 'variable', info: 'Sistema', detail: 'Zona horaria' },
        { label: '{{ system.language }}', type: 'variable', info: 'Sistema', detail: 'Idioma del sistema' },
        { label: '{{ system.viewport.width }}', type: 'variable', info: 'Sistema', detail: 'Ancho de viewport' },
        { label: '{{ system.viewport.height }}', type: 'variable', info: 'Sistema', detail: 'Alto de viewport' }
    ];

    return {
        from: word ? word.from : context.pos,
        options: suggestions
    };
}

function getAlpineCompletions(context) {
    const word = context.matchBefore(/[\w:-]*/);
    if (!word) return null;

    const alpineCompletions = [
        // Directivas Alpine
        { label: 'x-data', type: 'alpine-directive', info: 'Alpine.js', detail: 'Component data scope', insertText: 'x-data="{}"' },
        { label: 'x-show', type: 'alpine-directive', info: 'Alpine.js', detail: 'Toggle visibility', insertText: 'x-show=""' },
        { label: 'x-if', type: 'alpine-directive', info: 'Alpine.js', detail: 'Conditional rendering', insertText: 'x-if=""' },
        { label: 'x-for', type: 'alpine-directive', info: 'Alpine.js', detail: 'Loop through items', insertText: 'x-for="item in items"' },
        { label: 'x-text', type: 'alpine-directive', info: 'Alpine.js', detail: 'Set text content', insertText: 'x-text=""' },
        { label: 'x-html', type: 'alpine-directive', info: 'Alpine.js', detail: 'Set HTML content', insertText: 'x-html=""' },
        { label: 'x-model', type: 'alpine-directive', info: 'Alpine.js', detail: 'Two-way binding', insertText: 'x-model=""' },
        { label: 'x-bind:', type: 'alpine-directive', info: 'Alpine.js', detail: 'Bind attribute', insertText: 'x-bind:' },
        { label: 'x-on:', type: 'alpine-directive', info: 'Alpine.js', detail: 'Event listener', insertText: 'x-on:' },
        { label: '@click', type: 'alpine-event', info: 'Alpine.js', detail: 'Click event handler', insertText: '@click=""' },
        { label: '@input', type: 'alpine-event', info: 'Alpine.js', detail: 'Input event handler', insertText: '@input=""' },
        { label: '@submit', type: 'alpine-event', info: 'Alpine.js', detail: 'Submit event handler', insertText: '@submit=""' },
        { label: 'x-ref', type: 'alpine-directive', info: 'Alpine.js', detail: 'Element reference', insertText: 'x-ref=""' },
        { label: 'x-cloak', type: 'alpine-directive', info: 'Alpine.js', detail: 'Hide until Alpine loads', insertText: 'x-cloak' },
        { label: 'x-transition', type: 'alpine-directive', info: 'Alpine.js', detail: 'CSS transitions', insertText: 'x-transition' },
        { label: 'x-init', type: 'alpine-directive', info: 'Alpine.js', detail: 'Run on init', insertText: 'x-init=""' },
        
        // Clases Tailwind comunes
        { label: 'class="flex', type: 'css-class', info: 'Tailwind', detail: 'Flexbox container', insertText: 'class="flex items-center justify-center"' },
        { label: 'class="grid', type: 'css-class', info: 'Tailwind', detail: 'Grid container', insertText: 'class="grid grid-cols-2 gap-4"' },
        { label: 'class="bg-', type: 'css-class', info: 'Tailwind', detail: 'Background color', insertText: 'class="bg-blue-500"' },
        { label: 'class="text-', type: 'css-class', info: 'Tailwind', detail: 'Text color', insertText: 'class="text-gray-800"' },
        { label: 'class="p-', type: 'css-class', info: 'Tailwind', detail: 'Padding', insertText: 'class="p-4"' },
        { label: 'class="m-', type: 'css-class', info: 'Tailwind', detail: 'Margin', insertText: 'class="m-4"' },
        { label: 'class="w-', type: 'css-class', info: 'Tailwind', detail: 'Width', insertText: 'class="w-full"' },
        { label: 'class="h-', type: 'css-class', info: 'Tailwind', detail: 'Height', insertText: 'class="h-full"' }
    ];

    return {
        from: word.from,
        options: alpineCompletions.map(comp => ({
            label: comp.label,
            type: comp.type,
            info: comp.info,
            detail: comp.detail,
            apply: comp.insertText || comp.label
        }))
    };
}

function getPluginCompletions(context) {
    const completions = [];
    
    if (window.pluginManager) {
        const plugins = window.pluginManager.list();
        
        plugins.forEach(pluginInfo => {
            const plugin = window.pluginManager.get(pluginInfo.name);
            if (plugin?.getSnippets) {
                const snippets = plugin.getSnippets();
                Object.entries(snippets).forEach(([key, snippet]) => {
                    completions.push({
                        label: snippet.label || key,
                        type: 'snippet',
                        info: `${pluginInfo.name} snippet`,
                        detail: snippet.detail || snippet.description || '',
                        apply: snippet.body
                    });
                });
            }
        });
    }
    
    const word = context.matchBefore(/\w*/);
    if (word && word.from < word.to && completions.length > 0) {
        return {
            from: word.from,
            options: completions
        };
    }
    
    return null;
}

// ===================================================================
// VALIDACIÓN Y LINTING
// ===================================================================

const createVariableLinter = () => {
    return linter((view) => {
        const diagnostics = [];
        const code = view.state.doc.toString();
        
        try {
            // Usar el plugin de variables si está disponible
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin && variablesPlugin.validateSyntax) {
                const validation = variablesPlugin.validateSyntax(code);
                
                // Convertir errores del plugin a formato CodeMirror
                validation.errors?.forEach(error => {
                    diagnostics.push({
                        from: error.position || 0,
                        to: (error.position || 0) + (error.length || 1),
                        severity: 'error',
                        message: error.message,
                        actions: error.fixes?.map(fix => ({
                            name: fix.title,
                            apply: (view) => {
                                view.dispatch({
                                    changes: fix.changes
                                });
                            }
                        }))
                    });
                });

                validation.warnings?.forEach(warning => {
                    diagnostics.push({
                        from: warning.position || 0,
                        to: (warning.position || 0) + (warning.length || 1),
                        severity: 'warning',
                        message: warning.message
                    });
                });
            } else {
                // Validación básica como fallback
                const basicErrors = validateBasicSyntax(code);
                diagnostics.push(...basicErrors);
            }

        } catch (error) {
            console.error('❌ Linting error:', error);
        }

        return diagnostics;
    });
};

function validateBasicSyntax(code) {
    const diagnostics = [];
    
    // Verificar variables mal formadas
    const variablePattern = /\{\{([^}]*)\}\}/g;
    let match;
    
    while ((match = variablePattern.exec(code)) !== null) {
        const content = match[1].trim();
        const start = match.index;
        const end = start + match[0].length;
        
        if (!content) {
            diagnostics.push({
                from: start,
                to: end,
                severity: 'error',
                message: 'Variable vacía: {{ }}'
            });
        } else if (!/^[\w.-]+$/.test(content)) {
            diagnostics.push({
                from: start,
                to: end,
                severity: 'warning',
                message: `Variable con caracteres inválidos: {{ ${content} }}`
            });
        } else if (!validateVariableExists(content)) {
            diagnostics.push({
                from: start,
                to: end,
                severity: 'warning',
                message: `Variable desconocida: {{ ${content} }}`
            });
        }
    }
    
    return diagnostics;
}

// ===================================================================
// KEYMAPS PERSONALIZADOS
// ===================================================================

const createCustomKeymap = () => {
    return keymap.of([
        {
            key: 'Ctrl-Space',
            run: (view) => {
                // Forzar autocompletado
                const completion = view.state.languageDataAt('autocomplete', view.state.selection.main.head);
                if (completion) {
                    return true;
                }
                return false;
            }
        },
        {
            key: 'Ctrl-Shift-v',
            run: (view) => {
                // Insertar variable personalizada
                const cursor = view.state.selection.main.head;
                view.dispatch({
                    changes: {
                        from: cursor,
                        insert: '{{ variable.name }}'
                    },
                    selection: { anchor: cursor + 3, head: cursor + 16 } // Seleccionar "variable.name"
                });
                return true;
            }
        },
        {
            key: 'F1',
            run: (view) => {
                // Mostrar ayuda contextual
                showContextualHelp(view);
                return true;
            }
        }
    ]);
};

function showContextualHelp(view) {
    const pos = view.state.selection.main.head;
    const line = view.state.doc.lineAt(pos);
    const text = line.text;
    
    console.log('📖 Ayuda contextual solicitada para:', text.slice(Math.max(0, pos - line.from - 10), pos - line.from + 10));
    
    // Aquí se podría mostrar un tooltip con ayuda específica
    // Por ahora solo logging para debug
}

// ===================================================================
// FUNCIÓN PRINCIPAL PARA CREAR EXTENSIONES
// ===================================================================

export const createCodeMirrorExtensions = (
    extensions = [],
    completionSources = [],
    theme = 'light'
) => {
    const selectedTheme = theme === 'dark' ? darkTheme : lightTheme;
    
    return [
        basicSetup,
        html({
            matchClosingTags: true,
            autoCloseTags: true,
            nestedLanguages: []
        }),
        
        // Tema y highlighting
        selectedTheme,
        createVariableHighlighting(theme),
        
        // Sistema de variables
        variableDecorations,
        
        // Autocompletado
        createVariableCompletions(),
        
        // Validación y linting
        createVariableLinter(),
        lintGutter(),
        
        // Keymaps personalizados
        createCustomKeymap(),
        
        // Configuración del editor
        EditorView.lineWrapping,
        
        // Update listener para cambios de documento
        EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                // Notificar cambios para estadísticas
                if (window.debugMode) {
                    console.log('📝 Document updated, length:', update.state.doc.length);
                }
            }
        }),
        
        // Extensiones adicionales
        ...extensions,
        
        // Fuentes de autocompletado adicionales
        ...completionSources
    ];
};

// ===================================================================
// FUNCIONES DE CONVENIENCIA
// ===================================================================

export const createEditorExtensions = (options = {}) => {
    return createCodeMirrorExtensions(
        options.extensions || [],
        options.completionSources || [],
        options.theme || 'light'
    );
};

export const createVariableOnlyExtensions = (theme = 'light') => {
    return [
        createVariableCompletions(),
        variableDecorations,
        createVariableLinter(),
        createVariableHighlighting(theme)
    ];
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.debugCodeMirrorExtensions = {
        listSnippets() {
            const snippets = [];
            if (window.pluginManager) {
                const plugins = window.pluginManager.list();
                plugins.forEach(pluginInfo => {
                    const plugin = window.pluginManager.get(pluginInfo.name);
                    if (plugin?.getSnippets) {
                        const pluginSnippets = plugin.getSnippets();
                        Object.keys(pluginSnippets).forEach(key => {
                            snippets.push(`${pluginInfo.name}: ${key}`);
                        });
                    }
                });
            }
            console.log('📝 Available snippets:', snippets);
            return snippets;
        },
        
        testVariableValidation(variable) {
            const isValid = validateVariableExists(variable);
            console.log(`🔧 Variable "${variable}" is ${isValid ? 'valid' : 'invalid'}`);
            return isValid;
        },
        
        showAvailableVariables() {
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin) {
                console.table(variablesPlugin.getAvailableVariables());
            } else {
                console.log('❌ Variables plugin not found');
            }
        }
    };
    
    console.log('🔧 CodeMirror extensions debug helpers: window.debugCodeMirrorExtensions');
}