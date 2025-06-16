// resources/js/storybook/adapters/LiquidVariableAdapter.jsx
// 🌊 Adaptador avanzado para Templates con Liquid.js + Variables dinámicas

import { useState, useEffect } from 'preact/hooks';

const LiquidVariableAdapter = ({
  // Template data
  templateData = null,
  templateId = null,
  
  // Variables from Storybook controls
  variables = {},
  
  // Liquid context
  liquidContext = {},
  
  // Dynamic variables from your API
  loadDynamicVariables = true,
  
  className = '',
  ...props
}) => {
  const [renderedContent, setRenderedContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dynamicVariables, setDynamicVariables] = useState({});
  const [liquidEngine, setLiquidEngine] = useState(null);
  const [liquidAvailable, setLiquidAvailable] = useState(false);

  const LARAVEL_BASE_URL = 'http://127.0.0.1:8000';

  // ===================================================================
  // INICIALIZAR LIQUID.JS DE FORMA SEGURA
  // ===================================================================

  useEffect(() => {
    const initLiquid = async () => {
      try {
        console.log('🌊 Initializing Liquid.js...');
        
        // Intentar cargar Liquid.js dinámicamente
        const { Liquid } = await import('liquidjs');
        
        const engine = new Liquid({
          cache: false,
          strictFilters: false,
          strictVariables: false,
          trimTagLeft: false,
          trimTagRight: false,
          trimOutputLeft: false,
          trimOutputRight: false
        });

        // Registrar filtros personalizados
        registerCustomFilters(engine);
        
        setLiquidEngine(engine);
        setLiquidAvailable(true);
        console.log('✅ Liquid.js initialized successfully');
        
      } catch (error) {
        console.warn('⚠️ Liquid.js not available, using fallback rendering:', error);
        setLiquidAvailable(false);
        setError(null); // No mostrar error, usar fallback
      }
    };

    initLiquid();
  }, []);

  // ===================================================================
  // CARGAR VARIABLES DINÁMICAS DESDE TU API (CON THROTTLING)
  // ===================================================================

  useEffect(() => {
    if (loadDynamicVariables) {
      // ✅ SOLO cargar una vez al montar el componente
      loadVariablesFromAPI();
    }
  }, [loadDynamicVariables]); // Solo re-ejecutar si loadDynamicVariables cambia

  const loadVariablesFromAPI = async () => {
    try {
      console.log('🔄 Loading variables from API...');
      
      // Cargar variables resueltas desde tu VariableController
      const response = await fetch(`${LARAVEL_BASE_URL}/api/variables/resolved/all`, {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken()
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Variables loaded:', result);
        
        // Flatten las variables para uso en Liquid
        const flatVariables = flattenVariables(result.data || result);
        setDynamicVariables(flatVariables);
      } else {
        console.warn('⚠️ Variables API not available, using mock data');
        setDynamicVariables(getMockVariables());
      }
    } catch (error) {
      console.error('❌ Error loading variables:', error);
      setDynamicVariables(getMockVariables());
    }
  };

  // ===================================================================
  // RENDERIZAR TEMPLATE CON LIQUID + VARIABLES
  // ===================================================================

  // ===================================================================
  // RENDERIZAR TEMPLATE CON LIQUID + VARIABLES (DEPENDENCIES ARREGLADAS)
  // ===================================================================

  useEffect(() => {
    if (templateData?.content) {
      renderTemplate();
    }
  }, [
    // ✅ SOLO DEPENDENCIES QUE REALMENTE CAMBIAN
    templateData?.content,
    templateData?.name,
    JSON.stringify(variables), // Convertir a string para comparar objetos
    JSON.stringify(dynamicVariables),
    JSON.stringify(liquidContext),
    liquidAvailable
    // ❌ NO incluir liquidEngine porque cambia en cada render
  ]);

  const renderTemplate = async () => {
    if (!templateData?.content) return;
    
    setLoading(true);
    setError(null);

    try {
      // Combinar todas las variables
      const allVariables = {
        // Variables dinámicas de la API
        ...dynamicVariables,
        
        // Variables desde Storybook controls
        ...variables,
        
        // Context adicional de Liquid
        ...liquidContext,
        
        // Variables de configuración del template
        ...(templateData.variables || {}),
        
        // Meta variables útiles
        template: {
          name: templateData.name,
          type: templateData.type,
          category: templateData.category
        },
        
        // Variables del sistema (SOLO las necesarias, no timestamp que cambia)
        system: {
          storybook: true
        }
      };

      console.log('🌊 Rendering template...', { 
        liquidAvailable,
        templateName: templateData.name,
        variableCount: Object.keys(allVariables).length
      });

      let rendered;

      if (liquidAvailable && liquidEngine) {
        // Renderizar con Liquid.js
        console.log('✅ Using Liquid.js engine');
        rendered = await liquidEngine.parseAndRender(templateData.content, allVariables);
      } else {
        // Fallback: renderizado simple con reemplazo básico
        console.log('⚠️ Using fallback rendering (no Liquid.js)');
        rendered = fallbackRender(templateData.content, allVariables);
      }
      
      setRenderedContent(rendered);
      
    } catch (err) {
      console.error('❌ Render error:', err);
      setError(`Render error: ${err.message}`);
      
      // Fallback en caso de error
      try {
        const fallback = fallbackRender(templateData.content, variables);
        setRenderedContent(fallback);
        setError(null); // Si fallback funciona, no mostrar error
      } catch (fallbackErr) {
        console.error('❌ Fallback render also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // ===================================================================
  // UTILIDADES
  // ===================================================================

  const getCSRFToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  };

  const flattenVariables = (variables, prefix = '') => {
    const result = {};
    
    for (const [key, value] of Object.entries(variables)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (value.variables) {
          // Es un grupo de variables de tu sistema
          Object.assign(result, flattenVariables(value.variables, prefix));
        } else {
          // Es un objeto anidado
          Object.assign(result, flattenVariables(value, prefix ? `${prefix}.${key}` : key));
        }
      } else {
        const finalKey = prefix ? `${prefix}.${key}` : key;
        result[finalKey] = value;
      }
    }
    
    return result;
  };

  const getMockVariables = () => ({
    'site.name': 'Mi Sitio Web',
    'site.description': 'Un sitio web increíble',
    'site.url': 'https://misitio.com',
    'page.title': 'Página de Ejemplo',
    'page.description': 'Esta es una página de ejemplo',
    'user.name': 'Usuario Demo',
    'company.name': 'Mi Empresa',
    'company.phone': '+1 234 567 8900',
    'company.email': 'contacto@miempresa.com',
    'current.date': new Date().toLocaleDateString(),
    'current.year': new Date().getFullYear()
  });

  const fallbackRender = (content, vars) => {
    let result = content;
    
    // Reemplazo simple de variables {{ variable }}
    Object.entries(vars).forEach(([key, value]) => {
      // Reemplazar variables simples
      const simpleRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(simpleRegex, value);
      
      // Reemplazar variables con default: {{ variable | default: 'valor' }}
      const defaultRegex = new RegExp(`{{\\s*${key}\\s*\\|\\s*default:\\s*['"]([^'"]*?)['"]\\s*}}`, 'g');
      result = result.replace(defaultRegex, value || '$1');
    });

    // Procesar variables anidadas (objeto.propiedad)
    const nestedVars = {};
    Object.entries(vars).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          nestedVars[`${key}.${subKey}`] = subValue;
        });
      }
    });

    Object.entries(nestedVars).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value);
      
      const defaultRegex = new RegExp(`{{\\s*${key}\\s*\\|\\s*default:\\s*['"]([^'"]*?)['"]\\s*}}`, 'g');
      result = result.replace(defaultRegex, value || '$1');
    });

    // Limpiar tags Liquid que no se procesaron
    result = result.replace(/{%[^%]*%}/g, ''); // Remover {% tags %}
    result = result.replace(/{{[^}]*}}/g, ''); // Remover {{ variables }} no resueltas

    return result;
  };

  // ===================================================================
  // RENDER CONDICIONAL
  // ===================================================================

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded-lg p-4 ${className}`}>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="text-xs text-gray-500">Rendering with Liquid.js...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg ${className}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">Liquid Render Error</h3>
            <div className="mt-1 text-sm">{error}</div>
            {templateData && (
              <div className="mt-2 text-xs">
                <strong>Template:</strong> {templateData.name} ({templateData.type})
              </div>
            )}
          </div>
        </div>
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
    <div className={`liquid-template-preview ${className}`}>
      {/* Debug info en desarrollo */}
      {window.location.href.includes('localhost:6006') && (
        <details className="mb-4 text-xs bg-gray-100 p-2 rounded">
          <summary className="cursor-pointer font-medium">🔍 Debug Info</summary>
          <div className="mt-2 space-y-1">
            <div><strong>Template:</strong> {templateData?.name}</div>
            <div><strong>Liquid Available:</strong> {liquidAvailable ? '✅' : '❌'}</div>
            <div><strong>Variables loaded:</strong> {Object.keys(dynamicVariables).length}</div>
            <div><strong>Storybook vars:</strong> {Object.keys(variables).length}</div>
            <div><strong>Sample variables:</strong></div>
            <ul className="ml-4 text-gray-600">
              {Object.entries({...dynamicVariables, ...variables}).slice(0, 5).map(([key, value]) => (
                <li key={key}>{key}: {String(value).substring(0, 50)}</li>
              ))}
            </ul>
          </div>
        </details>
      )}
      
      {/* Contenido renderizado */}
      <div dangerouslySetInnerHTML={{ __html: renderedContent }} />
    </div>
  );
};

// ===================================================================
// FILTROS PERSONALIZADOS PARA LIQUID
// ===================================================================

const registerCustomFilters = (engine) => {
  // Filtro para slugify
  engine.registerFilter('slugify', (str) => {
    return String(str).toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  });

  // Filtro para truncate mejorado
  engine.registerFilter('smart_truncate', (str, length = 100, suffix = '...') => {
    if (String(str).length <= length) return str;
    return String(str).substring(0, length).trim() + suffix;
  });

  // Filtro para formatear fechas
  engine.registerFilter('format_date', (date, format = 'short') => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    
    switch (format) {
      case 'short': return d.toLocaleDateString();
      case 'long': return d.toLocaleDateString('es-ES', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
      case 'iso': return d.toISOString();
      default: return d.toString();
    }
  });

  // Filtro para clases CSS condicionales
  engine.registerFilter('add_class', (str, className, condition = true) => {
    if (!condition) return str;
    const currentClasses = String(str || '').trim();
    return currentClasses ? `${currentClasses} ${className}` : className;
  });
};

export default LiquidVariableAdapter;