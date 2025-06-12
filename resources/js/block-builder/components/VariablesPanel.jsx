// ===================================================================
// resources/js/block-builder/components/VariablesPanel.jsx - VERSIÓN MEJORADA
// ===================================================================

import { useState, useEffect, useCallback, useMemo } from 'preact/hooks';

const VariablesPanel = ({ visible = false, onClose, onInsertVariable }) => {
    const [variables, setVariables] = useState({});
    const [expandedSections, setExpandedSections] = useState({
        system: true,
        user: true,
        site: false,
        templates: false,
        current: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showOnlyUsed, setShowOnlyUsed] = useState(false);
    const [recentVariables, setRecentVariables] = useState([]);
    const [previewValues, setPreviewValues] = useState({});

    // ===================================================================
    // CARGAR VARIABLES
    // ===================================================================

    const loadVariables = useCallback(async () => {
        setLoading(true);
        try {
            // Obtener variables del plugin
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin && variablesPlugin.getAvailableVariables) {
                const availableVars = variablesPlugin.getAvailableVariables();
                setVariables(availableVars);
                
                // Cargar valores en tiempo real para preview
                await loadPreviewValues(availableVars);
            } else {
                // Fallback con variables básicas mejoradas
                const fallbackVars = createFallbackVariables();
                setVariables(fallbackVars);
                await loadPreviewValues(fallbackVars);
            }
            
            // Cargar variables recientes
            loadRecentVariables();
            
        } catch (error) {
            console.error('Error loading variables:', error);
            setVariables(createFallbackVariables());
        } finally {
            setLoading(false);
        }
    }, []);

 

    const loadPreviewValues = async (vars) => {
        const values = {};
        
        Object.entries(vars).forEach(([categoryKey, category]) => {
            Object.entries(category.variables).forEach(([path, value]) => {
                // Si es una variable de tiempo, calcularla en tiempo real
                if (path.startsWith('current.')) {
                    values[path] = getCurrentTimeValue(path);
                } else {
                    values[path] = value;
                }
            });
        });
        
        setPreviewValues(values);
    };

    const getCurrentTimeValue = (path) => {
        const now = new Date();
        const timeValues = {
            'current.time': now.toLocaleTimeString('es-ES'),
            'current.date': now.toLocaleDateString('es-ES'),
            'current.datetime': now.toLocaleString('es-ES'),
            'current.year': now.getFullYear(),
            'current.month': now.toLocaleDateString('es-ES', { month: 'long' }),
            'current.day': now.getDate(),
            'current.weekday': now.toLocaleDateString('es-ES', { weekday: 'long' }),
            'current.timestamp': now.getTime(),
            'current.iso': now.toISOString()
        };
        return timeValues[path] || now.toLocaleString('es-ES');
    };

    const loadRecentVariables = () => {
        try {
            const recent = JSON.parse(localStorage.getItem('recentVariables') || '[]');
            setRecentVariables(recent.slice(0, 5));
        } catch (error) {
            console.warn('Error loading recent variables:', error);
        }
    };

    // ===================================================================
    // EFECTOS
    // ===================================================================

    useEffect(() => {
        if (visible) {
            loadVariables();
            
            // Auto-refresh para variables de tiempo
            const interval = setInterval(() => {
                setPreviewValues(prev => {
                    const updated = { ...prev };
                    Object.keys(updated).forEach(path => {
                        if (path.startsWith('current.')) {
                            updated[path] = getCurrentTimeValue(path);
                        }
                    });
                    return updated;
                });
            }, 1000);
            
            return () => clearInterval(interval);
        }
    }, [visible, loadVariables]);

    // ===================================================================
    // FILTRADO Y BÚSQUEDA
    // ===================================================================

    const filteredVariables = useMemo(() => {
        let filtered = { ...variables };
        
        // Filtrar por categoría
        if (selectedCategory !== 'all') {
            filtered = { [selectedCategory]: variables[selectedCategory] };
        }
        
        // Filtrar por búsqueda
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            Object.keys(filtered).forEach(categoryKey => {
                const category = filtered[categoryKey];
                const matchingVars = {};
                
                Object.entries(category.variables).forEach(([path, value]) => {
                    const pathMatches = path.toLowerCase().includes(searchLower);
                    const valueMatches = String(value).toLowerCase().includes(searchLower);
                    
                    if (pathMatches || valueMatches) {
                        matchingVars[path] = value;
                    }
                });
                
                if (Object.keys(matchingVars).length > 0) {
                    filtered[categoryKey] = {
                        ...category,
                        variables: matchingVars
                    };
                } else {
                    delete filtered[categoryKey];
                }
            });
        }
        
        // Filtrar solo variables usadas (si está activado)
        if (showOnlyUsed && recentVariables.length > 0) {
            Object.keys(filtered).forEach(categoryKey => {
                const category = filtered[categoryKey];
                const usedVars = {};
                
                Object.entries(category.variables).forEach(([path, value]) => {
                    if (recentVariables.includes(path)) {
                        usedVars[path] = value;
                    }
                });
                
                if (Object.keys(usedVars).length > 0) {
                    filtered[categoryKey] = {
                        ...category,
                        variables: usedVars
                    };
                } else {
                    delete filtered[categoryKey];
                }
            });
        }
        
        return filtered;
    }, [variables, selectedCategory, searchTerm, showOnlyUsed, recentVariables]);

    // ===================================================================
    // ESTADÍSTICAS
    // ===================================================================

    const stats = useMemo(() => {
        const totalCategories = Object.keys(variables).length;
        const totalVariables = Object.values(variables).reduce(
            (sum, category) => sum + Object.keys(category.variables).length, 
            0
        );
        const filteredTotal = Object.values(filteredVariables).reduce(
            (sum, category) => sum + Object.keys(category.variables).length, 
            0
        );
        
        return {
            totalCategories,
            totalVariables,
            filteredTotal,
            recentCount: recentVariables.length
        };
    }, [variables, filteredVariables, recentVariables]);

    // ===================================================================
    // FUNCIONES DE INTERACCIÓN
    // ===================================================================

    const toggleSection = useCallback((sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    }, []);

    const handleInsertVariable = useCallback((variablePath) => {
        const formattedVariable = `{{ ${variablePath} }}`;
        
        if (onInsertVariable) {
            onInsertVariable(formattedVariable, variablePath);
        }
        
        // Actualizar variables recientes
        const updated = [variablePath, ...recentVariables.filter(v => v !== variablePath)].slice(0, 10);
        setRecentVariables(updated);
        localStorage.setItem('recentVariables', JSON.stringify(updated));
        
        console.log(`✅ Variable insertada: ${formattedVariable}`);
    }, [onInsertVariable, recentVariables]);

    const copyVariable = useCallback((variablePath) => {
        const formattedVariable = `{{ ${variablePath} }}`;
        navigator.clipboard.writeText(formattedVariable).then(() => {
            console.log(`📋 Variable copiada: ${formattedVariable}`);
            // Mostrar feedback visual (opcional)
        });
    }, []);

    const expandAllSections = useCallback(() => {
        const newExpanded = {};
        Object.keys(variables).forEach(key => {
            newExpanded[key] = true;
        });
        setExpandedSections(newExpanded);
    }, [variables]);

    const collapseAllSections = useCallback(() => {
        const newExpanded = {};
        Object.keys(variables).forEach(key => {
            newExpanded[key] = false;
        });
        setExpandedSections(newExpanded);
    }, [variables]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
        setSelectedCategory('all');
        setShowOnlyUsed(false);
    }, []);

    // ===================================================================
    // FUNCIONES DE RENDERIZADO
    // ===================================================================

    const renderVariableItem = (variablePath, value, categoryKey) => {
        const isRecent = recentVariables.includes(variablePath);
        const previewValue = previewValues[variablePath] ?? value;
        const isTimeVariable = variablePath.startsWith('current.');
        
        return (
            <div
                key={variablePath}
                onClick={() => handleInsertVariable(variablePath)}
                className="group cursor-pointer bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-md p-3 transition-all duration-200"
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded font-medium">
                                {`{{ ${variablePath} }}`}
                            </code>
                            
                            {isRecent && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                    Reciente
                                </span>
                            )}
                            
                            {isTimeVariable && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium animate-pulse">
                                    🕒 Live
                                </span>
                            )}
                            
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyVariable(variablePath);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-all duration-200"
                                title="Copiar al portapapeles"
                            >
                                📋
                            </button>
                        </div>
                        
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Valor:</span> 
                            <span className={`ml-1 ${isTimeVariable ? 'font-mono text-green-600' : ''}`}>
                                {formatValueForDisplay(previewValue)}
                            </span>
                        </div>
                        
                        {typeof previewValue === 'boolean' && (
                            <div className="text-xs text-gray-500 mt-1">
                                Tipo: Booleano
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </div>
                </div>
            </div>
        );
    };

    const formatValueForDisplay = (value) => {
        if (value === null || value === undefined) return 'null';
        if (typeof value === 'boolean') return value ? '✅ true' : '❌ false';
        if (typeof value === 'number') return value.toLocaleString();
        if (typeof value === 'object') return JSON.stringify(value, null, 2);
        
        const str = String(value);
        return str.length > 50 ? str.substring(0, 50) + '...' : str;
    };

    const getCategoryIcon = (categoryKey) => {
        const icons = {
            system: '⚙️',
            user: '👤',
            site: '🎨',
            current: '🕒',
            templates: '📝',
            app: '📱',
            custom: '🔧'
        };
        return icons[categoryKey] || '📁';
    };

    // ===================================================================
    // RENDER PRINCIPAL
    // ===================================================================

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            🎯
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Variables Disponibles</h2>
                            <p className="text-sm text-gray-600">
                                {stats.filteredTotal} de {stats.totalVariables} variables 
                                {searchTerm && ` • Buscando: "${searchTerm}"`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar variables..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Category Filter */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Todas las categorías</option>
                            {Object.entries(variables).map(([key, category]) => (
                                <option key={key} value={key}>
                                    {getCategoryIcon(key)} {category.title}
                                </option>
                            ))}
                        </select>

                        {/* Recent Filter */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showOnlyUsed}
                                onChange={(e) => setShowOnlyUsed(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Solo recientes ({stats.recentCount})</span>
                        </label>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                            <button
                                onClick={expandAllSections}
                                className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                                title="Expandir todo"
                            >
                                ⬇️
                            </button>
                            <button
                                onClick={collapseAllSections}
                                className="px-3 py-2 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                                title="Colapsar todo"
                            >
                                ⬆️
                            </button>
                            <button
                                onClick={clearSearch}
                                className="px-3 py-2 text-xs bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
                                title="Limpiar filtros"
                            >
                                🧹
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600">Cargando variables...</span>
                        </div>
                    ) : Object.keys(filteredVariables).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {searchTerm ? 'Sin resultados' : 'No hay variables disponibles'}
                            </h3>
                            <p className="text-gray-600 text-center max-w-md mb-6">
                                {searchTerm 
                                    ? `No se encontraron variables que coincidan con "${searchTerm}"`
                                    : 'Las variables aparecerán aquí cuando estén disponibles'
                                }
                            </p>
                            {(searchTerm || selectedCategory !== 'all' || showOnlyUsed) && (
                                <button
                                    onClick={clearSearch}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Variables recientes (si hay) */}
                            {recentVariables.length > 0 && selectedCategory === 'all' && !searchTerm && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                        🕒 Variables Recientes
                                        <span className="text-xs bg-green-200 px-2 py-1 rounded-full">
                                            {recentVariables.length}
                                        </span>
                                    </h4>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                        {recentVariables.slice(0, 4).map(variablePath => {
                                            // Encontrar la variable en las categorías
                                            let value = null;
                                            Object.values(variables).forEach(category => {
                                                if (category.variables[variablePath]) {
                                                    value = category.variables[variablePath];
                                                }
                                            });
                                            
                                            return (
                                                <div
                                                    key={variablePath}
                                                    onClick={() => handleInsertVariable(variablePath)}
                                                    className="cursor-pointer bg-white border border-green-300 hover:border-green-400 rounded p-2 transition-colors"
                                                >
                                                    <code className="text-xs text-green-700 font-mono">
                                                        {`{{ ${variablePath} }}`}
                                                    </code>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Categorías de variables */}
                            {Object.entries(filteredVariables)
                                .sort(([, a], [, b]) => (b.priority || 50) - (a.priority || 50))
                                .map(([categoryKey, category]) => (
                                <div key={categoryKey} className="border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleSection(categoryKey)}
                                        className="flex items-center justify-between w-full text-left p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">{getCategoryIcon(categoryKey)}</span>
                                            <div>
                                                <span className="font-semibold text-gray-900">{category.title}</span>
                                                <div className="text-sm text-gray-500">
                                                    {Object.keys(category.variables).length} variables
                                                    {category.priority && (
                                                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                            Prioridad: {category.priority}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <svg 
                                            className={`w-5 h-5 transition-transform ${expandedSections[categoryKey] ? 'rotate-90' : ''}`}
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    {/* Variables List */}
                                    {expandedSections[categoryKey] && (
                                        <div className="p-4 space-y-3 bg-white">
                                            {Object.entries(category.variables).map(([variablePath, value]) => 
                                                renderVariableItem(variablePath, value, categoryKey)
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                                <span>💡 <strong>Tip:</strong> Las variables se actualizan automáticamente en el preview</span>
                                <span>•</span>
                                <span>📊 <strong>Total:</strong> {stats.totalVariables} variables en {stats.totalCategories} categorías</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => loadVariables()}
                                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                                title="Recargar variables"
                            >
                                🔄 Recargar
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariablesPanel;