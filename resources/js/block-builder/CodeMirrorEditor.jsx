// ===================================================================
// resources/js/block-builder/CodeMirrorEditor.jsx
// Editor CodeMirror integrado con Preact/Mantine
// ===================================================================

import { useRef, useEffect, useState } from 'preact/hooks';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { php } from '@codemirror/lang-php';
import { oneDark } from '@codemirror/theme-one-dark';
import { autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap } from '@codemirror/search';
import { historyKeymap } from '@codemirror/commands';
import { lintKeymap } from '@codemirror/lint';
import { 
  Paper, 
  Group, 
  ActionIcon, 
  Tooltip, 
  Select,
  Switch,
  Text
} from '@mantine/core';
import { 
  IconCode,
  IconCopy,
  IconDownload,
  IconRefresh,
  IconSettings,
  IconSun,
  IconMoon
} from '@tabler/icons-preact';
import { notifications } from '@mantine/notifications';

// ===================================================================
// CONFIGURACIONES Y EXTENSIONES
// ===================================================================

const createAlpineCompletions = () => {
  const alpineDirectives = [
    'x-data', 'x-show', 'x-if', 'x-for', 'x-text', 'x-html',
    'x-model', 'x-bind', 'x-on', 'x-init', 'x-transition',
    'x-ref', 'x-cloak', 'x-ignore', 'x-effect', 'x-teleport'
  ];

  const alpineMethods = [
    '$el', '$refs', '$event', '$dispatch', '$watch', '$nextTick',
    '$store', '$data', '$id', '$root'
  ];

  return (context) => {
    const word = context.matchBefore(/\w*/);
    if (!word) return null;

    const options = [
      ...alpineDirectives.map(directive => ({
        label: directive,
        type: 'keyword',
        info: `Alpine.js directive: ${directive}`
      })),
      ...alpineMethods.map(method => ({
        label: method,
        type: 'function',
        info: `Alpine.js magic property: ${method}`
      }))
    ];

    return {
      from: word.from,
      options: options.filter(option => 
        option.label.toLowerCase().includes(word.text.toLowerCase())
      )
    };
  };
};

const createExtensions = (language, theme, enableAlpine = true) => {
  const extensions = [
    basicSetup,
    EditorView.lineWrapping,
    autocompletion({
      override: enableAlpine ? [createAlpineCompletions()] : []
    }),
    ...historyKeymap,
    ...searchKeymap,
    ...completionKeymap,
    ...lintKeymap
  ];

  // Agregar lenguaje
  switch (language) {
    case 'javascript':
      extensions.push(javascript());
      break;
    case 'html':
      extensions.push(html());
      break;
    case 'css':
      extensions.push(css());
      break;
    case 'php':
      extensions.push(php());
      break;
    default:
      extensions.push(javascript());
  }

  // Agregar tema
  if (theme === 'dark') {
    extensions.push(oneDark);
  }

  return extensions;
};

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

