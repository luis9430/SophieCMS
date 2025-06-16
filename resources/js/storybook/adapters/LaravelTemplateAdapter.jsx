// resources/js/storybook/adapters/LaravelTemplateAdapter.jsx
// 🔗 Adaptador para conectar Storybook con tu base de datos de templates

import { useState, useEffect } from 'preact/hooks';

const LaravelTemplateAdapter = ({
  // Opciones para cargar desde BD
  templateId = null,
  templateType = null,
  templateCategory = null,
  
  // O data directo
  templateData = null,
  
  // Variables y configuración
  variables = {},
  config = {},
  
  // Props del componente
  children,
  className = '',
  ...props
}) => {
  const [template, setTemplate] = useState(null);
  const [renderedContent, setRenderedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTemplates, setAvailableTemplates] = useState([]);

  // ✅ URL BASE CORRECTA PARA LARAVEL
  const LARAVEL_BASE_URL = 'http://127.0.0.1:8000';

  // ===================================================================
  // CARGAR TEMPLATE DESDE BD
  // ===================================================================

  useEffect(() => {
    const loadTemplate = async () => {
      if (!templateId && !templateData && !templateType) return;
      
      setLoading(true);
      setError(null);
      
      try {
        let templateToRender;
        
        if (templateData) {
          // Usar data directo
          templateToRender = templateData;
        } else if (templateId) {
          // Cargar template específico por ID
          templateToRender = await fetchTemplateById(templateId);
        } else if (templateType) {
          // Cargar templates por tipo
          const templates = await fetchTemplatesByType(templateType, templateCategory);
          setAvailableTemplates(templates);
          templateToRender = templates[0]; // Usar el primero por defecto
        }
        
        if (templateToRender) {
          setTemplate(templateToRender);
          
          // Renderizar usando tu sistema
          const rendered = await renderTemplate(templateToRender, {
            variables,
            config,
            ...props
          });
          
          setRenderedContent(rendered);
        }
      } catch (err) {
        console.error('Error loading template:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, templateType, templateCategory, templateData, variables, config]);

  // ===================================================================
  // API CALLS A TU LARAVEL BACKEND
  // ===================================================================

  const fetchTemplateById = async (id) => {
    const response = await fetch(`${LARAVEL_BASE_URL}/api/templates/${id}`, {
      headers: {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': getCSRFToken()
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load template ${id}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  };

  const fetchTemplatesByType = async (type, category = null) => {
    let url = `${LARAVEL_BASE_URL}/api/templates/type/${type}`;
    if (category) {
      url += `?category=${category}`;
    }

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': getCSRFToken()
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load templates: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  };

  const renderTemplate = async (template, context) => {
    // ✅ VERIFICAR SI ESTAMOS EN STORYBOOK (sin usar process)
    const isStorybookMode = window.location.port === '6006' || window.location.href.includes('localhost:6006');
    
    if (isStorybookMode) {
      return mockRender(template, context);
    }

    try {
      // En producción, usar tu PageBuilderController
      const response = await fetch(`${LARAVEL_BASE_URL}/admin/page-builder/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken()
        },
        body: JSON.stringify({
          template: template.content,
          variables: context.variables || {},
          config: context.config || {},
          type: template.type
        })
      });

      if (!response.ok) {
        throw new Error(`Render failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.html;
    } catch (error) {
      console.error('Error rendering template:', error);
      // Fallback a renderizado mock
      return mockRender(template, context);
    }
  };

  // ===================================================================
  // RENDERIZADO MOCK PARA STORYBOOK
  // ===================================================================

  const mockRender = (template, context) => {
    let content = template.content || '';
    
    // Procesar variables básicas {{ variable }}
    Object.entries(context.variables || {}).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      content = content.replace(regex, value);
    });

    // Procesar variables con notación punto {{ config.title }}
    Object.entries(context.config || {}).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*config\\.${key}\\s*}}`, 'g');
      content = content.replace(regex, value);
    });

    return content;
  };

  const getCSRFToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  };

  // ===================================================================
  // FUNCIONES PARA GUARDAR EN BD
  // ===================================================================

  const saveTemplate = async (templateData) => {
    const response = await fetch(`${LARAVEL_BASE_URL}/api/templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': getCSRFToken()
      },
      body: JSON.stringify({
        name: templateData.name,
        type: templateData.type || 'component',
        category: templateData.category || 'storybook',
        content: templateData.content,
        description: templateData.description,
        variables: templateData.variables || {},
        // Metadata específica de Storybook
        method_config: {
          storybook: true,
          story_name: templateData.storyName,
          controls: templateData.controls
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`);
    }

    return await response.json();
  };

  // ===================================================================
  // RENDER CONDICIONAL
  // ===================================================================

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg p-4 ${className}`}>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg ${className}`}>
        <strong>Template Error:</strong> {error}
        {template && (
          <div className="mt-2 text-sm">
            <strong>Template:</strong> {template.name} ({template.type})
          </div>
        )}
      </div>
    );
  }

  if (!renderedContent) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg ${className}`}>
        No template content available
      </div>
    );
  }

  return (
    <div 
      className={`storybook-template-preview ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};

// ===================================================================
// EXPORT CON FUNCIONES HELPER
// ===================================================================

export { LaravelTemplateAdapter };

// Helper para usar en stories
export const createTemplateStory = (templateConfig) => ({
  render: (args) => (
    <LaravelTemplateAdapter 
      {...templateConfig}
      variables={args}
      config={args}
    />
  )
});

export default LaravelTemplateAdapter;