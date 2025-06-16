// ===================================================================
// resources/js/block-builder/PageBuilder.jsx - VERSIÓN COMPLETA
// Integración completa del nuevo plugin preact-components
// ===================================================================

import { useState, useEffect, useCallback } from 'preact/hooks';
import IntegratedPageBuilderEditor from './components/IntegratedPageBuilderEditor';
import VariableManager from './plugins/variables/ui/VariableManager.jsx';
import PreactComponentEditor from './plugins/preact-components/components/PreactComponentEditor.jsx';
import { initializeCoreSystem } from './core/CoreSystemInitializer';

const PageBuilder = ({ content: initialContent, onContentChange }) => {
    const [isReady, setIsReady] = useState(false);
    const [editorContent, setEditorContent] = useState(initialContent || '');
    const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'variables' | 'components' | 
    const [preactComponentsPlugin, setPreactComponentsPlugin] = useState(null);
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
                        
            setIsReady(true);
            setSystemStatus('ready');
            
      
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
                       <PreactComponentEditor 
                        pluginInstance={preactComponentsPlugin}
                        onSave={(componentData) => {
                            console.log('Component saved:', componentData);
                        }}
                        onLoad={(componentId) => {
                            console.log('Component loaded:', componentId);
                        }}
                    />
                )}

                {/* Estado de error si ningún tab coincide */}
                {!['editor', 'variables', 'components'].includes(activeTab) && (
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