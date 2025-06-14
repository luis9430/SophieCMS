// resources/js/block-builder/PageBuilder.jsx - COMPLETO CON CACHE SIMPLE

import { useState, useEffect, useCallback } from 'preact/hooks';
import IntegratedPageBuilderEditor from './components/IntegratedPageBuilderEditor';
import VariableManager from './plugins/variables/ui/VariableManager.jsx';
import { initializeCoreSystem } from './core/CoreSystemInitializer';

const PageBuilder = ({ content: initialContent, onContentChange }) => {
    const [isReady, setIsReady] = useState(false);
    const [editorContent, setEditorContent] = useState(initialContent || '');
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'variables'

    useEffect(() => {
        initializeCoreSystem().then(() => {
            console.log("Block Builder Core Systems Initialized.");
            setIsReady(true);
            
            // ===================================================================
            // CACHE INVALIDATION SIMPLE
            // ===================================================================
            setTimeout(() => {
                setupSimpleCacheInvalidation();
            }, 1500); // Esperar más tiempo para asegurar que todo esté listo
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
                if (variablesPlugin) {
                    const dbProvider = variablesPlugin.getProvider('database');
                    if (dbProvider) {
                        // Limpiar cache
                        dbProvider.lastFetch = null;
                        if (dbProvider.cache) dbProvider.cache.clear();
                        
                        // Refrescar datos
                        await dbProvider.refresh();
                        
                        // Notificar al preview
                        window.dispatchEvent(new CustomEvent('variablesForceRefresh'));
                        
                        console.log('✅ Cache refreshed successfully');
                        return true;
                    }
                }
                console.warn('⚠️ Variables plugin or database provider not found');
                return false;
            } catch (error) {
                console.error('❌ Error refreshing cache:', error);
                return false;
            }
        };
        
        // Interceptar métodos críticos del admin
        if (window.variablesAdmin) {
            const methods = ['update', 'create', 'delete', 'refresh'];
            const originals = {};
            
            methods.forEach(method => {
                if (typeof window.variablesAdmin[method] === 'function') {
                    originals[method] = window.variablesAdmin[method];
                    
                    window.variablesAdmin[method] = async (...args) => {
                        try {
                            const result = await originals[method].apply(window.variablesAdmin, args);
                            
                            // Auto-refresh después de cambios
                            setTimeout(() => refreshCache(), 100);
                            
                            return result;
                        } catch (error) {
                            console.error(`Error in ${method}:`, error);
                            throw error;
                        }
                    };
                }
            });
            
            console.log('🔗 Admin methods intercepted:', methods);
        }
        
        // Exponer función manual
        window.refreshVariables = refreshCache;
        
        // Test function
        window.testVariables = async () => {
            console.log('🧪 Testing variables...');
            
            const plugin = window.pluginManager.get('variables');
            if (plugin) {
                const testVar = plugin.getVariable?.('site.company_name');
                console.log('Test variable:', testVar);
                
                await refreshCache();
                
                const afterRefresh = plugin.getVariable?.('site.company_name');
                console.log('After refresh:', afterRefresh);
                
                return { before: testVar, after: afterRefresh };
            }
            return null;
        };
        
        // Función de información del sistema
        window.getSystemInfo = () => {
            const pluginManager = window.pluginManager;
            const variablesPlugin = pluginManager?.get('variables');
            
            return {
                pluginManager: {
                    available: !!pluginManager,
                    pluginCount: pluginManager?.list?.()?.length || 0,
                    methods: pluginManager ? Object.getOwnPropertyNames(pluginManager).filter(name => typeof pluginManager[name] === 'function') : []
                },
                variables: {
                    plugin: !!variablesPlugin,
                    hasGetVariable: !!(variablesPlugin?.getVariable),
                    hasGetAllVariables: !!(variablesPlugin?.getAllVariables),
                    hasGetProvider: !!(variablesPlugin?.getProvider),
                    variableCount: variablesPlugin?.getVariableKeys?.()?.length || 0
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
        
        console.log('✅ Simple cache setup complete');
        console.log('💡 Commands: refreshVariables(), testVariables(), getSystemInfo()');
    };
    
    const handleContentUpdate = useCallback((newContent) => {
        setEditorContent(newContent);
        if (onContentChange) {
            onContentChange(newContent);
        }
    }, [onContentChange]);

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
                        
                        {/* Tab Navigation */}
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
                        </nav>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                        {/* Botón de refresh manual */}
                        <button
                            onClick={() => window.refreshVariables?.()}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center space-x-1"
                            title="Refrescar variables desde base de datos"
                        >
                            <span>🔄</span>
                            <span>Refresh Variables</span>
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
                {activeTab === 'editor' && (
                    <IntegratedPageBuilderEditor
                        initialContent={editorContent}
                        onContentChange={handleContentUpdate}
                    />
                )}
                
                {activeTab === 'variables' && (
                    <div className="flex-1 p-6">
                        <VariableManager />
                    </div>
                )}
            </div>
            
            {/* Status bar con información de debugging */}
            {process.env.NODE_ENV === 'development' && (
                <footer className="bg-gray-800 text-white px-4 py-2 text-xs flex justify-between items-center">
                    <div className="flex space-x-4">
                        <span>🔧 Dev Mode</span>
                        <span>📦 Plugins: {window.pluginManager?.list?.()?.length || 0}</span>
                        <span>🎯 Variables: {window.pluginManager?.get?.('variables')?.getVariableKeys?.()?.length || 0}</span>
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
                            title="Refrescar variables manualmente"
                        >
                            Refresh Now
                        </button>
                        <button 
                            onClick={() => console.log(window.getSystemInfo?.())}
                            className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
                            title="Ver información del sistema"
                        >
                            System Info
                        </button>
                        <button 
                            onClick={() => console.clear()}
                            className="px-2 py-1 bg-gray-700 rounded text-xs hover:bg-gray-600"
                            title="Limpiar consola"
                        >
                            Clear Console
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default PageBuilder;