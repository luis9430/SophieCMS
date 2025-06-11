// PageBuilder.jsx - Corrección de importaciones

import React, { useState, useEffect, useCallback } from 'react';
// ✅ CORRECCIÓN: Usar el nuevo inicializador completo
import { 
    initializeCoreSystem,      // ✅ Nuevo inicializador completo
    initializePluginSystem 
} from './core/CoreSystemInitializer.js';

const PageBuilder = () => {
    const [pluginSystemReady, setPluginSystemReady] = useState(false);
    const [systemStatus, setSystemStatus] = useState(null);
    const [initError, setInitError] = useState(null);

    // ✅ FUNCIÓN CORREGIDA: Usar inicializador completo
    const initPlugins = useCallback(async () => {
        try {
            console.log('🚀 Initializing Core System...');
            setInitError(null);

            // ✅ Usar el nuevo inicializador que maneja todo
            const systemInfo = await initializeCoreSystem({
                securityLevel: 'medium',
                enableHotReload: process.env.NODE_ENV === 'development',
                autoRegister: true,
                validateOnLoad: true
            });

            if (systemInfo) {
                setPluginSystemReady(true);
                setSystemStatus(systemInfo);
                
                console.log('✅ Core System initialized successfully');
                console.log('📊 System Info:', systemInfo);
            }

        } catch (error) {
            console.error('❌ Core System initialization failed:', error);
            setInitError(error.message);
            setPluginSystemReady(false);
        }
    }, []);

    // ✅ EFECTO CORREGIDO: Verificar si ya está inicializado
    useEffect(() => {
        // Verificar si ya está inicializado
        if (window.coreSystemInitializer && window.coreSystemInitializer.initialized) {
            console.log('🔄 Core System already initialized');
            setPluginSystemReady(true);
            if (window.getSystemInfo) {
                setSystemStatus(window.getSystemInfo());
            }
            return;
        }

        // Inicializar con delay para asegurar que todo esté cargado
        const timer = setTimeout(() => {
            initPlugins();
        }, 100);

        return () => clearTimeout(timer);
    }, [initPlugins]);

    // ✅ FUNCIÓN UTILITARIA: Verificar estado mejorado
    const checkPluginStatus = useCallback(() => {
        if (window.debugSystem) {
            window.debugSystem();
        } else {
            console.log('🔍 Debug function not available');
        }
        
        const status = window.getSystemInfo ? window.getSystemInfo() : null;
        if (status) {
            setSystemStatus(status);
        }
        
        return status;
    }, []);

    // ✅ RENDER CON MANEJO DE ESTADOS
    return (
        <div className="page-builder">
            {/* Header con información de estado */}
            <div className="plugin-status-header">
                {initError && (
                    <div className="error-banner" style={{ 
                        background: '#fee', 
                        color: '#c53030', 
                        padding: '10px', 
                        borderRadius: '4px',
                        marginBottom: '10px'
                    }}>
                        ❌ Plugin System Error: {initError}
                        <button 
                            onClick={initPlugins}
                            style={{ marginLeft: '10px', padding: '4px 8px' }}
                        >
                            Retry
                        </button>
                    </div>
                )}
                
                {pluginSystemReady && (
                    <div className="success-banner" style={{ 
                        background: '#f0fff4', 
                        color: '#22543d', 
                        padding: '10px', 
                        borderRadius: '4px',
                        marginBottom: '10px'
                    }}>
                        ✅ Plugin System Ready
                        {process.env.NODE_ENV === 'development' && (
                            <button 
                                onClick={checkPluginStatus}
                                style={{ marginLeft: '10px', padding: '4px 8px' }}
                            >
                                Debug Status
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Contenido principal del PageBuilder */}
            <div className="page-builder-content">
                {/* Aquí va el resto de tu PageBuilder */}
                <div className="editor-section">
                    {/* Tu editor actual */}
                </div>
                
                <div className="preview-section">
                    {/* Tu preview actual */}
                </div>
            </div>

            {/* Panel de debug en desarrollo */}
            {process.env.NODE_ENV === 'development' && systemStatus && (
                <div className="debug-panel" style={{
                    position: 'fixed',
                    bottom: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.8)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    maxWidth: '300px'
                }}>
                    <div><strong>🔧 Debug Info:</strong></div>
                    <div>Plugins: {systemStatus.plugins?.length || 0}</div>
                    <div>LegacyBridge: {systemStatus.legacyBridge ? '✅' : '❌'}</div>
                    <div>TemplateValidator: {systemStatus.templateValidator ? '✅' : '❌'}</div>
                </div>
            )}
        </div>
    );
};

export default PageBuilder;