// resources/js/storybook/stories/admin/VariableManager.stories.jsx
// 🎛️ Gestor de Variables desde Storybook

import { useState, useEffect } from 'preact/hooks';

const VariableManager = () => {
  const [variables, setVariables] = useState([]);
  const [resolvedVariables, setResolvedVariables] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newVariable, setNewVariable] = useState({
    key: '',
    value: '',
    type: 'static',
    category: 'custom',
    description: ''
  });

  const LARAVEL_BASE_URL = 'http://127.0.0.1:8000';

  // ===================================================================
  // CARGAR VARIABLES
  // ===================================================================

  useEffect(() => {
    loadVariables();
    loadResolvedVariables();
  }, [selectedCategory]);

  const loadVariables = async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${LARAVEL_BASE_URL}/api/variables`;
      if (selectedCategory !== 'all') {
        url += `?category=${selectedCategory}`;
      }

      console.log('🔄 Loading variables from:', url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken()
        }
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers.get('content-type'));

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Variables API response:', result);
        
        // Tu API podría retornar different structure
        const variablesData = result.data || result.variables || result || [];
        console.log('📋 Variables data:', variablesData);
        
        setVariables(Array.isArray(variablesData) ? variablesData : []);
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error loading variables:', err);
      setError(`Error: ${err.message}. Check console for details.`);
      setVariables([]);
    } finally {
      setLoading(false);
    }
  };

  const loadResolvedVariables = async () => {
    try {
      console.log('🔄 Loading resolved variables...');
      
      const response = await fetch(`${LARAVEL_BASE_URL}/api/variables/resolved/all`, {
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken()
        }
      });

      console.log('📡 Resolved variables response:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Resolved variables:', result);
        
        // Tu API podría retornar different structure
        const resolvedData = result.data || result.resolved || result || {};
        setResolvedVariables(resolvedData);
      } else {
        const errorText = await response.text();
        console.warn('⚠️ Could not load resolved variables:', response.status, errorText);
      }
    } catch (err) {
      console.warn('⚠️ Could not load resolved variables:', err);
    }
  };

  // ===================================================================
  // CRUD OPERATIONS
  // ===================================================================

  const createVariable = async () => {
    if (!newVariable.key || !newVariable.value) {
      alert('Key y Value son requeridos');
      return;
    }

    try {
      const response = await fetch(`${LARAVEL_BASE_URL}/api/variables`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken()
        },
        body: JSON.stringify(newVariable)
      });

      if (response.ok) {
        alert('✅ Variable creada exitosamente');
        setNewVariable({
          key: '',
          value: '',
          type: 'static',
          category: 'custom',
          description: ''
        });
        loadVariables();
        loadResolvedVariables();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating variable');
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const deleteVariable = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta variable?')) return;

    try {
      const response = await fetch(`${LARAVEL_BASE_URL}/api/variables/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken()
        }
      });

      if (response.ok) {
        alert('✅ Variable eliminada');
        loadVariables();
        loadResolvedVariables();
      } else {
        throw new Error('Error deleting variable');
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const refreshVariable = async (id) => {
    try {
      const response = await fetch(`${LARAVEL_BASE_URL}/api/variables/${id}/refresh`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken()
        }
      });

      if (response.ok) {
        alert('✅ Variable refrescada');
        loadVariables();
        loadResolvedVariables();
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const testVariableSystem = async () => {
    try {
      const response = await fetch(`${LARAVEL_BASE_URL}/api/variables/test`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken()
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Test exitoso:\n${JSON.stringify(result, null, 2)}`);
      }
    } catch (err) {
      alert(`❌ Test fallido: ${err.message}`);
    }
  };

  const clearCache = async () => {
    try {
      const response = await fetch(`${LARAVEL_BASE_URL}/api/variables/cache/clear`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'X-CSRF-TOKEN': getCSRFToken()
        }
      });

      if (response.ok) {
        alert('✅ Cache limpiado');
        loadResolvedVariables();
      }
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // ===================================================================
  // UTILITIES
  // ===================================================================

  const getCSRFToken = () => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  };

  const formatVariableValue = (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getTypeColor = (type) => {
    const colors = {
      static: 'bg-blue-100 text-blue-800',
      dynamic: 'bg-green-100 text-green-800',
      external: 'bg-purple-100 text-purple-800',
      computed: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Variable Manager</h1>
        <p className="text-gray-600">Gestiona las variables dinámicas de tu sistema</p>
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 items-center">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas las categorías</option>
              <option value="site">Site</option>
              <option value="company">Company</option>
              <option value="system">System</option>
              <option value="custom">Custom</option>
            </select>
            
            <button
              onClick={loadVariables}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Cargando...' : '🔄 Recargar'}
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={testVariableSystem}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              🧪 Test Sistema
            </button>
            
            <button
              onClick={clearCache}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              🗑️ Limpiar Cache
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lista de Variables */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Variables ({variables.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Cargando variables...</p>
              </div>
            ) : variables.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="mb-4">📦</div>
                <p>No hay variables en esta categoría.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {variables.map((variable) => (
                  <div key={variable.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {variable.key}
                          </code>
                          <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(variable.type)}`}>
                            {variable.type}
                          </span>
                          {variable.category && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              {variable.category}
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          {variable.description || 'Sin descripción'}
                        </div>
                        
                        <div className="text-sm bg-gray-50 p-2 rounded font-mono">
                          {formatVariableValue(variable.value).substring(0, 100)}
                          {formatVariableValue(variable.value).length > 100 && '...'}
                        </div>
                        
                        <div className="text-xs text-gray-400 mt-2">
                          Actualizado: {variable.updated_at ? new Date(variable.updated_at).toLocaleString() : 'N/A'}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {variable.type === 'dynamic' && (
                          <button
                            onClick={() => refreshVariable(variable.id)}
                            className="text-green-600 hover:text-green-900 text-sm"
                            title="Refrescar variable dinámica"
                          >
                            🔄
                          </button>
                        )}
                        <button
                          onClick={() => deleteVariable(variable.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                          title="Eliminar variable"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel de Creación + Variables Resueltas */}
        <div className="space-y-6">
          
          {/* Crear Nueva Variable */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear Variable</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key:</label>
                <input
                  type="text"
                  value={newVariable.key}
                  onChange={(e) => setNewVariable({...newVariable, key: e.target.value})}
                  placeholder="site.name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value:</label>
                <textarea
                  value={newVariable.value}
                  onChange={(e) => setNewVariable({...newVariable, value: e.target.value})}
                  placeholder="Mi Sitio Web"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo:</label>
                  <select
                    value={newVariable.type}
                    onChange={(e) => setNewVariable({...newVariable, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="static">Static</option>
                    <option value="dynamic">Dynamic</option>
                    <option value="external">External</option>
                    <option value="computed">Computed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría:</label>
                  <select
                    value={newVariable.category}
                    onChange={(e) => setNewVariable({...newVariable, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="custom">Custom</option>
                    <option value="site">Site</option>
                    <option value="company">Company</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción:</label>
                <input
                  type="text"
                  value={newVariable.description}
                  onChange={(e) => setNewVariable({...newVariable, description: e.target.value})}
                  placeholder="Descripción de la variable"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <button
                onClick={createVariable}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                ➕ Crear Variable
              </button>
            </div>
          </div>

          {/* Variables Resueltas */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Variables Resueltas</h3>
            
            {Object.keys(resolvedVariables).length === 0 ? (
              <p className="text-gray-500 text-sm">No hay variables resueltas</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(resolvedVariables).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <code className="text-blue-600">{key}:</code>
                    <div className="text-gray-600 ml-2 break-all">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  title: 'Admin/Variable Manager',
  component: VariableManager,
  parameters: {
    docs: {
      description: {
        component: 'Gestor completo de variables dinámicas integrado con tu VariableController de Laravel. Permite crear, editar, eliminar y probar variables desde Storybook.'
      }
    },
    layout: 'fullscreen'
  }
};

export const Dashboard = {
  render: () => <VariableManager />
};