// resources/js/block-builder/plugins/variables/ui/VariableManager.jsx

import { useState, useEffect } from 'preact/hooks';

export default function VariableManager() {
    const [variables, setVariables] = useState([]);
    const [categories, setCategories] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showEditor, setShowEditor] = useState(false);
    const [editingVariable, setEditingVariable] = useState(null);
    const [refreshing, setRefreshing] = useState(new Set());

    // ===================================================================
    // CARGAR DATOS
    // ===================================================================

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [variablesData, categoriesData] = await Promise.all([
                window.variablesAdmin.getAll(),
                window.variablesAdmin.getCategories()
            ]);
            
            setVariables(variablesData);
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Error al cargar variables');
        } finally {
            setLoading(false);
        }
    };

    // ===================================================================
    // FILTROS Y BÚSQUEDA
    // ===================================================================

    const filteredVariables = variables.filter(variable => {
        const matchesCategory = selectedCategory === 'all' || variable.category === selectedCategory;
        const matchesType = selectedType === 'all' || variable.type === selectedType;
        const matchesSearch = !searchQuery || 
            variable.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (variable.description && variable.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesCategory && matchesType && matchesSearch;
    });

    // ===================================================================
    // ACCIONES
    // ===================================================================

    const handleCreate = () => {
        setEditingVariable(null);
        setShowEditor(true);
    };

    const handleEdit = (variable) => {
        setEditingVariable(variable);
        setShowEditor(true);
    };

    const handleDelete = async (variable) => {
        if (!confirm(`¿Estás seguro de eliminar la variable "${variable.key}"?`)) {
            return;
        }

        try {
            await window.variablesAdmin.delete(variable.id);
            await loadData(); // Recargar datos
            alert('Variable eliminada correctamente');
        } catch (error) {
            console.error('Error deleting variable:', error);
            alert('Error al eliminar la variable');
        }
    };

    const handleRefresh = async (variable) => {
        setRefreshing(prev => new Set(prev).add(variable.id));
        
        try {
            await window.variablesAdmin.refresh(variable.id);
            await loadData(); // Recargar para mostrar nuevo valor
        } catch (error) {
            console.error('Error refreshing variable:', error);
            alert('Error al refrescar la variable');
        } finally {
            setRefreshing(prev => {
                const newSet = new Set(prev);
                newSet.delete(variable.id);
                return newSet;
            });
        }
    };

    const handleSave = async () => {
        await loadData(); // Recargar después de guardar
        setShowEditor(false);
    };

    // ===================================================================
    // UTILIDADES
    // ===================================================================

    const getVariableStatus = (variable) => {
        if (!variable.is_active) {
            return { status: 'inactive', color: 'bg-gray-100 text-gray-600', label: 'Inactiva' };
        }
        if (variable.last_error) {
            return { status: 'error', color: 'bg-red-100 text-red-600', label: 'Error' };
        }
        const isExpired = variable.cache_ttl && variable.last_refreshed_at && 
            new Date(variable.last_refreshed_at).getTime() + (variable.cache_ttl * 1000) < Date.now();
        if (isExpired) {
            return { status: 'expired', color: 'bg-yellow-100 text-yellow-600', label: 'Expirada' };
        }
        return { status: 'active', color: 'bg-green-100 text-green-600', label: 'Activa' };
    };

    const formatValue = (value) => {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'object') return JSON.stringify(value);
        const str = String(value);
        return str.length > 50 ? str.substring(0, 47) + '...' : str;
    };

    const getCategoryInfo = (categoryKey) => {
        return categories[categoryKey] || { name: categoryKey, icon: '📁', color: '#6B7280' };
    };

    // ===================================================================
    // RENDER
    // ===================================================================

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando variables...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="variables-manager p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        🔧 Gestor de Variables
                    </h1>
                    <button
                        onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                    >
                        <span>➕</span>
                        <span>Nueva Variable</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg border">
                    {/* Search */}
                    <div className="flex-1 min-w-64">
                        <input
                            type="text"
                            placeholder="Buscar variables..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todas las categorías</option>
                        {Object.entries(categories).map(([key, category]) => (
                            <option key={key} value={key}>
                                {category.icon} {category.name}
                            </option>
                        ))}
                    </select>

                    {/* Type Filter */}
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos los tipos</option>
                        <option value="static">📄 Estática</option>
                        <option value="dynamic">🔄 Dinámica</option>
                        <option value="external">🌍 Externa</option>
                        <option value="computed">⚡ Computada</option>
                    </select>

                    {/* Refresh All */}
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-50"
                    >
                        🔄 Actualizar
                    </button>
                </div>
            </div>

            {/* Variables Grid */}
            {filteredVariables.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                    <div className="text-gray-400 text-4xl mb-4">📝</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay variables</h3>
                    <p className="text-gray-600 mb-4">
                        {searchQuery || selectedCategory !== 'all' || selectedType !== 'all' 
                            ? 'No se encontraron variables con los filtros aplicados.'
                            : 'Comienza creando tu primera variable.'
                        }
                    </p>
                    <button
                        onClick={handleCreate}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                    >
                        ➕ Crear Variable
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredVariables.map((variable) => {
                        const status = getVariableStatus(variable);
                        const categoryInfo = getCategoryInfo(variable.category);
                        const isRefreshing = refreshing.has(variable.id);

                        return (
                            <div key={variable.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        {/* Header */}
                                        <div className="flex items-center space-x-3 mb-2">
                                            <span 
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                                style={{ backgroundColor: categoryInfo.color + '20', color: categoryInfo.color }}
                                            >
                                                {categoryInfo.icon} {categoryInfo.name}
                                            </span>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                {status.label}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase tracking-wide">
                                                {variable.type}
                                            </span>
                                        </div>

                                        {/* Key and Description */}
                                        <div className="mb-2">
                                            <h3 className="text-lg font-mono font-medium text-gray-900">
                                                {variable.key}
                                            </h3>
                                            {variable.description && (
                                                <p className="text-sm text-gray-600">
                                                    {variable.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Value */}
                                        <div className="mb-2">
                                            <div className="text-sm text-gray-600">Valor:</div>
                                            <div className="font-mono text-sm bg-gray-50 p-2 rounded border">
                                                {formatValue(variable.resolved_value || variable.value)}
                                            </div>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            {variable.last_refreshed_at && (
                                                <span>
                                                    Actualizada: {new Date(variable.last_refreshed_at).toLocaleString()}
                                                </span>
                                            )}
                                            {variable.cache_ttl && (
                                                <span>
                                                    TTL: {variable.cache_ttl}s
                                                </span>
                                            )}
                                        </div>

                                        {/* Error */}
                                        {variable.last_error && (
                                            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                                                ⚠️ {variable.last_error}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-2 ml-4">
                                        {variable.type !== 'static' && (
                                            <button
                                                onClick={() => handleRefresh(variable)}
                                                disabled={isRefreshing}
                                                className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-50"
                                                title="Refrescar"
                                            >
                                                <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleEdit(variable)}
                                            className="p-2 text-gray-400 hover:text-blue-600"
                                            title="Editar"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(variable)}
                                            className="p-2 text-gray-400 hover:text-red-600"
                                            title="Eliminar"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Variable Editor Modal */}
            {showEditor && (
                <VariableEditor
                    variable={editingVariable}
                    categories={categories}
                    onSave={handleSave}
                    onCancel={() => setShowEditor(false)}
                />
            )}
        </div>
    );
}

// ===================================================================
// VARIABLE EDITOR COMPONENT
// ===================================================================

function VariableEditor({ variable, categories, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        key: '',
        value: '',
        type: 'static',
        category: 'custom',
        description: '',
        cache_ttl: null,
        refresh_strategy: 'manual',
        config: {},
        is_active: true,
        ...variable
    });
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            if (variable) {
                await window.variablesAdmin.update(variable.id, formData);
            } else {
                await window.variablesAdmin.create(formData);
            }
            onSave();
        } catch (error) {
            console.error('Error saving variable:', error);
            alert('Error al guardar la variable');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        try {
            const result = await window.variablesAdmin.test({
                type: formData.type,
                value: formData.value,
                config: formData.config
            });
            setTestResult(result);
        } catch (error) {
            setTestResult({ success: false, error: error.message });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                    {variable ? '✏️ Editar Variable' : '➕ Nueva Variable'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Key */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Clave (Key) *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.key}
                            onChange={(e) => setFormData({...formData, key: e.target.value})}
                            placeholder="site.company_name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Type and Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo *
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="static">📄 Estática</option>
                                <option value="dynamic">🔄 Dinámica</option>
                                <option value="external">🌍 Externa</option>
                                <option value="computed">⚡ Computada</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categoría *
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {Object.entries(categories).map(([key, category]) => (
                                    <option key={key} value={key}>
                                        {category.icon} {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Descripción de la variable..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Value (for static) */}
                    {formData.type === 'static' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Valor *
                            </label>
                            <textarea
                                required
                                value={formData.value}
                                onChange={(e) => setFormData({...formData, value: e.target.value})}
                                placeholder="Valor de la variable..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* Config (for non-static) */}
                    {formData.type !== 'static' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Configuración (JSON) *
                            </label>
                            <textarea
                                required
                                value={JSON.stringify(formData.config, null, 2)}
                                onChange={(e) => {
                                    try {
                                        const config = JSON.parse(e.target.value);
                                        setFormData({...formData, config});
                                    } catch {
                                        // Ignore JSON parse errors while typing
                                    }
                                }}
                                placeholder={`{
  "url": "https://api.example.com/data",
  "method": "GET",
  "headers": {},
  "transform": "data.result"
}`}
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            />
                        </div>
                    )}

                    {/* Cache TTL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cache TTL (segundos)
                        </label>
                        <input
                            type="number"
                            value={formData.cache_ttl || ''}
                            onChange={(e) => setFormData({...formData, cache_ttl: e.target.value ? parseInt(e.target.value) : null})}
                            placeholder="3600 (null = infinito)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Test Section */}
                    {formData.type !== 'static' && (
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-700">🧪 Probar Configuración</h3>
                                <button
                                    type="button"
                                    onClick={handleTest}
                                    disabled={testing}
                                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm disabled:opacity-50"
                                >
                                    {testing ? '🔄 Probando...' : '🧪 Probar'}
                                </button>
                            </div>
                            {testResult && (
                                <div className={`text-sm p-2 rounded ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {testResult.success ? (
                                        <div>
                                            <div>✅ Prueba exitosa</div>
                                            <div className="font-mono text-xs mt-1">
                                                Resultado: {JSON.stringify(testResult.result)}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>❌ {testResult.error}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                        >
                            {saving ? '💾 Guardando...' : '💾 Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export { VariableEditor };