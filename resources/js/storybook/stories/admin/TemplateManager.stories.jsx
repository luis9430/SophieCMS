// resources/js/storybook/stories/admin/TemplateManager.stories.jsx
// 🎛️ Panel de administración de templates - VERSIÓN SIMPLIFICADA

import { useState, useEffect } from 'preact/hooks';

const TemplateManager = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ URL BASE CORRECTA PARA LARAVEL
  const LARAVEL_BASE_URL = 'http://127.0.0.1:8000';

  // Mock data para mostrar la interfaz
  const mockTemplates = [
    {
      id: 1,
      name: 'Hero Section',
      type: 'component',
      category: 'marketing',
      description: 'Sección hero para landing pages',
      updated_at: '2024-06-15'
    },
    {
      id: 2,
      name: 'Button Component',
      type: 'component', 
      category: 'ui',
      description: 'Botón reutilizable con Alpine.js',
      updated_at: '2024-06-14'
    },
    {
      id: 3,
      name: 'Modal Alpine',
      type: 'alpine_method',
      category: 'ui',
      description: 'Modal interactivo',
      updated_at: '2024-06-13'
    }
  ];

  // Cargar templates (por ahora mock data)
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // ✅ URL COMPLETA CON PUERTO CORRECTO
      const response = await fetch(`${LARAVEL_BASE_URL}/api/templates`, {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        }
      });

      console.log('✅ Intentando conectar a:', `${LARAVEL_BASE_URL}/api/templates`);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);
        setTemplates(result.data || result || []);
      } else {
        // Mostrar el error específico
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        setError(`API Error ${response.status}: ${errorText}`);
        setTemplates(mockTemplates);
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(`Error de conexión: ${err.message}. Usando datos de ejemplo.`);
      setTemplates(mockTemplates);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    
    // Tests múltiples para diagnosticar
    const tests = [
      { name: 'Laravel Home', url: `${LARAVEL_BASE_URL}/` },
      { name: 'API Templates', url: `${LARAVEL_BASE_URL}/api/templates` },
      { name: 'Templates Metadata', url: `${LARAVEL_BASE_URL}/api/templates/metadata` }
    ];
    
    const results = [];
    
    for (const test of tests) {
      try {
        console.log(`Testing: ${test.name} (${test.url})`);
        const response = await fetch(test.url, {
          headers: {
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          }
        });
        
        results.push({
          name: test.name,
          status: response.status,
          ok: response.ok,
          contentType: response.headers.get('content-type'),
          url: test.url
        });
      } catch (error) {
        results.push({
          name: test.name,
          error: error.message,
          url: test.url
        });
      }
    }
    
    // Mostrar resultados detallados
    const summary = results.map(r => 
      `${r.name}: ${r.ok ? '✅' : '❌'} ${r.status || r.error}`
    ).join('\n');
    
    alert(`🔍 Resultados de Conexión:\n\n${summary}`);
    console.log('Detailed test results:', results);
    
    setLoading(false);
    
    // Si alguno funcionó, intentar cargar templates
    if (results.some(r => r.ok)) {
      loadTemplates();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Manager</h1>
        <p className="text-gray-600">Gestiona todos los templates de tu base de datos</p>
        
        {error && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
            <strong>Aviso:</strong> {error}
          </div>
        )}
      </div>

      {/* Panel de Control */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Estado de Conexión</h2>
            <p className="text-sm text-gray-600">Verifica la conexión con tu base de datos Laravel</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={testConnection}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Probando...' : '🔗 Probar Conexión'}
            </button>
            <button
              onClick={loadTemplates}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Cargando...' : '🔄 Recargar'}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Templates */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Templates ({templates.length})
          </h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="mb-4">📦</div>
            <p>No se encontraron templates.</p>
            <p className="text-sm mt-2">Asegúrate de que Laravel esté corriendo y tengas templates en la BD.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actualizado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">{template.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{template.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {template.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {template.category || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {template.description || 'Sin descripción'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información de Debug */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-700 mb-2">🔧 Debug Info:</h3>
        <div className="text-xs text-gray-600 space-y-1">
          <div>• Laravel URL: <strong>{LARAVEL_BASE_URL}</strong></div>
          <div>• Storybook URL: <strong>{window.location.origin}</strong></div>
          <div>• API Endpoint: {LARAVEL_BASE_URL}/api/templates</div>
          <div>• CSRF Token: {document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')?.substring(0, 10) || 'No encontrado'}...</div>
          <div>• Templates cargados: {templates.length}</div>
        </div>
      </div>
    </div>
  );
};

export default {
  title: 'Admin/Template Manager',
  component: TemplateManager,
  parameters: {
    docs: {
      description: {
        component: 'Panel de administración para gestionar templates. Incluye modo demo con datos de ejemplo si la API no está disponible.'
      }
    },
    layout: 'fullscreen'
  }
};

export const Dashboard = {
  render: () => <TemplateManager />
};