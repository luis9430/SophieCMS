// ===================================================================
// PageBuilder.jsx - INTEGRACIÓN CON SISTEMA DE PLUGINS
// Ejemplo de cómo modificar PageBuilder.jsx para usar el nuevo sistema
// ===================================================================

import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import {
    AppShell, Text, Button, Group, Container, Flex, Box, ActionIcon, Tooltip,
    Collapse
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconDeviceFloppy, IconEye, IconRefresh, IconCode, IconPalette, 
    IconSun, IconMoon, IconPlus, IconList,
    IconVariable, IconCopy, IconChevronDown, IconChevronRight
} from '@tabler/icons-preact';

import CodeMirrorEditor from './codemirror/CodeMirrorEditor';

// ===================================================================
// 🔥 NUEVA IMPORTACIÓN: SISTEMA DE PLUGINS
// ===================================================================

// En lugar de importar hooks individuales, usar el LegacyBridge
import legacyBridge, { 
    useVariables, 
    useApi, 
    useAlpinePreview 
} from './core/LegacyBridge.js';

// Importar inicializador de plugins
import { initializePluginSystem, getPluginSystem } from './core/PluginSystemInit.js';

// ===================================================================
// COMPONENTE VARIABLES PANEL - SIN CAMBIOS (Usa LegacyBridge automáticamente)
// ===================================================================

