{{-- resources/views/components/my-custom-block.blade.php --}}

<div class="block-builder-container h-full bg-gray-100" x-data="blockBuilder()" x-init="init()">
    
    {{-- Header Toolbar --}}
    <div class="flex items-center justify-between p-4 bg-white border-b shadow-sm">
        <div class="flex items-center space-x-4">
            <h2 class="text-lg font-semibold text-gray-800 flex items-center">
                🎨 <span class="ml-2">Block Builder</span>
            </h2>
            
            {{-- Theme Selector --}}
            <div class="flex items-center space-x-2">
                <label class="text-sm text-gray-600">Tema:</label>
                <select x-model="selectedTheme" 
                        @change="changeTheme($event.target.value)"
                        class="px-3 py-1 text-sm border rounded-md focus:ring-1 focus:ring-blue-500">
                    <option value="none">Sin tema</option>
                    <option value="modern">Moderno</option>
                    <option value="minimal">Minimalista</option>
                </select>
            </div>
        </div>
        
        {{-- Action Buttons --}}
        <div class="flex items-center space-x-2">
            {{-- Preview Toggle --}}
            <button @click="togglePreview()" 
                    :class="previewMode ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'"
                    class="px-3 py-1 text-sm rounded-md hover:opacity-80 transition-all">
                <span x-text="previewMode ? '👁️ Preview' : '✏️ Edit'"></span>
            </button>
            
            {{-- Export --}}
            <button @click="exportData()" 
                    class="px-3 py-1 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors">
                📥 Export
            </button>
            
            {{-- Import --}}
            <label class="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 cursor-pointer transition-colors">
                📤 Import
                <input type="file" @change="importData($event)" accept=".json" class="hidden">
            </label>
            
            {{-- Clear All --}}
            <button @click="clearAll()" 
                    class="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                🗑️ Clear
            </button>
        </div>
    </div>

    {{-- Main Builder Interface --}}
    <div class="grid grid-cols-12 gap-0 h-[calc(100vh-200px)] min-h-[600px]">
        
        {{-- Blocks Palette (Left Sidebar) --}}
        <div class="col-span-2 bg-gray-50 border-r overflow-y-auto">
            @include('components.block-builder.blocks-palette')
        </div>
        
        {{-- Canvas (Main Area) --}}
        <div class="col-span-7 bg-white overflow-y-auto">
            @include('components.block-builder.canvas')
        </div>
        
        {{-- Settings Panel (Right Sidebar) --}}
        <div class="col-span-3 bg-gray-50 border-l overflow-y-auto">
            @include('components.block-builder.settings-panel')
        </div>
        
    </div>
    
    {{-- Hidden Fields para MoonShine --}}
    <input type="hidden" 
           id="website-structure-data" 
           name="structure" 
           x-model="builderData">
</div>

{{-- Global Styles --}}
<style>
/* Block Palette Styling */
.block-palette-item {
    transition: all 0.2s ease;
    position: relative;
}

.block-palette-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.block-palette-item:active {
    transform: translateY(0);
}

/* Block Wrapper Styling */
.block-wrapper {
    position: relative;
    transition: all 0.2s ease;
}

.block-wrapper:hover {
    z-index: 10;
}

.block-wrapper:hover .absolute {
    opacity: 1 !important;
}

.block-wrapper.selected {
    ring: 2px;
    ring-color: #3b82f6;
    ring-opacity: 0.5;
}

/* Drop Zone Styling */
.drop-zone-active {
    background-color: #dbeafe !important;
    border-color: #3b82f6 !important;
    border-style: dashed !important;
}

/* Grid Helper */
.show-grid {
    background-image: 
        linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px);
    background-size: 20px 20px;
}

/* Keyboard shortcuts styling */
kbd {
    display: inline-block;
    padding: 0.2rem 0.4rem;
    font-size: 0.75rem;
    color: #374151;
    background-color: #f3f4f6;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
}

/* Custom scrollbars */
.overflow-y-auto::-webkit-scrollbar {
    width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
}

/* Animation for new blocks */
@keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.block-container {
    animation: slideInUp 0.3s ease-out;
}

