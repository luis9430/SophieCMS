// ===================================================================
// resources/js/preact-app.jsx
// Entry point actualizado para el Page Builder con Preact/Mantine
// ===================================================================

import { render } from 'preact';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import PageBuilder from './block-builder/PageBuilder';

// Estilos de Mantine
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// ===================================================================
// TEMA PERSONALIZADO
// ===================================================================

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, Consolas, Monaco, monospace',
  headings: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: '600'
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md'
      }
    },
    Card: {
      defaultProps: {
        radius: 'md',
        withBorder: true
      }
    },
    Modal: {
      defaultProps: {
        radius: 'md',
        shadow: 'xl'
      }
    },
    Paper: {
      defaultProps: {
        radius: 'md'
      }
    }
  }
});

// ===================================================================
// COMPONENTE PRINCIPAL DE LA APP
// ===================================================================

const PageBuilderApp = () => {
  // Obtener datos del DOM
  const data = window.pageBuilderData || {};
  const {
    initialBlocks = [],
    availableBlocks = [],
    apiEndpoints = {},
    config = {}
  } = data;

  // Función de guardado personalizada
  const handleSave = async (blocks) => {
    try {
      console.log('💾 Saving page with blocks:', blocks);
      
      // Aquí puedes agregar lógica personalizada de guardado
      // Por ejemplo, mostrar un toast específico, limpiar cache, etc.
      
      return true;
    } catch (error) {
      console.error('❌ Save error:', error);
      throw error;
    }
  };

  // Función de carga personalizada
  const handleLoad = async (pageId) => {
    try {
      console.log('📄 Loading page:', pageId);
      
      // Implementar lógica de carga si necesario
      
      return [];
    } catch (error) {
      console.error('❌ Load error:', error);
      throw error;
    }
  };

  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ModalsProvider>
        <Notifications position="top-right" />
        
        <PageBuilder
          initialBlocks={initialBlocks}
          availableBlocks={availableBlocks}
          apiEndpoints={apiEndpoints}
          onSave={handleSave}
          onLoad={handleLoad}
          config={config}
        />
      </ModalsProvider>
    </MantineProvider>
  );
};

// ===================================================================
// FUNCIÓN DE INICIALIZACIÓN
// ===================================================================

function initPreactPageBuilder() {
  const container = document.getElementById('preact-page-builder');
  
  if (!container) {
    console.error('❌ Page Builder container not found');
    return;
  }

  try {
    // Renderizar la aplicación Preact
    render(<PageBuilderApp />, container);
    
    // Exponer instancia para debugging (solo en desarrollo)
    if (window.pageBuilderData?.config?.debug_mode) {
      window.pageBuilderInstance = {
        container,
        // Agregar métodos útiles para debugging
        reload: () => {
          render(null, container);
          setTimeout(() => render(<PageBuilderApp />, container), 100);
        },
        destroy: () => {
          render(null, container);
        }
      };
    }
    
    console.log('🚀 Preact Page Builder initialized successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing Preact Page Builder:', error);
    
    // Mostrar error en el contenedor
    container.innerHTML = `
      <div style="
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 1rem;
        color: #dc3545;
        text-align: center;
        padding: 2rem;
      ">
        <h3>Failed to Initialize Page Builder</h3>
        <p>Error: ${error.message}</p>
        <button onclick="location.reload()" style="
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        ">
          Reload Page
        </button>
      </div>
    `;
  }
}

// ===================================================================
// EXPORTACIONES Y CONFIGURACIÓN GLOBAL
// ===================================================================

// Exponer función para uso desde el HTML
window.initPreactPageBuilder = initPreactPageBuilder;

// Helpers para desarrollo
if (typeof window !== 'undefined' && window.pageBuilderData?.config?.debug_mode) {
  window.preactPageBuilderHelpers = {
    reinit: initPreactPageBuilder,
    theme,
    version: '1.0.0'
  };
}

// Auto-inicialización si el DOM ya está listo
if (typeof document !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Pequeño delay para asegurar que todos los scripts estén cargados
    setTimeout(initPreactPageBuilder, 50);
  });
} else if (typeof document !== 'undefined') {
  // DOM ya está listo
  setTimeout(initPreactPageBuilder, 50);
}

console.log('🎨 Preact Page Builder module loaded');

export default PageBuilderApp;
export { initPreactPageBuilder, theme };