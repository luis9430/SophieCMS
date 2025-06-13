// ===================================================================
// components/EnhancedCodeMirrorEditor.jsx
// Editor visual integrado con EditorBridge y sistema de plugins
// ===================================================================

import { useEffect, useRef, useCallback, useState } from 'preact/hooks';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { autocompletion, completionKeymap, pickedCompletion } from '@codemirror/autocomplete';
import { EditorView, keymap, Decoration, DecorationSet } from '@codemirror/view';
import { EditorState, StateField, StateEffect } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';
import { linter, lintGutter } from '@codemirror/lint';

/**
 * Editor CodeMirror mejorado con interfaz visual completa
 */
const EnhancedCodeMirrorEditor = ({ 
    code, 
    onCodeChange, 
    language = 'html', 
    theme = 'light',
    showGutter = true,
    showValidation = true,
    autocompletionEnabled = true,
    placeholder = 'Escribe tu código aquí...'
}) => {
    // ===================================================================
    // ESTADO Y REFS
    // ===================================================================
    
    const editorRef = useRef(null);
    const [editorView, setEditorView] = useState(null);
    const [systemStatus, setSystemStatus] = useState({
        plugins: false,
        editorBridge: false,
        validation: false
    });
    const [completionStats, setCompletionStats] = useState({
        totalSuggestions: 0,
        lastTriggered: null,
        source: 'none'
    });

    // ===================================================================
    // VERIFICAR ESTADO DEL SISTEMA
    // ===================================================================

    useEffect(() => {
        const checkSystemStatus = () => {
            const status = {
                plugins: !!(window.pluginManager && window.pluginManager.list().length > 0),
                editorBridge: !!window.editorBridge,
                validation: !!(window.pluginManager && window.templateValidator)
            };
            setSystemStatus(status);
            
            if (status.editorBridge && window.editorBridge.autoDetectEditorPlugins) {
                window.editorBridge.autoDetectEditorPlugins();
            }
        };

        checkSystemStatus();
        const interval = setInterval(checkSystemStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    // ===================================================================
    // SISTEMA DE AUTOCOMPLETADO VISUAL
    // ===================================================================

    /**
     * Función de autocompletado unificada que usa EditorBridge
     */
    const createAutocompletionSystem = useCallback(() => {
        if (!autocompletionEnabled) return [];

        return autocompletion({
            override: [
                // ✅ FUNCIÓN UNIFICADA QUE MANEJA TODO
                (context) => {
                    // 🎯 1. PRIMERO: Intentar variables
                    const variableCompletions = tryGetVariableCompletions(context);
                    if (variableCompletions) {
                        setCompletionStats({
                            totalSuggestions: variableCompletions.options.length,
                            lastTriggered: new Date(),
                            source: 'variables'
                        });
                        return variableCompletions;
                    }

                    // 🔌 2. SEGUNDO: Intentar plugins
                    if (systemStatus.editorBridge && window.editorBridge) {
                        try {
                            const pluginCompletions = window.editorBridge.getCompletions(context);
                            if (pluginCompletions && pluginCompletions.length > 0) {
                                setCompletionStats({
                                    totalSuggestions: pluginCompletions.length,
                                    lastTriggered: new Date(),
                                    source: 'plugins'
                                });
                                return {
                                    from: context.pos,
                                    options: pluginCompletions
                                };
                            }
                        } catch (error) {
                            console.warn('Plugin completions error:', error);
                        }
                    }

                    // 🎨 3. TERCERO: Intentar Tailwind
                    const tailwindCompletions = tryGetTailwindCompletions(context);
                    if (tailwindCompletions) {
                        setCompletionStats({
                            totalSuggestions: tailwindCompletions.options.length,
                            lastTriggered: new Date(),
                            source: 'tailwind'
                        });
                        return tailwindCompletions;
                    }

                    return null;
                }
            ],
            closeOnBlur: false,
            activateOnTyping: true,
            selectOnOpen: false,
            maxRenderedOptions: 50
        });
    }, [autocompletionEnabled, systemStatus]);


    const tryGetVariableCompletions = (context) => {
        if (!systemStatus.variables) return null;
        
        try {
            // Detectar si estamos escribiendo variables
            const beforeCursor = context.state.doc.sliceString(
                Math.max(0, context.pos - 50), 
                context.pos
            );
            
            const variableMatch = beforeCursor.match(/\{\{[\w.]*$/);
            if (!variableMatch) return null;

            // Usar la función importada
            return getVariableCompletions(context);
        } catch (error) {
            console.warn('Variable completions error:', error);
            return null;
        }
    };

    
    const tryGetTailwindCompletions = (context) => {
        const word = context.matchBefore(/class\s*=\s*["'][^"']*$/);
        if (!word) return null;

        const tailwindClasses = [
            'bg-blue-500', 'text-white', 'p-4', 'm-4', 'flex', 'grid', 
            'w-full', 'h-full', 'rounded', 'shadow', 'border'
        ];

        const options = tailwindClasses.map(className => ({
            label: className,
            type: 'keyword',
            info: 'Tailwind CSS class'
        }));

        return {
            from: word.from,
            options,
            validFor: /^[\w-]*$/
        };
    };

    /**
     * Autocompletado legacy como fallback
     */
    const getLegacyCompletions = useCallback((context) => {
        const suggestions = [];
        const word = context.matchBefore(/[\w-:@${}.]*/);
        
        if (!word) return suggestions;
        
        const searchText = word.text.toLowerCase();

        // Directivas Alpine básicas
        const alpineDirectives = [
            { label: 'x-data', type: 'alpine-directive', info: 'Alpine.js', detail: 'Component data scope' },
            { label: 'x-show', type: 'alpine-directive', info: 'Alpine.js', detail: 'Toggle visibility' },
            { label: 'x-if', type: 'alpine-directive', info: 'Alpine.js', detail: 'Conditional rendering' },
            { label: 'x-for', type: 'alpine-directive', info: 'Alpine.js', detail: 'Loop through items' },
            { label: 'x-text', type: 'alpine-directive', info: 'Alpine.js', detail: 'Set text content' },
            { label: 'x-model', type: 'alpine-directive', info: 'Alpine.js', detail: 'Two-way binding' },
            { label: '@click', type: 'alpine-event', info: 'Alpine.js', detail: 'Click event handler' },
            { label: '@input', type: 'alpine-event', info: 'Alpine.js', detail: 'Input event handler' }
        ];

        alpineDirectives.forEach(directive => {
            if (directive.label.includes(searchText)) {
                suggestions.push(directive);
            }
        });

        // Variables básicas
        const basicVariables = [
            { label: '{{ user.name }}', type: 'variable', info: 'Variable', detail: 'User name' },
            { label: '{{ current.date }}', type: 'variable', info: 'Variable', detail: 'Current date' },
            { label: '{{ site.title }}', type: 'variable', info: 'Variable', detail: 'Site title' }
        ];

        basicVariables.forEach(variable => {
            if (variable.label.toLowerCase().includes(searchText)) {
                suggestions.push(variable);
            }
        });

        return suggestions;
    }, []);

    // ===================================================================
    // SYNTAX HIGHLIGHTING MEJORADO
    // ===================================================================

    const createSyntaxHighlighting = useCallback((theme) => {
        const isDark = theme === 'dark';
        
        return syntaxHighlighting(HighlightStyle.define([
            // 🎨 BASE COLORS
            { tag: t.content, color: isDark ? '#ffffff' : '#000000' },
            { tag: t.comment, color: isDark ? '#6b7280' : '#6b7280', fontStyle: 'italic' },
            
            // 🏷️ HTML TAGS
            { tag: t.tagName, color: isDark ? '#f87171' : '#dc2626', fontWeight: 'bold' },
            { tag: t.angleBracket, color: isDark ? '#d1d5db' : '#6b7280' },
            
            // ⚡ ALPINE DIRECTIVES - Verde brillante especial
            { 
                tag: t.attributeName, 
                color: isDark ? '#10b981' : '#059669', 
                fontWeight: '600',
                textDecoration: 'underline',
                textDecorationColor: isDark ? '#10b981' : '#059669',
                textDecorationThickness: '1px'
            },
            
            // 🎯 ATTRIBUTE VALUES
            { tag: t.attributeValue, color: isDark ? '#60a5fa' : '#2563eb' },
            { tag: t.string, color: isDark ? '#a78bfa' : '#7c3aed' },
            
            // 🪄 VARIABLES (custom highlighting)
            { tag: t.special(t.string), color: isDark ? '#fbbf24' : '#d97706', fontWeight: 'bold' },
            
            // 🔢 NUMBERS AND LITERALS
            { tag: t.number, color: isDark ? '#34d399' : '#10b981' },
            { tag: t.bool, color: isDark ? '#f472b6' : '#ec4899' },
            { tag: t.null, color: isDark ? '#9ca3af' : '#6b7280' },
            
            // 🔧 OPERATORS AND PUNCTUATION
            { tag: t.operator, color: isDark ? '#fb7185' : '#e11d48' },
            { tag: t.punctuation, color: isDark ? '#d1d5db' : '#6b7280' },
            { tag: t.bracket, color: isDark ? '#c084fc' : '#8b5cf6' },
            
            // 🎪 SPECIAL ALPINE CLASSES
            { tag: t.className, color: isDark ? '#06b6d4' : '#0891b2' }
        ]));
    }, []);

    // ===================================================================
    // SISTEMA DE VALIDACIÓN VISUAL
    // ===================================================================

    /**
     * Linter integrado con el sistema de plugins
     */
    const createLintingSystem = useCallback(() => {
        if (!showValidation) return [];

        return linter(async (view) => {
            const diagnostics = [];
            const code = view.state.doc.toString();

            try {
                // 🔌 USAR EDITOR BRIDGE PARA VALIDACIÓN
                if (systemStatus.editorBridge && window.editorBridge) {
                    try {
                        const validationResult = await window.editorBridge.validateSyntax(code);
                        
                        // Convertir errores a formato CodeMirror
                        validationResult.errors?.forEach(error => {
                            diagnostics.push({
                                from: error.position || 0,
                                to: (error.position || 0) + (error.length || 1),
                                severity: error.severity === 'error' ? 'error' : 'warning',
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

                        validationResult.warnings?.forEach(warning => {
                            diagnostics.push({
                                from: warning.position || 0,
                                to: (warning.position || 0) + (warning.length || 1),
                                severity: 'warning',
                                message: warning.message
                            });
                        });

                    } catch (error) {
                        console.warn('⚠️ EditorBridge validation failed:', error);
                    }
                }

                // Validación básica de sintaxis HTML
                const basicErrors = validateBasicSyntax(code);
                diagnostics.push(...basicErrors);

            } catch (error) {
                console.error('❌ Linting error:', error);
            }

            return diagnostics;
        });
    }, [systemStatus.editorBridge, showValidation]);

    /**
     * Validación básica como fallback
     */
    const validateBasicSyntax = (code) => {
        const diagnostics = [];
        
        // Verificar variables mal formadas
        const variablePattern = /\{\{([^}]*)\}\}/g;
        let match;
        
        while ((match = variablePattern.exec(code)) !== null) {
            const content = match[1].trim();
            
            if (!content) {
                diagnostics.push({
                    from: match.index,
                    to: match.index + match[0].length,
                    severity: 'error',
                    message: 'Variable vacía: {{ }}'
                });
            } else if (!/^[\w.-]+$/.test(content)) {
                diagnostics.push({
                    from: match.index,
                    to: match.index + match[0].length,
                    severity: 'warning',
                    message: `Variable con caracteres inválidos: {{ ${content} }}`
                });
            }
        }
        
        return diagnostics;
    };

    // ===================================================================
    // EXTENSIONES DEL EDITOR
    // ===================================================================

    const createEditorExtensions = useCallback(() => {
        const extensions = [
            // Lenguaje base
            html({
                matchClosingTags: true,
                autoCloseTags: true,
                nestedLanguages: []
            }),
            
            // Syntax highlighting
            createSyntaxHighlighting(theme),
            
            // Autocompletado
            autocompletionEnabled ? createAutocompletionSystem() : [],
            
            // Validación
            createLintingSystem(),
            
            // Gutter con números de línea y linting
            showGutter ? lintGutter() : [],
            
            // Keymaps personalizados
            keymap.of([
                ...completionKeymap,
                {
                    key: 'Ctrl-Space',
                    run: (view) => {
                        view.dispatch({
                            effects: [pickedCompletion.of(null)]
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
            ]),
            
            // Tema visual personalizado
            EditorView.theme({
                '&': {
                    fontSize: '14px',
                    fontFamily: 'JetBrains Mono, Monaco, Menlo, "Ubuntu Mono", Consolas, monospace',
                    height: '100%'
                },
                '.cm-content': {
                    padding: '16px',
                    minHeight: '400px',
                    lineHeight: '1.6'
                },
                '.cm-focused': {
                    outline: `2px solid ${theme === 'dark' ? '#10b981' : '#059669'}`,
                    outlineOffset: '-1px'
                },
                '.cm-editor': {
                    borderRadius: '8px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`
                },
                
                // 🎨 ESTILOS DE AUTOCOMPLETADO
                '.cm-tooltip-autocomplete': {
                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    maxHeight: '400px',
                    minWidth: '300px'
                },
                '.cm-tooltip-autocomplete > ul > li': {
                    padding: '8px 12px',
                    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#f3f4f6'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                },
                '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
                    backgroundColor: theme === 'dark' ? '#10b981' : '#059669',
                    color: 'white'
                },
                
                // 🏷️ ICONOS PARA TIPOS DE COMPLETIONS
                '.cm-completion-variable:before': { content: '"🎯"', marginRight: '4px' },
                '.cm-completion-alpine-directive:before': { content: '"⚡"', marginRight: '4px' },
                '.cm-completion-alpine-magic:before': { content: '"🪄"', marginRight: '4px' },
                '.cm-completion-alpine-event:before': { content: '"🖱️"', marginRight: '4px' },
                '.cm-completion-plugin:before': { content: '"🔌"', marginRight: '4px' },
                '.cm-completion-css-class:before': { content: '"🎨"', marginRight: '4px' },
                
                // 🚨 ESTILOS DE VALIDACIÓN
                '.cm-diagnostic': {
                    borderRadius: '3px',
                    padding: '2px 4px'
                },
                '.cm-diagnostic-error': {
                    backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
                    color: theme === 'dark' ? '#fca5a5' : '#dc2626',
                    borderLeft: '3px solid #dc2626'
                },
                '.cm-diagnostic-warning': {
                    backgroundColor: theme === 'dark' ? '#78350f' : '#fffbeb',
                    color: theme === 'dark' ? '#fbbf24' : '#d97706',
                    borderLeft: '3px solid #d97706'
                },
                
                // 🎯 HIGHLIGHTING ESPECIAL PARA VARIABLES
                '.cm-variable-highlight': {
                    backgroundColor: theme === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(217, 119, 6, 0.1)',
                    borderRadius: '3px',
                    padding: '1px 2px'
                }
            }),
            
            // Configuración visual adicional
            EditorView.lineWrapping
        ];

        // Agregar tema oscuro si está seleccionado
        if (theme === 'dark') {
            extensions.push(oneDark);
        }

        return extensions.filter(Boolean);
    }, [theme, autocompletionEnabled, showValidation, showGutter, createAutocompletionSystem, createLintingSystem, createSyntaxHighlighting]);

    // ===================================================================
    // FUNCIONES AUXILIARES
    // ===================================================================

    const showContextualHelp = (view) => {
        // Mostrar ayuda contextual basada en la posición del cursor
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        const text = line.text;
        
        console.log('📖 Contextual help requested for:', text.slice(Math.max(0, pos - line.from - 10), pos - line.from + 10));
        
        // Aquí podrías mostrar un tooltip con ayuda específica
    };

    // ===================================================================
    // MANEJO DE CAMBIOS
    // ===================================================================

    const handleCodeChange = useCallback((value) => {
        onCodeChange(value);
    }, [onCodeChange]);

    // ===================================================================
    // RENDER
    // ===================================================================

    return (
        <div className="enhanced-codemirror-container" style={{ height: '100%', position: 'relative' }}>
            {/* HEADER CON INFORMACIÓN DEL SISTEMA */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                fontSize: '12px',
                fontFamily: 'monospace'
            }}>
                {/* Estado del sistema */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ 
                        color: systemStatus.plugins ? '#10b981' : '#f59e0b',
                        fontWeight: 'bold'
                    }}>
                        🔌 {systemStatus.plugins ? 'Plugins Active' : 'Legacy Mode'}
                    </span>
                    <span style={{ 
                        color: systemStatus.editorBridge ? '#10b981' : '#6b7280'
                    }}>
                        📝 EditorBridge: {systemStatus.editorBridge ? '✅' : '❌'}
                    </span>
                    <span style={{ 
                        color: systemStatus.validation ? '#10b981' : '#6b7280'
                    }}>
                        🔍 Validation: {systemStatus.validation ? '✅' : '❌'}
                    </span>
                </div>

                {/* Estadísticas de autocompletado */}
                {completionStats.totalSuggestions > 0 && (
                    <div style={{ 
                        display: 'flex', 
                        gap: '8px', 
                        color: theme === 'dark' ? '#9ca3af' : '#6b7280' 
                    }}>
                        <span>💡 {completionStats.totalSuggestions} suggestions</span>
                        <span>📊 {completionStats.source}</span>
                        <span>⏰ {completionStats.lastTriggered}</span>
                    </div>
                )}
            </div>

            {/* EDITOR PRINCIPAL */}
            <div style={{ height: 'calc(100% - 40px)' }}>
                <CodeMirror
                    ref={editorRef}
                    value={code}
                    onChange={handleCodeChange}
                    extensions={createEditorExtensions()}
                    placeholder={placeholder}
                    basicSetup={{
                        lineNumbers: showGutter,
                        foldGutter: showGutter,
                        dropCursor: false,
                        allowMultipleSelections: false,
                        indentOnInput: true,
                        bracketMatching: true,
                        closeBrackets: true,
                        autocompletion: false, // Usamos nuestro sistema custom
                        highlightSelectionMatches: true,
                        searchKeymap: true,
                        tabSize: 2
                    }}
                    style={{ 
                        height: '100%',
                        fontSize: '14px'
                    }}
                />
            </div>

            {/* SHORTCUTS HELP (opcional) */}
            <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                padding: '4px 8px',
                backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: '4px',
                fontSize: '10px',
                color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                pointerEvents: 'none'
            }}>
                Ctrl+Space: Autocompletar • F1: Ayuda
            </div>
        </div>
    );
};

export default EnhancedCodeMirrorEditor;