/* Form styling improvements */
input[type="text"], 
input[type="number"], 
input[type="url"], 
textarea, 
select {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input[type="text"]:focus, 
input[type="number"]:focus, 
input[type="url"]:focus, 
textarea:focus, 
select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Responsive adjustments */
@media (max-width: 1024px) {
    .grid.grid-cols-12 {
        grid-template-columns: 1fr 2fr 1fr;
    }
    
    .col-span-2 {
        grid-column: span 1;
    }
    
    .col-span-7 {
        grid-column: span 1;
    }
    
    .col-span-3 {
        grid-column: span 1;
    }
}
</style>

{{-- JavaScript Loading --}}
@push('scripts')
{{-- BLOCK BUILDER - TODO EL CÓDIGO INLINE --}}
<script>
// ============================================================
// BLOCK FACTORY
// ============================================================
class BlockFactory {
    static blocks = new Map();
    
    static register(type, blockClass) {
        this.blocks.set(type, blockClass);
        console.log(`📦 Block registered: ${type}`);
    }
    
    static create(type, data = {}) {
        const BlockClass = this.blocks.get(type);
        if (!BlockClass) {
            console.error(`❌ Block type "${type}" not found`);
            return null;
        }
        
        const block = new BlockClass(data);
        console.log(`✅ Block created: ${type}`, block);
        return block;
    }
    
    static getAvailable() {
        return Array.from(this.blocks.entries()).map(([type, BlockClass]) => ({
            type,
            ...BlockClass.config
        }));
    }
}

// ============================================================
// BASE BLOCK
// ============================================================
class BaseBlock {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.type = data.type || this.constructor.name.toLowerCase();
        this.settings = { ...this.getDefaultSettings(), ...data.settings };
        this.version = '1.0.0';
        this.created_at = data.created_at || new Date().toISOString();
    }
    
    generateId() {
        return `block_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getDefaultSettings() {
        return {};
    }
    
    render() {
        return `<div class="block-wrapper" data-block-id="${this.id}">
            <div class="bg-yellow-100 border border-yellow-400 p-4 rounded">
                <p class="text-yellow-800">⚠️ Block type "${this.type}" needs render() method</p>
            </div>
        </div>`;
    }
    
    getSettingsConfig() {
        return [
            {
                group: 'general',
                label: 'General',
                icon: '⚙️',
                settings: [
                    {
                        key: 'id',
                        type: 'text',
                        label: 'Block ID',
                        value: this.id,
                        readonly: true
                    }
                ]
            }
        ];
    }
    
    export() {
        return {
            id: this.id,
            type: this.type,
            settings: this.settings,
            version: this.version,
            created_at: this.created_at,
            updated_at: new Date().toISOString()
        };
    }
    
    static get config() {
        return {
            label: 'Base Block',
            description: 'Base block class',
            icon: '📦',
            category: 'system'
        };
    }
}

// ============================================================
// CARD BLOCK
// ============================================================
class CardBlock extends BaseBlock {
    constructor(data = {}) {
        super(data);
        this.type = 'card-block';
    }
    
    getDefaultSettings() {
        return {
            title: 'Card Title',
            content: 'This is the card content. You can customize it in the settings panel.',
            image: '',
            link: '',
            buttonText: 'Read More',
            showButton: true,
            backgroundColor: '#ffffff',
            textColor: '#000000',
            borderRadius: '8',
            shadow: 'md'
        };
    }
    
    render() {
        const shadowClass = {
            'none': '',
            'sm': 'shadow-sm',
            'md': 'shadow-md',
            'lg': 'shadow-lg',
            'xl': 'shadow-xl'
        }[this.settings.shadow] || 'shadow-md';
        
        return `
        <div class="block-wrapper relative group cursor-pointer" 
             data-block-id="${this.id}" 
             onclick="window.selectBlock && window.selectBlock('${this.id}')">
            
            <!-- Block Toolbar -->
            <div class="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white px-2 py-1 rounded text-xs flex items-center space-x-2 z-20">
                <span>🃏 Card</span>
                <button onclick="event.stopPropagation(); window.removeBlock && window.removeBlock('${this.id}')" 
                        class="text-red-400 hover:text-red-300">🗑️</button>
            </div>
            
            <!-- Card Content -->
            <div class="card-block ${shadowClass} rounded-lg overflow-hidden transition-all" 
                 style="background-color: ${this.settings.backgroundColor}; 
                        color: ${this.settings.textColor}; 
                        border-radius: ${this.settings.borderRadius}px;">
                
                ${this.settings.image ? `
                    <div class="card-image">
                        <img src="${this.settings.image}" 
                             alt="${this.settings.title}" 
                             class="w-full h-48 object-cover">
                    </div>
                ` : ''}
                
                <div class="card-body p-6">
                    <h3 class="text-xl font-semibold mb-3">${this.settings.title}</h3>
                    <p class="text-gray-600 mb-4 leading-relaxed">${this.settings.content}</p>
                    
                    ${this.settings.showButton && this.settings.buttonText ? `
                        <div class="card-actions">
                            <a href="${this.settings.link || '#'}" 
                               class="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                                ${this.settings.buttonText}
                            </a>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>`;
    }
    
    getSettingsConfig() {
        return [
            {
                group: 'content',
                label: 'Contenido',
                icon: '📝',
                settings: [
                    {
                        key: 'title',
                        type: 'text',
                        label: 'Título',
                        placeholder: 'Ingresa el título...'
                    },
                    {
                        key: 'content',
                        type: 'textarea',
                        label: 'Contenido',
                        rows: 4,
                        placeholder: 'Describe el contenido de la card...'
                    },
                    {
                        key: 'image',
                        type: 'url',
                        label: 'Imagen URL',
                        placeholder: 'https://ejemplo.com/imagen.jpg'
                    }
                ]
            },
            {
                group: 'button',
                label: 'Botón',
                icon: '🔗',
                settings: [
                    {
                        key: 'showButton',
                        type: 'checkbox',
                        label: 'Mostrar botón'
                    },
                    {
                        key: 'buttonText',
                        type: 'text',
                        label: 'Texto del botón',
                        placeholder: 'Leer más'
                    },
                    {
                        key: 'link',
                        type: 'url',
                        label: 'Enlace',
                        placeholder: 'https://ejemplo.com'
                    }
                ]
            },
            {
                group: 'style',
                label: 'Estilo',
                icon: '🎨',
                settings: [
                    {
                        key: 'backgroundColor',
                        type: 'color',
                        label: 'Color de fondo'
                    },
                    {
                        key: 'textColor',
                        type: 'color',
                        label: 'Color de texto'
                    },
                    {
                        key: 'borderRadius',
                        type: 'number',
                        label: 'Border Radius',
                        min: 0,
                        max: 50,
                        unit: 'px'
                    },
                    {
                        key: 'shadow',
                        type: 'select',
                        label: 'Sombra',
                        options: [
                            { value: 'none', label: 'Sin sombra' },
                            { value: 'sm', label: 'Pequeña' },
                            { value: 'md', label: 'Mediana' },
                            { value: 'lg', label: 'Grande' },
                            { value: 'xl', label: 'Extra grande' }
                        ]
                    }
                ]
            }
        ];
    }
    
    static get config() {
        return {
            label: 'Card',
            description: 'Tarjeta con título, contenido y botón opcional',
            icon: '🃏',
            category: 'content'
        };
    }
}

// ============================================================
// GRID CONTAINER BLOCK
// ============================================================
class GridContainer extends BaseBlock {
    constructor(data = {}) {
        super(data);
        this.type = 'grid-container';
    }
    
    getDefaultSettings() {
        return {
            columns: 2,
            gap: '4',
            padding: '6',
            backgroundColor: '#f8fafc'
        };
    }
    
    render() {
        const colsClass = {
            1: 'grid-cols-1',
            2: 'grid-cols-1 md:grid-cols-2',
            3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        }[this.settings.columns] || 'grid-cols-2';
        
        return `
        <div class="block-wrapper relative group cursor-pointer" 
             data-block-id="${this.id}" 
             onclick="window.selectBlock && window.selectBlock('${this.id}')">
            
            <!-- Block Toolbar -->
            <div class="absolute -top-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white px-2 py-1 rounded text-xs flex items-center space-x-2 z-20">
                <span>⊞ Grid</span>
                <button onclick="event.stopPropagation(); window.removeBlock && window.removeBlock('${this.id}')" 
                        class="text-red-400 hover:text-red-300">🗑️</button>
            </div>
            
            <!-- Grid Container -->
            <div class="grid-container rounded-lg p-${this.settings.padding}" 
                 style="background-color: ${this.settings.backgroundColor};">
                <div class="grid ${colsClass} gap-${this.settings.gap}">
                    ${this.generateGridItems()}
                </div>
            </div>
        </div>`;
    }
    
    generateGridItems() {
        let items = '';
        for (let i = 1; i <= this.settings.columns; i++) {
            items += `
                <div class="grid-item bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-32 flex items-center justify-center text-gray-500">
                    <div class="text-center">
                        <div class="text-2xl mb-2">📦</div>
                        <p class="text-sm">Drop zone ${i}</p>
                    </div>
                </div>
            `;
        }
        return items;
    }
    
    getSettingsConfig() {
        return [
            {
                group: 'layout',
                label: 'Layout',
                icon: '⊞',
                settings: [
                    {
                        key: 'columns',
                        type: 'select',
                        label: 'Columnas',
                        options: [
                            { value: 1, label: '1 Columna' },
                            { value: 2, label: '2 Columnas' },
                            { value: 3, label: '3 Columnas' },
                            { value: 4, label: '4 Columnas' }
                        ]
                    },
                    {
                        key: 'gap',
                        type: 'select',
                        label: 'Espaciado',
                        options: [
                            { value: '2', label: 'Pequeño' },
                            { value: '4', label: 'Mediano' },
                            { value: '6', label: 'Grande' },
                            { value: '8', label: 'Extra grande' }
                        ]
                    },
                    {
                        key: 'padding',
                        type: 'select',
                        label: 'Padding',
                        options: [
                            { value: '4', label: 'Pequeño' },
                            { value: '6', label: 'Mediano' },
                            { value: '8', label: 'Grande' }
                        ]
                    }
                ]
            },
            {
                group: 'style',
                label: 'Estilo',
                icon: '🎨',
                settings: [
                    {
                        key: 'backgroundColor',
                        type: 'color',
                        label: 'Color de fondo'
                    }
                ]
            }
        ];
    }
    
    static get config() {
        return {
            label: 'Grid Container',
            description: 'Contenedor con layout de grid responsivo',
            icon: '⊞',
            category: 'layout'
        };
    }
}

// ============================================================
// ALPINE.JS COMPONENT
// ============================================================
function blockBuilder() {
    return {
        // Estado del builder
        blocks: [],
        selectedBlock: null,
        selectedCategory: 'all',
        selectedTheme: 'none',
        previewMode: false,
        showGrid: false,
        builderData: '[]',
        
        // Inicialización
        init() {
            console.log('🚀 Initializing Block Builder...');
            
            // Registrar bloques
            BlockFactory.register('card-block', CardBlock);
            BlockFactory.register('grid-container', GridContainer);
            
            console.log('📦 Available blocks:', BlockFactory.getAvailable().map(b => b.type));
            
            // Event listeners
            this.setupEventListeners();
            
            // Funciones globales para interacción
            window.selectBlock = (blockId) => this.selectBlock(blockId);
            window.removeBlock = (blockId) => this.removeBlock(blockId);
            
            console.log('✅ Block Builder initialized!');
        },
        
        setupEventListeners() {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Delete' && this.selectedBlock) {
                    this.removeBlock(this.selectedBlock.id);
                }
                if (e.key === 'Escape') {
                    this.selectedBlock = null;
                }
            });
        },
        
        // Gestión de bloques
        addBlock(type, data = {}) {
            const block = BlockFactory.create(type, data);
            if (block) {
                this.blocks.push(block);
                this.selectedBlock = block;
                this.updateBuilderData();
                console.log('✅ Block added:', type);
            }
        },
        
        removeBlock(blockId) {
            const index = this.blocks.findIndex(b => b.id === blockId);
            if (index !== -1) {
                this.blocks.splice(index, 1);
                if (this.selectedBlock?.id === blockId) {
                    this.selectedBlock = null;
                }
                this.updateBuilderData();
                console.log('🗑️ Block removed:', blockId);
            }
        },
        
        selectBlock(blockId) {
            this.selectedBlock = this.blocks.find(b => b.id === blockId) || null;
            console.log('🎯 Block selected:', this.selectedBlock?.type);
        },
        
        // Configuración de bloques
        updateBlockSetting(key, value) {
            if (!this.selectedBlock) return;
            
            // Manejar claves anidadas
            const keys = key.split('.');
            let target = this.selectedBlock.settings;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!target[keys[i]]) target[keys[i]] = {};
                target = target[keys[i]];
            }
            
            target[keys[keys.length - 1]] = value;
            this.updateBuilderData();
            
            console.log('⚙️ Setting updated:', key, '=', value);
        },
        
        // Datos del builder
        updateBuilderData() {
            const data = this.blocks.map(block => block.export());
            this.builderData = JSON.stringify(data);
            
            // Integración con MoonShine
            if (window.updateMoonShineField) {
                window.updateMoonShineField(data);
            }
        },
        
        // Utilidades
        getAvailableBlocks() {
            const available = BlockFactory.getAvailable();
            if (this.selectedCategory === 'all') return available;
            return available.filter(block => block.category === this.selectedCategory);
        },
        
        getCategories() {
            const available = BlockFactory.getAvailable();
            const categories = [...new Set(available.map(b => b.category))];
            
            return [
                { id: 'all', label: 'Todos', count: available.length },
                ...categories.map(cat => ({
                    id: cat,
                    label: cat.charAt(0).toUpperCase() + cat.slice(1),
                    count: available.filter(b => b.category === cat).length
                }))
            ];
        },
        
        // Funcionalidades adicionales
        togglePreview() {
            this.previewMode = !this.previewMode;
            console.log('👁️ Preview mode:', this.previewMode);
        },
        
        changeTheme(theme) {
            this.selectedTheme = theme;
            console.log('🎨 Theme changed to:', theme);
        },
        
        exportData() {
            const data = JSON.parse(this.builderData);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'block-builder-export.json';
            a.click();
            URL.revokeObjectURL(url);
            console.log('📥 Data exported');
        },
        
        importData(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.blocks = data.map(blockData => BlockFactory.create(blockData.type, blockData));
                        this.updateBuilderData();
                        console.log('📤 Data imported:', data.length, 'blocks');
                    } catch (error) {
                        console.error('❌ Import failed:', error);
                    }
                };
                reader.readAsText(file);
            }
        },
        
        clearAll() {
            if (confirm('¿Estás seguro de que quieres eliminar todos los bloques?')) {
                this.blocks = [];
                this.selectedBlock = null;
                this.updateBuilderData();
                console.log('🗑️ All blocks cleared');
            }
        }
    };
}

