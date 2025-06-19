// ===================================================================
// resources/js/app.jsx - VERSIÓN CORREGIDA SIN NESTING PROBLEMS
// ===================================================================

import { render } from 'preact';
import { MantineProvider } from '@mantine/core';

// Import directo para evitar problemas
import MDXEditor from './mdx-system/editor/MDXEditor.jsx';
import '../css/app.css'; 

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

  // ===================================================================
  // CONTENIDO INICIAL CORREGIDO - Sin problemas de nesting
  // ===================================================================
  const initialContent = `---
title: "Mi primera página MDX"
description: "Testing del sistema"
author: "Tu nombre"
date: "2024-01-01"
---

# ¡Bienvenido al sistema MDX! 🎉

<div>
  <Text size="lg" fw={500}>Este es tu primer contenido usando nuestro editor.</Text>
</div>

<Alert color="blue" title="¡Sistema funcionando!">
  <Text>El editor MDX está funcionando correctamente con Mantine + Preact.</Text>
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

<div>
  <Text>Puedes escribir texto normal usando componentes Text y mezclarlo con otros elementos.</Text>
</div>

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

<div>
  <Text size="xl" fw={600}>¡Ahora puedes crear contenido increíble! 🚀</Text>
</div>`;

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
      reload: () => window.location.reload(),
      checkComponents: () => {
        // Helper para debuggear componentes registrados
        console.table(Object.keys(window.componentRegistry?.getAllComponents?.() || {}));
      }
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