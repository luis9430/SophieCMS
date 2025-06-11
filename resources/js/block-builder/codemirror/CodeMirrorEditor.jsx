import { useEffect, useRef, useCallback } from 'preact/hooks';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// ===================================================================
// 🔥 NUEVA IMPORTACIÓN: SISTEMA DE PLUGINS PARA CODEMIRROR
// ===================================================================

import legacyBridge from '../core/LegacyBridge.js';

// Importar funciones legacy como fallback
import { 
    getAlpineCompletions as legacyGetAlpineCompletions,
    validateAlpineSyntax as legacyValidateAlpineSyntax,
    analyzeAlpineCode as legacyAnalyzeAlpineCode
} from '../utils/alpineEditorHelpers.js';

/**
 * Editor CodeMirror con soporte para sistema de plugins
 * Usa automáticamente plugins disponibles o fallback a legacy
 */
const CodeMirrorEditor = ({ code, onCodeChange, language = 'html', theme = 'light' }) => {
    // ===================================================================
    // ESTADO Y REFS
    // ===================================================================
    
    const debounceTimeoutRef = useRef(null);
    const isUserTypingRef = useRef(false);
    const lastExternalCodeRef = useRef(code);
    const editorValueRef = useRef(code);
    const ignoreNextChangeRef = useRef(false);
    const analysisRef = useRef(null);
    const pluginSystemReadyRef = useRef(false);

    // ===================================================================
    // 🔥 NUEVO: DETECCIÓN DE PLUGINS DISPONIBLES
    // ===================================================================
    
    useEffect(() => {
        // Detectar si el sistema de plugins está listo
        const checkPluginSystem = () => {
            try {
                // Verificar si legacyBridge puede acceder a plugins
                const migrationInfo = legacyBridge.getMigrationInfo?.();
                const hasPlugins = migrationInfo && Object.values(migrationInfo.status).some(Boolean);
                
                pluginSystemReadyRef.current = hasPlugins;
                console.log('🔌 CodeMirror plugin system status:', hasPlugins ? 'PLUGINS' : 'LEGACY');
                
                return hasPlugins;
            } catch (error) {
                console.warn('⚠️ Error checking plugin system:', error);
                pluginSystemReadyRef.current = false;
                return false;
            }
        };

        checkPluginSystem();
        
        // Re-check cuando se registren nuevos plugins
        const interval = setInterval(checkPluginSystem, 2000);
        return () => clearInterval(interval);
    }, []);

    // ===================================================================
    // 🔥 AUTOCOMPLETADO UNIFICADO: PLUGINS + LEGACY
    // ===================================================================

    /**
     * Sistema de autocompletado que usa plugins si están disponibles
     */
    const createAutocompletions = useCallback(async (context) => {
        try {
            if (!context || !context.state) return null;
            const word = context.matchBefore(/[\w-:@${}.]*/);
            if (!word || (word.from === word.to && !context.explicit)) return null;

            let suggestions = [];

            if (pluginSystemReadyRef.current) {
                // 🔌 USAR SISTEMA DE PLUGINS
                console.log('🔌 Getting completions from plugin system...');
                
                try {
                    const pluginSuggestions = await legacyBridge.getAllCompletions(context);
                    suggestions = pluginSuggestions || [];
                    
                    console.log(`✅ Got ${suggestions.length} suggestions from plugins`);
                } catch (error) {
                    console.warn('⚠️ Plugin completions failed, falling back to legacy:', error);
                    suggestions = getLegacyCompletions(context);
                }
            } else {
                // 🔄 USAR SISTEMA LEGACY
                console.log('🔄 Using legacy completions...');
                suggestions = getLegacyCompletions(context);
            }

            // Añadir Tailwind CSS como siempre
            const tailwindSuggestions = getTailwindCompletions(context, word.text.toLowerCase());
            suggestions.push(...tailwindSuggestions);

            return suggestions.length > 0 ? { from: word.from, options: suggestions } : null;
            
        } catch (error) {
            console.warn('❌ Autocompletion error:', error);
            return null;
        }
    }, []);

    /**
     * Obtener completions del sistema legacy
     */
    const getLegacyCompletions = useCallback((context) => {
        try {
            return legacyGetAlpineCompletions(context) || [];
        } catch (error) {
            console.warn('Legacy completions error:', error);
            return [];
        }
    }, []);

    /**
     * Obtener completions de Tailwind CSS
     */
    const getTailwindCompletions = useCallback((context, searchText) => {
        if (!searchText || searchText.length < 2) return [];

        const tailwindClasses = [
            // Layout & Display
            'flex', 'grid', 'block', 'inline', 'inline-block', 'hidden', 'container',
            'flex-row', 'flex-col', 'flex-wrap', 'flex-nowrap',
            
            // Flexbox & Grid
            'justify-start', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly', 'justify-end',
            'items-start', 'items-center', 'items-end', 'items-stretch', 'items-baseline',
            
            // Spacing
            'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
            'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-6', 'px-8', 'py-2', 'py-3', 'py-4',
            'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8', 'm-10', 'm-12',
            'mx-auto', 'mx-0', 'mx-2', 'mx-4', 'my-0', 'my-2', 'my-4', 'my-6',
            
            // Sizing
            'w-auto', 'w-full', 'w-screen', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
            'h-auto', 'h-full', 'h-screen', 'h-1/2', 'h-1/3', 'h-2/3',
            'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl',
            
            // Typography
            'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
            'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold',
            'text-left', 'text-center', 'text-right', 'text-justify',
            
            // Colors
            'bg-white', 'bg-black', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-500',
            'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600',
            'bg-green-50', 'bg-green-100', 'bg-green-500', 'bg-green-600',
            'text-white', 'text-black', 'text-gray-600', 'text-gray-700', 'text-gray-800',
            'text-blue-500', 'text-blue-600', 'text-green-500', 'text-green-600',
            
            // Borders & Effects
            'border', 'border-0', 'border-2', 'border-gray-200', 'border-blue-500',
            'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-full',
            'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl',
            
            // Interactive
            'hover:bg-blue-600', 'hover:bg-red-600', 'hover:text-white',
            'hover:shadow-lg', 'hover:scale-105', 'transition', 'transition-all',
            'cursor-pointer', 'select-none'
        ];

        return tailwindClasses
            .filter(cls => cls.toLowerCase().includes(searchText))
            .slice(0, 10)
            .map(cls => ({
                label: cls,
                type: 'class',
                info: 'Tailwind CSS',
                detail: `CSS utility: ${cls}`,
                boost: 60
            }));
    }, []);

    // ===================================================================
    // 🔥 VALIDACIÓN UNIFICADA: PLUGINS + LEGACY
    // ===================================================================

    /**
     * Validar código usando plugins o sistema legacy
     */
    const validateCode = useCallback(async (code) => {
        try {
            let errors = [];

            if (pluginSystemReadyRef.current) {
                // 🔌 USAR SISTEMA DE PLUGINS
                console.log('🔌 Validating with plugin system...');
                
                try {
                    const pluginErrors = await legacyBridge.validateCodeWithAllPlugins(code);
                    errors = pluginErrors || [];
                    
                    console.log(`✅ Validation completed: ${errors.length} issues found`);
                } catch (error) {
                    console.warn('⚠️ Plugin validation failed, falling back to legacy:', error);
                    errors = getLegacyValidation(code);
                }
            } else {
                // 🔄 USAR SISTEMA LEGACY
                console.log('🔄 Using legacy validation...');
                errors = getLegacyValidation(code);
            }

            // Mostrar errores en consola para debugging
            if (errors.length > 0) {
                const criticalErrors = errors.filter(e => e.severity === 'critical');
                const warnings = errors.filter(e => e.severity === 'warning');
                
                console.log(`🔍 Validation results: ${criticalErrors.length} critical, ${warnings.length} warnings`);
                
                if (criticalErrors.length > 0) {
                    console.error('❌ Critical errors:', criticalErrors);
                }
            }

            return errors;
            
        } catch (error) {
            console.warn('Validation error:', error);
            return [];
        }
    }, []);

    /**
     * Validación legacy como fallback
     */
    const getLegacyValidation = useCallback((code) => {
        try {
            return legacyValidateAlpineSyntax(code) || [];
        } catch (error) {
            console.warn('Legacy validation error:', error);
            return [];
        }
    }, []);

    // ===================================================================
    // 🔥 ANÁLISIS DE CÓDIGO UNIFICADO
    // ===================================================================

    /**
     * Analizar código usando plugins o sistema legacy
     */
    const analyzeCode = useCallback(async (code) => {
        try {
            let analysis = null;

            if (pluginSystemReadyRef.current) {
                // 🔌 INTENTAR CON PLUGINS
                try {
                    // Usar Alpine plugin para análisis si está disponible
                    const alpinePlugin = legacyBridge.getAlpineCompletions ? 
                        await legacyBridge.analyzeAlpineCode(code) : null;
                    
                    analysis = alpinePlugin;
                } catch (error) {
                    console.warn('Plugin analysis failed:', error);
                }
            }

            // 🔄 FALLBACK A LEGACY
            if (!analysis) {
                analysis = legacyAnalyzeAlpineCode(code);
            }

            analysisRef.current = analysis;
            console.log('📊 Code analysis completed:', analysis);
            
            return analysis;
            
        } catch (error) {
            console.warn('Analysis error:', error);
            return null;
        }
    }, []);

    // ===================================================================
    // HIGHLIGHTING PERSONALIZADO
    // ===================================================================

    const createCustomHighlighting = useCallback((theme) => {
        const isDark = theme === 'dark';
        
        return syntaxHighlighting(HighlightStyle.define([
            // Texto base
            { tag: t.content, color: isDark ? '#ffffff' : '#000000' },
            
            // HTML Tags
            { tag: t.tagName, color: isDark ? '#ff7675' : '#e03131', fontWeight: 'bold' },
            
            // 🎯 ALPINE DIRECTIVES - Verde brillante especial
            { 
                tag: t.attributeName, 
                color: isDark ? '#00d084' : '#2f9e44', 
                fontWeight: '600'
            },
            
            // Attribute values
            { tag: t.attributeValue, color: isDark ? '#74c0fc' : '#1971c2' },
            
            // 🪄 ALPINE MAGIC PROPERTIES
            { 
                tag: t.variableName, 
                color: isDark ? '#fdcb6e' : '#fab005',
                fontWeight: 'bold'
            },
            
            // Strings
            { tag: t.string, color: isDark ? '#e17cff' : '#7048e8' },
            
            // Comments
            { tag: t.comment, color: isDark ? '#b2bec3' : '#6c757d', fontStyle: 'italic' },
            
            // Brackets
            { tag: t.bracket, color: isDark ? '#fd79a8' : '#e64980' },
            
            // Numbers
            { tag: t.number, color: isDark ? '#55efc4' : '#51cf66' },
            
            // Keywords
            { tag: t.keyword, color: isDark ? '#ff7675' : '#fd7e14', fontWeight: 'bold' },
            
            // Punctuation
            { tag: t.punctuation, color: isDark ? '#74b9ff' : '#0984e3' },
            
            // Property names
            { tag: t.propertyName, color: isDark ? '#00cec9' : '#00b894' },
        ]));
    }, []);

    // ===================================================================
    // EXTENSIONES DE CODEMIRROR
    // ===================================================================

    const baseExtensions = [
        html({
            matchClosingTags: false,
            autoCloseTags: true,
            nestedLanguages: [],
        }),
        autocompletion({
            override: [createAutocompletions],
            maxRenderedOptions: 40, // Más opciones para plugins
            activateOnTyping: true,
            closeOnBlur: true,
            defaultKeymap: true,
        }),
        createCustomHighlighting(theme),
        EditorView.theme({
            '&': {
                fontSize: '14px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Liberation Mono", "Courier New", monospace',
                backgroundColor: 'transparent',
                color: theme === 'dark' ? '#ffffff' : '#000000'
            },
            '.cm-content': {
                padding: '12px',
                minHeight: '400px',
                backgroundColor: 'transparent',
                lineHeight: '1.5',
                color: theme === 'dark' ? '#ffffff' : '#000000'
            },
            '.cm-focused': {
                outline: 'none',
            },
            '.cm-editor': {
                height: '100%',
                color: theme === 'dark' ? '#ffffff' : '#000000'
            },
            '.cm-scroller': {
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Liberation Mono", "Courier New", monospace',
                color: theme === 'dark' ? '#ffffff' : '#000000'
            },
            
            // 🎯 ESTILOS ESPECÍFICOS PARA DIRECTIVAS
            '.alpine-directive': {
                fontWeight: '600',
                textDecoration: 'underline',
                textDecorationColor: theme === 'dark' ? '#00d084' : '#2f9e44',
                textDecorationThickness: '1px',
                textUnderlineOffset: '2px'
            },
            
            // Cursor más visible
            '.cm-cursor': {
                borderColor: theme === 'dark' ? '#00d084' : '#000000',
                borderWidth: '2px'
            },
            
            // Línea activa más sutil
            '.cm-activeLine': {
                backgroundColor: theme === 'dark' ? 'rgba(0, 208, 132, 0.1)' : 'rgba(0, 0, 0, 0.02)'
            },
            
            // Selección más visible
            '&.cm-focused .cm-selectionBackground': {
                backgroundColor: theme === 'dark' ? 'rgba(0, 208, 132, 0.3)' : 'rgba(124, 179, 255, 0.2)'
            },
            
            // 🎯 AUTOCOMPLETE MEJORADO PARA PLUGINS
            '.cm-tooltip-autocomplete': {
                backgroundColor: theme === 'dark' ? '#2a2a2a' : '#ffffff',
                border: `1px solid ${theme === 'dark' ? '#555555' : '#e2e8f0'}`,
                borderRadius: '8px',
                boxShadow: theme === 'dark' ? '0 8px 16px rgba(0, 0, 0, 0.6)' : '0 8px 16px rgba(0, 0, 0, 0.1)',
                color: theme === 'dark' ? '#ffffff' : '#000000',
                maxHeight: '400px',
                overflowY: 'auto'
            },
            '.cm-tooltip-autocomplete > ul > li': {
                padding: '8px 12px',
                color: theme === 'dark' ? '#ffffff' : '#2d3748',
                borderBottom: `1px solid ${theme === 'dark' ? '#444444' : '#f7fafc'}`
            },
            '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
                backgroundColor: theme === 'dark' ? '#00d084' : '#3182ce',
                color: theme === 'dark' ? '#000000' : '#ffffff'
            },
            
            // 🏷️ ICONOS PARA TIPOS DE COMPLETIONS
            '.cm-completionIcon-alpine-directive:before': {
                content: '"⚡"',
                marginRight: '6px'
            },
            '.cm-completionIcon-alpine-magic:before': {
                content: '"🪄"',
                marginRight: '6px'
            },
            '.cm-completionIcon-variable:before': {
                content: '"🎯"',
                marginRight: '6px'
            },
            '.cm-completionIcon-class:before': {
                content: '"🎨"',
                marginRight: '6px'
            },
            '.cm-completionIcon-plugin:before': {
                content: '"🔌"',
                marginRight: '6px'
            }
        }),
        EditorView.lineWrapping,
    ];

    const finalExtensions = [...baseExtensions];
    
    // Aplicar tema oscuro si está seleccionado
    if (theme === 'dark') {
        finalExtensions.push(oneDark);
    }

    // ===================================================================
    // MANEJO DE CAMBIOS CON VALIDACIÓN Y ANÁLISIS
    // ===================================================================

    const handleChange = useCallback((value) => {
        if (ignoreNextChangeRef.current) {
            ignoreNextChangeRef.current = false;
            return;
        }
        
        isUserTypingRef.current = true;
        editorValueRef.current = value;
        
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        
        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                // 🔍 Validar código
                await validateCode(value);
                
                // 📊 Analizar código
                await analyzeCode(value);
                
                // Notificar cambio al parent
                onCodeChange(value);
                lastExternalCodeRef.current = value;
                
            } catch (error) {
                console.warn('Code change processing error:', error);
            }
            
            setTimeout(() => {
                isUserTypingRef.current = false;
            }, 300);
        }, 150);
    }, [onCodeChange, validateCode, analyzeCode]);

    // ===================================================================
    // SINCRONIZACIÓN DE CÓDIGO EXTERNO
    // ===================================================================

    const currentValue = useRef(code);
    useEffect(() => {
        if (!isUserTypingRef.current && code !== lastExternalCodeRef.current && code !== editorValueRef.current) {
            currentValue.current = code;
            lastExternalCodeRef.current = code;
            editorValueRef.current = code;
            ignoreNextChangeRef.current = true;
        }
    }, [code]);

    // ===================================================================
    // CLEANUP
    // ===================================================================

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        };
    }, []);

    // ===================================================================
    // RENDER
    // ===================================================================

    return (
        <div style={{
            border: `1px solid ${theme === 'dark' ? '#4a5568' : '#e9ecef'}`,
            borderRadius: '8px',
            overflow: 'hidden',
            height: '100%',
            minHeight: '400px',
            position: 'relative',
            backgroundColor: theme === 'dark' ? '#1a202c' : '#ffffff'
        }}>
            {/* 🎯 INDICADOR DE ESTADO DEL SISTEMA */}
            <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: theme === 'dark' ? '#2d3748' : '#f7fafc',
                color: pluginSystemReadyRef.current ? 
                    (theme === 'dark' ? '#00d084' : '#2f9e44') : 
                    (theme === 'dark' ? '#f59e0b' : '#d97706'),
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 'bold',
                zIndex: 10,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {pluginSystemReadyRef.current ? (
                    <>
                        <span>🔌 Plugins</span>
                        {analysisRef.current?.components?.length > 0 && (
                            <span>⚡ {analysisRef.current.components.length}</span>
                        )}
                        {analysisRef.current?.variables?.totalVariables > 0 && (
                            <span>🎯 {analysisRef.current.variables.totalVariables}</span>
                        )}
                    </>
                ) : (
                    <span>🔄 Legacy</span>
                )}
            </div>
            
            {/* 🔍 INDICADOR DE VALIDACIÓN */}
            {analysisRef.current?.variables?.invalidVariables > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '40px',
                    right: '8px',
                    background: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
                    color: theme === 'dark' ? '#ff7675' : '#dc2626',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    zIndex: 10,
                    pointerEvents: 'none'
                }}>
                    ❌ {analysisRef.current.variables.invalidVariables} errors
                </div>
            )}
            
            <CodeMirror
                value={currentValue.current}
                onChange={handleChange}
                extensions={finalExtensions}
                height="100%"
                theme={theme === 'dark' ? 'dark' : 'light'}
                basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: false, // Usamos nuestro sistema custom
                    highlightSelectionMatches: false,
                    searchKeymap: true,
                    tabSize: 2,
                    highlightActiveLine: true,
                    highlightActiveLineGutter: true
                }}
                style={{
                    fontSize: '14px',
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Liberation Mono", "Courier New", monospace',
                    height: '100%'
                }}
            />
        </div>
    );
};

export default CodeMirrorEditor;