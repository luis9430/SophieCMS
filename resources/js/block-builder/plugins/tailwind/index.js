// ===================================================================
// resources/js/block-builder/plugins/tailwind/index.js
// Plugin Tailwind - VERSIÓN FINAL OPTIMIZADA (Sin archivo gigante)
// ===================================================================

import { getTailwindCompletions } from './editor.js';

// Lista optimizada de clases más importantes para page builders
// Solo las que realmente necesitas para autocompletado
const generatedClasses = [
    // Layout esencial
    'flex', 'block', 'inline', 'inline-block', 'hidden', 'grid',
    'relative', 'absolute', 'fixed', 'sticky', 'static',
    
    // Flexbox más usado
    'flex-row', 'flex-col', 'flex-wrap', 'items-center', 'items-start', 'items-end', 
    'justify-center', 'justify-between', 'justify-start', 'justify-end',
    'flex-1', 'flex-auto', 'flex-none',
    
    // Grid básico
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-6', 'grid-cols-12',
    'col-span-1', 'col-span-2', 'col-span-3', 'col-span-4', 'col-span-6', 'col-span-12',
    'gap-2', 'gap-4', 'gap-6', 'gap-8',
    
    // Spacing crítico (solo valores más usados)
    'p-0', 'p-1', 'p-2', 'p-3', 'p-4', 'p-6', 'p-8',
    'px-2', 'px-4', 'px-6', 'px-8', 'py-2', 'py-4', 'py-6', 'py-8',
    'm-0', 'm-2', 'm-4', 'm-6', 'm-8', 'm-auto',
    'mx-2', 'mx-4', 'mx-6', 'mx-8', 'mx-auto', 'my-2', 'my-4', 'my-6', 'my-8',
    
    // Sizing esencial
    'w-full', 'w-auto', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4',
    'w-4', 'w-6', 'w-8', 'w-12', 'w-16', 'w-20', 'w-24', 'w-32', 'w-48', 'w-64', 'w-96',
    'h-full', 'h-auto', 'h-screen', 'h-1/2', 'h-1/3', 'h-2/3', 'h-1/4', 'h-3/4',
    'h-4', 'h-6', 'h-8', 'h-12', 'h-16', 'h-20', 'h-24', 'h-32', 'h-48', 'h-64', 'h-96',
    
    // Colors más usados en page builders
    'bg-white', 'bg-black', 'bg-transparent',
    'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-gray-300', 'bg-gray-500', 'bg-gray-700', 'bg-gray-900',
    'bg-blue-50', 'bg-blue-100', 'bg-blue-500', 'bg-blue-600', 'bg-blue-700',
    'bg-red-50', 'bg-red-100', 'bg-red-500', 'bg-red-600', 'bg-red-700',
    'bg-green-50', 'bg-green-100', 'bg-green-500', 'bg-green-600', 'bg-green-700',
    'bg-yellow-50', 'bg-yellow-100', 'bg-yellow-400', 'bg-yellow-500',
    'bg-purple-50', 'bg-purple-100', 'bg-purple-500', 'bg-purple-600',
    
    'text-white', 'text-black', 'text-transparent',
    'text-gray-400', 'text-gray-500', 'text-gray-600', 'text-gray-700', 'text-gray-800', 'text-gray-900',
    'text-blue-500', 'text-blue-600', 'text-blue-700',
    'text-red-500', 'text-red-600', 'text-red-700',
    'text-green-500', 'text-green-600', 'text-green-700',
    
    // Typography esencial
    'text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',
    'text-left', 'text-center', 'text-right',
    'font-normal', 'font-medium', 'font-semibold', 'font-bold',
    'uppercase', 'lowercase', 'capitalize',
    'underline', 'no-underline',
    
    // Borders básicos
    'border', 'border-0', 'border-2', 'border-t', 'border-b',
    'border-gray-200', 'border-gray-300', 'border-blue-500',
    'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-full',
    
    // Effects
    'shadow', 'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl',
    'opacity-0', 'opacity-50', 'opacity-75', 'opacity-100',
    
    // Interactive crítico
    'cursor-pointer', 'cursor-default', 'cursor-not-allowed',
    'transition', 'duration-200', 'duration-300',
    'pointer-events-none', 'pointer-events-auto',
    
    // Hover states críticos
    'hover:bg-gray-100', 'hover:bg-gray-200', 'hover:bg-blue-500', 'hover:bg-blue-600',
    'hover:text-white', 'hover:text-blue-600', 'hover:shadow-lg',
    
    // Focus states
    'focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500',
    
    // Responsive más usado
    'sm:block', 'sm:hidden', 'sm:flex', 'sm:w-full', 'sm:w-1/2',
    'md:block', 'md:hidden', 'md:flex', 'md:w-full', 'md:w-1/2', 'md:grid-cols-2', 'md:grid-cols-3',
    'lg:block', 'lg:hidden', 'lg:flex', 'lg:w-full', 'lg:w-1/3', 'lg:grid-cols-3', 'lg:grid-cols-4',
    'xl:grid-cols-4', 'xl:grid-cols-6'
];

