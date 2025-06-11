// hooks/useAlpinePreview.js - Corregido para Fase 4

import { useState, useEffect, useCallback, useMemo } from 'react';

// ✅ HOOK PRINCIPAL CORREGIDO
export function useAlpinePreview(code, options = {}) {
    const [preview, setPreview] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // ✅ Usar LegacyBridge de forma segura
    const generatePreview = useCallback(async (inputCode) => {
        try {
            setIsLoading(true);
            setError(null);

            if (!inputCode || inputCode.trim() === '') {
                setPreview('');
                return;
            }

            let previewHtml = '';

            // Priorizar plugin Alpine si está disponible
            if (window.legacyBridge && window.legacyBridge.migrationStatus?.alpine) {
                try {
                    // Usar el plugin Alpine a través de LegacyBridge
                    previewHtml = window.legacyBridge.useAlpinePreview(inputCode, options);
                    console.log('🎬 Using Alpine Preview Plugin (Phase 4)');
                } catch (pluginError) {
                    console.warn('⚠️ Alpine Plugin failed, falling back to legacy:', pluginError.message);
                    previewHtml = generateLegacyPreview(inputCode, options);
                }
            } else {
                // Fallback a método legacy
                console.log('🔄 Using Legacy Alpine Preview (Fallback)');
                previewHtml = generateLegacyPreview(inputCode, options);
            }

            setPreview(previewHtml);

        } catch (err) {
            console.error('❌ Error generating Alpine preview:', err);
            setError(err.message);
            setPreview(getErrorPreview(err.message));
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    // ✅ Efecto para generar preview cuando cambia el código
    useEffect(() => {
        const timer = setTimeout(() => {
            generatePreview(code);
        }, 300); // Debounce de 300ms

        return () => clearTimeout(timer);
    }, [code, generatePreview]);

    // ✅ Memoizar resultado para optimizar renders
    const result = useMemo(() => ({
        preview,
        isLoading,
        error,
        refresh: () => generatePreview(code)
    }), [preview, isLoading, error, generatePreview, code]);

    return result;
}

// ✅ FUNCIÓN LEGACY SEPARADA (no usa hooks)
function generateLegacyPreview(code, options = {}) {
    try {
        // Obtener variables de forma segura
        let variables = {};
        
        if (window.legacyBridge && window.legacyBridge.migrationStatus?.variables) {
            try {
                variables = window.legacyBridge.useVariables() || {};
            } catch (error) {
                console.warn('⚠️ Failed to get variables from plugin:', error);
            }
        }

        // Procesar variables en el código
        let processedCode = processVariablesInCode(code, variables);
        
        // Generar HTML del preview
        const previewHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alpine.js Preview</title>
    <style>
        body { 
            font-family: system-ui, -apple-system, sans-serif; 
            padding: 20px; 
            margin: 0;
            line-height: 1.6;
        }
        .alpine-container { 
            max-width: 100%; 
            overflow-x: auto; 
        }
        ${options.styles || ''}
    </style>
    <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <script>
        // Variables disponibles globalmente
        window.pageBuilderVariables = ${JSON.stringify(variables, null, 2)};
        
        // Helper para acceder a variables
        window.getVariable = function(path) {
            try {
                return path.split('.').reduce((obj, key) => obj && obj[key], window.pageBuilderVariables);
            } catch (error) {
                console.warn('Variable not found:', path);
                return undefined;
            }
        };
        
        // Debug info si está habilitado
        ${options.debug ? `
        console.log('🎬 Alpine Preview Debug Info:', {
            variables: window.pageBuilderVariables,
            alpine: !!window.Alpine,
            timestamp: new Date().toISOString()
        });
        ` : ''}
    </script>
</head>
<body>
    <div class="alpine-container">
        ${processedCode}
    </div>
    
    ${options.includeDebug ? getDebugPanel(variables) : ''}
</body>
</html>
        `.trim();

        return previewHtml;
        
    } catch (error) {
        console.error('❌ Error in generateLegacyPreview:', error);
        return getErrorPreview(error.message);
    }
}

// ✅ FUNCIÓN PARA PROCESAR VARIABLES (no usa hooks)
function processVariablesInCode(code, variables) {
    if (!code || typeof code !== 'string') {
        return code;
    }

    try {
        // Reemplazar variables con sintaxis {{ variable.path }}
        return code.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, variablePath) => {
            try {
                const value = variablePath.trim().split('.').reduce((obj, key) => {
                    return obj && obj[key] !== undefined ? obj[key] : undefined;
                }, variables);
                
                return value !== undefined ? String(value) : match;
            } catch (error) {
                console.warn(`⚠️ Error processing variable ${variablePath}:`, error);
                return match;
            }
        });
        
    } catch (error) {
        console.error('❌ Error processing variables in code:', error);
        return code;
    }
}

// ✅ FUNCIÓN PARA PANEL DE DEBUG
function getDebugPanel(variables) {
    return `
<div style="margin-top: 30px; padding: 15px; background: #f5f5f5; border-radius: 8px; border-left: 4px solid #007acc;">
    <h3 style="margin: 0 0 10px 0; color: #007acc;">🐛 Debug Information</h3>
    <details>
        <summary style="cursor: pointer; font-weight: bold;">Variables disponibles</summary>
        <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(variables, null, 2)}</pre>
    </details>
    <div style="margin-top: 10px; font-size: 12px; color: #666;">
        <strong>Alpine.js:</strong> <span id="alpine-status">Cargando...</span><br>
        <strong>Timestamp:</strong> ${new Date().toLocaleString()}
    </div>
    <script>
        document.addEventListener('alpine:init', () => {
            document.getElementById('alpine-status').textContent = '✅ Cargado';
            document.getElementById('alpine-status').style.color = 'green';
        });
        
        setTimeout(() => {
            if (!window.Alpine) {
                document.getElementById('alpine-status').textContent = '❌ Error al cargar';
                document.getElementById('alpine-status').style.color = 'red';
            }
        }, 3000);
    </script>
</div>
    `;
}

// ✅ FUNCIÓN PARA PREVIEW DE ERROR
function getErrorPreview(errorMessage) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Error - Alpine Preview</title>
    <style>
        body { 
            font-family: system-ui, sans-serif; 
            padding: 20px; 
            background: #fff5f5; 
        }
        .error-container { 
            background: #fff; 
            border: 1px solid #feb2b2; 
            border-radius: 8px; 
            padding: 20px; 
            color: #c53030; 
        }
        .error-title { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .error-message { 
            font-family: monospace; 
            background: #fed7d7; 
            padding: 10px; 
            border-radius: 4px; 
            white-space: pre-wrap; 
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-title">❌ Error en Alpine Preview</div>
        <div class="error-message">${errorMessage}</div>
        <div style="margin-top: 15px; font-size: 14px;">
            <strong>Sugerencias:</strong>
            <ul>
                <li>Verifica la sintaxis de Alpine.js</li>
                <li>Revisa la consola del navegador para más detalles</li>
                <li>Asegúrate de que las variables estén correctamente definidas</li>
            </ul>
        </div>
    </div>
</body>
</html>
    `;
}

// ✅ HOOK ALTERNATIVO PARA CASOS SIMPLES
export function useAlpinePreviewSimple(code) {
    const [preview, setPreview] = useState('');
    
    useEffect(() => {
        if (!code) {
            setPreview('');
            return;
        }
        
        const simplePreview = generateLegacyPreview(code, { debug: false });
        setPreview(simplePreview);
    }, [code]);
    
    return preview;
}

// ✅ FUNCIÓN UTILITARIA PARA USO FUERA DE REACT
export function generateAlpinePreviewStatic(code, options = {}) {
    return generateLegacyPreview(code, options);
}

export default useAlpinePreview;