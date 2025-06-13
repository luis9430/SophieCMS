// resources/js/block-builder/PageBuilder.jsx - UPDATED

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
        });
    }, []);
    
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
                                🔧 Variables
                            </button>
                        </nav>
                    </div>

                    {/* Header Actions */}
                    <div className="flex items-center space-x-3">
                        {activeTab === 'editor' && (
                            <>
                                <button className="px-3 py-2 text-gray-600 hover:text-gray-900 text-sm">
                                    💾 Save
                                </button>
                                <button className="px-3 py-2 text-gray-600 hover:text-gray-900 text-sm">
                                    👁️ Preview
                                </button>
                            </>
                        )}
                        
                        {activeTab === 'variables' && (
                            <VariableSystemStatus />
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                {activeTab === 'editor' && (
                    <IntegratedPageBuilderEditor
                        initialContent={editorContent}
                        onContentChange={handleContentUpdate}
                    />
                )}
                
                {activeTab === 'variables' && (
                    <div className="h-full overflow-auto">
                        <VariableManager />
                    </div>
                )}
            </main>
        </div>
    );
};

// ===================================================================
// COMPONENT: Variable System Status
// ===================================================================

function VariableSystemStatus() {
    const [status, setStatus] = useState({
        providers: 0,
        variables: 0,
        loading: false,
        lastUpdate: null
    });

    useEffect(() => {
        updateStatus();
        
        // Listen for variable changes
        if (window.variablesAdmin) {
            window.variablesAdmin.onVariableChange(() => {
                updateStatus();
            });
        }
    }, []);

    const updateStatus = async () => {
        try {
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin && variablesPlugin.processor) {
                const providers = Array.from(variablesPlugin.processor.providers.keys());
                const allVars = variablesPlugin.getAllVariables();
                const totalVars = Object.values(allVars).reduce((acc, provider) => {
                    return acc + Object.keys(provider.variables || {}).length;
                }, 0);

                setStatus({
                    providers: providers.length,
                    variables: totalVars,
                    loading: false,
                    lastUpdate: new Date()
                });
            }
        } catch (error) {
            console.error('Error updating variable status:', error);
        }
    };

    const handleRefreshAll = async () => {
        setStatus(prev => ({ ...prev, loading: true }));
        try {
            // Refresh all providers
            const variablesPlugin = window.pluginManager?.get('variables');
            if (variablesPlugin) {
                await variablesPlugin._refreshProvider('database');
                await variablesPlugin._refreshProvider('system');
            }
            await updateStatus();
        } catch (error) {
            console.error('Error refreshing variables:', error);
        } finally {
            setStatus(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
                <span>🔌 {status.providers} providers</span>
                <span>•</span>
                <span>📦 {status.variables} variables</span>
            </div>
            
            <button
                onClick={handleRefreshAll}
                disabled={status.loading}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md disabled:opacity-50 transition-colors"
                title="Refresh all variables"
            >
                <span className={status.loading ? 'animate-spin' : ''}>🔄</span>
            </button>
            
            {status.lastUpdate && (
                <span className="text-xs text-gray-400">
                    Updated {status.lastUpdate.toLocaleTimeString()}
                </span>
            )}
        </div>
    );
}

export default PageBuilder;