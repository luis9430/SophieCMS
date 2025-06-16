// ===================================================================
// resources/js/block-builder/plugins/preact-components/components/PreactComponentPreview.jsx
// Sistema de preview en tiempo real para componentes Preact
// ===================================================================

import { useEffect, useRef, useState } from 'preact/hooks';
import { Alert, Group, Text, Button, Stack, Card, Badge } from '@mantine/core';
import { IconAlertCircle, IconRefresh, IconCode, IconEye } from '@tabler/icons-preact';

const PreactComponentPreview = ({ 
    code, 
    componentName = 'Component',
    props = {} 
}) => {
    const containerRef = useRef();
    const iframeRef = useRef();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState('live'); // 'live' | 'iframe'

    // ===================================================================
    // PREVIEW EN TIEMPO REAL
    // ===================================================================

    useEffect(() => {
        if (previewMode === 'live') {
            renderLivePreview();
        } else {
            renderIframePreview();
        }
    }, [code, props, previewMode]);

    const renderLivePreview = async () => {
        if (!containerRef.current || !code.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            // Limpiar container anterior
            containerRef.current.innerHTML = '';

            // Transformar y ejecutar código
            const transformedCode = transformJSXCode(code);
            const Component = await createPreactComponent(transformedCode);

            // Renderizar usando Preact
            const { render, h } = await import('preact');
            render(h(Component, props), containerRef.current);

        } catch (err) {
            console.error('Error en preview live:', err);
            setError(err.message);
            showErrorInContainer(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderIframePreview = () => {
        if (!iframeRef.current) return;

        setIsLoading(true);
        setError(null);

        const iframeDoc = iframeRef.current.contentDocument;
        const previewHTML = generatePreviewHTML(code, props);

        iframeDoc.open();
        iframeDoc.write(previewHTML);
        iframeDoc.close();

        setIsLoading(false);
    };

    // ===================================================================
    // TRANSFORMACIÓN DE CÓDIGO
    // ===================================================================

    const transformJSXCode = (code) => {
        // Preparar imports y contexto
        const imports = `
            import { h, Fragment } from 'preact';
            import { useState, useEffect, useCallback, useMemo, useRef } from 'preact/hooks';
        `;

        // Transformar JSX a función ejecutable
        let transformed = code;

        // Reemplazar className por class para compatibilidad
        transformed = transformed.replace(/className=/g, 'class=');
        
        // Asegurar que el componente esté exportado
        if (!transformed.includes('export') && !transformed.includes('return')) {
            // Si es solo una función, asegurar que retorne JSX
            const componentMatch = transformed.match(/const\s+(\w+)\s*=/);
            if (componentMatch) {
                transformed += `\nexport default ${componentMatch[1]};`;
            }
        }

        return `
            ${imports}
            ${transformed}
        `;
    };

    const createPreactComponent = async (transformedCode) => {
        try {
            // Crear blob con el código
            const blob = new Blob([transformedCode], { type: 'application/javascript' });
            const moduleUrl = URL.createObjectURL(blob);

            // Importar como módulo
            const module = await import(moduleUrl);
            URL.revokeObjectURL(moduleUrl);

            return module.default || module[Object.keys(module)[0]];
        } catch (error) {
            // Fallback: crear componente usando Function constructor
            return createComponentFromString(transformedCode);
        }
    };

    const createComponentFromString = (code) => {
        try {
            // Preparar contexto
            const context = {
                h: window.preact?.h || (() => {}),
                Fragment: window.preact?.Fragment || (() => {}),
                useState: window.preactHooks?.useState || (() => [null, () => {}]),
                useEffect: window.preactHooks?.useEffect || (() => {}),
                useCallback: window.preactHooks?.useCallback || ((fn) => fn),
                useMemo: window.preactHooks?.useMemo || ((fn) => fn()),
                useRef: window.preactHooks?.useRef || (() => ({ current: null }))
            };

            // Crear función que retorna el componente
            const componentFunction = new Function(
                'h', 'Fragment', 'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef',
                `
                ${code}
                
                // Buscar el componente definido
                const componentNames = Object.keys(this).filter(key => 
                    typeof this[key] === 'function' && key[0] === key[0].toUpperCase()
                );
                
                return this[componentNames[componentNames.length - 1]] || (() => h('div', null, 'Error: No component found'));
                `
            );

            return componentFunction.call(
                {},
                context.h,
                context.Fragment,
                context.useState,
                context.useEffect,
                context.useCallback,
                context.useMemo,
                context.useRef
            );
        } catch (error) {
            throw new Error(`Error creating component: ${error.message}`);
        }
    };

    // ===================================================================
    // PREVIEW HTML PARA IFRAME
    // ===================================================================

    const generatePreviewHTML = (code, props) => {
        const propsString = JSON.stringify(props);
        
        return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
        import { render, h } from 'https://esm.sh/preact@10.26.8';
        import { useState, useEffect, useCallback, useMemo, useRef } from 'https://esm.sh/preact@10.26.8/hooks';
        
        // Configurar Tailwind
        tailwind.config = {
            theme: {
                extend: {
                    animation: {
                        'fade-in-up': 'fadeInUp 0.6s ease-out',
                        'bounce': 'bounce 2s infinite'
                    }
                }
            }
        };

        // Componente del usuario
        ${code}
        
        // Renderizar
        window.addEventListener('DOMContentLoaded', () => {
            try {
                const container = document.getElementById('preview-root');
                const componentNames = Object.keys(window).filter(key => 
                    typeof window[key] === 'function' && 
                    key[0] === key[0].toUpperCase() &&
                    key !== 'Object' && key !== 'Array'
                );
                
                const ComponentToRender = window[componentNames[componentNames.length - 1]];
                
                if (ComponentToRender) {
                    render(h(ComponentToRender, ${propsString}), container);
                } else {
                    container.innerHTML = '<div class="p-4 text-red-600">No se encontró componente para renderizar</div>';
                }
            } catch (error) {
                document.getElementById('preview-root').innerHTML = 
                    '<div class="p-4 bg-red-50 border border-red-200 rounded"><h3 class="font-bold text-red-800">Error:</h3><pre class="text-red-600 text-sm mt-2">' + error.message + '</pre></div>';
            }
        });
    </script>
    <style>
        body { 
            margin: 0; 
            padding: 1rem; 
            font-family: system-ui, sans-serif; 
            background: white;
        }
        
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        [x-cloak] { display: none !important; }
    </style>
</head>
<body>
    <div id="preview-root"></div>
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

    // ===================================================================
    // RENDER
    // ===================================================================

    return (
        <Stack className="h-full">
            {/* Header del preview */}
            <Card className="p-4">
                <Group justify="space-between">
                    <Group>
                        <IconEye size={20} className="text-blue-600" />
                        <Text fw={600}>Preview: {componentName}</Text>
                        <Badge variant="light" color={error ? 'red' : 'green'}>
                            {error ? 'Error' : 'OK'}
                        </Badge>
                    </Group>
                    
                    <Group>
                        {/* Selector de modo preview */}
                        <Group spacing="xs">
                            <Button
                                size="sm"
                                variant={previewMode === 'live' ? 'filled' : 'light'}
                                onClick={() => setPreviewMode('live')}
                            >
                                Live
                            </Button>
                            <Button
                                size="sm"
                                variant={previewMode === 'iframe' ? 'filled' : 'light'}
                                onClick={() => setPreviewMode('iframe')}
                            >
                                Iframe
                            </Button>
                        </Group>
                        
                        <Button
                            size="sm"
                            variant="light"
                            leftSection={<IconRefresh size={14} />}
                            onClick={handleRefresh}
                            loading={isLoading}
                        >
                            Refresh
                        </Button>
                    </Group>
                </Group>
            </Card>

            {/* Error display */}
            {error && (
                <Alert 
                    icon={<IconAlertCircle size={16} />} 
                    color="red"
                    title="Error en el preview"
                >
                    <pre className="text-sm whitespace-pre-wrap">{error}</pre>
                </Alert>
            )}

            {/* Preview container */}
            <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg overflow-hidden">
                {previewMode === 'live' ? (
                    <div 
                        ref={containerRef}
                        className="w-full h-full min-h-[400px] bg-white p-4"
                        style={{ minHeight: '400px' }}
                    />
                ) : (
                    <iframe
                        ref={iframeRef}
                        className="w-full h-full min-h-[400px] border-0"
                        title="Component Preview"
                        sandbox="allow-scripts allow-same-origin"
                    />
                )}
            </div>

            {/* Info */}
            <Card className="p-3">
                <Group justify="space-between">
                    <Text size="sm" c="dimmed">
                        Modo: {previewMode === 'live' ? 'Renderizado directo' : 'Sandbox aislado'}
                    </Text>
                    <Text size="sm" c="dimmed">
                        Props: {Object.keys(props).length} 
                    </Text>
                </Group>
            </Card>
        </Stack>
    );
};

export default PreactComponentPreview;