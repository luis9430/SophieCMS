// ===================================================================
// resources/js/block-builder/plugins/tailwind/index.js
// Plugin Tailwind - VERSIÓN SIMPLE CON CDN
// ===================================================================

import { getTailwindCompletions } from './editor.js';

// Lista básica para autocompletado
const basicClasses = [
    'flex', 'block', 'hidden', 'grid', 'relative', 'absolute',
    'p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'p-8',
    'm-1', 'm-2', 'm-3', 'm-4', 'm-6', 'm-8', 'm-auto',
    'w-full', 'w-auto', 'w-1/2', 'w-1/3', 'w-1/4',
    'h-full', 'h-auto', 'h-screen',
    'bg-white', 'bg-gray-100', 'bg-gray-200', 'bg-blue-500', 'bg-red-500', 'bg-green-500',
    'text-white', 'text-black', 'text-gray-700', 'text-blue-600',
    'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl',
    'font-normal', 'font-medium', 'font-bold',
    'border', 'rounded', 'shadow', 'cursor-pointer', 'transition',
    'hover:bg-gray-100', 'hover:bg-blue-600', 'focus:outline-none'
];

const tailwindPlugin = {
    name: 'tailwind',
    version: '1.0.0',
    dependencies: [],
    
    async init(context) {
        console.log('✅ Tailwind Plugin Simple Inicializado');
        return this;
    },

    getEditorCompletions(context) {
        try {
            return getTailwindCompletions(context, basicClasses);
        } catch (error) {
            console.error('❌ Error en autocompletado:', error);
            return [];
        }
    },

    getPreviewTemplate() {
        return `
            <script src="https://cdn.tailwindcss.com"></script>
            <script>
                // Configuración básica
                tailwind.config = {
                    theme: {
                        extend: {}
                    }
                }
                
                // Función de scan global
                window.scanTailwind = function() {
                    if (window.tailwind && window.tailwind.scan) {
                        window.tailwind.scan();
                        console.log('🔄 Tailwind escaneado');
                    }
                };
                
                // Observer simple para cambios
                function setupObserver() {
                    if (!window.tailwind || !window.tailwind.scan) {
                        setTimeout(setupObserver, 50);
                        return;
                    }
                    
                    const observer = new MutationObserver(function() {
                        clearTimeout(window.scanTimeout);
                        window.scanTimeout = setTimeout(window.scanTailwind, 10);
                    });
                    
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['class']
                    });
                    
                    // Scan inicial
                    window.scanTailwind();
                    console.log('✅ Observer activo');
                }
                
                // Inicializar
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', setupObserver);
                } else {
                    setupObserver();
                }
            </script>
        `;
    },

    // Funciones básicas
    hasClass(className) {
        return basicClasses.includes(className);
    },
    
    getAllClasses() {
        return [...basicClasses];
    },
    
    getStats() {
        return {
            name: this.name,
            version: this.version,
            totalClasses: basicClasses.length,
            status: 'active'
        };
    }
};

export default tailwindPlugin;

// Debug en desarrollo
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.tailwindPlugin = tailwindPlugin;
    console.log('🔧 Plugin Tailwind simple disponible en window.tailwindPlugin');
}