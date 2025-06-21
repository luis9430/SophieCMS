// resources/js/component-preview.js - Optimizado
// 🎯 Este archivo se usa SOLO para previews de componentes
// NO inicializa Alpine ni librerías - usa el sistema centralizado

class ComponentPreview {
    constructor() {
        this.isReady = false;
        this.requiredLibraries = new Set();
        this.previewComponents = new Map();
        
        console.log('🖼️ ComponentPreview initializing...');
        this.init();
    }

    async init() {
        try {
            // Esperar a que la aplicación principal esté lista
            await this.waitForApp();
            
            // Registrar componentes específicos del preview
            this.registerPreviewComponents();
            
            // Detectar y cargar librerías necesarias del DOM
            await this.autoDetectAndLoadLibraries();
            
            this.isReady = true;
            console.log('✅ ComponentPreview ready');
            
        } catch (error) {
            console.error('❌ ComponentPreview initialization failed:', error);
        }
    }

    /**
     * Esperar a que la aplicación principal esté disponible
     */
    async waitForApp(timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (window.App && window.App.isInitialized) {
                resolve(window.App);
                return;
            }

            const checkInterval = setInterval(() => {
                if (window.App && window.App.isInitialized) {
                    clearInterval(checkInterval);
                    resolve(window.App);
                }
            }, 100);

            // Timeout
            setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error('App not ready within timeout'));
            }, timeout);

            // También escuchar el evento app:ready
            document.addEventListener('app:ready', () => {
                clearInterval(checkInterval);
                resolve(window.App);
            }, { once: true });
        });
    }

    /**
     * Auto-detectar librerías necesarias desde el DOM
     */
    async autoDetectAndLoadLibraries() {
        const detectionPatterns = {
            gsap: [
                'x-data="gsapFade"',
                'x-data="gsapReveal"',
                'x-data="gsapSlider"',
                '@gsap',
                'data-gsap'
            ],
            fullcalendar: [
                'x-data="fullCalendar"',
                'x-data="calendar"',
                '.calendar-container',
                '[data-calendar]'
            ],
            swiper: [
                'x-data="swiper"',
                '.swiper-container',
                '.swiper'
            ]
        };

        const bodyHTML = document.body.innerHTML;

        for (const [library, patterns] of Object.entries(detectionPatterns)) {
            const found = patterns.some(pattern => bodyHTML.includes(pattern));
            
            if (found) {
                this.requiredLibraries.add(library);
                console.log(`🔍 Auto-detected library: ${library}`);
                
                try {
                    await window.App.loadLibrary(library);
                    console.log(`📚 ${library} loaded for preview`);
                } catch (error) {
                    console.warn(`⚠️ Failed to load ${library}:`, error);
                }
            }
        }
    }

    /**
     * Registrar componentes específicos para previews
     */
    registerPreviewComponents() {
        // Componente de preview wrapper
        window.App.registerComponent('previewWrapper', (config = {}) => ({
            isLoading: true,
            hasErrors: false,
            errorMessage: '',
            
            init() {
                this.$nextTick(() => {
                    this.isLoading = false;
                    this.initializeChildComponents();
                });
            },
            
            initializeChildComponents() {
                // Buscar componentes que necesiten inicialización especial
                const gsapElements = this.$el.querySelectorAll('[x-data*="gsap"]');
                const calendarElements = this.$el.querySelectorAll('[x-data*="calendar"]');
                
                console.log(`🔧 Found ${gsapElements.length} GSAP components`);
                console.log(`📅 Found ${calendarElements.length} calendar components`);
            },
            
            handleError(error) {
                this.hasErrors = true;
                this.errorMessage = error.message || 'Error desconocido';
                console.error('Preview error:', error);
            }
        }));

        // Componente de grid responsive para previews
        window.App.registerComponent('previewGrid', (config = {}) => ({
            columns: config.columns || 'auto',
            gap: config.gap || '4',
            
            get gridClasses() {
                const cols = {
                    '1': 'grid-cols-1',
                    '2': 'grid-cols-1 md:grid-cols-2',
                    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
                    '4': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
                    'auto': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                };
                
                return `grid ${cols[this.columns]} gap-${this.gap}`;
            }
        }));

        // Componente para manejo de assets dinámicos
        window.App.registerComponent('dynamicAssets', () => ({
            loadedAssets: new Set(),
            
            async loadCSS(href) {
                if (this.loadedAssets.has(href)) return;
                
                return new Promise((resolve, reject) => {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = href;
                    link.onload = () => {
                        this.loadedAssets.add(href);
                        resolve();
                    };
                    link.onerror = reject;
                    document.head.appendChild(link);
                });
            },
            
            async loadJS(src) {
                if (this.loadedAssets.has(src)) return;
                
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.onload = () => {
                        this.loadedAssets.add(src);
                        resolve();
                    };
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
        }));

        // Componente de código de ejemplo
        window.App.registerComponent('codeExample', (config = {}) => ({
            code: config.code || '',
            language: config.language || 'html',
            showCode: false,
            copied: false,
            
            toggleCode() {
                this.showCode = !this.showCode;
            },
            
            async copyCode() {
                try {
                    await navigator.clipboard.writeText(this.code);
                    this.copied = true;
                    setTimeout(() => this.copied = false, 2000);
                } catch (error) {
                    console.error('Failed to copy code:', error);
                }
            }
        }));
    }

    /**
     * Método público para registrar componentes del preview
     */
    registerComponent(name, definition) {
        if (window.App) {
            window.App.registerComponent(name, definition);
            this.previewComponents.set(name, definition);
        } else {
            console.warn('App not available, queuing component:', name);
            // Guardar para registrar después
            setTimeout(() => this.registerComponent(name, definition), 100);
        }
    }

    /**
     * Método público para cargar librerías bajo demanda
     */
    async loadLibrary(name, config = {}) {
        if (window.App) {
            this.requiredLibraries.add(name);
            return await window.App.loadLibrary(name, config);
        } else {
            throw new Error('App not available');
        }
    }

    /**
     * Obtener estado del preview
     */
    getStatus() {
        return {
            isReady: this.isReady,
            requiredLibraries: Array.from(this.requiredLibraries),
            previewComponents: Array.from(this.previewComponents.keys()),
            appReady: window.App?.isInitialized || false
        };
    }

    /**
     * Método de debug
     */
    debug() {
        console.log('🐛 ComponentPreview Debug:', this.getStatus());
        if (window.App) {
            console.log('🐛 App Debug:', window.App.getDebugInfo());
        }
    }
}

// 🚀 Inicializar solo si estamos en contexto de preview
const isPreviewContext = document.body.classList.contains('component-preview') || 
                         document.querySelector('.component-preview') ||
                         window.location.pathname.includes('/preview');

let componentPreview = null;

if (isPreviewContext) {
    componentPreview = new ComponentPreview();
    window.ComponentPreview = componentPreview;
    
    // Hacer disponibles métodos globales para el preview
    window.registerPreviewComponent = (name, definition) => {
        componentPreview.registerComponent(name, definition);
    };
    
    window.loadPreviewLibrary = async (name, config) => {
        return await componentPreview.loadLibrary(name, config);
    };
}

// Export para módulos
export default ComponentPreview;
export { componentPreview };

console.log('🖼️ ComponentPreview module loaded', isPreviewContext ? '(active)' : '(standby)');