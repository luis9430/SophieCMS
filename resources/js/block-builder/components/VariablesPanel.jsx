// ===================================================================
// resources/js/block-builder/components/VariablesPanel.jsx
// Panel de Variables para el Page Builder
// ===================================================================

import { useState, useEffect, useCallback } from 'preact/hooks';

const VariablesPanel = ({ visible = false, onClose, onInsertVariable }) => {
    const [variables, setVariables] = useState({});
    const [expandedSections, setExpandedSections] = useState({
        user: true,
        site: false,
        app: false,
        current: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Cargar variables disponibles
    useEffect(() => {
        if (visible) {
            loadVariables();
        }
    }, [visible]);

    const loadVariables = useCallback(async () => {
        setLoading(true);
        try {
            // Obtener variables del plugin
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin && variablesPlugin.getAvailableVariables) {
                const availableVars = variablesPlugin.getAvailableVariables();
                setVariables(availableVars);
            } else {
                // Fallback con variables básicas
                setVariables({
                    user: {
                        title: '👤 Usuario',
                        variables: {
                            'user.name': 'Usuario Demo',
                            'user.email': 'usuario@demo.com'
                        }
                    },
                    site: {
                        title: '🎨 Sitio',
                        variables: {
                            'site.title': 'Mi Sitio Web',
                            'site.url': window.location.origin
                        }
                    },
                    current: {
                        title: '🕒 Fecha/Hora',
                        variables: {
                            'current.date': new Date().toLocaleDateString('es-ES'),
                            'current.time': new Date().toLocaleTimeString('es-ES')
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading variables:', error);
        } finally {
            setLoading(false);
        }
    }, []);

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
        // No cerrar automáticamente para permitir insertar múltiples variables
    }, [onInsertVariable]);

    // Filtrar variables según búsqueda
    const filteredVariables = Object.entries(variables).reduce((acc, [categoryKey, category]) => {
        if (!searchTerm) {
            acc[categoryKey] = category;
            return acc;
        }

        const matchingVars = Object.entries(category.variables).filter(([path, value]) => {
            const pathMatches = path.toLowerCase().includes(searchTerm.toLowerCase());
            const valueMatches = String(value).toLowerCase().includes(searchTerm.toLowerCase());
            return pathMatches || valueMatches;
        });

        if (matchingVars.length > 0) {
            acc[categoryKey] = {
                ...category,
                variables: Object.fromEntries(matchingVars)
            };
        }

        return acc;
    }, {});

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            🎯
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Variables Disponibles</h2>
                            <p className="text-sm text-gray-600">Haz clic para insertar en tu código</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar variables..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                            <span className="ml-3 text-gray-600">Cargando variables...</span>
                        </div>
                    ) : Object.keys(filteredVariables).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="text-4xl mb-4">🔍</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {searchTerm ? 'Sin resultados' : 'No hay variables disponibles'}
                            </h3>
                            <p className="text-gray-600 text-center">
                                {searchTerm 
                                    ? `No se encontraron variables que coincidan con "${searchTerm}"`
                                    : 'Las variables aparecerán aquí cuando estén disponibles'
                                }
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    Limpiar búsqueda
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {Object.entries(filteredVariables).map(([categoryKey, category]) => (
                                <div key={categoryKey} className="p-4">
                                    {/* Category Header */}
                                    <button
                                        onClick={() => toggleSection(categoryKey)}
                                        className="flex items-center justify-between w-full text-left p-2 hover:bg-gray-50 rounded-md transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{category.title}</span>
                                            <span className="text-sm text-gray-500">
                                                ({Object.keys(category.variables).length} variables)
                                            </span>
                                        </div>
                                        <svg 
                                            className={`w-4 h-4 transition-transform ${expandedSections[categoryKey] ? 'rotate-90' : ''}`}
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>

                                    {/* Variables List */}
                                    {expandedSections[categoryKey] && (
                                        <div className="mt-3 space-y-2">
                                            {Object.entries(category.variables).map(([variablePath, value]) => (
                                                <div
                                                    key={variablePath}
                                                    onClick={() => handleInsertVariable(variablePath)}
                                                    className="group cursor-pointer bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-md p-3 transition-all"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                                                    {`{{ ${variablePath} }}`}
                                                                </code>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        navigator.clipboard.writeText(`{{ ${variablePath} }}`);
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-all"
                                                                    title="Copiar al portapapeles"
                                                                >
                                                                    📋
                                                                </button>
                                                            </div>
                                                            <div className="mt-1 text-sm text-gray-600">
                                                                <span className="font-medium">Valor actual:</span> {String(value)}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            💡 <span className="font-medium">Tip:</span> Las variables se actualizan automáticamente en el preview
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    Object.keys(variables).forEach(key => {
                                        setExpandedSections(prev => ({ ...prev, [key]: true }));
                                    });
                                }}
                                className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                            >
                                Expandir todo
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
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