// ===================================================================
// resources/js/block-builder/plugins/preact-components/components/PreactComponentPreview.jsx
// Sistema de preview en tiempo real para componentes Preact - COMPLETO
// ===================================================================

import { useEffect, useRef, useState } from 'preact/hooks';
import { Alert, Group, Text, Button, Stack, Card, Badge, Loader, Tooltip, ActionIcon } from '@mantine/core';
import { IconAlertCircle, IconRefresh, IconCode, IconEye, IconExternalLink, IconMaximize } from '@tabler/icons-preact';

const PreactComponentPreview = ({ 
    code, 
    componentName = 'Component',
    props = {},
    className = ""
}) => {
    const containerRef = useRef();
    const iframeRef = useRef();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState('iframe'); // 'live' | 'iframe'
    const [componentInfo, setComponentInfo] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ===================================================================
    // EFECTOS PRINCIPALES
    // ===================================================================

    useEffect(() => {
        if (!code?.trim()) {
            setError(null);
            return;
        }

        if (previewMode === 'live') {
            renderLivePreview();
        } else {
            renderIframePreview();
        }
    }, [code, props, previewMode]);

    useEffect(() => {
        // Extraer información del componente cuando cambie el código
        if (code?.trim()) {
            const info = extractComponentInfo(code);
            setComponentInfo(info);
        }
    }, [code]);

    // ===================================================================
    // RENDERIZADO LIVE (DIRECTO)
    // ===================================================================

    const renderLivePreview = async () => {
        if (!containerRef.current || !code.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            // Limpiar container anterior
            containerRef.current.innerHTML = '';

            // Verificar si tenemos el renderer disponible
            if (!window.PreactRenderer) {
                throw new Error('Sistema de renderizado Preact no disponible. Usando modo iframe.');
            }

            // Usar el renderer global
            const success = await window.PreactRenderer.renderComponent(code, containerRef.current, props);
            
            if (!success) {
                throw new Error('Error en el renderizado del componente');
            }

        } catch (err) {
            console.error('Error en preview live:', err);
            setError(err.message);
            showErrorInContainer(err.message);
            
            // Fallback automático a iframe
            setPreviewMode('iframe');
        } finally {
            setIsLoading(false);
        }
    };

    // ===================================================================
    // RENDERIZADO IFRAME (SANDBOX)
    // ===================================================================

    const renderIframePreview = () => {
        if (!iframeRef.current || !code.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const iframeDoc = iframeRef.current.contentDocument;
            if (!iframeDoc) {
                throw new Error('No se pudo acceder al iframe');
            }

            const previewHTML = generatePreviewHTML(code, props);

            iframeDoc.open();
            iframeDoc.write(previewHTML);
            iframeDoc.close();

            // Manejar errores del iframe
            iframeRef.current.onload = () => {
                try {
                    const iframeWindow = iframeRef.current.contentWindow;
                    
                    // Escuchar errores del iframe
                    iframeWindow.addEventListener('error', (event) => {
                        setError(`Error en iframe: ${event.error?.message || event.message}`);
                    });

                    setIsLoading(false);
                } catch (err) {
                    setError('Error cargando iframe');
                    setIsLoading(false);
                }
            };

        } catch (err) {
            console.error('Error en iframe preview:', err);
            setError(err.message);
            setIsLoading(false);
        }
    };

    // ===================================================================
    // GENERACIÓN DE HTML PARA IFRAME
    // ===================================================================

    const generatePreviewHTML = (code, props) => {
        const propsString = JSON.stringify(props);
        const componentNameSafe = componentName.replace(/[^a-zA-Z0-9]/g, '');
        
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview: ${componentName}</title>
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Preact desde CDN -->
    <script src="https://unpkg.com/preact@10.26.8/dist/preact.umd.js"></script>
    <script src="https://unpkg.com/preact@10.26.8/hooks/dist/hooks.umd.js"></script>
    
    <style>
        body { 
            font-family: system-ui, sans-serif; 
            padding: 1rem; 
            margin: 0;
            background: white;
            overflow-x: hidden;
        }
        
        /* Animaciones Tailwind personalizadas */
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        
        .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-slide-up {
            animation: slideUp 0.6s ease-out;
        }
        
        /* Ocultar elementos con x-cloak equivalente */
        [data-cloak] { display: none !important; }
        
        /* Error styles */
        .preview-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
        }
        
        .preview-error h3 {
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .preview-error pre {
            background: #fee;
            padding: 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            margin-top: 0.5rem;
            white-space: pre-wrap;
            word-break: break-word;
        }
    </style>
</head>
<body>
    <div id="preview-root" class="w-full"></div>
    
    <script>
        // Configurar Tailwind
        if (window.tailwind) {
            tailwind.config = {
                theme: {
                    extend: {
                        animation: {
                            'fade-in-up': 'fadeInUp 0.6s ease-out',
                            'slide-up': 'slideUp 0.6s ease-out',
                            'bounce': 'bounce 2s infinite'
                        }
                    }
                }
            };
        }

        // Función para mostrar errores
        function showError(message, details = null) {
            const container = document.getElementById('preview-root');
            container.innerHTML = \`
                <div class="preview-error">
                    <h3>Error en el componente:</h3>
                    <div>\${message}</div>
                    \${details ? \`<pre>\${details}</pre>\` : ''}
                </div>
            \`;
        }

        // Función principal de renderizado
        async function renderComponent() {
            try {
                const container = document.getElementById('preview-root');
                
                // Verificar que Preact esté disponible
                if (!window.preact || !window.preactHooks) {
                    throw new Error('Preact no está disponible');
                }

                const { render, h } = window.preact;
                const { useState, useEffect, useCallback, useMemo, useRef } = window.preactHooks;
                
                // Props del componente
                const componentProps = ${propsString};
                
                // ===================================================================
                // CÓDIGO DEL COMPONENTE (INSERTADO DINÁMICAMENTE)
                // ===================================================================
                
                ${code}
                
                // ===================================================================
                // RENDERIZAR COMPONENTE
                // ===================================================================
                
                // Buscar el componente definido
                const componentNames = Object.keys(window).filter(key => 
                    typeof window[key] === 'function' && 
                    key[0] === key[0].toUpperCase() &&
                    key !== 'Object' && key !== 'Array' && key !== 'Function' &&
                    key !== 'String' && key !== 'Number' && key !== 'Boolean' &&
                    key !== 'Date' && key !== 'RegExp' && key !== 'Error'
                );
                
                let ComponentToRender = null;
                
                // Buscar por nombre específico primero
                if (window['${componentNameSafe}']) {
                    ComponentToRender = window['${componentNameSafe}'];
                } else if (componentNames.length > 0) {
                    // Usar el último componente definido
                    ComponentToRender = window[componentNames[componentNames.length - 1]];
                }
                
                if (!ComponentToRender) {
                    throw new Error('No se encontró un componente válido para renderizar');
                }
                
                // Renderizar el componente
                render(h(ComponentToRender, componentProps), container);
                
                console.log('✅ Componente renderizado exitosamente');
                
            } catch (error) {
                console.error('❌ Error renderizando componente:', error);
                showError(error.message, error.stack);
            }
        }

        // Inicializar cuando el DOM esté listo
        window.addEventListener('DOMContentLoaded', renderComponent);
        
        // Fallback si ya está listo
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(renderComponent, 100);
        }
    </script>
</body>
</html>
        `;
    };

    // ===================================================================
    // UTILIDADES
    // ===================================================================

    const showErrorInContainer = (errorMessage) => {
        if (containerRef.current) {
            containerRef.current.innerHTML = `
                <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 class="font-bold text-red-800 mb-2">Error en el componente:</h3>
                    <pre class="text-red-600 text-sm whitespace-pre-wrap">${errorMessage}</pre>
                </div>
            `;
        }
    };

    const handleRefresh = () => {
        setError(null);
        if (previewMode === 'live') {
            renderLivePreview();
        } else {
            renderIframePreview();
        }
    };

    const handleModeChange = (mode) => {
        setPreviewMode(mode);
        setError(null);
    };

    const handleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleOpenInNewTab = () => {
        if (previewMode === 'iframe' && code.trim()) {
            const previewHTML = generatePreviewHTML(code, props);
            const newWindow = window.open('', '_blank');
            newWindow.document.write(previewHTML);
            newWindow.document.close();
        }
    };

    // Extraer información del componente
    const extractComponentInfo = (code) => {
        const info = {
            name: 'Component',
            props: [],
            hooks: [],
            lines: 0
        };

        // Extraer nombre
        const nameMatch = code.match(/(?:const|function)\s+([A-Z][a-zA-Z0-9]*)/);
        if (nameMatch) {
            info.name = nameMatch[1];
        }

        // Extraer props
        const propsMatch = code.match(/\(\s*{\s*([^}]+)\s*}\s*\)/);
        if (propsMatch) {
            info.props = propsMatch[1]
                .split(',')
                .map(prop => prop.trim().split('=')[0].trim())
                .filter(prop => prop.length > 0);
        }

        // Extraer hooks
        const hookMatches = code.match(/use[A-Z]\w*/g);
        if (hookMatches) {
            info.hooks = [...new Set(hookMatches)];
        }

        // Contar líneas
        info.lines = code.split('\n').length;

        return info;
    };

    // ===================================================================
    // RENDER PRINCIPAL
    // ===================================================================

    if (!code?.trim()) {
        return (
            <div className={`h-full flex items-center justify-center bg-gray-50 rounded-lg ${className}`}>
                <div className="text-center text-gray-500">
                    <IconCode size={48} className="mx-auto mb-4 opacity-50" />
                    <Text size="lg" fw={600} className="mb-2">
                        Sin código para preview
                    </Text>
                    <Text size="sm">
                        Escribe tu componente Preact en el editor
                    </Text>
                </div>
            </div>
        );
    }

    return (
        <div className={`h-full flex flex-col ${className}`}>
            {/* Header del preview */}
            <Card className="p-4 mb-4">
                <Group justify="space-between">
                    <Group>
                        <IconEye size={20} className="text-blue-600" />
                        <Text fw={600}>Preview: {componentInfo?.name || componentName}</Text>
                        <Badge variant="light" color={error ? 'red' : isLoading ? 'orange' : 'green'}>
                            {error ? 'Error' : isLoading ? 'Cargando' : 'OK'}
                        </Badge>
                        {componentInfo && (
                            <Group gap="xs">
                                <Badge size="sm" variant="outline">
                                    {componentInfo.props.length} props
                                </Badge>
                                <Badge size="sm" variant="outline">
                                    {componentInfo.hooks.length} hooks
                                </Badge>
                                <Badge size="sm" variant="outline">
                                    {componentInfo.lines} líneas
                                </Badge>
                            </Group>
                        )}
                    </Group>
                    
                    <Group>
                        {/* Selector de modo preview */}
                        <Group gap="xs">
                            <Button
                                size="xs"
                                variant={previewMode === 'iframe' ? 'filled' : 'light'}
                                onClick={() => handleModeChange('iframe')}
                            >
                                Iframe
                            </Button>
                            <Button
                                size="xs"
                                variant={previewMode === 'live' ? 'filled' : 'light'}
                                onClick={() => handleModeChange('live')}
                                disabled={!window.PreactRenderer}
                            >
                                Live
                            </Button>
                        </Group>
                        
                        <Tooltip label="Refrescar">
                            <ActionIcon
                                variant="light"
                                onClick={handleRefresh}
                                loading={isLoading}
                            >
                                <IconRefresh size={16} />
                            </ActionIcon>
                        </Tooltip>
                        
                        <Tooltip label="Abrir en nueva pestaña">
                            <ActionIcon
                                variant="light"
                                onClick={handleOpenInNewTab}
                                disabled={previewMode !== 'iframe'}
                            >
                                <IconExternalLink size={16} />
                            </ActionIcon>
                        </Tooltip>
                        
                        <Tooltip label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}>
                            <ActionIcon
                                variant="light"
                                onClick={handleFullscreen}
                            >
                                <IconMaximize size={16} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
            </Card>

            {/* Error display */}
            {error && (
                <Alert 
                    icon={<IconAlertCircle size={16} />} 
                    color="red"
                    title="Error en el preview"
                    className="mb-4"
                >
                    <Text size="sm">{error}</Text>
                </Alert>
            )}

            {/* Preview container */}
            <div className={`flex-1 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden relative ${
                isFullscreen ? 'fixed inset-0 z-50 border-0 rounded-none' : ''
            }`}>
                {isLoading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                        <Loader size="lg" />
                    </div>
                )}

                {previewMode === 'live' ? (
                    <div 
                        ref={containerRef}
                        className="w-full h-full min-h-[400px] bg-white p-4 overflow-auto"
                    />
                ) : (
                    <iframe
                        ref={iframeRef}
                        className="w-full h-full min-h-[400px] border-0 bg-white"
                        title={`Preview: ${componentName}`}
                        sandbox="allow-scripts allow-same-origin"
                    />
                )}
            </div>

            {/* Footer info */}
            <Card className="p-3 mt-4">
                <Group justify="space-between">
                    <Group gap="md">
                        <Text size="sm" c="dimmed">
                            Modo: {previewMode === 'live' ? 'Renderizado directo' : 'Sandbox aislado'}
                        </Text>
                        {Object.keys(props).length > 0 && (
                            <Text size="sm" c="dimmed">
                                Props: {Object.keys(props).length} 
                            </Text>
                        )}
                        {componentInfo && (
                            <Text size="sm" c="dimmed">
                                Hooks: {componentInfo.hooks.join(', ') || 'Ninguno'}
                            </Text>
                        )}
                    </Group>
                    
                    <Text size="xs" c="dimmed">
                        Preact + Tailwind + Mantine
                    </Text>
                </Group>
            </Card>
        </div>
    );
};

export default PreactComponentPreview;