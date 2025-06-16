// ===================================================================
// resources/js/block-builder/plugins/preact-components/PreactComponentsIntegration.js
// Integración completa del sistema de sintaxis simple con tu plugin existente
// ===================================================================

import { SimpleSyntaxTransformer } from './SimpleSyntaxTransformer.js';
import { createSimpleSyntaxCompletionSource, integrateSimpleSyntaxWithCodeMirror } from './SimpleSyntaxCompletions.js';

export class PreactComponentsIntegration {
    constructor(pluginInstance) {
        this.plugin = pluginInstance;
        this.transformer = new SimpleSyntaxTransformer();
        this.isIntegrated = false;
    }

    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================

    async integrate() {
        if (this.isIntegrated) {
            console.log('✅ PreactComponents ya está integrado');
            return;
        }

        try {
            console.log('🔄 Integrando SimpleSyntax con PreactComponents...');

            // 1. Extender el plugin con nuevos métodos
            this.extendPlugin();

            // 2. Integrar con CodeMirror
            this.integrateWithCodeMirror();

            // 3. Configurar preview system
            this.setupPreviewSystem();

            // 4. Registrar en el sistema global
            this.registerGlobally();

            this.isIntegrated = true;
            console.log('✅ SimpleSyntax integrado exitosamente');

        } catch (error) {
            console.error('❌ Error integrando SimpleSyntax:', error);
            throw error;
        }
    }

    // ===================================================================
    // EXTENSIÓN DEL PLUGIN
    // ===================================================================

    extendPlugin() {
        if (!this.plugin) {
            throw new Error('Plugin instance not provided');
        }

        // Agregar método de transformación
        this.plugin.transformSimpleSyntax = (template, options = {}) => {
            return this.transformer.transform(template, options);
        };

        // Agregar método para obtener ejemplos
        this.plugin.getSimpleSyntaxExamples = () => {
            // Importar ejemplos del transformador
            const examples = {
                counter: `<div>
  <button @click="count = count + 1">
    Clicks: <span x-text="count"></span>
  </button>
</div>`,

                dropdown: `<div class="dropdown">
  <button @click="sortType='Most popular',openSort=!openSort" 
          class="flex items-center gap-2 px-4 py-2 bg-white border rounded">
    Sort: <span x-text="sortType"></span>
  </button>
  
  <div x-show="openSort" class="absolute mt-1 bg-white border rounded shadow-lg">
    <a @click="sortType='Most popular',openSort=false" 
       x-show="sortType != 'Most popular'"
       class="block px-4 py-2 hover:bg-gray-100">
      Most popular
    </a>
    <a @click="sortType='Newest',openSort=false"
       x-show="sortType != 'Newest'" 
       class="block px-4 py-2 hover:bg-gray-100">
      Newest
    </a>
  </div>
</div>`,

                form: `<form @submit="handleSubmit">
  <input x-model="name" placeholder="Your name" class="border p-2 rounded" />
  <div x-show="name.length > 0">
    Hello, <span x-text="name"></span>!
  </div>
  <button type="submit">Submit</button>
</form>`,

                toggle: `<div>
  <button @click="isVisible = !isVisible">
    Toggle Content
  </button>
  <div x-show="isVisible">
    <p>This content can be toggled!</p>
  </div>
</div>`
            };
            
            return examples;
        };

        // Agregar método de validación
        this.plugin.validateSimpleSyntax = (template) => {
            try {
                this.transformer.transform(template);
                return { valid: true, errors: [] };
            } catch (error) {
                return { valid: false, errors: [error.message] };
            }
        };

        // Agregar método para obtener variables de un template
        this.plugin.extractVariablesFromTemplate = (template) => {
            try {
                const context = { variables: new Set() };
                this.transformer.applyTransformations(template, context);
                return Array.from(context.variables);
            } catch (error) {
                console.warn('Error extracting variables:', error);
                return [];
            }
        };

        console.log('✅ Plugin extendido con métodos SimpleSyntax');
    }

    // ===================================================================
    // INTEGRACIÓN CON CODEMIRROR
    // ===================================================================

    integrateWithCodeMirror() {
        // Obtener las extensiones existentes del plugin
        const originalGetExtensions = this.plugin.getEditorExtensions;

        // Extender el método
        this.plugin.getEditorExtensions = () => {
            const originalExtensions = originalGetExtensions ? originalGetExtensions.call(this.plugin) : [];
            
            // Agregar nuestras extensiones
            const simpleSyntaxExtensions = [
                createSimpleSyntaxCompletionSource()
            ];

            return integrateSimpleSyntaxWithCodeMirror([
                ...originalExtensions,
                ...simpleSyntaxExtensions
            ]);
        };

        // Si hay una instancia global de CodeMirror, actualizarla
        if (window.editorInstance && typeof window.editorInstance.addExtensions === 'function') {
            const newExtensions = this.plugin.getEditorExtensions();
            window.editorInstance.addExtensions(newExtensions);
            console.log('✅ CodeMirror actualizado con SimpleSyntax completions');
        }

        console.log('✅ CodeMirror integrado con SimpleSyntax');
    }

    // ===================================================================
    // SISTEMA DE PREVIEW
    // ===================================================================