const VariablesPanel = ({ onInsertVariable }) => {
    // ✅ ESTE HOOK USA AUTOMÁTICAMENTE EL LEGACYBRIDGE
    // Si hay plugin de variables: usa plugin
    // Si no: usa sistema legacy
    const {
        showVariablesPanel,
        expandedSections,
        searchTerm,
        filteredVariables,
        variableStats,
        toggleVariablesPanel,
        hidePanel,
        toggleSection,
        updateSearchTerm,
        clearSearch,
        formatVariable
    } = useVariables(); // ← LegacyBridge decide qué usar

    const handleInsertVariable = (varPath) => {
        const formatted = formatVariable(varPath);
        onInsertVariable(formatted);
    };

    // ... resto del componente sin cambios
    // (Código idéntico al original)
    
    if (!showVariablesPanel) {
        return (
            <ActionIcon 
                variant="light" 
                color="purple"
                onClick={toggleVariablesPanel}
                size="lg"
                style={{ position: 'fixed', left: 10, top: 100, zIndex: 1000 }}
            >
                <IconVariable size={18} />
            </ActionIcon>
        );
    }

    return (
        <Box style={{
            position: 'fixed',
            left: 10,
            top: 100,
            width: 300,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            borderRadius: 8,
            padding: 16,
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
            {/* ... resto del JSX sin cambios */}
        </Box>
    );
};

// ===================================================================
// COMPONENTE PRINCIPAL - CON INTEGRACIÓN DE PLUGINS
// ===================================================================

export default function PageBuilder() {
    // ===================================================================
    // 🔥 ESTADO NUEVO: SISTEMA DE PLUGINS
    // ===================================================================
    
    const [pluginSystemReady, setPluginSystemReady] = useState(false);
    const [pluginSystemError, setPluginSystemError] = useState(null);
    const [pluginStats, setPluginStats] = useState({});
    
    // ===================================================================
    // HOOKS EXISTENTES - AHORA USAN LEGACYBRIDGE AUTOMÁTICAMENTE
    // ===================================================================
    
    const variablesHook = useVariables();    // ← LegacyBridge
    const apiHook = useApi();                // ← LegacyBridge
    const alpineHook = useAlpinePreview();   // ← LegacyBridge

    // ===================================================================
    // ESTADO EXISTENTE - SIN CAMBIOS
    // ===================================================================
    
    const [theme, setTheme] = useState('light');
    const [code, setCode] = useState(`<div class="p-8 text-center">
    <h1 class="text-3xl font-bold mb-4">¡Hola {{ user.name }}!</h1>
    <p class="text-lg text-gray-600 mb-4">Bienvenido a {{ app.name }}</p>
    <p class="text-sm text-gray-500">Hoy es {{ current.date }} y son las {{ current.time }}</p>
    
    <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm">💡 <strong>Tip:</strong> Usa el panel de variables (icono púrpura) para insertar más variables automáticamente</p>
    </div>
</div>`);
    const [previewHTML, setPreviewHTML] = useState('');
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
    
    // ... resto del estado existente sin cambios
    const [templates, setTemplates] = useState([
        // Templates existentes...
    ]);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [savedCode, setSavedCode] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateName, setTemplateName] = useState('');

    // ===================================================================
    // 🔥 NUEVO: INICIALIZACIÓN DEL SISTEMA DE PLUGINS
    // ===================================================================
    
    useEffect(() => {
        const initPlugins = async () => {
            try {
                console.log('🚀 Initializing Plugin System...');
                
                const result = await initializePluginSystem({
                    securityLevel: 'high',
                    enableHotReload: process.env.NODE_ENV === 'development',
                    autoRegister: true
                });
                
                setPluginSystemReady(true);
                setPluginStats({
                    pluginCount: result.pluginCount,
                    initializedAt: new Date().toISOString()
                });
                
                console.log('✅ Plugin System ready:', result);
                
                // Mostrar notificación de éxito
                notifications.show({
                    title: '🔌 Sistema de Plugins Activo',
                    message: `${result.pluginCount} plugin(s) cargado(s) exitosamente`,
                    color: 'green',
                    icon: <IconCode size={18} />
                });
                
            } catch (error) {
                console.error('❌ Plugin System initialization failed:', error);
                setPluginSystemError(error.message);
                
                // Mostrar error pero continuar con sistema legacy
                notifications.show({
                    title: '⚠️ Sistema de Plugins Falló',
                    message: 'Continuando con sistema legacy',
                    color: 'yellow',
                    icon: <IconRefresh size={18} />
                });
            }
        };
        
        initPlugins();
    }, []);

    // ===================================================================
    // 🔥 NUEVA FUNCIÓN: PROCESAMIENTO MEJORADO CON PLUGINS
    // ===================================================================
    
    /**
     * Procesar código usando sistema de plugins o legacy
     */
    const processCodeAdvanced = useCallback(async () => {
        console.log('🔄 Processing code with advanced plugin system...');
        
        try {
            if (pluginSystemReady) {
                // ✅ USAR SISTEMA DE PLUGINS
                const processedCode = await legacyBridge.processCodeWithAllPlugins(code);
                setPreviewHTML(processedCode);
                
                notifications.show({
                    title: '🚀 Código Procesado (Plugins)',
                    message: `Procesado con sistema de plugins avanzado`,
                    color: 'blue',
                    icon: <IconCode size={18} />
                });
            } else {
                // ⏰ FALLBACK A LEGACY
                const processedHTML = alpineHook.processCodeWithAlpine(code);
                setPreviewHTML(processedHTML);
                
                notifications.show({
                    title: '🔄 Código Procesado (Legacy)',
                    message: `Procesado con sistema legacy`,
                    color: 'orange',
                    icon: <IconRefresh size={18} />
                });
            }
            
        } catch (error) {
            console.error('❌ Error processing code:', error);
            
            // Fallback automático a legacy
            try {
                const fallbackHTML = alpineHook.processCodeWithAlpine(code);
                setPreviewHTML(fallbackHTML);
                
                notifications.show({
                    title: '⚠️ Fallback a Legacy',
                    message: 'Error en plugins, usando sistema legacy',
                    color: 'yellow'
                });
            } catch (fallbackError) {
                notifications.show({
                    title: '❌ Error Total',
                    message: 'Error en ambos sistemas',
                    color: 'red'
                });
            }
        }
    }, [code, pluginSystemReady, alpineHook]);

    // ===================================================================
    // 🔥 NUEVA FUNCIÓN: VALIDACIÓN AVANZADA
    // ===================================================================
    
    /**
     * Validar código con todos los plugins
     */
    const validateCodeAdvanced = useCallback(async () => {
        if (!pluginSystemReady) {
            console.log('Plugin system not ready, skipping advanced validation');
            return;
        }
        
        try {
            const errors = await legacyBridge.validateCodeWithAllPlugins(code);
            
            if (errors.length > 0) {
                const criticalErrors = errors.filter(e => e.severity === 'critical');
                const warnings = errors.filter(e => e.severity === 'warning');
                
                notifications.show({
                    title: '🔍 Validación Completa',
                    message: `${criticalErrors.length} errores críticos, ${warnings.length} advertencias`,
                    color: criticalErrors.length > 0 ? 'red' : 'yellow'
                });
                
                console.log('Validation results:', errors);
            } else {
                notifications.show({
                    title: '✅ Código Válido',
                    message: 'Sin errores detectados',
                    color: 'green'
                });
            }
            
        } catch (error) {
            console.error('Error in advanced validation:', error);
        }
    }, [code, pluginSystemReady]);

    // ===================================================================
    // 🔥 NUEVA FUNCIÓN: GESTIÓN DE PLUGINS
    // ===================================================================
    
    /**
     * Obtener información del sistema de plugins
     */
    const getPluginSystemInfo = useCallback(() => {
        if (!pluginSystemReady) return null;
        
        try {
            const { pluginManager } = getPluginSystem();
            return {
                plugins: pluginManager.list(),
                stats: pluginManager.getStats(),
                debug: pluginManager.getDebugInfo()
            };
        } catch (error) {
            console.error('Error getting plugin info:', error);
            return null;
        }
    }, [pluginSystemReady]);

    /**
     * Hot reload de plugin específico
     */
    const hotReloadPlugin = useCallback(async (pluginName) => {
        if (!pluginSystemReady) return;
        
        try {
            const { init } = getPluginSystem();
            await init.hotReloadPlugin(pluginName);
            
            notifications.show({
                title: '🔥 Plugin Recargado',
                message: `Plugin ${pluginName} recargado exitosamente`,
                color: 'green'
            });
            
        } catch (error) {
            notifications.show({
                title: '❌ Error Hot Reload',
                message: `Error recargando ${pluginName}: ${error.message}`,
                color: 'red'
            });
        }
    }, [pluginSystemReady]);

    // ===================================================================
    // FUNCIONES EXISTENTES - MÍNIMOS CAMBIOS
    // ===================================================================
    
    // updatePreview ahora puede usar el sistema avanzado
    const updatePreview = useCallback(() => {
        if (pluginSystemReady) {
            processCodeAdvanced();
        } else {
            // Código original
            try {
                const processedHTML = alpineHook.processCodeWithAlpine(code);
                setPreviewHTML(processedHTML);
                
                notifications.show({
                    title: '🚀 Variables + Alpine procesadas',
                    message: `Preview actualizado (legacy)`,
                    color: 'green',
                    icon: <IconEye size={18} />
                });
            } catch (error) {
                console.error('Error en procesamiento legacy:', error);
                notifications.show({
                    title: 'Error',
                    message: `Error procesando: ${error.message}`,
                    color: 'red'
                });
            }
        }
    }, [code, alpineHook, pluginSystemReady, processCodeAdvanced]);

    // ... resto de funciones existentes sin cambios (handleAddTemplate, etc.)

    // ===================================================================
    // 🔥 MEJORA: AUTO-UPDATE CON VALIDACIÓN AVANZADA
    // ===================================================================
    
    useEffect(() => {
        if (isLoadingTemplate) {
            console.log('⏸️ Auto-update pausado - cargando template');
            return;
        }
        
        const updatePreviewContent = async () => {
            if (code) {
                try {
                    console.log('🔄 Auto-update iniciado para:', code.length, 'caracteres');
                    
                    if (pluginSystemReady) {
                        // Usar sistema avanzado
                        const processedHTML = await legacyBridge.processCodeWithAllPlugins(code);
                        setPreviewHTML(processedHTML);
                        console.log('✅ Auto-update con plugins completado');
                    } else {
                        // Fallback a legacy
                        const processedHTML = alpineHook.processCodeWithAlpine(code);
                        setPreviewHTML(processedHTML);
                        console.log('✅ Auto-update legacy completado');
                    }
                } catch (error) {
                    console.error('❌ Error en auto-update:', error);
                    setPreviewHTML(`<div style="padding: 20px; color: red;">Error procesando: ${error.message}</div>`);
                }
            } else {
                console.log('📄 Código vacío - limpiando preview');
                setPreviewHTML('');
            }
        };

        const timeoutId = setTimeout(updatePreviewContent, 150);
        return () => clearTimeout(timeoutId);
    }, [code, alpineHook, isLoadingTemplate, pluginSystemReady]);

    // ===================================================================
    // RENDER - CON NUEVOS CONTROLES DE PLUGINS
    // ===================================================================

    return (
        <AppShell
            header={{ height: 70 }}
            padding={0}
            style={{ 
                height: '100vh', 
                overflow: 'hidden',
                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
            }}
        >
            <AppShell.Header style={{ backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff' }}>
                <Container size="100%" h="100%">
                    <Flex justify="space-between" align="center" h="100%" px="md">
                        <Group gap="sm">
                            <IconPalette size={28} color="#228be6" />
                            <Text size="lg" fw={700} c={theme === 'dark' ? 'white' : 'dark'}>
                                Page Builder
                            </Text>
                            
                            {/* 🔥 NUEVO: INDICADOR DE ESTADO DE PLUGINS */}
                            {pluginSystemReady && (
                                <Group gap="xs">
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: '#10b981'
                                    }} />
                                    <Text size="xs" c="green">
                                        Plugins: {pluginStats.pluginCount || 0}
                                    </Text>
                                </Group>
                            )}
                            
                            {pluginSystemError && (
                                <Group gap="xs">
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: '#f59e0b'
                                    }} />
                                    <Text size="xs" c="yellow">
                                        Legacy Mode
                                    </Text>
                                </Group>
                            )}
                            
                            {/* Status indicators existentes */}
                            {currentTemplate && (
                                <Group gap="xs">
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: isDirty ? '#f59e0b' : '#10b981'
                                    }} />
                                    <Text size="sm" c={isDirty ? 'yellow' : 'green'}>
                                        {autoSaving ? 'Auto-guardando...' : isDirty ? 'Sin guardar' : 'Guardado'}
                                    </Text>
                                </Group>
                            )}
                        </Group>
                        
                        <Group>
                            {/* 🔥 NUEVO: CONTROLES DE PLUGINS */}
                            {pluginSystemReady && (
                                <>
                                    <Tooltip label="Validación avanzada con plugins">
                                        <ActionIcon 
                                            variant="light" 
                                            color="purple"
                                            onClick={validateCodeAdvanced}
                                            size="lg"
                                        >
                                            🔍
                                        </ActionIcon>
                                    </Tooltip>
                                    
                                    <Tooltip label="Información de plugins">
                                        <ActionIcon 
                                            variant="light" 
                                            color="blue"
                                            onClick={() => {
                                                const info = getPluginSystemInfo();
                                                console.log('Plugin System Info:', info);
                                                notifications.show({
                                                    title: '🔌 Plugin Info',
                                                    message: `${info?.plugins?.length || 0} plugins activos`,
                                                    color: 'blue'
                                                });
                                            }}
                                            size="lg"
                                        >
                                            🔌
                                        </ActionIcon>
                                    </Tooltip>
                                </>
                            )}
                            
                            {/* Controles existentes */}
                            <Tooltip label="Gestionar templates">
                                <ActionIcon 
                                    variant="light" 
                                    color="green"
                                    onClick={() => setShowTemplates(!showTemplates)}
                                    size="lg"
                                >
                                    <IconList size={18} />
                                </ActionIcon>
                            </Tooltip>
                            
                            {/* ... resto de controles existentes */}
                            
                            <Button 
                                leftSection={<IconEye size={18} />} 
                                size="sm" 
                                variant="light"
                                onClick={updatePreview}
                            >
                                {pluginSystemReady ? '🚀 Procesar (Plugins)' : '🔄 Procesar (Legacy)'}
                            </Button>
                            
                            {/* ... resto de botones existentes */}
                        </Group>
                    </Flex>
                </Container>
            </AppShell.Header>

            <AppShell.Main style={{ height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
                {/* ... resto del contenido exactamente igual */}
                {/* Solo el preview y los paneles existentes */}
                
                {/* Panel de variables sin cambios */}
                <VariablesPanel onInsertVariable={(text) => setCode(prev => prev + text)} />
            </AppShell.Main>
        </AppShell>
    );
}

// ===================================================================
// 🔥 NUEVA EXPORTACIÓN: INFORMACIÓN DEL SISTEMA
// ===================================================================

export const getPageBuilderInfo = () => {
    return {
        version: '2.0.0-plugins',
        features: [
            'Legacy Compatibility',
            'Plugin System',
            'Hot Reload',
            'Advanced Validation',
            'Template Security'
        ],
        pluginSystemReady: window.pluginSystemInit?.initialized || false
    };
};

// ===================================================================
// DEBUGGING EN DESARROLLO
// ===================================================================

if (process.env.NODE_ENV === 'development') {
    window.getPageBuilderInfo = getPageBuilderInfo;
    console.log('🔧 PageBuilder with Plugin System ready');
}