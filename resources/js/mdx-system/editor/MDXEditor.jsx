// ===================================================================
// resources/js/mdx-system/editor/MDXEditor.jsx - CON MONACO EDITOR
// ===================================================================

import { Container, Grid, Paper, Button, Group, Text, Badge, Alert, Box } from '@mantine/core';
import { IconTemplate, IconComponents, IconVariable, IconSun, IconMoon, IconCode, IconEye } from '@tabler/icons-preact';
import { useMDXSystem } from '../hooks/useMDXSystem.js';
import { useState } from 'preact/hooks';
import MDXMonacoEditor from '../components/MDXMonacoEditor.jsx'; // ⭐ NOMBRE ÚNICO

export default function MDXEditor({ 
  initialContent = '', 
  onSave,
  theme = 'light', // ⭐ CAMBIADO: theme en lugar de defaultTheme
  height = '500px'  // ⭐ CAMBIADO: height en lugar de defaultHeight
}) {
  const {
    content,
    setContent,
    compiledResult,
    isLoading,
    componentRegistry,
    templateManager,
    loadTemplate,
    insertComponent,
    hasError,
    Component,
    frontmatter
  } = useMDXSystem(initialContent);

  // Estados locales del editor
  const [showTemplates, setShowTemplates] = useState(false);
  const [showComponents, setShowComponents] = useState(false);
  const [editorTheme, setEditorTheme] = useState(theme); // ⭐ USAR theme
  const [editorHeight, setEditorHeight] = useState(height); // ⭐ USAR height
  const [editorRef, setEditorRef] = useState(null);

  const handleSave = () => {
    if (onSave && !hasError) {
      onSave({
        content,
        frontmatter: compiledResult?.frontmatter,
        timestamp: new Date().toISOString()
      });
    }
  };

  const toggleTheme = () => {
    setEditorTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleMonacoChange = (newValue) => {
    // ⭐ DEBOUNCE PARA EVITAR ACTUALIZACIONES EXCESIVAS
    if (newValue !== undefined) {
      setContent(newValue);
    }
  };

  // ⭐ INSERTAR COMPONENTES CON MONACO
  const insertComponentInEditor = (componentName) => {
    const component = componentRegistry.getComponent(componentName);
    if (component && component.example && editorRef?.insertComponent) {
      editorRef.insertComponent('\n\n' + component.example + '\n\n');
    } else {
      // Fallback: agregar al final
      setContent(prev => prev + '\n\n' + (component?.example || `<${componentName} />`));
    }
    setShowComponents(false);
  };

  return (
    <Container fluid style={{ height: '100vh' }}>
      {/* Header */}
      <Paper p="md" mb="md" withBorder>
        <Group justify="space-between">
          <Group>
            <Text fw={700} size="xl">MDX Editor</Text>
            <Badge color="green">v2.0</Badge>
            <Badge variant="light" color="orange">Monaco</Badge>
            
            {/* Mostrar info del frontmatter */}
            {frontmatter?.title && (
              <Badge variant="light" color="blue">
                {frontmatter.title}
              </Badge>
            )}
          </Group>
          
          <Group>
            {/* Toggle tema editor */}
            <Button
              variant="light"
              color="gray"
              onClick={toggleTheme}
              leftSection={editorTheme === 'light' ? <IconMoon size={16} /> : <IconSun size={16} />}
            >
              {editorTheme === 'light' ? 'Oscuro' : 'Claro'}
            </Button>

            <Button
              variant="light"
              leftSection={<IconTemplate size={16} />}
              onClick={() => setShowTemplates(!showTemplates)}
            >
              Templates ({templateManager.getAllTemplates().length})
            </Button>
            
            <Button
              variant="light"
              leftSection={<IconComponents size={16} />}
              onClick={() => setShowComponents(!showComponents)}
            >
              Componentes ({componentRegistry.getAllComponents().length})
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={hasError || isLoading}
              color={hasError ? 'red' : 'blue'}
            >
              {hasError ? 'Corregir errores' : 'Guardar'}
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Templates rápidos */}
      {showTemplates && (
        <Paper p="md" mb="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={600}>Templates rápidos:</Text>
            <Text size="sm" c="dimmed">
              Haz clic en un template para cargarlo
            </Text>
          </Group>
          <Group>
            {templateManager.getAllTemplates().slice(0, 6).map(template => (
              <Button
                key={template.id}
                variant="outline"
                size="sm"
                onClick={() => {
                  loadTemplate(template.id);
                  setShowTemplates(false);
                }}
              >
                {template.thumbnail} {template.name}
              </Button>
            ))}
          </Group>
        </Paper>
      )}

      {/* Componentes rápidos */}
      {showComponents && (
        <Paper p="md" mb="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw={600}>Componentes rápidos:</Text>
            <Text size="sm" c="dimmed">
              Haz clic para insertar en el cursor
            </Text>
          </Group>
          <Group>
            {componentRegistry.getAllComponents().slice(0, 10).map(comp => (
              <Button
                key={comp.name}
                variant="outline"
                size="sm"
                onClick={() => insertComponentInEditor(comp.name)}
              >
                {comp.name}
              </Button>
            ))}
          </Group>
        </Paper>
      )}

      {/* Editor principal */}
      <Grid style={{ height: 'calc(100vh - 200px)' }}>
        {/* Editor con Monaco */}
        <Grid.Col span={6}>
          <Paper p="md" style={{ height: '100%' }} withBorder>
            <Group justify="space-between" mb="md">
              <Group>
                <IconCode size={18} />
                <Text fw={600}>Editor MDX</Text>
              </Group>
              <Group>
                <Badge 
                  size="sm" 
                  color={hasError ? 'red' : isLoading ? 'yellow' : 'green'}
                  variant="light"
                >
                  {hasError ? 'Error' : isLoading ? 'Compilando' : 'OK'}
                </Badge>
                <Badge size="sm" variant="outline">
                  {content.length} chars
                </Badge>
                <Badge size="sm" variant="outline">
                  {content.split('\n').length} líneas
                </Badge>
              </Group>
            </Group>
            
            {/* ⭐ MONACO EDITOR */}
            <MDXMonacoEditor
              value={content}
              onChange={handleMonacoChange}
              theme={editorTheme}
              height={editorHeight}
              onSave={handleSave}
              ref={setEditorRef}
            />

            {/* Info adicional del editor */}
            <Box mt="xs" pt="xs" style={{ borderTop: '1px solid #e5e7eb' }}>
              <Group justify="space-between">
                <Group gap="lg">
                  <Text size="xs" c="dimmed">
                    Editor: Monaco (VS Code)
                  </Text>
                  <Text size="xs" c="dimmed">
                    Tema: {editorTheme}
                  </Text>
                </Group>
                <Group gap="xs">
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => setEditorHeight(prev => prev === '500px' ? '700px' : '500px')}
                  >
                    {editorHeight === '500px' ? 'Expandir' : 'Contraer'}
                  </Button>
                </Group>
              </Group>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Preview mejorado */}
        <Grid.Col span={6}>
          <Paper p="md" style={{ height: '100%', overflow: 'auto' }} withBorder>
            <Group justify="space-between" mb="md">
              <Group>
                <IconEye size={18} />
                <Text fw={600}>Preview</Text>
              </Group>
              <Badge size="sm" color="blue" variant="light">
                Tiempo real
              </Badge>
            </Group>
            
            {/* Mostrar metadata del frontmatter */}
            {frontmatter && Object.keys(frontmatter).length > 0 && (
              <Box mb="md" p="sm" bg="gray.1" style={{ borderRadius: '6px' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>📄 Metadata extraído:</div>
                <Group gap="xs">
                  {Object.entries(frontmatter).slice(0, 5).map(([key, value]) => (
                    <Badge key={key} variant="light" size="xs">
                      {key}: {String(value).slice(0, 20)}
                      {String(value).length > 20 ? '...' : ''}
                    </Badge>
                  ))}
                  {Object.keys(frontmatter).length > 5 && (
                    <Badge variant="outline" size="xs">
                      +{Object.keys(frontmatter).length - 5} más
                    </Badge>
                  )}
                </Group>
              </Box>
            )}
            
            {/* Contenido del preview */}
            {hasError ? (
              <Alert color="red" title="Error de compilación">
                <div style={{ fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                  {compiledResult.error}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  💡 Monaco puede ayudarte a detectar errores automáticamente
                </div>
              </Alert>
            ) : isLoading ? (
              <Box ta="center" pt="xl">
                <div style={{ color: '#6b7280' }}>⚡ Compilando contenido...</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  El preview se actualiza automáticamente
                </div>
              </Box>
            ) : Component ? (
              <Box>
                <Component />
              </Box>
            ) : (
              <Box ta="center" pt="xl">
                <div style={{ color: '#6b7280' }}>
                  ✏️ Escribe contenido para ver el preview
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                  Monaco tiene autocompletado inteligente - prueba escribiendo &lt; o presionando Ctrl+Space
                </div>
              </Box>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}