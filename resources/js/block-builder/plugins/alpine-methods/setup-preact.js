// ===================================================================
// resources/js/block-builder/plugins/alpine-methods/setup-preact.js
// Setup CORREGIDO para Preact - Alpine Methods
// ===================================================================

import { render, createElement } from 'preact';
import AlpineMethodsInterface from './components/AlpineMethodsInterface.jsx';
import { 
    createAlpineMethodsEditor, 
    AlpineMethodsEditorIntegration,
    integrateWithPageBuilder 
} from './integration-preact.js';
import { 
    alpineMethodsCompletionSource,
    extendCodeMirrorWithAlpineMethods 
} from './codemirror/AlpineMethodsAutoComplete.js';
import { initializeAlpineMethodsPlugin } from './init.js';

// ===================================================================
// SETUP PRINCIPAL PARA PREACT
// ===================================================================

/**
 * Configuración principal para Preact (CORREGIDO)
 */
export async function setupAlpineMethodsWithPreact(options = {}) {
    try {
        console.log('🚀 Setting up Alpine Methods with Preact...');

        const config = {
            enableModal: true,
            enableTab: true,
            enhanceCodeMirror: true,
            container: '#alpine-methods-editor',
            ...options
        };

        // 1. Inicializar el plugin Alpine Methods
        const plugin = await initializeAlpineMethodsPlugin();

        // 2. Extender CodeMirror con autocompletado
        if (config.enhanceCodeMirror) {
            extendCodeMirrorWithAlpineMethods();
        }

        // 3. Buscar contenedor específico
        if (config.container) {
            const container = document.querySelector(config.container);
            if (container) {
                const editor = await createAlpineMethodsEditor(config.container, {
                    pluginName: 'alpine-methods',
                    apiEndpoint: '/api/templates/alpine-methods'
                });
                console.log('✅ Alpine Methods Editor created in dedicated container (Preact)');
                return editor;
            }
        }

        // 4. Setup como modal si está habilitado
        if (config.enableModal) {
            setupAlpineMethodsModalPreact();
        }

        // 5. Setup como tab si está habilitado
        if (config.enableTab) {
            setupAlpineMethodsTabPreact();
        }

        console.log('✅ Alpine Methods setup completed with Preact');

    } catch (error) {
        console.error('❌ Error setting up Alpine Methods with Preact:', error);
    }
}

// ===================================================================
// MODAL SETUP CON PREACT
// ===================================================================

function setupAlpineMethodsModalPreact() {
    // Agregar botón al toolbar
    const toolbar = document.querySelector('.page-builder-toolbar') || 
                   document.querySelector('.toolbar') ||
                   document.querySelector('[class*="toolbar"]');
    
    if (toolbar) {
        const button = document.createElement('button');
        button.innerHTML = `
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>
            <span>Alpine Methods</span>
        `;
        button.className = 'btn btn-alpine-methods';
        button.style.cssText = `
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        `;
        button.onmouseover = () => button.style.background = '#2563eb';
        button.onmouseout = () => button.style.background = '#3b82f6';
        button.onclick = openAlpineMethodsModalPreact;
        
        toolbar.appendChild(button);
        console.log('✅ Alpine Methods modal button added to toolbar');
    }
}

/**
 * Abrir modal con Preact
 */
