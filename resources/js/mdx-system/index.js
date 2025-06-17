// ===================================================================
// resources/js/mdx-system/index.js - ENTRY POINT
// ===================================================================

// Exportar solo lo que existe
export { MDXEngine } from './core/MDXEngine.js';
export { ComponentRegistry } from './core/ComponentRegistry.js';
export { TemplateManager } from './core/TemplateManager.js';
export { default as MDXEditor } from './editor/MDXEditor.jsx';
// Exportar componentes por defecto
//export * from './components/index.js';

// Hook principal para usar el sistema
export { useMDXSystem } from './hooks/useMDXSystem.js';