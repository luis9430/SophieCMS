// ===================================================================
// resources/js/block-builder/PageBuilder.jsx - CON ALPINE METHODS TAB
// ===================================================================

import { useState, useEffect, useCallback } from 'preact/hooks';
import IntegratedPageBuilderEditor from './components/IntegratedPageBuilderEditor';
import VariableManager from './plugins/variables/ui/VariableManager.jsx';
import AlpineMethodsTab from './plugins/alpine-methods/components/AlpineMethodsTab.jsx';
import { initializeCoreSystem } from './core/CoreSystemInitializer';

const PageBuilder = ({ content: initialContent, onContentChange }) => {
    const [isReady, setIsReady] = useState(false);
    const [editorContent, setEditorContent] = useState(initialContent || '');
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'variables' | 'alpine-methods'
    const [alpineMethodsPlugin, setAlpineMethodsPlugin] = useState(null);

    useEffect(() => {
        initializeCoreSystem().then(async () => {
            console.log("Block Builder Core Systems Initialized.");
            
            // EVITAR DOBLE INICIALIZACIÓN - Verificar primero si ya existe
            try {
                const { getAlpineMethodsPlugin, initializeAlpineMethodsPlugin } = await import('./plugins/alpine-methods/init.js');
                
                let plugin = getAlpineMethodsPlugin();
                
                if (!plugin) {
                    console.log('🔄 Inicializando Alpine Methods Plugin desde PageBuilder...');
                    plugin = await initializeAlpineMethodsPlugin();
                } else {
                    console.log('✅ Alpine Methods Plugin ya estaba disponible');
                }
                
                setAlpineMethodsPlugin(plugin);
                console.log('✅ Alpine Methods Plugin ready in PageBuilder');
            } catch (error) {
                console.warn('⚠️ Alpine Methods Plugin failed to initialize:', error);
                // No es crítico, continuar sin Alpine Methods
            }
            
            setIsReady(true);
            
            // Cache invalidation setup
            setTimeout(() => {
                setupSimpleCacheInvalidation();
            }, 1500);
        });
    }, []);

    // ===================================================================
    // FUNCIÓN: Setup simple de cache
    // ===================================================================
    const setupSimpleCacheInvalidation = () => {
        console.log('🔧 Setting up simple cache invalidation...');
        
        // Verificar disponibilidad del sistema
        if (!window.variablesAdmin || !window.pluginManager) {
            console.warn('⚠️ System not ready, retrying...');
            setTimeout(setupSimpleCacheInvalidation, 2000);
            return;
        }
        
        // Función central de refresh
        const refreshCache = async () => {
            try {
                console.log('🔄 Refreshing variable cache...');
                
                const variablesPlugin = window.pluginManager.get('variables');
                if (variablesPlugin && typeof variablesPlugin.loadProviders === 'function') {
                    await variablesPlugin.loadProviders();
                    console.log('✅ Variables plugin cache refreshed');
                } else {
                    console.warn('⚠️ Variables plugin not available for refresh');
                }
                
                // Refresh Alpine Methods cache if available
                if (alpineMethodsPlugin && typeof alpineMethodsPlugin.loadMethods === 'function') {
                    await alpineMethodsPlugin.loadMethods();
                    console.log('✅ Alpine Methods cache refreshed');
                }
                
                // Invalidar cache de autocompletado
                if (window.variableAutoComplete) {
                    window.variableAutoComplete.invalidateCache();
                }
                
                console.log('🎉 All caches refreshed successfully');
                
            } catch (error) {
                console.error('❌ Error refreshing cache:', error);
            }
        };

        // Función de test
        const testVariables = () => {
            const variablesPlugin = window.pluginManager.get('variables');
            if (variablesPlugin) {
                console.log('🧪 Testing variables system:');
                console.log('Variables:', variablesPlugin.getAllVariables());
                console.log('Keys:', variablesPlugin.getVariableKeys());
                console.log('Providers:', variablesPlugin.getProviders());
            }
        };

        // Función para obtener información del sistema
        const getSystemInfo = () => {
            const variablesPlugin = window.pluginManager.get('variables');
            
            return {
                timestamp: new Date().toISOString(),
                plugins: {
                    variables: !!variablesPlugin,
                    alpineMethods: !!alpineMethodsPlugin,
                    hasGetAllVariables: !!(variablesPlugin?.getAllVariables),
                    hasGetProvider: !!(variablesPlugin?.getProvider),
                    variableCount: variablesPlugin?.getVariableKeys?.()?.length || 0,
                    alpineMethodsCount: alpineMethodsPlugin?.getAllMethods?.()?.length || 0
                },
                admin: {
                    available: !!window.variablesAdmin,
                    methods: window.variablesAdmin ? Object.keys(window.variablesAdmin) : []
                },
                cache: {
                    refreshFunction: !!window.refreshVariables,
                    testFunction: !!window.testVariables
                }
            };
        };

        // Exponer funciones globalmente
        window.refreshVariables = refreshCache;
        window.testVariables = testVariables;
        window.getSystemInfo = getSystemInfo;
        
        console.log('✅ Simple cache setup complete');
        console.log('💡 Commands: refreshVariables(), testVariables(), getSystemInfo()');
    };
    
    const handleContentUpdate = useCallback((newContent) => {
        setEditorContent(newContent);
        if (onContentChange) {
            onContentChange(newContent);
        }
    }, [onContentChange]);

    // Alpine Methods handlers
    const handleAlpineMethodSave = useCallback(async (method) => {
        console.log('💾 Saving Alpine method:', method.name);
        try {
            if (alpineMethodsPlugin && typeof alpineMethodsPlugin.saveMethod === 'function') {
                return await alpineMethodsPlugin.saveMethod(method);
            } else {
                // Fallback: save via API
                const response = await fetch('/api/templates/alpine-methods', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        name: method.name,
                        description: method.description,
                        category: method.category,
                        trigger_syntax: `@${method.name}`,
                        method_template: method.inputCode,
                        method_parameters: method.parameters || {},
                        is_active: true
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const result = await response.json();
                if (!result.success) {
                    throw new Error(result.message || 'Failed to save method');
                }

                console.log('✅ Alpine method saved successfully');
                return result.data;
            }
        } catch (error) {
            console.error('❌ Error saving Alpine method:', error);
            alert(`Error guardando método: ${error.message}`);
            throw error;
        }
    }, [alpineMethodsPlugin]);

    const handleAlpineMethodLoad = useCallback((method) => {
        console.log('📄 Alpine method loaded:', method.name);
    }, []);

    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Loading Page Builder...</p>
                    <p className="text-gray-400 text-sm mt-2">Initializing core systems...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-builder-container h-screen flex flex-col bg-gray-50">
            {/* Header with Navigation */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm font-bold">PB</span>
                            </div>
                            <span>Page Builder</span>
                        </h1>
                        
                        {/* Tab Navigation - AGREGADA ALPINE METHODS */}
                        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('editor')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === 'editor'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                📝 Editor
                            </button>
                            <button
                                onClick={() => setActiveTab('variables')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === 'variables'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                🎯 Variables
                            </button>
                            {/* NUEVA TAB ALPINE METHODS */}
                            <button
                                onClick={() => setActiveTab('alpine-methods')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    activeTab === 'alpine-methods'
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                                title="Editor de métodos Alpine.js reutilizables"
                            >
                                ⚡ Alpine Methods
                            </button>
                        </nav>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                        {/* Botón de refresh manual */}
                        <button
                            onClick={() => window.refreshVariables?.()}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center space-x-1"
                            title="Refrescar variables y métodos desde base de datos"
                        >
                            <span>🔄</span>
                            <span>Refresh</span>
                        </button>
                        
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            💾 Save
                        </button>
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                            🚀 Publish
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Editor Tab */}
                {activeTab === 'editor' && (
                    <IntegratedPageBuilderEditor
                        initialContent={editorContent}
                        onContentChange={handleContentUpdate}
                    />
                )}
                
                {/* Variables Tab */}
                {activeTab === 'variables' && (
                    <div className="flex-1 p-6">
                        <VariableManager />
                    </div>
                )}

                {/* Alpine Methods Tab - NUEVO */}
                {activeTab === 'alpine-methods' && (
                    <AlpineMethodsTab
                        pluginInstance={alpineMethodsPlugin}
                        onSave={handleAlpineMethodSave}
                        onLoad={handleAlpineMethodLoad}
                    />
                )}
            </div>
            
            {/* Status bar con información de debugging */}
            {process.env.NODE_ENV === 'development' && (
                <footer className="bg-gray-800 text-white px-4 py-2 text-xs flex justify-between items-center">
                    <div className="flex space-x-4">
                        <span>🔧 Dev Mode</span>
                        <span>📦 Plugins: {window.pluginManager?.list?.()?.length || 0}</span>
                        <span>🎯 Variables: {window.pluginManager?.get?.('variables')?.getVariableKeys?.()?.length || 0}</span>
                        <span>⚡ Alpine Methods: {alpineMethodsPlugin?.getAllMethods?.()?.length || 0}</span>
                    </div>
                    <div className="flex space-x-2">
                        <button 
                            onClick={() => window.testVariables?.()}
                            className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
                            title="Probar sistema de variables"
                        >
                            Test Variables
                        </button>
                        <button 
                            onClick={() => window.refreshVariables?.()}
                            className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
                            title="Refrescar cache"
                        >
                            Refresh Cache
                        </button>
                        <button 
                            onClick={() => console.log(window.getSystemInfo?.())}
                            className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
                            title="Ver información del sistema"
                        >
                            System Info
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default PageBuilder;