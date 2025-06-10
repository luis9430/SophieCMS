import { useEffect, useRef, useCallback } from 'preact/hooks';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// 🎯 IMPORTAR FUNCIONES ALPINE + VARIABLES UNIFICADAS
import { 
    getAlpineCompletions, 
    validateAlpineSyntax,
    analyzeAlpineCode,
    analyzeVariableUsage
} from '../utils/alpineEditorHelpers.js';

// Highlighting style optimizado para fondo gris oscuro + Alpine
const createCustomHighlighting = (theme) => {
  const isDark = theme === 'dark';
  
  return syntaxHighlighting(HighlightStyle.define([
    // Texto base - BLANCO para modo oscuro
    { tag: t.content, color: isDark ? '#ffffff' : '#000000' },
    
    // HTML Tags - Rojo brillante
    { tag: t.tagName, color: isDark ? '#ff7675' : '#e03131', fontWeight: 'bold' },
    
    // 🎯 ALPINE DIRECTIVES - Verde brillante especial
    { 
      tag: t.attributeName, 
      color: isDark ? '#00d084' : '#2f9e44', 
      fontWeight: '600',
      // Detectar si es directiva Alpine
      class: 'alpine-directive'
    },
    
    // Attribute values (clases CSS, valores) - Azul brillante
    { tag: t.attributeValue, color: isDark ? '#74c0fc' : '#1971c2' },
    
    // 🪄 ALPINE MAGIC PROPERTIES - Amarillo dorado
    { 
      tag: t.variableName, 
      color: isDark ? '#fdcb6e' : '#fab005',
      fontWeight: 'bold'
    },
    
    // Strings - Púrpura brillante
    { tag: t.string, color: isDark ? '#e17cff' : '#7048e8' },
    
    // Comments - Gris claro
    { tag: t.comment, color: isDark ? '#b2bec3' : '#6c757d', fontStyle: 'italic' },
    
    // Brackets - Rosa brillante
    { tag: t.bracket, color: isDark ? '#fd79a8' : '#e64980' },
    
    // Variables y contenido dinámico - Amarillo brillante
    { tag: t.variableName, color: isDark ? '#fdcb6e' : '#fab005' },
    
    // Números - Verde claro
    { tag: t.number, color: isDark ? '#55efc4' : '#51cf66' },
    
    // Keywords - Naranja brillante
    { tag: t.keyword, color: isDark ? '#ff7675' : '#fd7e14', fontWeight: 'bold' },
    
    // Delimiters - Cyan
    { tag: t.punctuation, color: isDark ? '#74b9ff' : '#0984e3' },
    
    // Names (propiedades, etc.)
    { tag: t.propertyName, color: isDark ? '#00cec9' : '#00b894' },
  ]));
};