    setupPreviewSystem() {
        // Extender el sistema de preview existente
        const originalRenderPreview = this.plugin.renderPreview;

        this.plugin.renderPreview = async (code, container, props = {}) => {
            try {
                // Detectar si es sintaxis simple
                if (this.isSimpleSyntax(code)) {
                    console.log('🔄 Detectada sintaxis simple, transformando...');
                    
                    // Transformar a Preact
                    const transformedCode = this.transformer.transform(code, {
                        componentName: 'PreviewComponent'
                    });

                    // Renderizar código transformado
                    if (originalRenderPreview) {
                        return await originalRenderPreview.call(this.plugin, transformedCode, container, props);
                    }
                } else {
                    // Es código Preact normal, usar método original
                    if (originalRenderPreview) {
                        return await originalRenderPreview.call(this.plugin, code, container, props);
                    }
                }

                // Fallback si no hay método original
                return this.fallbackPreview(code, container, props);

            } catch (error) {
                console.error('Error en preview:', error);
                container.innerHTML = `
                    <div class="error-preview p-4 bg-red-50 border border-red-200 rounded">
                        <h4 class="text-red-800 font-bold">Preview Error</h4>
                        <pre class="text-red-600 text-sm mt-2">${error.message}</pre>
                    </div>
                `;
                return false;
            }
        };

        console.log('✅ Preview system configurado');
    }

    // ===================================================================
    // UTILIDADES DEL PREVIEW
    // ===================================================================

    isSimpleSyntax(code) {
        // Detectar si el código usa sintaxis simple
        const simpleSyntaxPatterns = [
            /@\w+="/,           // @click="..."
            /x-\w+="/,          // x-show="..."
            /:\w+="/            // :class="..."
        ];

        return simpleSyntaxPatterns.some(pattern => pattern.test(code));
    }

    async fallbackPreview(code, container, props) {
        // Preview básico si no hay otro sistema
        try {
            let previewCode = code;

            // Si es sintaxis simple, transformar
            if (this.isSimpleSyntax(code)) {
                previewCode = this.transformer.transform(code, {
                    componentName: 'PreviewComponent'
                });
            }

            // Crear preview HTML simple
            const previewHTML = this.generatePreviewHTML(previewCode, props);
            container.innerHTML = previewHTML;

            return true;
        } catch (error) {
            throw new Error(`Fallback preview failed: ${error.message}`);
        }
    }

    generatePreviewHTML(componentCode, props = {}) {
        // Generar HTML para preview (versión simplificada)
        const propsStr = JSON.stringify(props);
        
        return `
            <div class="component-preview p-4 border rounded">
                <div class="preview-header mb-2">
                    <span class="text-sm text-gray-600">Component Preview</span>
                </div>
                <div class="preview-content">
                    <iframe 
                        srcdoc="<!DOCTYPE html>
                        <html>
                        <head>
                            <script crossorigin src='https://unpkg.com/preact@latest/dist/preact.umd.js'></script>
                            <script crossorigin src='https://unpkg.com/preact@latest/hooks/dist/hooks.umd.js'></script>
                            <script src='https://cdn.tailwindcss.com'></script>
                        </head>
                        <body>
                            <div id='app'></div>
                            <script>
                                const { render, h } = preact;
                                const { useState, useEffect } = preactHooks;
                                
                                ${componentCode}
                                
                                render(h(Component, ${propsStr}), document.getElementById('app'));
                            </script>
                        </body>
                        </html>"
                        style="width: 100%; height: 300px; border: 1px solid #e5e7eb; border-radius: 6px;">
                    </iframe>
                </div>
            </div>
        `;
    }

    // ===================================================================
    // REGISTRO GLOBAL
    // ===================================================================

    registerGlobally() {
        // Hacer el transformador disponible globalmente para debugging
        if (typeof window !== 'undefined') {
            window.SimpleSyntaxTransformer = this.transformer;
            window.transformSimpleSyntax = (template, options) => 
                this.transformer.transform(template, options);
            
            // Solo en desarrollo
            if (process.env.NODE_ENV === 'development') {
                window.debugSimpleSyntax = () => ({
                    transformer: this.transformer,
                    plugin: this.plugin,
                    isIntegrated: this.isIntegrated
                });
            }
        }

        console.log('✅ SimpleSyntax registrado globalmente');
    }
}

// ===================================================================
// FUNCIÓN DE INICIALIZACIÓN
// ===================================================================

export async function initializeSimpleSyntaxIntegration(preactPlugin) {
    if (!preactPlugin) {
        console.warn('⚠️ PreactComponents plugin not provided for SimpleSyntax integration');
        return null;
    }

    try {
        const integration = new PreactComponentsIntegration(preactPlugin);
        await integration.integrate();
        
        console.log('✅ SimpleSyntax integration completed');
        return integration;

    } catch (error) {
        console.error('❌ SimpleSyntax integration failed:', error);
        throw error;
    }
}

// ===================================================================
// FUNCIÓN DE CONVENIENCIA
// ===================================================================

export function createSimpleSyntaxHelper() {
    return {
        // Transformar sintaxis simple a Preact
        transform: (template, options = {}) => {
            const transformer = new SimpleSyntaxTransformer();
            return transformer.transform(template, options);
        },

        // Validar sintaxis simple
        validate: (template) => {
            try {
                const transformer = new SimpleSyntaxTransformer();
                transformer.transform(template);
                return { valid: true, errors: [] };
            } catch (error) {
                return { valid: false, errors: [error.message] };
            }
        },

        // Obtener ejemplos
        getExamples: () => {
            const { examples } = require('./SimpleSyntaxTransformer.js');
            return examples;
        },

        // Detectar si es sintaxis simple
        isSimpleSyntax: (code) => {
            const patterns = [/@\w+="/, /x-\w+="/, /:\w+="/];
            return patterns.some(pattern => pattern.test(code));
        }
    };
}

// ===================================================================
// EXPORT PARA USO EN INIT.JS
// ===================================================================

export default {
    PreactComponentsIntegration,
    initializeSimpleSyntaxIntegration,
    createSimpleSyntaxHelper
};