// ===================================================================
// resources/js/block-builder/components/VariablesDebugPanel.jsx
// Panel de debug para gestionar variables y preview
// ===================================================================

import { useState, useEffect } from 'preact/hooks';

const VariablesDebugPanel = ({ onForceRefresh }) => {
    const [variables, setVariables] = useState({});
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    // ===================================================================
    // CARGAR VARIABLES AL MONTAR
    // ===================================================================

    useEffect(() => {
        loadVariables();
        
        // Listener para cambios en variables
        const handleVariableChange = (event) => {
            console.log('🔄 Variable changed, reloading...', event.detail);
            loadVariables();
        };
        
        window.addEventListener('variableChanged', handleVariableChange);
        window.addEventListener('variablesForceRefresh', handleVariableChange);
        
        return () => {
            window.removeEventListener('variableChanged', handleVariableChange);
            window.removeEventListener('variablesForceRefresh', handleVariableChange);
        };
    }, []);

    // ===================================================================
    // FUNCIONES PRINCIPALES
    // ===================================================================

    const loadVariables = async () => {
        try {
            setLoading(true);
            const variablesPlugin = window.pluginManager?.get('variables');
            
            if (variablesPlugin) {
                const allVars = variablesPlugin.getAllVariables();
                setVariables(allVars);
                console.log('📦 Variables loaded:', allVars);
            } else {
                console.warn('⚠️ Variables plugin not found');
            }
        } catch (error) {
            console.error('❌ Error loading variables:', error);
        } finally {
            setLoading(false);
        }
    };

    const testVariableProcessing = async () => {
        const testContent = `
        <div>
            <h1>{{site.name}}</h1>
            <p>Fecha: {{current.date}}</p>
            <p>Hora: {{current.time}}</p>
            <p>Usuario: {{user.name}}</p>
            <p>Email: {{user.email}}</p>
        </div>
        `;

        try {
            setLoading(true);
            
            // Test con el hook de preview
            if (window.debugIntegratedPreview?.testVariables) {
                const result = await window.debugIntegratedPreview.testVariables(testContent);
                setTestResult(result);
                console.log('🎯 Test result:', result);
            } else {
                // Fallback al plugin directo
                const variablesPlugin = window.pluginManager?.get('variables');
                if (variablesPlugin) {
                    const result = variablesPlugin.processContent(testContent);
                    setTestResult(result);
                    console.log('🎯 Test result (direct):', result);
                }
            }
        } catch (error) {
            console.error('❌ Error testing variables:', error);
            setTestResult(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const refreshDatabase = async () => {
        try {
            setLoading(true);
            
            if (window.variablesAdmin?.refreshAll) {
                await window.variablesAdmin.refreshAll();
                console.log('✅ Database refreshed');
            }
            
            // Forzar refresh del preview
            if (onForceRefresh) {
                onForceRefresh();
            }
            
            // Recargar variables
            await loadVariables();
            
        } catch (error) {
            console.error('❌ Error refreshing database:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearAllCaches = () => {
        try {
            // Limpiar cache del preview
            if (window.debugIntegratedPreview?.clearCache) {
                window.debugIntegratedPreview.clearCache();
            }
            
            // Limpiar cache de variables
            if (window.debugVariablesPreview?.invalidateCache) {
                window.debugVariablesPreview.invalidateCache();
            }
            
            // Forzar refresh
            if (window.variablesAdmin?.forcePreviewRefresh) {
                window.variablesAdmin.forcePreviewRefresh();
            }
            
            console.log('🗑️ All caches cleared');
        } catch (error) {
            console.error('❌ Error clearing caches:', error);
        }
    };

    const testApiConnection = async () => {
        try {
            setLoading(true);
            
            if (window.variablesAdmin?.getAll) {
                const dbVariables = await window.variablesAdmin.getAll();
                console.log('📊 Database variables:', dbVariables);
                setTestResult(JSON.stringify(dbVariables, null, 2));
            }
            
        } catch (error) {
            console.error('❌ Error testing API:', error);
            setTestResult(`API Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ===================================================================
    // RENDERIZAR VARIABLES
    // ===================================================================

    const renderVariables = () => {
        return Object.entries(variables).map(([providerName, provider]) => (
            <div key={providerName} className="mb-4 p-3 border rounded">
                <h4 className="font-bold text-sm mb-2">
                    📦 {provider.title || providerName}
                    <span className="ml-2 text-xs text-gray-500">
                        (Prioridad: {provider.priority || 50})
                    </span>
                </h4>
                
                {provider.error ? (
                    <div className="text-red-600 text-xs">
                        ❌ Error: {provider.error}
                    </div>
                ) : (
                    <div className="space-y-1">
                        {Object.entries(provider.variables || {}).map(([key, value]) => (
                            <div key={key} className="flex text-xs">
                                <span className="font-mono text-blue-600 w-32 truncate">
                                    {key}
                                </span>
                                <span className="text-gray-700 flex-1 truncate">
                                    {String(value)}
                                </span>
                            </div>
                        ))}
                        {Object.keys(provider.variables || {}).length === 0 && (
                            <div className="text-gray-500 text-xs italic">
                                Sin variables
                            </div>
                        )}
                    </div>
                )}
            </div>
        ));
    };

    // No renderizar en producción
    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Botón para mostrar/ocultar */}
            <button
                onClick={() => setIsVisible(!isVisible)}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-blue-700 transition-colors"
                title="Debug Variables"
            >
                🎯 Variables
            </button>

            {/* Panel de debug */}
            {isVisible && (
                <div className="absolute bottom-12 right-0 w-96 max-h-96 bg-white border shadow-xl rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                        <h3 className="font-bold text-sm">Variables Debug Panel</h3>
                        <button
                            onClick={() => setIsVisible(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="p-4 overflow-y-auto max-h-80">
                        {/* Controles principales */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                onClick={loadVariables}
                                disabled={loading}
                                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                                🔄 Recargar
                            </button>
                            
                            <button
                                onClick={refreshDatabase}
                                disabled={loading}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                            >
                                💾 Refresh DB
                            </button>
                            
                            <button
                                onClick={clearAllCaches}
                                disabled={loading}
                                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                            >
                                🗑️ Clear Cache
                            </button>
                            
                            <button
                                onClick={testVariableProcessing}
                                disabled={loading}
                                className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 disabled:opacity-50"
                            >
                                🧪 Test
                            </button>
                        </div>

                        <button
                            onClick={testApiConnection}
                            disabled={loading}
                            className="w-full bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 disabled:opacity-50 mb-4"
                        >
                            📡 Test API
                        </button>

                        {loading && (
                            <div className="text-center py-2 text-sm text-gray-500">
                                ⏳ Cargando...
                            </div>
                        )}

                        {/* Lista de variables */}
                        <div className="space-y-2">
                            <h4 className="font-bold text-sm border-b pb-1">
                                Variables Disponibles ({Object.keys(variables).length})
                            </h4>
                            {renderVariables()}
                        </div>

                        {/* Resultado de prueba */}
                        {testResult && (
                            <div className="mt-4">
                                <h4 className="font-bold text-sm mb-2">Resultado de Prueba:</h4>
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                                    {testResult}
                                </pre>
                            </div>
                        )}

                        {/* Comandos de consola */}
                        <div className="mt-4 p-2 bg-gray-100 rounded">
                            <h5 className="font-bold text-xs mb-1">Comandos de Consola:</h5>
                            <div className="text-xs font-mono space-y-1">
                                <div>debugVariables.showVariables()</div>
                                <div>debugVariables.testDatabase()</div>
                                <div>debugIntegratedPreview.testVariables()</div>
                                <div>variablesAdmin.refreshAll()</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariablesDebugPanel;