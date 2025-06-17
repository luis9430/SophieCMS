// ===================================================================
// resources/js/app.jsx - VERSIÓN SIMPLIFICADA Y SEGURA
// ===================================================================

import { render } from 'preact';
import { MantineProvider } from '@mantine/core';

// Import directo para evitar problemas
import MDXEditor from './mdx-system/editor/MDXEditor.jsx';
import '../css/app.css'; // Debería incluir Tailwind

// Estilos
import '@mantine/core/styles.css';

function App() {
  const handleSave = (data) => {
    console.log('💾 Guardando contenido:', {
      contentLength: data.content?.length,
      frontmatter: data.frontmatter,
      timestamp: data.timestamp
    });
    
    // Simular guardado exitoso
    setTimeout(() => {
      alert('✅ Contenido guardado exitosamente!');
    }, 500);
  };

  const initialContent = `---
title: "Mi primera página MDX"
description: "Testing del sistema"
author: "Tu nombre"
date: "2024-01-01"
---

# ¡Bienvenido al sistema MDX! 🎉

Este es tu **primer contenido** usando nuestro editor.

<Alert color="blue" title="¡Sistema funcionando!">
  El editor MDX está funcionando correctamente con Mantine + Preact.
</Alert>

## Prueba de componentes

<Button color="green" size="lg">
  Mi primer botón
</Button>

<Card withBorder style={{ margin: '1rem 0', padding: '1rem' }}>
  <Text fw={500} size="lg" mb="xs">Mi primera card</Text>
  <Text size="sm" c="dimmed">
    Esta es una card de prueba para verificar que todo funciona.
  </Text>
  <Badge color="green" mt="md">¡Funciona!</Badge>
</Card>

## Hero Section

<Hero 
  title="¡Increíble!" 
  subtitle="El sistema está funcionando perfectamente"
  buttonText="Continuar explorando"
/>

## Texto y más componentes

Puedes escribir **texto normal** en markdown y mezclarlo con componentes.

<Container>
  <Grid>
    <GridCol span={6}>
      <Text>Columna 1</Text>
    </GridCol>
    <GridCol span={6}>
      <Text>Columna 2</Text>
    </GridCol>
  </Grid>
</Container>

¡Ahora puedes crear contenido increíble! 🚀`;

  return (
    <MantineProvider>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8f9fa',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <MDXEditor 
          initialContent={initialContent}
          onSave={handleSave}
        />
      </div>
    </MantineProvider>
  );
}

// Renderizar la app
function initApp() {
  const appElement = document.getElementById('app');
  if (appElement) {
    render(<App />, appElement);
    console.log('✅ MDX Editor App iniciada exitosamente');
    
    // Debug helper
    window.mdxDebug = {
      test: () => console.log('✅ Sistema funcionando'),
      reload: () => window.location.reload()
    };
  } else {
    console.error('❌ Elemento #app no encontrado en el DOM');
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