const CodeMirrorEditor = ({ code, onCodeChange, language = 'html', theme = 'light' }) => {
  const debounceTimeoutRef = useRef(null);
  const isUserTypingRef = useRef(false);
  const lastExternalCodeRef = useRef(code);
  const editorValueRef = useRef(code);
  const ignoreNextChangeRef = useRef(false);
  const alpineAnalysisRef = useRef(null);

  // 🎯 AUTOCOMPLETADO UNIFICADO: ALPINE + VARIABLES + TAILWIND
  const createAutocompletions = useCallback((context) => {
    try {
      if (!context || !context.state) return null;
      const word = context.matchBefore(/[\w-:@${}.]*/);
      if (!word || (word.from === word.to && !context.explicit)) return null;

      const searchText = word.text.toLowerCase();
      const suggestions = [];
      
      // 🥇 1. SUGERENCIAS ALPINE + VARIABLES (PRIMERA PRIORIDAD)
      const alpineAndVariableSuggestions = getAlpineCompletions(context);
      suggestions.push(...alpineAndVariableSuggestions);
      
      // 🎨 2. CLASES TAILWIND CSS
      const tailwindClasses = [
        // Layout & Display
        'flex', 'grid', 'block', 'inline', 'inline-block', 'hidden', 'container',
        'flex-row', 'flex-col', 'flex-wrap', 'flex-nowrap',
        
        // Flexbox & Grid
        'justify-start', 'justify-center', 'justify-between', 'justify-around', 'justify-evenly', 'justify-end',
        'items-start', 'items-center', 'items-end', 'items-stretch', 'items-baseline',
        'content-start', 'content-center', 'content-end', 'content-between', 'content-around',
        
        // Spacing
        'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8', 'p-10', 'p-12',
        'px-0', 'px-1', 'px-2', 'px-3', 'px-4', 'px-6', 'px-8', 'py-2', 'py-3', 'py-4', 'py-6', 'py-8',
        'm-0', 'm-1', 'm-2', 'm-3', 'm-4', 'm-5', 'm-6', 'm-8', 'm-10', 'm-12',
        'mx-auto', 'mx-0', 'mx-2', 'mx-4', 'mx-6', 'my-0', 'my-2', 'my-4', 'my-6', 'my-8',
        
        // Sizing
        'w-auto', 'w-full', 'w-screen', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4', 'w-1/5', 'w-2/5', 'w-3/5', 'w-4/5',
        'h-auto', 'h-full', 'h-screen', 'h-1/2', 'h-1/3', 'h-2/3', 'h-1/4', 'h-3/4',
        'max-w-xs', 'max-w-sm', 'max-w-md', 'max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-4xl', 'max-w-6xl', 'max-w-7xl',
        'min-h-screen', 'min-h-full',
        
        // Typography
        'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl',
        'font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold',
        'text-left', 'text-center', 'text-right', 'text-justify',
        'leading-tight', 'leading-snug', 'leading-normal', 'leading-relaxed', 'leading-loose',
        
        // Colors
        'bg-white', 'bg-black', 'bg-transparent',
        'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-400', 'bg-gray-500', 'bg-gray-600', 'bg-gray-700', 'bg-gray-800', 'bg-gray-900',
        'bg-red-50', 'bg-red-100', 'bg-red-500', 'bg-red-600', 'bg-red-700',
        'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700',
        'bg-green-50', 'bg-green-100', 'bg-green-500', 'bg-green-600', 'bg-green-700',
        'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-500', 'bg-yellow-600',
        'bg-purple-50', 'bg-purple-100', 'bg-purple-500', 'bg-purple-600',
        'bg-indigo-50', 'bg-indigo-100', 'bg-indigo-500', 'bg-indigo-600',
        
        'text-white', 'text-black',
        'text-gray-50', 'text-gray-100', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
        'text-red-500', 'text-red-600', 'text-red-700', 'text-red-800',
        'text-blue-500', 'text-blue-600', 'text-blue-700', 'text-blue-800',
        'text-green-500', 'text-green-600', 'text-green-700', 'text-green-800',
        
        // Borders & Effects
        'border', 'border-0', 'border-2', 'border-4',
        'border-gray-200', 'border-gray-300', 'border-blue-500', 'border-red-500',
        'rounded', 'rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
        'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
        
        // Interactive & Transitions
        'hover:bg-blue-600', 'hover:bg-red-600', 'hover:bg-green-600', 'hover:bg-gray-100', 'hover:bg-gray-700',
        'hover:text-white', 'hover:text-blue-600', 'hover:text-red-600',
        'hover:shadow-lg', 'hover:shadow-xl', 'hover:scale-105', 'hover:scale-110',
        'transition', 'transition-all', 'transition-colors', 'transition-transform',
        'duration-150', 'duration-200', 'duration-300', 'duration-500',
        'cursor-pointer', 'cursor-default', 'select-none',
        
        // Position & Transform
        'relative', 'absolute', 'fixed', 'sticky',
        'top-0', 'right-0', 'bottom-0', 'left-0',
        'transform', 'scale-95', 'scale-100', 'scale-105', 'translate-x-1', 'translate-y-1',
        
        // Responsive prefixes
        'sm:flex', 'md:flex', 'lg:flex', 'xl:flex',
        'sm:grid', 'md:grid', 'lg:grid',
        'sm:hidden', 'md:block', 'lg:inline',
        'sm:text-sm', 'md:text-base', 'lg:text-lg',
      ];

      // 🎨 3. SUGERENCIAS TAILWIND (menor prioridad que Alpine)
      if (searchText && searchText.length > 0) {
        tailwindClasses.forEach(cls => {
          if (cls.toLowerCase().includes(searchText) && suggestions.length < 25) {
            suggestions.push({ 
              label: cls, 
              type: 'class', 
              info: 'Tailwind CSS',
              detail: `CSS utility: ${cls}`,
              boost: 60 // Menor boost que Alpine
            });
          }
        });
      }
      
      return suggestions.length > 0 ? { from: word.from, options: suggestions } : null;
    } catch (error) {
      console.warn('Autocompletion error:', error);
      return null;
    }
  }, []);

  // 🔍 VALIDACIÓN EN TIEMPO REAL
  const validateCode = useCallback((code) => {
    try {
      const errors = validateAlpineSyntax(code);
      
      // Aquí podrías mostrar errores en la UI
      if (errors.length > 0) {
        console.log('🔍 Alpine validation errors:', errors);
        // TODO: Mostrar errores en gutter o panel
      }
      
      return errors;
    } catch (error) {
      console.warn('Validation error:', error);
      return [];
    }
  }, []);

  // 📊 ANÁLISIS DE CÓDIGO ALPINE + VARIABLES
  const analyzeCode = useCallback((code) => {
    try {
      const analysis = analyzeAlpineCode(code);
      alpineAnalysisRef.current = analysis;
      
      console.log('📊 Alpine + Variables analysis:', analysis);
      return analysis;
    } catch (error) {
      console.warn('Analysis error:', error);
      return null;
    }
  }, []);

  const baseExtensions = [
    html({
      matchClosingTags: false,
      autoCloseTags: true,
      nestedLanguages: [],
    }),
    autocompletion({
      override: [createAutocompletions],
      maxRenderedOptions: 30, // Aumentado para más sugerencias Alpine
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
      
      // 🎯 ESTILOS ESPECÍFICOS PARA ALPINE
      '.alpine-directive': {
        fontWeight: '600',
        textDecoration: 'underline',
        textDecorationColor: theme === 'dark' ? '#00d084' : '#2f9e44',
        textDecorationThickness: '1px',
        textUnderlineOffset: '2px'
      },
      
      // Números de línea más visibles
      '.cm-lineNumbers': {
        color: theme === 'dark' ? '#888888' : '#999999',
        backgroundColor: 'transparent'
      },
      '.cm-lineNumbers .cm-gutterElement': {
        color: theme === 'dark' ? '#888888' : '#999999'
      },
      
      // Cursor más visible
      '.cm-cursor': {
        borderColor: theme === 'dark' ? '#00d084' : '#000000',
        borderWidth: '2px'
      },
      
      // Highlighting para línea actual más sutil
      '.cm-activeLine': {
        backgroundColor: theme === 'dark' ? 'rgba(0, 208, 132, 0.1)' : 'rgba(0, 0, 0, 0.02)'
      },
      
      // Selección más visible
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: theme === 'dark' ? 'rgba(0, 208, 132, 0.3)' : 'rgba(124, 179, 255, 0.2)'
      },
      
      // 🎯 AUTOCOMPLETE CON MEJOR CATEGORIZACIÓN
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
      
      // 🏷️ ICONOS PARA TIPOS DE COMPLETIONS (AMPLIADO)
      '.cm-completionIcon-alpine-directive:before': {
        content: '"⚡"',
        marginRight: '6px'
      },
      '.cm-completionIcon-alpine-magic:before': {
        content: '"🪄"',
        marginRight: '6px'
      },
      '.cm-completionIcon-alpine-snippet:before': {
        content: '"📋"',
        marginRight: '6px'
      },
      '.cm-completionIcon-variable:before': {
        content: '"🎯"',
        marginRight: '6px'
      },
      '.cm-completionIcon-variable-name:before': {
        content: '"💎"',
        marginRight: '6px'
      },
      '.cm-completionIcon-template-variable:before': {
        content: '"📝"',
        marginRight: '6px'
      },
      '.cm-completionIcon-class:before': {
        content: '"🎨"',
        marginRight: '6px'
      },
      
      // Mejorar el gutter
      '.cm-gutter': {
        backgroundColor: 'transparent',
        border: 'none'
      }
    }),
    EditorView.lineWrapping,
  ];

  const finalExtensions = [...baseExtensions];
  
  // Aplicar tema oscuro si está seleccionado
  if (theme === 'dark') {
    finalExtensions.push(oneDark);
  }

  // 🔄 HANDLE CHANGE CON VALIDACIÓN
  const handleChange = useCallback((value) => {
    if (ignoreNextChangeRef.current) {
      ignoreNextChangeRef.current = false;
      return;
    }
    
    isUserTypingRef.current = true;
    editorValueRef.current = value;
    
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    
    debounceTimeoutRef.current = setTimeout(() => {
      try {
        // 🔍 Validar Alpine en tiempo real
        validateCode(value);
        
        // 📊 Analizar código Alpine
        analyzeCode(value);
        
        // Notificar cambio al parent
        onCodeChange(value);
        lastExternalCodeRef.current = value;
      } catch (error) {
        console.warn('Code change error:', error);
      }
      
      setTimeout(() => {
        isUserTypingRef.current = false;
      }, 300);
    }, 150); // Debounce un poco más para validación
  }, [onCodeChange, validateCode, analyzeCode]);

  const currentValue = useRef(code);
  useEffect(() => {
    if (!isUserTypingRef.current && code !== lastExternalCodeRef.current && code !== editorValueRef.current) {
      currentValue.current = code;
      lastExternalCodeRef.current = code;
      editorValueRef.current = code;
      ignoreNextChangeRef.current = true;
    }
  }, [code]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

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
      {/* 🎯 INFORMACIÓN ALPINE + VARIABLES */}
      {alpineAnalysisRef.current && (
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: theme === 'dark' ? '#2d3748' : '#f7fafc',
          color: theme === 'dark' ? '#00d084' : '#2f9e44',
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
          {alpineAnalysisRef.current.components.length > 0 && (
            <span>⚡ {alpineAnalysisRef.current.components.length}</span>
          )}
          {alpineAnalysisRef.current.variables?.totalVariables > 0 && (
            <span>🎯 {alpineAnalysisRef.current.variables.totalVariables}</span>
          )}
          {alpineAnalysisRef.current.variables?.invalidVariables > 0 && (
            <span style={{color: theme === 'dark' ? '#ff7675' : '#e03131'}}>
              ❌ {alpineAnalysisRef.current.variables.invalidVariables}
            </span>
          )}
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
          autocompletion: false,
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