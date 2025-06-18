// ===================================================================
// resources/js/mdx-system/editor/MDXEditor.jsx - Mejorar preview
// ===================================================================

import { Container, Grid, Paper, Textarea, Button, Group, Text, Badge, Alert, Title, Box } from '@mantine/core';
import { IconTemplate, IconComponents, IconVariable } from '@tabler/icons-preact';
import { useMDXSystem } from '../hooks/useMDXSystem.js';
import { useState } from 'preact/hooks';

export default function MDXEditor({ initialContent = '', onSave }) {
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

  const [showTemplates, setShowTemplates] = useState(false);
  const [showComponents, setShowComponents] = useState(false);

  const handleSave = () => {
    if (onSave && !hasError) {
      onSave({
        content,
        frontmatter: compiledResult?.frontmatter,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <Container fluid style={{ height: '100vh' }}>
      {/* Header */}
      <Paper p="md" mb="md" withBorder>
        <Group justify="space-between">
          <Group>
            <Text fw={700} size="xl">MDX Editor</Text>
            <Badge color="green">v1.0</Badge>
            {/* Mostrar info del frontmatter */}
            {frontmatter?.title && (
              <Badge variant="light" color="blue">
                {frontmatter.title}
              </Badge>
            )}
          </Group>
          
          <Group>
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
            >
              Guardar
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Templates rápidos */}
      {showTemplates && (
        <Paper p="md" mb="md" withBorder>
          <Text fw={600} mb="md">Templates rápidos:</Text>
          <Group>
            {templateManager.getAllTemplates().slice(0, 5).map(template => (
              <Button
                key={template.id}
                variant="outline"
                size="xs"
                onClick={() => {
                  loadTemplate(template.id);
                  setShowTemplates(false);
                }}
              >
                {template.name}
              </Button>
            ))}
          </Group>
        </Paper>
      )}

      {/* Componentes rápidos */}
      {showComponents && (
        <Paper p="md" mb="md" withBorder>
          <Text fw={600} mb="md">Componentes rápidos:</Text>
          <Group>
            {componentRegistry.getAllComponents().slice(0, 8).map(comp => (
              <Button
                key={comp.name}
                variant="outline"
                size="xs"
                onClick={() => {
                  insertComponent(comp.name);
                  setShowComponents(false);
                }}
              >
                {comp.name}
              </Button>
            ))}
          </Group>
        </Paper>
      )}

      {/* Editor principal */}
      <Grid style={{ height: 'calc(100vh - 200px)' }}>
        {/* Editor */}
        <Grid.Col span={6}>
          <Paper p="md" style={{ height: '100%' }} withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Editor</Text>
              <Group>
                <Badge size="sm" color={hasError ? 'red' : isLoading ? 'yellow' : 'green'}>
                  {hasError ? 'Error' : isLoading ? 'Compilando' : 'OK'}
                </Badge>
                <Text size="xs" c="dimmed">{content.length} chars</Text>
              </Group>
            </Group>
            
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Escribe tu contenido MDX...

Ejemplo:
---
title: "Mi página"
description: "Descripción"
---

# Mi título

Este es **contenido markdown**.

<Alert color="blue" title="¡Genial!">
  ¡Tu contenido con componentes!
</Alert>`}
              styles={{
                input: {
                  height: 'calc(100% - 80px)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '14px'
                }
              }}
              autosize
              minRows={20}
            />
          </Paper>
        </Grid.Col>

        {/* Preview mejorado */}
        <Grid.Col span={6}>
          <Paper p="md" style={{ height: '100%', overflow: 'auto' }} withBorder>
            <Group justify="space-between" mb="md">
              <Text fw={600}>Preview</Text>
              <Badge size="sm" color="blue">Tiempo real</Badge>
            </Group>
            
            {/* Mostrar metadata del frontmatter */}
            {frontmatter && Object.keys(frontmatter).length > 0 && (
              <Box mb="md" p="sm" bg="gray.1" style={{ borderRadius: '6px' }}>
                <Text size="xs" c="dimmed" mb="xs">Metadata:</Text>
                <Group gap="xs">
                  {Object.entries(frontmatter).map(([key, value]) => (
                    <Badge key={key} variant="light" size="xs">
                      {key}: {String(value)}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}
            
            {hasError ? (
              <Alert color="red" title="Error de compilación">
                <Text size="sm" style={{ fontFamily: 'monospace' }}>
                  {compiledResult.error}
                </Text>
              </Alert>
            ) : isLoading ? (
              <Text c="dimmed" ta="center" pt="xl">Compilando...</Text>
            ) : Component ? (
              <Box>
                <Component />
              </Box>
            ) : (
              <Text c="dimmed" ta="center" pt="xl">
                Escribe contenido para ver el preview
              </Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}