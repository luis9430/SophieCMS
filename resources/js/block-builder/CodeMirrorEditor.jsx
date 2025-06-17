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
import { notifications } from '@mantine/notifications';

import { 
  Paper, 
  Group, 
  ActionIcon, 
  Tooltip, 
  Select,
  Switch,
  Text,
  // NUEVOS imports para panel de componentes:
  Badge,
  TextInput,
  ScrollArea,
  Stack,
  Card,
  Button
} from '@mantine/core';
import { 
  IconCode,
  IconCopy,
  IconDownload,
  IconRefresh,
  IconSettings,
  IconSun,
  IconMoon,
  // NUEVOS iconos:
  IconSearch,
  IconComponents
} from '@tabler/icons-preact';

// ===================================================================
// CONFIGURACIONES Y EXTENSIONES
// ===================================================================

const createComponentCompletions = () => {
  /*
  return (context) => {
    const word = context.matchBefore(/<[\w-]*|name="[\w]*|props='[^']*'/);
    if (!word) return null;

    const beforeCursor = context.state.doc.sliceString(
      Math.max(0, context.pos - 50), 
      context.pos
    );

    let options = [];

    // Si está escribiendo <preact-
    if (beforeCursor.match(/<preact-?$/)) {
      options.push({
        label: 'preact-component',
        type: 'element',
        info: 'Insert Preact component',
        apply: 'preact-component name="" props=\'{}\'/>',
        boost: 100
      });
    }

    // Si está escribiendo name=" en un preact-component
    const nameMatch = beforeCursor.match(/<preact-component[^>]*name="([^"]*)?$/);
    if (nameMatch) {
      if (window.getAllComponents) {
        const components = window.getAllComponents();
        options.push(...components.map(comp => ({
          label: comp.name,
          type: 'class',
          info: comp.metadata.description,
          detail: `Category: ${comp.metadata.category}`,
          apply: comp.name,
          boost: 90
        })));
      }
    }

    const filteredOptions = options.filter(option => 
      option.label.toLowerCase().includes(word.text.toLowerCase())
    );

    if (filteredOptions.length === 0) return null;

    return {
      from: word.from,
      options: filteredOptions
    };
  };
  */
};

const createExtensions = (language, theme, enableComponents = true) => {
  const extensions = [
    basicSetup,
    EditorView.lineWrapping,
    autocompletion({
      override: enableComponents ? [createComponentCompletions] : []    
}),
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
  enableComponents = true,
  showToolbar = true,
  theme = 'light',
  lineNumbers = true,
  autoFocus = false,
  onSave = null,
  // NUEVOS props para panel de componentes:
  showComponentPanel = false,
  onComponentInsert = null,
  componentPanelWidth = 320
}) => {
  // ===================================================================
  // ESTADOS Y REFERENCIAS
  // ===================================================================
  
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const [currentTheme, setCurrentTheme] = useState(theme);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [isFullscreen, setIsFullscreen] = useState(false);
// NUEVOS estados para panel de componentes
const [availableComponents, setAvailableComponents] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState('all');
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


  // NUEVAS funciones para componentes
const loadAvailableComponents = () => {
  try {
    if (window.getAllComponents) {
      const components = window.getAllComponents();
      setAvailableComponents(components);
    }
  } catch (error) {
    console.error('Error cargando componentes:', error);
  }
};

const handleInsertComponent = (component) => {
  const exampleProps = {};
  Object.entries(component.metadata.props || {}).forEach(([propName, propDef]) => {
    if (propDef.default !== undefined) {
      exampleProps[propName] = propDef.default;
    }
  });
  
  const componentTag = `<preact-component
  name="${component.name}"
  props='${JSON.stringify(exampleProps)}'
/>`;
  
  // Insertar en el editor
  const newValue = value + '\n\n' + componentTag;
  onChange(newValue);
  
  // Callback opcional
  if (onComponentInsert) {
    onComponentInsert(component, componentTag);
  }
};

const getFilteredComponents = () => {
  return availableComponents.filter(component => {
    const matchesCategory = selectedCategory === 'all' || component.metadata.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.metadata.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });
};

const getCategories = () => {
  const categories = ['all'];
  availableComponents.forEach(comp => {
    if (!categories.includes(comp.metadata.category)) {
      categories.push(comp.metadata.category);
    }
  });
  return categories;
};

  // ===================================================================
  // EFECTOS
  // ===================================================================

  useEffect(() => {
    if (!editorRef.current) return;

    const extensions = createExtensions(currentLanguage, currentTheme, enableComponents);
    
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
  }, [currentLanguage, currentTheme, readOnly, height,  enableComponents]);

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

// NUEVO useEffect para cargar componentes
    useEffect(() => {
      if (showComponentPanel) {
        loadAvailableComponents();
      }
    }, [showComponentPanel]);

  // ===================================================================
  // RENDER
  // ===================================================================

 return (
  <div className="flex h-full">
    {/* Editor principal */}
    <div className={showComponentPanel ? 'flex-1 mr-4' : 'w-full'}>
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
              
              {enableComponents && (
                <Badge size="sm" color="blue">
                  Components: {availableComponents.length}
                </Badge>
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
    </div>

    {/* Panel lateral de componentes */}
    {showComponentPanel && (
      <div style={{ width: componentPanelWidth }} className="flex-shrink-0">
        <Card className="h-full p-4">
          <Group className="justify-between mb-4">
            <Group>
              <IconComponents size={20} />
              <Text className="font-semibold">Components</Text>
            </Group>
            <Badge size="sm">{getFilteredComponents().length}</Badge>
          </Group>
          
          <Stack spacing="sm" className="mb-4">
            <TextInput
              placeholder="Search components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<IconSearch size={16} />}
            />
            
            <Select
              label="Category"
              value={selectedCategory}
              onChange={setSelectedCategory}
              data={getCategories().map(cat => ({
                value: cat,
                label: cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)
              }))}
            />
          </Stack>
          
          <ScrollArea style={{ height: 'calc(100% - 140px)' }}>
            <Stack spacing="xs">
              {getFilteredComponents().map((component, index) => (
                <Paper 
                  key={index} 
                  className="p-3 border cursor-pointer hover:border-blue-300 transition-colors" 
                  onClick={() => handleInsertComponent(component)}
                >
                  <Group className="justify-between mb-2">
                    <Text className="font-medium text-sm">{component.name}</Text>
                    <Badge size="xs">{component.metadata.category}</Badge>
                  </Group>
                  
                  <Text size="xs" color="dimmed">
                    {component.metadata.description}
                  </Text>
                  
                  {Object.keys(component.metadata.props || {}).length > 0 && (
                    <Text size="xs" color="dimmed" className="mt-1">
                      Props: {Object.keys(component.metadata.props).join(', ')}
                    </Text>
                  )}
                </Paper>
              ))}
            </Stack>
          </ScrollArea>
        </Card>
      </div>
    )}
  </div>
);
};

export default CodeMirrorEditor;