async function openAlpineMethodsModalPreact() {
    // Crear estructura del modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'alpine-methods-modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    `;

    const modalContainer = document.createElement('div');
    modalContainer.className = 'alpine-methods-modal-container';
    modalContainer.style.cssText = `
        width: 95vw;
        height: 90vh;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        position: relative;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex;
        flex-direction: column;
    `;

    // Header del modal
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
        padding: 16px 20px;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;

    const modalTitle = document.createElement('h2');
    modalTitle.textContent = 'Alpine Methods Editor';
    modalTitle.style.cssText = `
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1e293b;
    `;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #64748b;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
    `;
    closeButton.onmouseover = () => closeButton.style.background = '#f1f5f9';
    closeButton.onmouseout = () => closeButton.style.background = 'none';
    closeButton.onclick = () => {
        // Unmount Preact component antes de remover el modal
        render(null, editorContainer);
        document.body.removeChild(modalOverlay);
    };

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    // Contenedor para el editor Preact
    const editorContainer = document.createElement('div');
    editorContainer.className = 'alpine-methods-modal-editor';
    editorContainer.style.cssText = `
        flex: 1;
        overflow: hidden;
    `;

    modalContainer.appendChild(modalHeader);
    modalContainer.appendChild(editorContainer);
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);

    // Cerrar modal al hacer clic fuera
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) {
            render(null, editorContainer);
            document.body.removeChild(modalOverlay);
        }
    };

    // Montar componente Preact en el modal
    try {
        const plugin = window.pluginManager?.get('alpine-methods') || 
                      window.alpineMethodsPlugin;

        const editorComponent = createElement(AlpineMethodsInterface, {
            pluginInstance: plugin,
            onSave: async (method) => {
                console.log('💾 Saving method from modal:', method.name);
                // Aquí podrías agregar lógica específica del modal
            },
            onLoad: (method) => {
                console.log('📄 Method loaded in modal:', method.name);
            }
        });

        render(editorComponent, editorContainer);
        console.log('✅ Alpine Methods Modal opened with Preact component');

    } catch (error) {
        console.error('❌ Error mounting Preact component in modal:', error);
        document.body.removeChild(modalOverlay);
    }
}

// ===================================================================
// TAB SETUP CON PREACT
// ===================================================================

function setupAlpineMethodsTabPreact() {
    const tabsContainer = document.querySelector('.editor-tabs') ||
                         document.querySelector('[class*="tab"]') ||
                         document.querySelector('.nav-tabs');
    
    const contentContainer = document.querySelector('.editor-content') ||
                            document.querySelector('.tab-content') ||
                            document.querySelector('[class*="content"]');
    
    if (!tabsContainer || !contentContainer) {
        console.warn('⚠️ Tab system not found for Alpine Methods');
        return;
    }

    // Crear tab button
    const alpineTab = document.createElement('button');
    alpineTab.className = 'editor-tab alpine-methods-tab';
    alpineTab.innerHTML = `
        <span class="tab-icon">⚡</span>
        <span class="tab-label">Alpine Methods</span>
    `;
    alpineTab.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 14px;
        color: #64748b;
        transition: all 0.2s;
    `;
    
    alpineTab.onclick = () => showAlpineMethodsTabPreact();
    tabsContainer.appendChild(alpineTab);

    // Crear contenido del tab
    const alpineContent = document.createElement('div');
    alpineContent.className = 'editor-tab-content alpine-methods-tab-content';
    alpineContent.style.cssText = `
        display: none;
        height: 100%;
        overflow: hidden;
    `;
    contentContainer.appendChild(alpineContent);

    // Función para mostrar el tab
    async function showAlpineMethodsTabPreact() {
        // Ocultar otros tabs
        document.querySelectorAll('.editor-tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        document.querySelectorAll('.editor-tab').forEach(tab => {
            tab.classList.remove('active');
            tab.style.borderBottomColor = 'transparent';
            tab.style.color = '#64748b';
        });

        // Mostrar tab Alpine Methods
        alpineContent.style.display = 'block';
        alpineTab.classList.add('active');
        alpineTab.style.borderBottomColor = '#3b82f6';
        alpineTab.style.color = '#3b82f6';

        // Montar componente Preact si no existe
        if (!alpineContent.hasChildNodes()) {
            try {
                const plugin = window.pluginManager?.get('alpine-methods') || 
                              window.alpineMethodsPlugin;

                const editorComponent = createElement(AlpineMethodsInterface, {
                    pluginInstance: plugin,
                    onSave: async (method) => {
                        console.log('💾 Saving method from tab:', method.name);
                    },
                    onLoad: (method) => {
                        console.log('📄 Method loaded in tab:', method.name);
                    }
                });

                render(editorComponent, alpineContent);
                console.log('✅ Alpine Methods tab initialized with Preact');

            } catch (error) {
                console.error('❌ Error initializing Alpine Methods tab:', error);
                alpineContent.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #ef4444;">
                        <h3>Error al cargar Alpine Methods Editor</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        }
    }

    console.log('✅ Alpine Methods tab added to editor system');
}

// ===================================================================
// INTEGRACIÓN CON TU SISTEMA EXISTENTE
// ===================================================================

/**
 * Integrar con tu FinalVisualEditor existente
 */
export function integrateWithFinalVisualEditor() {
    // Buscar tu FinalVisualEditor
    const visualEditor = document.querySelector('[class*="visual-editor"]') ||
                        document.querySelector('#visual-editor') ||
                        document.querySelector('.final-visual-editor');

    if (!visualEditor) {
        console.warn('⚠️ FinalVisualEditor not found for integration');
        return;
    }

    // Agregar botón Alpine Methods al toolbar del editor
    const editorToolbar = visualEditor.querySelector('.editor-toolbar') ||
                         visualEditor.querySelector('[class*="toolbar"]');

    if (editorToolbar) {
        const alpineButton = document.createElement('button');
        alpineButton.innerHTML = `
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
            </svg>
        `;
        alpineButton.className = 'editor-btn alpine-methods-btn';
        alpineButton.title = 'Alpine Methods (Ctrl+Shift+A)';
        alpineButton.onclick = openAlpineMethodsModalPreact;
        
        editorToolbar.appendChild(alpineButton);
        console.log('✅ Alpine Methods button added to FinalVisualEditor toolbar');
    }
}

/**
 * Setup de comandos de teclado para Preact
 */
export function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+A: Abrir Alpine Methods
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            openAlpineMethodsModalPreact();
        }

        // Ctrl+Alt+M: Insertar @method en editor activo
        if (e.ctrlKey && e.altKey && e.key === 'm') {
            e.preventDefault();
            insertAlpineMethodTrigger();
        }
    });

    console.log('✅ Alpine Methods keyboard shortcuts configured');
}

