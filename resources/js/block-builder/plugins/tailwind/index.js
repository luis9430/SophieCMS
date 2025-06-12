// ===================================================================
// resources/js/block-builder/plugins/tailwind/index.js
// Plugin Tailwind actualizado con safelist automático
// ===================================================================

import { getTailwindCompletions } from './editor';

// Importar clases generadas (se creará cuando ejecutes el script)
let generatedClasses;
try {
    const { pageBuilderTailwindClasses } = await import('./generated-classes.js');
    generatedClasses = pageBuilderTailwindClasses;
} catch (error) {
    console.warn('⚠️ Clases generadas no encontradas. Ejecuta: npm run generate-safelist');
    generatedClasses = [];
}

const tailwindPlugin = {
    name: 'tailwind',
    version: '2.0.0',
    
    init() {
        console.log('✅ Tailwind CSS Plugin Initialized');
        console.log(`🎨 ${generatedClasses.length} clases disponibles para autocompletado`);
        return this;
    },

    // ===================================================================
    // AUTOCOMPLETADO MEJORADO
    // ===================================================================
    
    getEditorCompletions(context) {
        return getTailwindCompletions(context, generatedClasses);
    },

    // ===================================================================
    // TEMPLATE PREVIEW
    // ===================================================================
    
    getPreviewTemplate() {
        // Usar CSS compilado de Laravel
        return `<link rel="stylesheet" href="/build/assets/app-CjlCKX9p.css">`;
    },

    // ===================================================================
    // SAFELIST MANAGEMENT
    // ===================================================================
    
    /**
     * Buscar clases similares para sugerencias
     */
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
    
    /**
     * Obtener clases por categoría
     */
    getClassesByCategory(category) {
        const categories = {
            colors: /^(.*-)?(bg|text|border|ring|decoration|outline|shadow)-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose|white|black)-/,
            spacing: /^(.*-)?(p|m|gap|space|top|right|bottom|left|inset)-/,
            layout: /^(.*)?(flex|grid|block|inline|hidden|static|fixed|absolute|relative|sticky)/,
            typography: /^(.*)?(text|font|leading|tracking|decoration|uppercase|lowercase|capitalize|italic)-/,
            sizing: /^(.*)?(w|h|min-w|min-h|max-w|max-h)-/,
            effects: /^(.*)?(shadow|rounded|opacity|blur|brightness|contrast|grayscale|hue-rotate|invert|saturate|sepia)-/
        };
        
        const pattern = categories[category];
        if (!pattern) return [];
        
        return generatedClasses.filter(cls => pattern.test(cls));
    },

    // ===================================================================
    // VALIDACIÓN DE CLASES
    // ===================================================================
    
    /**
     * Validar clases en código HTML
     */
    validateClasses(htmlCode) {
        const classPattern = /class=["']([^"']+)["']/g;
        const issues = [];
        let match;
        
        while ((match = classPattern.exec(htmlCode)) !== null) {
            const classes = match[1].split(/\s+/).filter(Boolean);
            
            classes.forEach(cls => {
                if (!this.hasClass(cls)) {
                    const suggestions = this.findSimilarClasses(cls, 3);
                    
                    issues.push({
                        type: 'unknown-class',
                        message: `Clase Tailwind desconocida: "${cls}"`,
                        class: cls,
                        line: this._getLineNumber(htmlCode, match.index),
                        suggestions: suggestions.map(s => s.label),
                        severity: 'warning'
                    });
                }
            });
        }
        
        return issues;
    },

    // ===================================================================
    // UTILIDADES INTERNAS
    // ===================================================================
    
    /**
     * Obtener descripción de una clase
     * @private
     */
    _getClassDescription(className) {
        // Mapeo básico de patrones comunes a descripciones
        const patterns = {
            'bg-': 'Background color',
            'text-': 'Text color/size',
            'p-': 'Padding',
            'm-': 'Margin',
            'w-': 'Width',
            'h-': 'Height',
            'flex': 'Flexbox layout',
            'grid': 'Grid layout',
            'rounded': 'Border radius',
            'shadow': 'Box shadow',
            'hover:': 'Hover state',
            'focus:': 'Focus state',
            'md:': 'Medium screens+',
            'lg:': 'Large screens+',
            'xl:': 'Extra large screens+'
        };
        
        for (const [pattern, description] of Object.entries(patterns)) {
            if (className.includes(pattern)) {
                return description;
            }
        }
        
        return 'Tailwind utility class';
    },
    
    /**
     * Calcular boost para ordenamiento de sugerencias
     * @private
     */
    _getClassBoost(className, searchTerm) {
        let boost = 50; // Base boost
        
        // Boost por coincidencia exacta
        if (className === searchTerm) boost += 100;
        
        // Boost por inicio de palabra
        if (className.startsWith(searchTerm)) boost += 50;
        
        // Boost por clases comunes del page builder
        const commonClasses = [
            'flex', 'block', 'hidden', 'bg-', 'text-', 'p-', 'm-',
            'cursor-pointer', 'transition', 'hover:', 'focus:'
        ];
        
        if (commonClasses.some(common => className.includes(common))) {
            boost += 25;
        }
        
        // Boost por responsive y states
        if (className.includes('md:') || className.includes('lg:')) boost += 15;
        if (className.includes('hover:') || className.includes('focus:')) boost += 20;
        
        return boost;
    },
    
    /**
     * Obtener número de línea para errores
     * @private
     */
    _getLineNumber(text, index) {
        return text.substring(0, index).split('\n').length;
    },

    // ===================================================================
    // INTEGRACIÓN CON EDITOR
    // ===================================================================
    
    /**
     * Formatear código con clases Tailwind (ordenar, limpiar duplicados)
     */
    formatTailwindClasses(htmlCode) {
        return htmlCode.replace(/class=["']([^"']+)["']/g, (match, classString) => {
            const classes = classString
                .split(/\s+/)
                .filter(Boolean)
                .filter((cls, index, arr) => arr.indexOf(cls) === index) // Remover duplicados
                .sort(this._sortTailwindClasses.bind(this));
            
            return `class="${classes.join(' ')}"`;
        });
    },
    
    /**
     * Ordenar clases Tailwind por prioridad lógica
     * @private
     */
    _sortTailwindClasses(a, b) {
        const order = [
            'flex', 'grid', 'block', 'inline', 'hidden', // Layout primero
            'relative', 'absolute', 'fixed', 'sticky', // Position
            'w-', 'h-', 'min-', 'max-', // Sizing
            'p-', 'px-', 'py-', 'pt-', 'pr-', 'pb-', 'pl-', // Padding
            'm-', 'mx-', 'my-', 'mt-', 'mr-', 'mb-', 'ml-', // Margin
            'bg-', 'text-', 'border-', // Colors
            'rounded', 'shadow', // Effects
            'transition', 'duration', 'ease', // Transitions
            'hover:', 'focus:', 'active:', // States
            'md:', 'lg:', 'xl:', '2xl:' // Responsive
        ];
        
        const aIndex = order.findIndex(prefix => a.startsWith(prefix));
        const bIndex = order.findIndex(prefix => b.startsWith(prefix));
        
        if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
        }
        
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return a.localeCompare(b);
    },

    // ===================================================================
    // DEBUGGING Y ESTADÍSTICAS
    // ===================================================================
    
    /**
     * Obtener estadísticas del plugin
     */
    getStats() {
        return {
            totalClasses: generatedClasses.length,
            categoriesAvailable: [
                'colors', 'spacing', 'layout', 'typography', 
                'sizing', 'effects', 'responsive', 'states'
            ],
            lastGenerated: 'Check generated-classes.js file',
            version: this.version
        };
    },
    
    /**
     * Analizar uso de Tailwind en código
     */
    analyzeUsage(htmlCode) {
        const classPattern = /class=["']([^"']+)["']/g;
        const usedClasses = new Set();
        const unknownClasses = new Set();
        const duplicateClasses = new Set();
        let match;
        
        while ((match = classPattern.exec(htmlCode)) !== null) {
            const classes = match[1].split(/\s+/).filter(Boolean);
            const seenInThisElement = new Set();
            
            classes.forEach(cls => {
                if (seenInThisElement.has(cls)) {
                    duplicateClasses.add(cls);
                }
                seenInThisElement.add(cls);
                
                if (this.hasClass(cls)) {
                    usedClasses.add(cls);
                } else {
                    unknownClasses.add(cls);
                }
            });
        }
        
        return {
            totalElements: (htmlCode.match(/class=/g) || []).length,
            totalClasses: usedClasses.size + unknownClasses.size,
            validClasses: usedClasses.size,
            unknownClasses: Array.from(unknownClasses),
            duplicateClasses: Array.from(duplicateClasses),
            coverage: Math.round((usedClasses.size / generatedClasses.length) * 100 * 100) / 100,
            suggestions: Array.from(unknownClasses).map(cls => ({
                class: cls,
                suggestions: this.findSimilarClasses(cls, 3).map(s => s.label)
            }))
        };
    },

    // ===================================================================
    // CONFIGURACIÓN
    // ===================================================================
    
    /**
     * Recargar clases generadas
     */
    async reloadClasses() {
        try {
            // Recargar el módulo de clases generadas
            delete require.cache[require.resolve('./generated-classes.js')];
            const { pageBuilderTailwindClasses } = await import('./generated-classes.js');
            generatedClasses = pageBuilderTailwindClasses;
            
            console.log(`🔄 Clases Tailwind recargadas: ${generatedClasses.length} disponibles`);
            return true;
        } catch (error) {
            console.error('❌ Error recargando clases:', error);
            return false;
        }
    }
};

