// ===================================================================
// resources/js/mdx-system/components/MDXMonacoEditor.jsx
// Monaco Editor ULTRA ESTABLE - Solución definitiva para cursor
// ===================================================================

import { useRef, useEffect, useCallback, useState } from 'preact/hooks';
import Editor from '@monaco-editor/react';

export default function MDXMonacoEditor({
  value = '',
  onChange,
  theme = 'light',
  height = '400px',
  onSave = null
}) {
  const editorRef = useRef(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const changeTimeoutRef = useRef(null);
  const lastChangeFromProps = useRef(false);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    setIsEditorReady(true);

    // Autocompletado para componentes MDX
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => ({
        suggestions: [
          {
            label: 'Alert',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<Alert color="${1:blue}" title="${2:título}">\n  ${3:contenido}\n</Alert>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Componente Alert de Mantine',
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column
            }
          },
          {
            label: 'Button',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<Button color="${1:blue}" size="${2:md}">${3:texto}</Button>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Botón de Mantine',
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column
            }
          },
          {
            label: 'Card',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<Card withBorder>\n  <Text>${1:contenido}</Text>\n</Card>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Card de Mantine',
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column
            }
          },
          {
            label: 'Hero',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '<Hero \n  title="${1:título}"\n  subtitle="${2:subtítulo}"\n  buttonText="${3:texto del botón}"\n/>',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Componente Hero',
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column
            }
          },
          {
            label: 'frontmatter',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '---\ntitle: "${1:título}"\ndescription: "${2:descripción}"\nauthor: "${3:autor}"\ndate: "${4:2024-01-01}"\n---\n\n',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Frontmatter para MDX',
            range: {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: position.column,
              endColumn: position.column
            }
          }
        ]
      })
    });

    // Atajo para guardar
    if (onSave) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave(editor.getValue());
      });
    }
  };

  // Manejar cambios desde el editor - MUY CONSERVADOR
  const handleChange = useCallback((newValue) => {
    if (lastChangeFromProps.current) {
      lastChangeFromProps.current = false;
      return;
    }

    setInternalValue(newValue);

    if (changeTimeoutRef.current) {
      clearTimeout(changeTimeoutRef.current);
    }

    // Debounce más largo para batching real
    changeTimeoutRef.current = setTimeout(() => {
      if (onChange) {
        onChange(newValue);
      }
    }, 150); // Más tiempo para asegurar estabilidad
  }, [onChange]);

  // Sincronizar con props value - SOLO cuando realmente cambió desde fuera
  useEffect(() => {
    if (!isEditorReady || !editorRef.current) return;
    
    // Solo actualizar si el valor de props es diferente al interno
    if (value !== internalValue) {
      lastChangeFromProps.current = true;
      
      const editor = editorRef.current;
      const currentPosition = editor.getPosition();
      const currentSelection = editor.getSelection();
      
      // Usar pushUndoStop para mejor control del historial
      editor.pushUndoStop();
      editor.setValue(value);
      editor.pushUndoStop();
      
      // Restaurar posición de forma más robusta
      setTimeout(() => {
        try {
          if (currentPosition) {
            editor.setPosition(currentPosition);
          }
          if (currentSelection) {
            editor.setSelection(currentSelection);
          }
        } catch (e) {
          // Ignorar errores de posición
        }
        
        setInternalValue(value);
        lastChangeFromProps.current = false;
      }, 10);
    }
  }, [value, internalValue, isEditorReady]);

  // Método para insertar componentes
  const insertComponent = useCallback((snippet) => {
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const selection = editor.getSelection();
    
    editor.executeEdits('insert-component', [{
      range: selection,
      text: snippet,
      forceMoveMarkers: true
    }]);
    
    editor.focus();
  }, []);

  // Exponer métodos
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.insertComponent = insertComponent;
    }
  }, [insertComponent]);

  return (
    <div>
      <Editor
        height={height}
        language="javascript"
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        value={internalValue}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          // Configuración ULTRA CONSERVADORA para máxima estabilidad
          minimap: { enabled: false },
          lineNumbers: 'on',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontSize: 14,
          fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          tabSize: 2,
          insertSpaces: true,
          
          // Autocompletado MUY conservador
          quickSuggestions: false, // Desactivado para máxima estabilidad
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'smart',
          suggestSelection: 'first',
          
          // Desactivar TODO lo que pueda interferir
          parameterHints: { enabled: false },
          hover: { enabled: false },
          lightbulb: { enabled: false },
          
          // Sin formateo automático
          formatOnPaste: false,
          formatOnType: false,
          
          // Bracket matching muy básico
          matchBrackets: 'never', // Más estable
          autoClosingBrackets: 'never',
          autoClosingQuotes: 'never',
          
          // Cursor ultra estable
          cursorBlinking: 'solid',
          cursorSmoothCaretAnimation: 'off',
          
          // Sin animaciones
          smoothScrolling: false,
          
          // Desactivar features problemáticas
          codeLens: false,
          folding: false,
          glyphMargin: false,
          contextmenu: false,
          links: false,
          colorDecorators: false,
          
          // Scroll simple
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10
          },
          
          // Sin highlighting problemático
          occurrencesHighlight: false,
          selectionHighlight: false,
          
          // Rendering optimizado
          wordWrapBreakAfterCharacters: '\t})]?|&,;',
          wordWrapBreakBeforeCharacters: '{([+',
          wordWrapBreakObtrusiveCharacters: '.',
          
          // Desactivar drag & drop
          dragAndDrop: false
        }}
      />
      
      <div style={{
        fontSize: '12px',
        color: '#6b7280',
        marginTop: '8px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>
          🔥 <strong>Monaco Editor</strong> - Modo ultra estable (cursor fijo)
        </span>
        <span>
          <kbd style={{ background: '#f1f3f4', padding: '2px 4px', borderRadius: '2px' }}>Ctrl+Space</kbd> Autocompletado • 
          <kbd style={{ background: '#f1f3f4', padding: '2px 4px', borderRadius: '2px' }}>Ctrl+S</kbd> Guardar
        </span>
      </div>
    </div>
  );
}