/**
 * Insertar trigger @method en editor activo
 */
function insertAlpineMethodTrigger() {
    const activeEditor = document.querySelector('.cm-editor.cm-focused');
    if (activeEditor && activeEditor.CodeMirror) {
        const view = activeEditor.CodeMirror;
        const pos = view.state.selection.main.head;
        
        view.dispatch({
            changes: { from: pos, insert: '@' },
            selection: { anchor: pos + 1 }
        });
        
        // Trigger autocompletado después de un breve delay
        setTimeout(() => {
            view.requestMeasure();
        }, 100);
    }
}

// ===================================================================
// DETECCIÓN AUTOMÁTICA DE TU SISTEMA
// ===================================================================

/**
 * Auto-detectar y configurar Alpine Methods según tu sistema existente
 */
export async function autoDetectAndSetup(options = {}) {
    try {
        console.log('🔍 Auto-detecting system for Alpine Methods integration...');

        // 1. Siempre inicializar el plugin
        await initializeAlpineMethodsPlugin();
        extendCodeMirrorWithAlpineMethods();

        // 2. Detectar contenedor dedicado
        const dedicatedContainer = document.querySelector('#alpine-methods-editor') ||
                                  document.querySelector('.alpine-methods-container') ||
                                  document.querySelector('[data-alpine-methods]');

        if (dedicatedContainer) {
            await createAlpineMethodsEditor(dedicatedContainer, options);
            console.log('✅ Alpine Methods mounted in dedicated container');
            return;
        }

        // 3. Detectar sistema de tabs
        const tabSystem = document.querySelector('.editor-tabs') ||
                         document.querySelector('.nav-tabs') ||
                         document.querySelector('[class*="tab"]');

        if (tabSystem) {
            setupAlpineMethodsTabPreact();
            console.log('✅ Alpine Methods integrated as tab');
        }

        // 4. Detectar FinalVisualEditor
        const visualEditor = document.querySelector('[class*="visual-editor"]') ||
                            document.querySelector('#visual-editor');

        if (visualEditor) {
            integrateWithFinalVisualEditor();
            console.log('✅ Alpine Methods integrated with FinalVisualEditor');
        }

        // 5. Siempre agregar modal como fallback
        setupAlpineMethodsModalPreact();
        console.log('✅ Alpine Methods modal setup as fallback');

        // 6. Configurar shortcuts de teclado
        setupKeyboardShortcuts();

        // 7. Integrar con PageBuilder si existe
        if (window.pageBuilder || window.pageBuilderInstance) {
            integrateWithPageBuilder(window.pageBuilder || window.pageBuilderInstance);
        }

        console.log('✅ Alpine Methods auto-detection and setup completed');

    } catch (error) {
        console.error('❌ Error in Alpine Methods auto-setup:', error);
    }
}

// ===================================================================
// INICIALIZACIÓN AUTOMÁTICA PARA PREACT
// ===================================================================

/**
 * Inicialización automática cuando el DOM esté listo
 */
if (typeof document !== 'undefined') {
    const autoInit = async () => {
        // Esperar que el sistema de plugins esté disponible
        let attempts = 0;
        const maxAttempts = 10;
        
        const waitForPluginSystem = () => {
            return new Promise((resolve) => {
                const check = () => {
                    if (window.pluginManager || window.alpineMethodsPlugin || attempts >= maxAttempts) {
                        resolve();
                    } else {
                        attempts++;
                        setTimeout(check, 200);
                    }
                };
                check();
            });
        };

        await waitForPluginSystem();
        
        // Ejecutar auto-setup
        setTimeout(() => {
            autoDetectAndSetup({
                apiEndpoint: '/api/templates/alpine-methods',
                enableModal: true,
                enableTab: true,
                enhanceCodeMirror: true
            });
        }, 300);
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }
}

// ===================================================================
// CSS STYLES PARA LA INTEGRACIÓN
// ===================================================================

const alpineMethodsStyles = `
    .alpine-methods-tab.active {
        border-bottom-color: #3b82f6 !important;
        color: #3b82f6 !important;
    }

    .alpine-methods-modal-overlay {
        backdrop-filter: blur(4px);
    }

    .alpine-methods-modal-container {
        box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1);
    }

    .btn-alpine-methods:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .editor-btn.alpine-methods-btn {
        padding: 6px;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        background: white;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s;
    }

    .editor-btn.alpine-methods-btn:hover {
        background: #f8fafc;
        color: #3b82f6;
        border-color: #3b82f6;
    }

    @media (max-width: 768px) {
        .alpine-methods-modal-container {
            width: 100vw !important;
            height: 100vh !important;
            border-radius: 0 !important;
        }
    }
`;

// Inyectar estilos
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = alpineMethodsStyles;
    document.head.appendChild(style);
}

// ===================================================================
// EXPORTS
// ===================================================================

export default {
    setupAlpineMethodsWithPreact,
    autoDetectAndSetup,
    integrateWithFinalVisualEditor,
    setupKeyboardShortcuts,
    openAlpineMethodsModalPreact
};