// ===================================================================
// resources/js/block-builder/PageBuilder.jsx - VERSIÓN COMPLETA
// Integración completa del nuevo plugin preact-components
// ===================================================================

import { useState, useEffect, useCallback } from 'preact/hooks';
import IntegratedPageBuilderEditor from './components/IntegratedPageBuilderEditor';
import VariableManager from './plugins/variables/ui/VariableManager.jsx';
import PreactComponentsTab from './plugins/preact-components/components/PreactComponentsTab.jsx';
import AlpineMethodsTab from './plugins/alpine-methods/components/AlpineMethodsTab.jsx'; // Mantener temporalmente
import { initializeCoreSystem } from './core/CoreSystemInitializer';

const PageBuilder = ({ content: initialContent, onContentChange }) => {
    const [isReady, setIsReady] = useState(false);
    const [editorContent, setEditorContent] = useState(initialContent || '');
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'variables' | 'components' | 'alpine-methods'
    const [preactComponentsPlugin, setPreactComponentsPlugin] = useState(null);
    const [alpineMethodsPlugin, setAlpineMethodsPlugin] = useState(null);
    const [systemStatus, setSystemStatus] = useState('initializing');

    useEffect(() => {
        initializeSystem();
    }, []);

    const initializeSystem = async () => {
        try {
            setSystemStatus('initializing');
            console.log("🚀 Inicializando Block Builder Core Systems...");
            
            await initializeCoreSystem();
            console.log("✅ Block Builder Core Systems Initialized.");
            
            // ===================================================================
            // INICIALIZAR PLUGIN PREACT COMPONENTS (PRINCIPAL)
            // ===================================================================
            await initializePreactComponents();
            
            // ===================================================================
            // MANTENER ALPINE METHODS (DEPRECATED - SOLO DESARROLLO)
            // ===================================================================
            if (process.env.NODE_ENV === 'development') {
                await initializeAlpineMethods();
            }
            
            setIsReady(true);
            setSystemStatus('ready');
            
            // Cache invalidation setup
            setTimeout(() => {
                setupSimpleCacheInvalidation();
            }, 1500);
            
        } catch (error) {
            console.error("❌ Error inicializando Page Builder:", error);
            setSystemStatus('error');
        }
    };

    const initializePreactComponents = async () => {
        try {
            const { getPreactComponentsPlugin, initializePreactComponentsPlugin } = 
                await import('./plugins/preact-components/init.js');
            
            let plugin = getPreactComponentsPlugin();
            
            if (!plugin) {
                console.log('🔄 Inicializando Preact Components Plugin...');
                plugin = await initializePreactComponentsPlugin();
            } else {
                console.log('✅ Preact Components Plugin ya estaba disponible');
            }
            
            setPreactComponentsPlugin(plugin);
            console.log('✅ Preact Components Plugin ready in PageBuilder');
        } catch (error) {
            console.warn('⚠️ Preact Components Plugin failed to initialize:', error);
            throw error; // Re-throw para mostrar error general
        }
    };

    const initializeAlpineMethods = async () => {
        try {
            const { getAlpineMethodsPlugin, initializeAlpineMethodsPlugin } = 
                await import('./plugins/alpine-methods/init.js');
            
            let plugin = getAlpineMethodsPlugin();
            
            if (!plugin) {
                console.log('🔄 Inicializando Alpine Methods Plugin (deprecated)...');
                plugin = await initializeAlpineMethodsPlugin();
            } else {
                console.log('✅ Alpine Methods Plugin ya estaba disponible');
            }
            
            setAlpineMethodsPlugin(plugin);
            console.log('⚠️ Alpine Methods Plugin ready (deprecated)');
        } catch (error) {
            console.warn('⚠️ Alpine Methods Plugin failed to initialize (expected):', error);
            // No es crítico, continuar sin Alpine Methods
        }
    };

    // ===================================================================
    // FUNCIÓN: Setup simple de cache invalidation
    // ===================================================================
    
    const setupSimpleCacheInvalidation = () => {
        try {
            if (typeof window !== 'undefined') {
                // Limpiar cache cada 5 minutos
                setInterval(() => {
                    console.log('🧹 Limpiando cache de componentes...');
                    if (window.caches) {
                        window.caches.keys().then(names => {
                            names.forEach(name => {
                                if (name.includes('preact-components') || name.includes('alpine-methods')) {
                                    window.caches.delete(name);
                                }
                            });
                        });
                    }
                }, 300000);
            }
        } catch (error) {
            console.warn('⚠️ Cache invalidation setup failed:', error);
        }
    };

    // ===================================================================
    // HANDLERS
    // ===================================================================

    const handleContentChange = useCallback((newContent) => {
        setEditorContent(newContent);
        onContentChange?.(newContent);
    }, [onContentChange]);

    const handleTabChange = (tabValue) => {
        setActiveTab(tabValue);
        console.log(`📑 Switched to tab: ${tabValue}`);
    };

    // ===================================================================
    // ESTADOS DE CARGA
    // ===================================================================

    if (systemStatus === 'error') {
        return (
            <div className="h-screen flex items-center justify-center bg-red-50">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-2xl font-bold text-red-800 mb-2">
                        Error de Inicialización
                    </h2>
                    <p className="text-red-700 mb-4">
                        No se pudo inicializar el sistema de componentes Preact.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!isReady) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Inicializando Page Builder
                    </h2>
                    <p className="text-gray-600">
                        Cargando sistema de componentes Preact...
                    </p>
                    <div className="mt-4">
                        <div className="text-sm text-gray-500">
                            Estado: {systemStatus}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ===================================================================
    // CONFIGURACIÓN DE TABS
    // ===================================================================

    const availableTabs = [
        {
            id: 'editor',
            label: 'Editor',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            ),
            description: 'Editor de código principal'
        },
        {
            id: 'variables',
            label: 'Variables',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            description: 'Gestión de variables dinámicas'
        },
        {
            id: 'components',
            label: 'Componentes',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            ),
            description: 'Sistema de componentes Preact',
            badge: 'Preact',
            badgeColor: 'green'
        }
    ];

    // Agregar Alpine Methods tab solo en desarrollo
    if (process.env.NODE_ENV === 'development' && alpineMethodsPlugin) {
        availableTabs.push({
            id: 'alpine-methods',
            label: 'Alpine (Legacy)',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            ),
            description: 'Sistema Alpine.js (deprecated)',
            badge: 'Legacy',
            badgeColor: 'orange',
            deprecated: true
        });
    }

    // ===================================================================
    // MAIN RENDER
    // ===================================================================

    return (
        <div className="h-screen flex flex-col bg-white">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Page Builder
                        </h1>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ✨ Preact Ready
                        </span>
                        {systemStatus === 'ready' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                🟢 Online
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                            Sistema moderno con Preact + Mantine + Tailwind
                        </span>
                    </div>
                </div>
            </header>

            {/* Tab Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="px-6">
                    <div className="flex space-x-8">
                        {availableTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors group ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : tab.deprecated
                                        ? 'border-transparent text-orange-500 hover:text-orange-700 hover:border-orange-300 opacity-60'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                                title={tab.description}
                            >
                                <span className="flex items-center space-x-2">
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                    {tab.badge && (
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                            tab.badgeColor === 'green' 
                                                ? 'bg-green-100 text-green-800'
                                                : tab.badgeColor === 'orange'
                                                ? 'bg-orange-100 text-orange-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {tab.badge}
                                        </span>
                                    )}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Tab Content */}
            <main className="flex-1 overflow-hidden">
                {activeTab === 'editor' && (
                    <IntegratedPageBuilderEditor
                        content={editorContent}
                        onContentChange={handleContentChange}
                        preactPlugin={preactComponentsPlugin}
                    />
                )}

                {activeTab === 'variables' && (
                    <VariableManager />
                )}

                {/* ✅ NUEVO: Preact Components Tab */}
                {activeTab === 'components' && (
                    <PreactComponentsTab 
                        pluginInstance={preactComponentsPlugin}
                        onSave={(componentData) => {
                            console.log('Component saved:', componentData);
                            // Aquí puedes agregar lógica adicional cuando se guarda un componente
                        }}
                        onLoad={(componentId) => {
                            console.log('Component loaded:', componentId);
                            // Aquí puedes agregar lógica adicional cuando se carga un componente
                        }}
                    />
                )}

                {/* ⚠️ DEPRECATED: Alpine Methods Tab */}
                {activeTab === 'alpine-methods' && process.env.NODE_ENV === 'development' && (
                    <div className="h-full flex flex-col">
                        {/* Warning Banner */}
                        <div className="bg-orange-50 border-b border-orange-200 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="text-2xl">⚠️</div>
                                    <div>
                                        <h3 className="text-orange-800 font-semibold">
                                            Alpine Methods (Deprecated)
                                        </h3>
                                        <p className="text-orange-700 text-sm">
                                            Este sistema está deprecated. Se recomienda usar 
                                            <strong> Componentes Preact</strong> para nuevos desarrollos.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleTabChange('components')}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Ir a Componentes Preact
                                </button>
                            </div>
                        </div>

                        {/* Alpine Methods Tab Content */}
                        <div className="flex-1">
                            {alpineMethodsPlugin ? (
                                <AlpineMethodsTab 
                                    pluginInstance={alpineMethodsPlugin}
                                    onSave={(methodData) => {
                                        console.log('Alpine method saved (deprecated):', methodData);
                                    }}
                                    onLoad={(methodId) => {
                                        console.log('Alpine method loaded (deprecated):', methodId);
                                    }}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center">
                                    <div className="text-center text-gray-500">
                                        <div className="text-4xl mb-2">🚫</div>
                                        <p>Alpine Methods Plugin no disponible</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Estado de error si ningún tab coincide */}
                {!['editor', 'variables', 'components', 'alpine-methods'].includes(activeTab) && (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="text-4xl mb-4">❓</div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                Tab no encontrado
                            </h2>
                            <p className="text-gray-600 mb-4">
                                El tab "{activeTab}" no está disponible.
                            </p>
                            <button
                                onClick={() => handleTabChange('editor')}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Ir al Editor
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer de estado (opcional) */}
            <footer className="bg-gray-50 border-t border-gray-200 px-6 py-2">
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                        <span>
                            Tab activo: <strong className="text-gray-700">{activeTab}</strong>
                        </span>
                        <span>
                            Plugin Preact: <strong className={preactComponentsPlugin ? 'text-green-600' : 'text-red-600'}>
                                {preactComponentsPlugin ? 'Activo' : 'Inactivo'}
                            </strong>
                        </span>
                        {process.env.NODE_ENV === 'development' && (
                            <span>
                                Plugin Alpine: <strong className={alpineMethodsPlugin ? 'text-orange-600' : 'text-gray-400'}>
                                    {alpineMethodsPlugin ? 'Activo (Legacy)' : 'Inactivo'}
                                </strong>
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <span>Modo: {process.env.NODE_ENV || 'production'}</span>
                        <span>•</span>
                        <span>Page Builder v2.0</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PageBuilder;