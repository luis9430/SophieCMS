// ===================================================================
// components/IntegratedPageBuilderEditor.jsx
// EDITOR COMPLETO INTEGRADO - Solución final
// ===================================================================

import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { EditorView, keymap } from '@codemirror/view';
import { linter, lintGutter } from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';

// Importar nuestras extensiones personalizadas
import { AlpineCodeMirrorExtensions } from './CodeMirrorExtensions.js';
import EditorVisualInterface from './EditorVisualInterface.jsx';

/**
 * 🚀 EDITOR PRINCIPAL INTEGRADO
 * Combina CodeMirror + EditorBridge + Plugins + Interfaz Visual
 */
const IntegratedPageBuilderEditor = ({
    initialCode = '',
    onCodeChange,
    theme = 'light',
    height = '500px',
    showGutter = true,
    showValidation = true,
    showAutocompletion = true,
    showHelp = true,
    placeholder = 'Escribe tu código Alpine.js + HTML aquí...\n\nEjemplo:\n<div x-data="{ message: \'{{ user.name }}\' }">\n  <p x-text="message"></p>\n</div>',
    className = '',
    style = {}
}) => {
    // ===================================================================
    // ESTADO PRINCIPAL
    // ===================================================================
    
    const [code, setCode] = useState(initialCode);
    const [editorView, setEditorView] = useState(null);
    const editorRef = useRef(null);
    
    // Estado del sistema
    const [systemStatus, setSystemStatus] = useState({
        pluginManager: false,
        editorBridge: false,
        templateValidator: false,
        variablesPlugin: false,
        alpinePlugin: false
    });
    
    // Estado de la interfaz visual
    const [autocompletionPanel, setAutocompletionPanel] = useState({
        visible: false,
        suggestions: [],
        position: { x: 0, y: 0 }
    });
    
    const [validationPanel, setValidationPanel] = useState({
        visible: false,
        errors: [],
        warnings: []
    });
    
    const [helpPanel, setHelpPanel] = useState({
        visible: false,
        content: null,
        position: { x: 0, y: 0 }
    });
    
    // Estadísticas del editor
    const [editorStats, setEditorStats] = useState({
        linesCount: 0,
        charactersCount: 0,
        variablesCount: 0,
        alpineDirectivesCount: 0,
        lastModified: null
    });

    // ===================================================================
    // VERIFICACIÓN DEL SISTEMA
    // ===================================================================

    const checkSystemStatus = useCallback(() => {
        const status = {
            pluginManager: !!(window.pluginManager),
            editorBridge: !!(window.editorBridge),
            templateValidator: !!(window.templateValidator),
            variablesPlugin: !!(window.pluginManager?.get('variables')),
            alpinePlugin: !!(window.pluginManager?.get('alpine'))
        };
        
        setSystemStatus(status);
        
        // Auto-detectar plugins en EditorBridge
        if (status.editorBridge && window.editorBridge.autoDetectEditorPlugins) {
            window.editorBridge.autoDetectEditorPlugins();
        }
        
        return status;
    }, []);

    useEffect(() => {
        checkSystemStatus();
        const interval = setInterval(checkSystemStatus, 5000);
        return () => clearInterval(interval);
    }, [checkSystemStatus]);

    // ===================================================================
    // AUTOCOMPLETADO UNIFICADO
    // ===================================================================

    const createUnifiedAutocompletion = useCallback(() => {
        return autocompletion({
            override: [
                async (context) => {
                    try {
                        let suggestions = [];
                        let source = 'legacy';

                        // 🔌 PRIORIDAD 1: USAR EDITOR BRIDGE
                        if (systemStatus.editorBridge && window.editorBridge) {
                            try {
                                suggestions = await window.editorBridge.getCompletions(context);
                                source = 'editorBridge';
                                console.log(`🔌 EditorBridge: ${suggestions.length} sugerencias`);
                            } catch (error) {
                                console.warn('⚠️ EditorBridge falló:', error);
                            }
                        }

                        // 🔌 PRIORIDAD 2: USAR PLUGINS DIRECTAMENTE
                        if (suggestions.length === 0 && systemStatus.variablesPlugin) {
                            try {
                                const variablesPlugin = window.pluginManager.get('variables');
                                if (variablesPlugin?.getCompletions) {
                                    const varSuggestions = variablesPlugin.getCompletions(context);
                                    suggestions.push(...varSuggestions);
                                    source = 'variablesPlugin';
                                }
                            } catch (error) {
                                console.warn('⚠️ Variables plugin falló:', error);
                            }
                        }

                        // 🔄 FALLBACK: AUTOCOMPLETADO BÁSICO
                        if (suggestions.length === 0) {
                            suggestions = getBasicCompletions(context);
                            source = 'basic';
                        }

                        // Actualizar panel de autocompletado
                        if (showAutocompletion) {
                            updateAutocompletionPanel(context, suggestions);
                        }

                        console.log(`💡 Autocompletado: ${suggestions.length} sugerencias (${source})`);

                        if (suggestions.length === 0) return null;

                        const word = context.matchBefore(/[\w-:@${}.]*/);
                        if (!word || (word.from === word.to && !context.explicit)) return null;

                        return {
                            from: word.from,
                            options: suggestions.map(suggestion => ({
                                ...suggestion,
                                apply: suggestion.apply || createDefaultApply(suggestion)
                            }))
                        };

                    } catch (error) {
                        console.error('❌ Error en autocompletado:', error);
                        return null;
                    }
                }
            ],
            activateOnTyping: true,
            maxRenderedOptions: 50,
            closeOnBlur: true,
            defaultKeymap: true,
            interactionDelay: 100
        });
    }, [systemStatus, showAutocompletion]);

    // ===================================================================
    // VALIDACIÓN UNIFICADA
    // ===================================================================

    const createUnifiedLinter = useCallback(() => {
        if (!showValidation) return [];

        return linter(async (view) => {
            const diagnostics = [];
            const code = view.state.doc.toString();
            
            try {
                // 🔌 USAR EDITOR BRIDGE PARA VALIDACIÓN
                if (systemStatus.editorBridge && window.editorBridge) {
                    try {
                        const result = await window.editorBridge.validateSyntax(code);
                        diagnostics.push(...convertToDiagnostics(result.errors, 'error'));
                        diagnostics.push(...convertToDiagnostics(result.warnings, 'warning'));
                    } catch (error) {
                        console.warn('⚠️ EditorBridge validation failed:', error);
                    }
                }

                // 🔌 USAR TEMPLATE VALIDATOR
                if (systemStatus.templateValidator && window.templateValidator) {
                    try {
                        const validation = window.templateValidator.validate(code);
                        diagnostics.push(...convertToDiagnostics(validation.errors, 'error'));
                        diagnostics.push(...convertToDiagnostics(validation.warnings, 'warning'));
                    } catch (error) {
                        console.warn('⚠️ TemplateValidator failed:', error);
                    }
                }

                // Validación básica como fallback
                const basicDiagnostics = validateBasicSyntax(code);
                diagnostics.push(...basicDiagnostics);

                // Actualizar panel de validación
                updateValidationPanel(diagnostics);

            } catch (error) {
                console.error('❌ Error en validación:', error);
            }

            return diagnostics;
        });
    }, [systemStatus, showValidation]);

    // ===================================================================
    // EXTENSIONES DEL EDITOR
    // ===================================================================

    const createEditorExtensions = useCallback(() => {
        const extensions = [
            // Lenguaje base
            html({
                matchClosingTags: true,
                autoCloseTags: true
            }),
            
            // Autocompletado unificado
            showAutocompletion ? createUnifiedAutocompletion() : [],
            
            // Syntax highlighting mejorado
            AlpineCodeMirrorExtensions.highlighting(theme),
            
            // Validación unificada
            createUnifiedLinter(),
            
            // Decoraciones visuales
            AlpineCodeMirrorExtensions.variableHighlighter,
            
            // Gutter
            showGutter ? lintGutter() : [],
            
            // Keymaps personalizados
            keymap.of([
                ...completionKeymap,
                {
                    key: 'Ctrl-Space',
                    run: (view) => {
                        // Forzar autocompletado
                        view.dispatch({ effects: [] });
                        return true;
                    }
                },
                {
                    key: 'F1',
                    run: (view) => {
                        showContextualHelp(view);
                        return true;
                    }
                },
                {
                    key: 'Ctrl-/',
                    run: (view) => {
                        toggleComments(view);
                        return true;
                    }
                },
                {
                    key: 'Ctrl-Shift-F',
                    run: (view) => {
                        formatCode(view);
                        return true;
                    }
                }
            ]),
            
            // Tema personalizado
            AlpineCodeMirrorExtensions.theme(theme, {
                fontSize: '14px',
                fontFamily: 'JetBrains Mono, Monaco, Menlo, Consolas, monospace',
                lineHeight: '1.6'
            }),
            
            // Configuración adicional
            EditorView.lineWrapping,
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    updateEditorStats(update.state.doc.toString());
                }
            })
        ];

        // Tema oscuro
        if (theme === 'dark') {
            extensions.push(oneDark);
        }

        return extensions.filter(Boolean);
    }, [theme, showAutocompletion, showValidation, showGutter, createUnifiedAutocompletion, createUnifiedLinter]);

    // ===================================================================
    // FUNCIONES AUXILIARES
    // ===================================================================

    const getBasicCompletions = (context) => {
        const word = context.matchBefore(/[\w-:@${}.]*/);
        if (!word) return [];
        
        const searchText = word.text.toLowerCase();
        const completions = [];

        // Directivas Alpine básicas
        const alpineDirectives = [
            { label: 'x-data', type: 'alpine-directive', info: 'Alpine.js', detail: 'Component data scope', boost: 95 },
            { label: 'x-show', type: 'alpine-directive', info: 'Alpine.js', detail: 'Toggle visibility', boost: 90 },
            { label: 'x-if', type: 'alpine-directive', info: 'Alpine.js', detail: 'Conditional rendering', boost: 85 },
            { label: 'x-for', type: 'alpine-directive', info: 'Alpine.js', detail: 'Loop rendering', boost: 80 },
            { label: 'x-text', type: 'alpine-directive', info: 'Alpine.js', detail: 'Set text content', boost: 75 },
            { label: 'x-model', type: 'alpine-directive', info: 'Alpine.js', detail: 'Two-way binding', boost: 85 },
            { label: '@click', type: 'alpine-event', info: 'Alpine.js', detail: 'Click event', boost: 90 },
            { label: '@input', type: 'alpine-event', info: 'Alpine.js', detail: 'Input event', boost: 80 }
        ];

        alpineDirectives.forEach(directive => {
            if (directive.label.includes(searchText)) {
                completions.push(directive);
            }
        });

        // Variables básicas
        const basicVariables = [
            { label: '{{ user.name }}', type: 'variable', info: 'Variable de Usuario', detail: 'Nombre del usuario', boost: 85 },
            { label: '{{ current.date }}', type: 'variable', info: 'Variable de Sistema', detail: 'Fecha actual', boost: 80 },
            { label: '{{ site.title }}', type: 'variable', info: 'Variable de Sitio', detail: 'Título del sitio', boost: 75 }
        ];

        basicVariables.forEach(variable => {
            if (variable.label.toLowerCase().includes(searchText)) {
                completions.push(variable);
            }
        });

        return completions;
    };

    const createDefaultApply = (suggestion) => {
        return (view, completion, from, to) => {
            let insertText = completion.label;
            
            // Para directivas que necesitan valor
            if (suggestion.type === 'alpine-directive' && 
                ['x-data', 'x-show', 'x-if', 'x-text', 'x-model'].includes(suggestion.label)) {
                insertText += '=""';
                view.dispatch({
                    changes: { from, to, insert: insertText },
                    selection: { anchor: from + insertText.length - 1 }
                });
                return;
            }
            
            view.dispatch({
                changes: { from, to, insert: insertText }
            });
        };
    };

    const validateBasicSyntax = (code) => {
        const diagnostics = [];
        
        // Validar variables {{ }}
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

    const convertToDiagnostics = (items, severity) => {
        return (items || []).map(item => ({
            from: item.position || 0,
            to: (item.position || 0) + (item.length || 1),
            severity,
            message: item.message,
            actions: item.fixes?.map(fix => ({
                name: fix.title,
                apply: (view) => {
                    view.dispatch({ changes: fix.changes });
                }
            }))
        }));
    };

    const updateAutocompletionPanel = (context, suggestions) => {
        if (!showAutocompletion) return;
        
        // Calcular posición del panel basada en el cursor
        const coords = editorView?.coordsAtPos?.(context.pos);
        
        setAutocompletionPanel({
            visible: suggestions.length > 0,
            suggestions,
            position: coords ? { x: coords.left, y: coords.bottom + 5 } : { x: 0, y: 0 }
        });
    };

    const updateValidationPanel = (diagnostics) => {
        const errors = diagnostics.filter(d => d.severity === 'error');
        const warnings = diagnostics.filter(d => d.severity === 'warning');
        
        setValidationPanel({
            visible: errors.length > 0 || warnings.length > 0,
            errors,
            warnings
        });
    };

    const updateEditorStats = (code) => {
        const lines = code.split('\n');
        const variablesCount = (code.match(/\{\{[^}]+\}\}/g) || []).length;
        const alpineDirectivesCount = (code.match(/(x-[\w-]+|@[\w-]+)/g) || []).length;
        
        setEditorStats({
            linesCount: lines.length,
            charactersCount: code.length,
            variablesCount,
            alpineDirectivesCount,
            lastModified: new Date().toLocaleTimeString()
        });
    };

    const showContextualHelp = (view) => {
        if (!showHelp) return;
        
        const pos = view.state.selection.main.head;
        const line = view.state.doc.lineAt(pos);
        const text = line.text;
        const wordMatch = text.slice(0, pos - line.from).match(/[\w-:@${}]*$/);
        
        if (wordMatch) {
            const word = wordMatch[0];
            const helpContent = getHelpContent(word);
            
            if (helpContent) {
                const coords = view.coordsAtPos(pos);
                setHelpPanel({
                    visible: true,
                    content: helpContent,
                    position: coords ? { x: coords.left, y: coords.bottom + 5 } : { x: 0, y: 0 }
                });
            }
        }
    };

    const getHelpContent = (word) => {
        // Ayuda para directivas Alpine
        const alpineHelp = {
            'x-data': {
                title: 'x-data',
                description: 'Define el ámbito de datos reactivos de un componente Alpine.js',
                example: 'x-data="{ count: 0, message: \'Hola\' }"',
                docs: 'https://alpinejs.dev/directives/data'
            },
            'x-show': {
                title: 'x-show',
                description: 'Muestra u oculta un elemento basado en una expresión booleana.',
                example: 'x-show="isVisible"',
                docs: 'https://alpinejs.dev/directives/show'
            }
        };
        
        return alpineHelp[word] || null;
    };

    const toggleComments = (view) => {
        // Implementar toggle de comentarios HTML
        console.log('Toggle comments');
    };

    const formatCode = (view) => {
        // Implementar formateo de código
        if (systemStatus.editorBridge && window.editorBridge.formatCode) {
            const formatted = window.editorBridge.formatCode(view.state.doc.toString());
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: formatted }
            });
        }
    };

    // ===================================================================
    // MANEJO DE CAMBIOS
    // ===================================================================

    const handleCodeChange = useCallback((value) => {
        setCode(value);
        onCodeChange?.(value);
        updateEditorStats(value);
    }, [onCodeChange]);

    const handleAutocompletionSelect = useCallback((suggestion) => {
        // Aplicar la sugerencia seleccionada
        if (editorView && suggestion.apply) {
            // Aquí necesitarías la lógica específica para aplicar la sugerencia
        }
        
        setAutocompletionPanel(prev => ({ ...prev, visible: false }));
    }, [editorView]);

    const handleValidationClick = useCallback((diagnostic) => {
        // Navegar a la posición del error
        if (editorView && diagnostic.from !== undefined) {
            editorView.dispatch({
                selection: { anchor: diagnostic.from, head: diagnostic.to || diagnostic.from }
            });
            editorView.focus();
        }
    }, [editorView]);

    const handleHelpClose = useCallback(() => {
        setHelpPanel(prev => ({ ...prev, visible: false }));
    }, []);

    // ===================================================================
    // RENDER
    // ===================================================================

    return (
        <div 
            className={`integrated-page-builder-editor ${className}`}
            style={{ 
                height,
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                overflow: 'hidden',
                fontFamily: 'system-ui, sans-serif',
                ...style
            }}
        >
            {/* HEADER CON ESTADO DEL SISTEMA Y ESTADÍSTICAS */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 16px',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                fontSize: '12px',
                fontFamily: 'monospace'
            }}>
                {/* Estado del sistema */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ 
                        color: systemStatus.pluginManager ? '#10b981' : '#f59e0b',
                        fontWeight: 'bold'
                    }}>
                        🔌 {systemStatus.pluginManager ? 'Plugin System' : 'Legacy Mode'}
                    </span>
                    <span style={{ color: systemStatus.editorBridge ? '#10b981' : '#6b7280' }}>
                        📝 Bridge: {systemStatus.editorBridge ? '✅' : '❌'}
                    </span>
                    <span style={{ color: systemStatus.variablesPlugin ? '#10b981' : '#6b7280' }}>
                        🎯 Variables: {systemStatus.variablesPlugin ? '✅' : '❌'}
                    </span>
                    <span style={{ color: systemStatus.alpinePlugin ? '#10b981' : '#6b7280' }}>
                        ⚡ Alpine: {systemStatus.alpinePlugin ? '✅' : '❌'}
                    </span>
                </div>

                {/* Estadísticas del editor */}
                <div style={{ 
                    display: 'flex', 
                    gap: '12px', 
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280' 
                }}>
                    <span>📄 {editorStats.linesCount} líneas</span>
                    <span>🔤 {editorStats.charactersCount} chars</span>
                    <span>🎯 {editorStats.variablesCount} vars</span>
                    <span>⚡ {editorStats.alpineDirectivesCount} alpine</span>
                    {editorStats.lastModified && (
                        <span>⏰ {editorStats.lastModified}</span>
                    )}
                </div>
            </div>

            {/* EDITOR PRINCIPAL */}
            <div style={{ flex: 1, position: 'relative' }}>
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
                        autocompletion: false, // Usamos nuestro sistema
                        highlightSelectionMatches: true,
                        searchKeymap: true,
                        tabSize: 2
                    }}
                    style={{ 
                        height: '100%',
                        fontSize: '14px'
                    }}
                />

                {/* SHORTCUTS HELP */}
                <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    right: '8px',
                    padding: '4px 8px',
                    backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    pointerEvents: 'none',
                    fontFamily: 'monospace'
                }}>
                    Ctrl+Space: Autocompletar • F1: Ayuda • Ctrl+/: Comentar • Ctrl+Shift+F: Formatear
                </div>
            </div>

            {/* INTERFAZ VISUAL OVERLAY */}
            <EditorVisualInterface
                autocompletion={{
                    ...autocompletionPanel,
                    onSelect: handleAutocompletionSelect,
                    onClose: () => setAutocompletionPanel(prev => ({ ...prev, visible: false }))
                }}
                validation={{
                    ...validationPanel,
                    onErrorClick: handleValidationClick
                }}
                help={{
                    ...helpPanel,
                    onClose: handleHelpClose
                }}
                theme={theme}
            />
        </div>
    );
};

export default IntegratedPageBuilderEditor;