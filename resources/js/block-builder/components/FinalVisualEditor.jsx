// ===================================================================
// components/FinalVisualEditor.jsx
// Editor Visual Completo - Versión final integrada
// ===================================================================

import { useState, useEffect, useCallback, useRef } from 'preact/hooks';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { EditorView, keymap } from '@codemirror/view';
import { linter, lintGutter } from '@codemirror/lint';
import { oneDark } from '@codemirror/theme-one-dark';

// Importar nuestras extensiones
import { createCompleteEditorExtensions } from './CodeMirrorExtensions.js';
import { AlpineCodeMirrorExtensions } from '../extensions/CodeMirrorExtensions.js';
import EditorVisualInterface from './EditorVisualInterface.jsx';

/**
 * 🎨 EDITOR VISUAL COMPLETO FINAL
 * Combina todo: CodeMirror + EditorBridge + Plugins + Interfaz Visual
 */
const FinalVisualEditor = ({
    initialCode = '',
    onCodeChange,
    theme = 'light',
    height = '600px',
    placeholder = 'Escribe tu código Alpine.js + HTML aquí...\n\n<!-- Usa Ctrl+Space para autocompletado -->\n<!-- Usa Ctrl+Shift+V para insertar variables -->\n\nEjemplo:\n<div x-data="{ mensaje: \'{{ user.name }}\' }">\n  <p x-text="mensaje" class="text-blue-600"></p>\n</div>',
    className = '',
    style = {},
    showToolbar = true,
    showStatusBar = true,
    enableHotkeys = true,
    enableLiveValidation = true
}) => {
    // ===================================================================
    // ESTADO DEL EDITOR
    // ===================================================================
    
    const [code, setCode] = useState(initialCode);
    const [editorView, setEditorView] = useState(null);
    const editorRef = useRef(null);
    
    // Estado del sistema
    const [systemStatus, setSystemStatus] = useState({
        editorBridge: false,
        pluginManager: false,
        variablesPlugin: false,
        alpinePlugin: false,
        allReady: false
    });
    
    // Estado de la interfaz visual
    const [visualInterface, setVisualInterface] = useState({
        autocompletion: {
            visible: false,
            suggestions: [],
            position: { x: 0, y: 0 }
        },
        validation: {
            visible: false,
            errors: [],
            warnings: []
        },
        help: {
            visible: false,
            content: null,
            position: { x: 0, y: 0 }
        }
    });
    
    // Estadísticas del editor
    const [editorStats, setEditorStats] = useState({
        linesCount: 0,
        charactersCount: 0,
        wordsCount: 0,
        variablesCount: 0,
        alpineDirectivesCount: 0,
        errorsCount: 0,
        warningsCount: 0,
        lastModified: null
    });

    // ===================================================================
    // VERIFICACIÓN DEL SISTEMA
    // ===================================================================

    const checkSystemStatus = useCallback(() => {
        const status = {
            editorBridge: !!(window.editorBridge),
            pluginManager: !!(window.pluginManager),
            variablesPlugin: !!(window.pluginManager?.get('variables')),
            alpinePlugin: !!(window.pluginManager?.get('alpine')),
        };
        
        status.allReady = Object.values(status).every(Boolean);
        
        setSystemStatus(status);
        
        // Auto-configurar EditorBridge
        if (status.editorBridge && window.editorBridge.autoDetectEditorPlugins) {
            window.editorBridge.autoDetectEditorPlugins();
        }
        
        return status;
    }, []);

    useEffect(() => {
        checkSystemStatus();
        const interval = setInterval(checkSystemStatus, 3000);
        return () => clearInterval(interval);
    }, [checkSystemStatus]);

    // ===================================================================
    // SISTEMA DE AUTOCOMPLETADO UNIFICADO
    // ===================================================================

    const createUnifiedAutocompletion = useCallback(() => {
        return autocompletion({
            override: [
                async (context) => {
                    try {
                        let suggestions = [];
                        let source = 'fallback';

                        // 🔌 PRIORIDAD 1: USAR EDITOR BRIDGE
                        if (systemStatus.editorBridge && window.editorBridge?.getCompletions) {
                            try {
                                suggestions = await window.editorBridge.getCompletions(context);
                                source = 'editorBridge';
                                console.log(`🔌 EditorBridge: ${suggestions.length} sugerencias`);
                            } catch (error) {
                                console.warn('⚠️ EditorBridge falló:', error);
                            }
                        }

                        // 🎯 PRIORIDAD 2: PLUGINS DIRECTOS
                        if (suggestions.length === 0) {
                            // Variables Plugin
                            if (systemStatus.variablesPlugin) {
                                const variablesPlugin = window.pluginManager.get('variables');
                                if (variablesPlugin?.getCompletions) {
                                    const varSuggestions = variablesPlugin.getCompletions(context);
                                    suggestions.push(...varSuggestions);
                                    source = 'variablesPlugin';
                                }
                            }

                            // Alpine Plugin
                            if (systemStatus.alpinePlugin) {
                                const alpinePlugin = window.pluginManager.get('alpine');
                                if (alpinePlugin?.getEditorCompletions) {
                                    const alpineSuggestions = alpinePlugin.getEditorCompletions(context);
                                    suggestions.push(...alpineSuggestions);
                                    source = source === 'variablesPlugin' ? 'mixed' : 'alpinePlugin';
                                }
                            }
                        }

                        // 🔄 FALLBACK: Sistema básico
                        if (suggestions.length === 0) {
                            suggestions = getBasicCompletions(context);
                            source = 'basic';
                        }

                        // Actualizar interfaz visual
                        updateAutocompletionInterface(context, suggestions, source);

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
            interactionDelay: 75
        });
    }, [systemStatus]);

    // ===================================================================
    // SISTEMA DE VALIDACIÓN UNIFICADO
    // ===================================================================

    const createUnifiedLinter = useCallback(() => {
        if (!enableLiveValidation) return [];

        return linter(async (view) => {
            const diagnostics = [];
            const code = view.state.doc.toString();
            
            try {
                // 🔌 USAR EDITOR BRIDGE
                if (systemStatus.editorBridge && window.editorBridge?.validateSyntax) {
                    const result = await window.editorBridge.validateSyntax(code);
                    diagnostics.push(...convertToDiagnostics(result.errors, 'error'));
                    diagnostics.push(...convertToDiagnostics(result.warnings, 'warning'));
                }

                // 🎯 VALIDACIÓN DE PLUGINS ESPECÍFICOS
                if (systemStatus.variablesPlugin) {
                    const variablesPlugin = window.pluginManager.get('variables');
                    if (variablesPlugin?.validateCode) {
                        const varValidation = variablesPlugin.validateCode(code);
                        diagnostics.push(...convertToDiagnostics(varValidation.errors, 'error'));
                        diagnostics.push(...convertToDiagnostics(varValidation.warnings, 'warning'));
                    }
                }

                // Validación básica como fallback
                const basicDiagnostics = validateBasicSyntax(code);
                diagnostics.push(...basicDiagnostics);

                // Actualizar interfaz visual
                updateValidationInterface(diagnostics);

            } catch (error) {
                console.error('❌ Error en validación:', error);
            }

            return diagnostics;
        });
    }, [systemStatus, enableLiveValidation]);

    // ===================================================================
    // EXTENSIONES DEL EDITOR
    // ===================================================================

    const createEditorExtensions = useCallback(() => {
        const extensions = [
            // Lenguaje HTML base
            html({
                matchClosingTags: true,
                autoCloseTags: true
            }),
            
            // Sistema de autocompletado
            createUnifiedAutocompletion(),
            
            // Sistema de validación
            createUnifiedLinter(),
            
            // Syntax highlighting mejorado
            AlpineCodeMirrorExtensions.highlighting(theme),
            
            // Decoraciones visuales
            AlpineCodeMirrorExtensions.variableHighlighter,
            
            // Extensiones completas personalizadas
            ...createCompleteEditorExtensions(theme),
            
            // Gutter con linting
            lintGutter(),
            
            // Hotkeys si están habilitados
            ...(enableHotkeys ? [
                keymap.of([
                    ...completionKeymap,
                    {
                        key: 'F1',
                        run: (view) => {
                            showContextualHelp(view);
                            return true;
                        }
                    },
                    {
                        key: 'Ctrl-Shift-P',
                        run: (view) => {
                            showCommandPalette(view);
                            return true;
                        }
                    }
                ])
            ] : []),
            
            // Listener de actualizaciones
            EditorView.updateListener.of((update) => {
                if (update.docChanged) {
                    const newCode = update.state.doc.toString();
                    updateEditorStats(newCode);
                    
                    // Debounce el onChange
                    if (onCodeChange) {
                        clearTimeout(window.editorChangeTimeout);
                        window.editorChangeTimeout = setTimeout(() => {
                            onCodeChange(newCode);
                        }, 300);
                    }
                }
                
                if (update.view) {
                    setEditorView(update.view);
                }
            }),
            
            // Line wrapping
            EditorView.lineWrapping
        ];

        // Tema oscuro
        if (theme === 'dark') {
            extensions.push(oneDark);
        }

        return extensions.filter(Boolean);
    }, [theme, createUnifiedAutocompletion, createUnifiedLinter, enableHotkeys, onCodeChange]);

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
            { label: 'x-text', type: 'alpine-directive', info: 'Alpine.js', detail: 'Set text content', boost: 80 },
            { label: '@click', type: 'alpine-event', info: 'Alpine.js', detail: 'Click event', boost: 88 }
        ];

        alpineDirectives.forEach(directive => {
            if (directive.label.includes(searchText)) {
                completions.push(directive);
            }
        });

        // Variables básicas
        const basicVariables = [
            { label: '{{ user.name }}', type: 'variable', info: 'Usuario', detail: 'Nombre del usuario', boost: 85 },
            { label: '{{ current.date }}', type: 'variable', info: 'Sistema', detail: 'Fecha actual', boost: 80 }
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
            view.dispatch({
                changes: { from, to, insert: completion.label }
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
            }
        }
        
        return diagnostics;
    };

    const convertToDiagnostics = (items, severity) => {
        return (items || []).map(item => ({
            from: item.position || 0,
            to: (item.position || 0) + (item.length || 1),
            severity,
            message: item.message
        }));
    };

    const updateAutocompletionInterface = (context, suggestions, source) => {
        const coords = editorView?.coordsAtPos?.(context.pos);
        
        setVisualInterface(prev => ({
            ...prev,
            autocompletion: {
                visible: suggestions.length > 0,
                suggestions,
                position: coords ? { x: coords.left, y: coords.bottom + 5 } : { x: 0, y: 0 },
                source
            }
        }));
    };

    const updateValidationInterface = (diagnostics) => {
        const errors = diagnostics.filter(d => d.severity === 'error');
        const warnings = diagnostics.filter(d => d.severity === 'warning');
        
        setVisualInterface(prev => ({
            ...prev,
            validation: {
                visible: errors.length > 0 || warnings.length > 0,
                errors,
                warnings
            }
        }));
    };

    const updateEditorStats = (code) => {
        const lines = code.split('\n');
        const words = code.split(/\s+/).filter(word => word.length > 0);
        const variables = (code.match(/\{\{[^}]+\}\}/g) || []).length;
        const alpineDirectives = (code.match(/(x-[\w-]+|@[\w-]+)/g) || []).length;
        
        setEditorStats({
            linesCount: lines.length,
            charactersCount: code.length,
            wordsCount: words.length,
            variablesCount: variables,
            alpineDirectivesCount: alpineDirectives,
            errorsCount: visualInterface.validation.errors.length,
            warningsCount: visualInterface.validation.warnings.length,
            lastModified: new Date().toLocaleTimeString()
        });
    };

    const showContextualHelp = (view) => {
        const pos = view.state.selection.main.head;
        const coords = view.coordsAtPos(pos);
        
        setVisualInterface(prev => ({
            ...prev,
            help: {
                visible: true,
                content: {
                    title: 'Ayuda del Editor',
                    description: 'Editor Alpine.js + Variables con autocompletado inteligente',
                    shortcuts: [
                        'Ctrl+Space: Autocompletado',
                        'Ctrl+Shift+V: Insertar variable',
                        'Ctrl+/: Comentar línea',
                        'F1: Esta ayuda'
                    ]
                },
                position: coords ? { x: coords.left, y: coords.bottom + 5 } : { x: 0, y: 0 }
            }
        }));
    };

    const showCommandPalette = (view) => {
        // Implementar paleta de comandos
        console.log('🎨 Command Palette opened');
    };

    // ===================================================================
    // HANDLERS DE EVENTOS
    // ===================================================================

    const handleCodeChange = useCallback((value) => {
        setCode(value);
        updateEditorStats(value);
    }, []);

    const handleAutocompletionSelect = useCallback((suggestion) => {
        setVisualInterface(prev => ({
            ...prev,
            autocompletion: { ...prev.autocompletion, visible: false }
        }));
    }, []);

    const handleValidationClick = useCallback((diagnostic) => {
        if (editorView && diagnostic.from !== undefined) {
            editorView.dispatch({
                selection: { anchor: diagnostic.from, head: diagnostic.to || diagnostic.from }
            });
            editorView.focus();
        }
    }, [editorView]);

    const handleHelpClose = useCallback(() => {
        setVisualInterface(prev => ({
            ...prev,
            help: { ...prev.help, visible: false }
        }));
    }, []);

    // ===================================================================
    // RENDER
    // ===================================================================

    return (
        <div 
            className={`final-visual-editor ${className}`}
            style={{ 
                height,
                display: 'flex',
                flexDirection: 'column',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                borderRadius: '12px',
                overflow: 'hidden',
                fontFamily: 'system-ui, sans-serif',
                background: theme === 'dark' ? '#1f2937' : '#ffffff',
                ...style
            }}
        >
            {/* TOOLBAR */}
            {showToolbar && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    fontSize: '12px',
                    fontWeight: '500'
                }}>
                    {/* Estado del sistema */}
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ 
                            color: systemStatus.allReady ? '#10b981' : '#f59e0b',
                            fontWeight: 'bold'
                        }}>
                            {systemStatus.allReady ? '🟢 Sistema Completo' : '🟡 Sistema Parcial'}
                        </span>
                        <span style={{ color: systemStatus.editorBridge ? '#10b981' : '#6b7280' }}>
                            EditorBridge: {systemStatus.editorBridge ? '✅' : '❌'}
                        </span>
                        <span style={{ color: systemStatus.variablesPlugin ? '#10b981' : '#6b7280' }}>
                            Variables: {systemStatus.variablesPlugin ? '✅' : '❌'}
                        </span>
                        <span style={{ color: systemStatus.alpinePlugin ? '#10b981' : '#6b7280' }}>
                            Alpine: {systemStatus.alpinePlugin ? '✅' : '❌'}
                        </span>
                    </div>

                    {/* Controles */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                            onClick={() => checkSystemStatus()}
                            style={{
                                padding: '4px 8px',
                                border: 'none',
                                borderRadius: '4px',
                                background: theme === 'dark' ? '#374151' : '#e5e7eb',
                                color: theme === 'dark' ? '#f3f4f6' : '#374151',
                                fontSize: '11px',
                                cursor: 'pointer'
                            }}
                        >
                            🔄 Refresh
                        </button>
                        <button 
                            onClick={() => showContextualHelp(editorView)}
                            style={{
                                padding: '4px 8px',
                                border: 'none',
                                borderRadius: '4px',
                                background: theme === 'dark' ? '#374151' : '#e5e7eb',
                                color: theme === 'dark' ? '#f3f4f6' : '#374151',
                                fontSize: '11px',
                                cursor: 'pointer'
                            }}
                        >
                            ❓ Help
                        </button>
                    </div>
                </div>
            )}

            {/* EDITOR PRINCIPAL */}
            <div style={{ flex: 1, position: 'relative' }}>
                <CodeMirror
                    ref={editorRef}
                    value={code}
                    onChange={handleCodeChange}
                    extensions={createEditorExtensions()}
                    placeholder={placeholder}
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
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
                        fontSize: '14px',
                        fontFamily: 'JetBrains Mono, Monaco, Menlo, Consolas, monospace'
                    }}
                />

                {/* OVERLAYS DE AYUDA */}
                <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    padding: '6px 12px',
                    backgroundColor: theme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '6px',
                    fontSize: '10px',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                    pointerEvents: 'none',
                    fontFamily: 'monospace',
                    backdropFilter: 'blur(4px)'
                }}>
                    {enableHotkeys && (
                        <>
                            Ctrl+Space: Autocompletar • F1: Ayuda • Ctrl+Shift+V: Variable
                        </>
                    )}
                </div>
            </div>

            {/* STATUS BAR */}
            {showStatusBar && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 16px',
                    backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                    borderTop: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    fontSize: '11px',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                }}>
                    {/* Estadísticas */}
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <span>📄 {editorStats.linesCount} líneas</span>
                        <span>🔤 {editorStats.charactersCount} chars</span>
                        <span>📝 {editorStats.wordsCount} palabras</span>
                        <span>🎯 {editorStats.variablesCount} variables</span>
                        <span>⚡ {editorStats.alpineDirectivesCount} alpine</span>
                        {editorStats.errorsCount > 0 && (
                            <span style={{ color: '#ef4444' }}>❌ {editorStats.errorsCount} errores</span>
                        )}
                        {editorStats.warningsCount > 0 && (
                            <span style={{ color: '#f59e0b' }}>⚠️ {editorStats.warningsCount} warnings</span>
                        )}
                    </div>

                    {/* Última modificación */}
                    <div>
                        {editorStats.lastModified && (
                            <span>⏰ {editorStats.lastModified}</span>
                        )}
                    </div>
                </div>
            )}

            {/* INTERFAZ VISUAL OVERLAY */}
            <EditorVisualInterface
                autocompletion={{
                    ...visualInterface.autocompletion,
                    onSelect: handleAutocompletionSelect,
                    onClose: () => setVisualInterface(prev => ({
                        ...prev,
                        autocompletion: { ...prev.autocompletion, visible: false }
                    }))
                }}
                validation={{
                    ...visualInterface.validation,
                    onErrorClick: handleValidationClick
                }}
                help={{
                    ...visualInterface.help,
                    onClose: handleHelpClose
                }}
                theme={theme}
            />
        </div>
    );
};

export default FinalVisualEditor;