// ============================================================
// MAGIC METHODS PARA ALPINE
// ============================================================
document.addEventListener('alpine:init', () => {
    // Magic method para acceder a valores anidados
    Alpine.addMagic('getNestedValue', () => {
        return (obj, path) => {
            if (!obj || !path) return '';
            return path.split('.').reduce((current, key) => {
                return current && current[key] !== undefined ? current[key] : '';
            }, obj);
        };
    });
});

// ============================================================
// INICIALIZACIÓN
// ============================================================
// Hacer la función disponible globalmente
window.blockBuilder = blockBuilder;

// Función para conectar con MoonShine
window.updateMoonShineField = function(data) {
    const field = document.getElementById('website-structure-field');
    if (field) {
        field.value = JSON.stringify(data);
        field.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('✅ MoonShine field updated with', data.length, 'blocks');
    } else {
        console.warn('⚠️ MoonShine field not found');
    }
};

// Debug helpers
window.BlockBuilderDebug = {
    getBlocks: () => {
        const builderEl = document.querySelector('[x-data*="blockBuilder"]');
        return builderEl ? Alpine.$data(builderEl).blocks : [];
    },
    exportJSON: () => {
        const builderEl = document.querySelector('[x-data*="blockBuilder"]');
        if (builderEl) {
            const data = Alpine.$data(builderEl).builderData;
            console.log('Current builder data:', JSON.parse(data));
            return JSON.parse(data);
        }
        return null;
    }
};

console.log('🎉 Alpine Block Builder Integration loaded!');
console.log('📦 Available blocks:', ['card-block', 'grid-container']);

// Verificar que todo esté cargado
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('✅ Alpine.js disponible:', typeof Alpine !== 'undefined');
        console.log('✅ blockBuilder function:', typeof window.blockBuilder !== 'undefined');
        console.log('🎉 Block Builder loaded successfully!');
        console.log('🔧 Debug helpers available at window.BlockBuilderDebug');
    }, 100);
});
</script>
@endpush