const CodeMirrorEditor = ({
  value = '',
  onChange = () => {},
  language = 'javascript',
  height = '300px',
  placeholder = 'Start typing...',
  readOnly = false,
  enableAlpine = true,
  showToolbar = true,
  theme = 'light',
  lineNumbers = true,
  autoFocus = false,
  onSave = null
}) => {
  // ===================================================================
  // ESTADOS Y REFERENCIAS
  // ===================================================================
  
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ===================================================================
  // FUNCIONES UTILITARIAS
  // ===================================================================

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      notifications.show({
        title: 'Copied!',
        message: 'Code copied to clipboard',
        color: 'green'
      });
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Failed to copy to clipboard',
        color: 'red'
      });
    }
  };

  const downloadCode = () => {
    const blob = new Blob([value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${getFileExtension(currentLanguage)}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileExtension = (lang) => {
    const extensions = {
      javascript: 'js',
      html: 'html',
      css: 'css',
      php: 'php',
      json: 'json'
    };
    return extensions[lang] || 'txt';
  };

  const formatCode = () => {
    if (viewRef.current) {
      // Formateo básico - podrías integrar prettier aquí
      const doc = viewRef.current.state.doc;
      const formatted = doc.toString().replace(/\s+/g, ' ').trim();
      
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: doc.length,
          insert: formatted
        }
      });
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(value);
    } else {
      notifications.show({
        title: 'Saved',
        message: 'Code saved successfully',
        color: 'green'
      });
    }
  };

  // ===================================================================
  // EFECTOS
  // ===================================================================

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = createExtensions(currentLanguage, currentTheme, enableAlpine);
    
    const state = EditorState.create({
      doc: value,
      extensions: [
        ...extensions,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newValue = update.state.doc.toString();
            onChange(newValue);
          }
        }),
        EditorState.readOnly.of(readOnly),
        EditorView.theme({
          '&': {
            height: height,
          },
          '.cm-content': {
            padding: '12px',
            minHeight: height,
            fontSize: '14px',
            lineHeight: '1.5'
          },
          '.cm-focused': {
            outline: 'none'
          },
          '.cm-editor': {
            borderRadius: '6px'
          },
          '.cm-scroller': {
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace'
          }
        }),
        // Shortcuts personalizados
        EditorView.domEventHandlers({
          keydown: (event, view) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
              event.preventDefault();
              handleSave();
              return true;
            }
            if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
              event.preventDefault();
              formatCode();
              return true;
            }
            return false;
          }
        })
      ]
    });

    const view = new EditorView({
      state,
      parent: editorRef.current
    });

    viewRef.current = view;

    if (autoFocus) {
      view.focus();
    }

    return () => {
      view.destroy();
    };
  }, [currentLanguage, currentTheme, readOnly, height, enableAlpine]);

  // Actualizar contenido cuando cambia value desde props
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value
        }
      });
    }
  }, [value]);

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      {showToolbar && (
        <Group 
          justify="space-between" 
          p="xs" 
          style={{ 
            borderBottom: '1px solid var(--mantine-color-gray-3)',
            backgroundColor: 'var(--mantine-color-gray-0)'
          }}
        >
          <Group gap="xs">
            <Select
              size="xs"
              value={currentLanguage}
              onChange={setCurrentLanguage}
              data={[
                { value: 'javascript', label: 'JavaScript' },
                { value: 'html', label: 'HTML' },
                { value: 'css', label: 'CSS' },
                { value: 'php', label: 'PHP' },
                { value: 'json', label: 'JSON' }
              ]}
              w={100}
            />
            
            {enableAlpine && (
              <Text size="xs" c="dimmed">
                Alpine.js enabled
              </Text>
            )}
          </Group>

          <Group gap="xs">
            <Tooltip label="Toggle Theme">
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={() => setCurrentTheme(current => current === 'light' ? 'dark' : 'light')}
              >
                {currentTheme === 'light' ? <IconMoon size={14} /> : <IconSun size={14} />}
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Copy Code">
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={copyToClipboard}
              >
                <IconCopy size={14} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Download Code">
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={downloadCode}
              >
                <IconDownload size={14} />
              </ActionIcon>
            </Tooltip>

            <Tooltip label="Format Code (Ctrl+F)">
              <ActionIcon
                size="sm"
                variant="subtle"
                onClick={formatCode}
              >
                <IconCode size={14} />
              </ActionIcon>
            </Tooltip>

            {onSave && (
              <Tooltip label="Save (Ctrl+S)">
                <ActionIcon
                  size="sm"
                  variant="filled"
                  onClick={handleSave}
                >
                  <IconSettings size={14} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>
      )}

      <div 
        ref={editorRef}
        style={{
          height: height,
          backgroundColor: currentTheme === 'dark' ? '#1e1e1e' : '#ffffff'
        }}
      />
    </Paper>
  );
};

export default CodeMirrorEditor;