const tailwindPlugin = {
    name: 'tailwind',
    version: '2.0.0',
    dependencies: [],
    
    async init(context) {
        console.log('✅ Tailwind CSS Plugin Initialized (Optimized)');
        console.log(`🎨 ${generatedClasses.length} clases esenciales para autocompletado`);
        console.log('🚀 CDN JIT manejará cualquier clase adicional dinámicamente');
        
        return this;
    },

    // ===================================================================
    // AUTOCOMPLETADO MEJORADO
    // ===================================================================
    
    getEditorCompletions(context) {
        try {
            return getTailwindCompletions(context, generatedClasses);
        } catch (error) {
            console.error('❌ Error en autocompletado Tailwind:', error);
            return [];
        }
    },

    // ===================================================================
    // TEMPLATE PREVIEW - CDN CON PERSISTENCE INTELIGENTE
    // ===================================================================
    
    getPreviewTemplate() {
        // Pre-cargar solo las clases más críticas para mejor performance
        const preloadedClasses = this._generateSmartPreloader();
        
        return `
            <!-- 🎯 Pre-cargar clases críticas para JIT -->
            <div style="display: none !important;" aria-hidden="true" id="tw-preloader">
                ${preloadedClasses}
            </div>
            
            <!-- 🚀 Tailwind CDN con JIT -->
            <script src="https://cdn.tailwindcss.com"></script>
            
            <!-- ⚙️ Configuración optimizada -->
            <script>
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                'primary': '#3B82F6',
                                'secondary': '#6B7280'
                            }
                        }
                    }
                }
                
                // 🔄 Función para scan manual cuando sea necesario
                window.tailwindScan = function() {
                    if (window.tailwind && window.tailwind.scan) {
                        window.tailwind.scan();
                        console.log('🔄 Tailwind JIT scan ejecutado');
                    }
                };
                
                // 🎯 Auto-scan después de cargar
                document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(() => {
                        window.tailwindScan();
                    }, 100);
                });
            </script>
        `;
    },
    
    /**
     * Genera un preloader inteligente con solo las clases más críticas
     * @private
     */
    _generateSmartPreloader() {
        // Dividir en grupos lógicos para mejor organización
        const criticalGroups = {
            layout: ['flex', 'block', 'grid', 'hidden', 'relative', 'absolute'],
            spacing: ['p-4', 'p-6', 'p-8', 'm-4', 'm-6', 'm-8', 'mx-auto'],
            colors: ['bg-white', 'bg-gray-100', 'bg-blue-500', 'text-black', 'text-white', 'text-gray-700'],
            interactive: ['cursor-pointer', 'hover:bg-gray-100', 'focus:outline-none', 'transition']
        };
        
        let preloaderHTML = '';
        
        Object.entries(criticalGroups).forEach(([group, classes]) => {
            preloaderHTML += `<div class="${classes.join(' ')}" data-group="${group}"></div>\n`;
        });
        
        return preloaderHTML;
    },

    /**
     * Agregar clases dinámicamente sin recarga (mejorado)
     */
    addDynamicClasses(iframe, newClasses) {
        if (!Array.isArray(newClasses) || newClasses.length === 0) return;
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
            console.warn('⚠️ No se puede acceder al documento del iframe');
            return;
        }
        
        // Encontrar o crear el preloader
        let preloader = iframeDoc.getElementById('tw-preloader');
        if (!preloader) {
            preloader = iframeDoc.createElement('div');
            preloader.id = 'tw-preloader';
            preloader.style.display = 'none !important';
            preloader.setAttribute('aria-hidden', 'true');
            iframeDoc.body.appendChild(preloader);
        }
        
        // Crear elemento temporal con las nuevas clases
        const tempDiv = iframeDoc.createElement('div');
        tempDiv.className = newClasses.join(' ');
        tempDiv.setAttribute('data-dynamic', 'true');
        preloader.appendChild(tempDiv);
        
        // Trigger scan de Tailwind
        if (iframe.contentWindow?.tailwindScan) {
            iframe.contentWindow.tailwindScan();
        }
        
        console.log(`✨ Agregadas ${newClasses.length} clases dinámicas:`, newClasses);
    },

    // ===================================================================
    // FUNCIONES BÁSICAS OPTIMIZADAS
    // ===================================================================
    
    hasClass(className) {
        return generatedClasses.includes(className);
    },
    
    findSimilarClasses(searchTerm, limit = 10) {
        if (!searchTerm) return [];
        
        const term = searchTerm.toLowerCase();
        return generatedClasses
            .filter(cls => cls.toLowerCase().includes(term))
            .slice(0, limit)
            .map(cls => ({
                label: cls,
                type: 'class',
                info: 'Tailwind CSS',
                detail: this._getClassDescription(cls),
                boost: this._getClassBoost(cls, term)
            }));
    },
    
    getAllClasses() {
        return [...generatedClasses];
    },
    
    getStats() {
        return {
            name: this.name,
            version: this.version,
            totalClasses: generatedClasses.length,
            status: 'optimized',
            lastLoaded: new Date().toISOString(),
            memoryUsage: `~${Math.round(JSON.stringify(generatedClasses).length / 1024)}KB`
        };
    },

    // ===================================================================
    // UTILIDADES INTERNAS
    // ===================================================================
    
    _getClassDescription(className) {
        const patterns = {
            'bg-': 'Background color',
            'text-': className.match(/^text-(xs|sm|base|lg|xl)/) ? 'Text size' : 'Text color',
            'p-': 'Padding', 'px-': 'Horizontal padding', 'py-': 'Vertical padding',
            'm-': 'Margin', 'mx-': 'Horizontal margin', 'my-': 'Vertical margin',
            'w-': 'Width', 'h-': 'Height',
            'flex': 'Flexbox layout', 'grid': 'Grid layout', 'block': 'Block display',
            'rounded': 'Border radius', 'shadow': 'Box shadow', 'border': 'Border',
            'hover:': 'Hover state', 'focus:': 'Focus state',
            'cursor-': 'Cursor style', 'transition': 'CSS transition'
        };
        
        for (const [pattern, description] of Object.entries(patterns)) {
            if (className.startsWith(pattern) || className.includes(pattern)) {
                return description;
            }
        }
        return 'Tailwind utility class';
    },
    
    _getClassBoost(className, searchTerm) {
        let boost = 50;
        if (className === searchTerm) boost += 100;
        if (className.startsWith(searchTerm)) boost += 50;
        
        const veryCommon = ['flex', 'block', 'hidden', 'w-full', 'h-full', 'p-4', 'm-4'];
        if (veryCommon.includes(className)) boost += 30;
        
        const common = ['bg-', 'text-', 'p-', 'm-', 'cursor-pointer', 'transition'];
        if (common.some(pattern => className.includes(pattern))) boost += 25;
        
        return boost;
    },

    // ===================================================================
    // DEBUG Y UTILIDADES
    // ===================================================================
    
    debugPreview(iframe) {
        const doc = iframe?.contentDocument;
        const preloader = doc?.getElementById('tw-preloader');
        const tailwindScript = doc?.querySelector('script[src*="tailwindcss"]');
        
        const debugInfo = {
            iframeLoaded: !!doc,
            preloaderExists: !!preloader,
            preloaderClasses: preloader?.children?.length || 0,
            tailwindLoaded: !!tailwindScript,
            tailwindAvailable: !!iframe?.contentWindow?.tailwind,
            scanAvailable: !!iframe?.contentWindow?.tailwindScan
        };
        
        console.log('🔍 Debug Preview:', debugInfo);
        
        if (preloader) {
            const dynamicDivs = Array.from(preloader.querySelectorAll('[data-dynamic="true"]'));
            console.log('📋 Clases dinámicas agregadas:', 
                dynamicDivs.map(div => div.className).filter(Boolean)
            );
        }
        
        return { iframe, preloader, tailwind: iframe?.contentWindow?.tailwind, debugInfo };
    }
};

// ===================================================================
// EXPORTACIÓN Y DEBUG
// ===================================================================

export default tailwindPlugin;

if (process.env.NODE_ENV === 'development') {
    window.tailwindPlugin = tailwindPlugin;
    window.tailwindClasses = generatedClasses;
    
    console.log('🔧 Tailwind plugin optimizado expuesto para debugging');
    console.log(`📊 ${generatedClasses.length} clases en memoria (~${Math.round(JSON.stringify(generatedClasses).length / 1024)}KB)`);
}