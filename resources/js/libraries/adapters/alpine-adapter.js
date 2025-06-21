// resources/js/libraries/adapters/alpine-adapter.js
export default class AlpineAdapter {
    static instance = null;
    static registeredComponents = new Set();

    /**
     * Obtener instancia de Alpine (compatible con Moonshine)
     */
    static async getInstance(config = {}) {
        if (AlpineAdapter.instance) {
            console.log('🎿 Alpine - Returning existing instance');
            return AlpineAdapter.instance;
        }

        console.log('🎿 Alpine - Creating adapter instance');
        return await AlpineAdapter.initialize(config);
    }

    /**
     * Inicializar adaptador Alpine
     */
    static async initialize(config = {}) {
        try {
            // Verificar que Alpine esté disponible
            if (typeof window.Alpine === 'undefined') {
                throw new Error('Alpine not available globally. Make sure it\'s imported in app.js');
            }

            const defaultConfig = {
                debug: false,
                autoRegisterComponents: true,
                safeMode: true // Para compatibilidad con Moonshine
            };

            const finalConfig = { ...defaultConfig, ...config };

            AlpineAdapter.instance = {
                // Core Alpine
                core: window.Alpine,
                config: finalConfig,

                // === REGISTRO SEGURO DE COMPONENTES ===

                /**
                 * Registrar componente de forma segura
                 */
                safeData: (name, definition) => {
                    return AlpineAdapter.safeRegisterComponent(name, definition);
                },

                /**
                 * Registrar directiva personalizada
                 */
                safeDirective: (name, definition) => {
                    return AlpineAdapter.safeRegisterDirective(name, definition);
                },

                /**
                 * Registrar magic helper
                 */
                safeMagic: (name, definition) => {
                    return AlpineAdapter.safeRegisterMagic(name, definition);
                },

                // === UTILIDADES DE COMPONENTES ===

                /**
                 * Crear componente con estado reactivo
                 */
                createReactiveComponent: (name, initialData = {}, methods = {}) => {
                    const componentDefinition = () => ({
                        // Estado reactivo
                        ...initialData,
                        
                        // Métodos
                        ...methods,
                        
                        // Utilidades integradas
                        $nextTick: (callback) => Alpine.nextTick(callback),
                        $watch: (property, callback) => Alpine.watch(property, callback),
                        
                        // Lifecycle hooks
                        init() {
                            if (finalConfig.debug) {
                                console.log(`🧩 ${name} component initialized`);
                            }
                            
                            // Llamar init personalizado si existe
                            if (methods.init) {
                                methods.init.call(this);
                            }
                        }
                    });

                    return AlpineAdapter.safeRegisterComponent(name, componentDefinition);
                },

                /**
                 * Crear componente con integración GSAP
                 */
                createGSAPComponent: (name, gsapConfig = {}) => {
                    const componentDefinition = () => ({
                        show: false,
                        
                        init() {
                            if (finalConfig.debug) {
                                console.log(`🎬 ${name} GSAP component initialized`);
                            }
                        },
                        
                        toggle() {
                            this.show = !this.show;
                            
                            // Usar GSAP si está disponible
                            if (window.LibraryManager && window.LibraryManager.isLibraryLoaded('gsap')) {
                                const gsapInstance = window.LibraryManager.getLibraryInstance('gsap');
                                
                                if (this.show) {
                                    gsapInstance.fadeIn(this.$el, gsapConfig);
                                } else {
                                    gsapInstance.fadeOut(this.$el, gsapConfig);
                                }
                            } else {
                                // Fallback sin GSAP
                                this.$el.style.display = this.show ? 'block' : 'none';
                            }
                        }
                    });

                    return AlpineAdapter.safeRegisterComponent(name, componentDefinition);
                },

                // === STORE MANAGEMENT ===

                /**
                 * Crear store global
                 */
                createStore: (name, data) => {
                    if (window.Alpine.store) {
                        window.Alpine.store(name, data);
                        console.log(`🗄️ Store '${name}' created`);
                    } else {
                        console.warn('⚠️ Alpine stores not available');
                    }
                },

                /**
                 * Obtener store
                 */
                getStore: (name) => {
                    return window.Alpine.store ? window.Alpine.store(name) : null;
                },

                // === DEBUGGING Y UTILIDADES ===

                /**
                 * Debug de componente
                 */
                debugComponent: (element) => {
                    if (element._x_dataStack) {
                        console.log('🐛 Alpine Debug:', element._x_dataStack);
                    } else {
                        console.warn('⚠️ Element is not an Alpine component');
                    }
                },

                /**
                 * Verificar si un elemento es componente Alpine
                 */
                isAlpineComponent: (element) => {
                    return !!(element._x_dataStack || element.__x);
                },

                /**
                 * Obtener datos de componente
                 */
                getComponentData: (element) => {
                    return element._x_dataStack ? element._x_dataStack[0] : null;
                }
            };

            // Auto-registrar componentes básicos si está habilitado
            if (finalConfig.autoRegisterComponents) {
                AlpineAdapter.registerBasicComponents();
            }

            console.log('✅ Alpine Adapter initialized successfully');
            return AlpineAdapter.instance;

        } catch (error) {
            console.error('❌ Alpine Adapter initialization failed:', error);
            throw error;
        }
    }

    /**
     * Registrar componente de forma segura
     */
    static safeRegisterComponent(name, definition) {
        try {
            // Verificar si ya está registrado
            if (AlpineAdapter.registeredComponents.has(name)) {
                console.warn(`⚠️ Alpine component '${name}' already registered, skipping`);
                return false;
            }

            // Verificar que Alpine esté disponible
            if (!window.Alpine || !window.Alpine.data) {
                console.warn('⚠️ Alpine.data not available, queuing component for later');
                // TODO: Implementar cola para registrar después
                return false;
            }

            // Registrar componente
            window.Alpine.data(name, definition);
            AlpineAdapter.registeredComponents.add(name);
            
            console.log(`🧩 Alpine component '${name}' registered successfully`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to register Alpine component '${name}':`, error);
            return false;
        }
    }

    /**
     * Registrar directiva de forma segura
     */
    static safeRegisterDirective(name, definition) {
        try {
            if (!window.Alpine || !window.Alpine.directive) {
                console.warn('⚠️ Alpine.directive not available');
                return false;
            }

            window.Alpine.directive(name, definition);
            console.log(`📐 Alpine directive '${name}' registered`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to register Alpine directive '${name}':`, error);
            return false;
        }
    }

    /**
     * Registrar magic helper de forma segura
     */
    static safeRegisterMagic(name, definition) {
        try {
            if (!window.Alpine || !window.Alpine.magic) {
                console.warn('⚠️ Alpine.magic not available');
                return false;
            }

            window.Alpine.magic(name, definition);
            console.log(`✨ Alpine magic '${name}' registered`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to register Alpine magic '${name}':`, error);
            return false;
        }
    }

    /**
     * Registrar componentes básicos útiles
     */
    static registerBasicComponents() {
        // Componente de toggle mejorado
        AlpineAdapter.safeRegisterComponent('toggle', (initialState = false) => ({
            open: initialState,
            toggle() {
                this.open = !this.open;
            },
            show() {
                this.open = true;
            },
            hide() {
                this.open = false;
            }
        }));

        // Componente de loading state
        AlpineAdapter.safeRegisterComponent('loading', () => ({
            isLoading: false,
            
            async execute(asyncFunction) {
                this.isLoading = true;
                try {
                    const result = await asyncFunction();
                    return result;
                } catch (error) {
                    console.error('Loading error:', error);
                    throw error;
                } finally {
                    this.isLoading = false;
                }
            },
            
            start() {
                this.isLoading = true;
            },
            
            stop() {
                this.isLoading = false;
            }
        }));

        // Componente de formulario mejorado
        AlpineAdapter.safeRegisterComponent('form', (config = {}) => ({
            data: config.data || {},
            errors: {},
            isSubmitting: false,
            
            async submit(url, options = {}) {
                this.isSubmitting = true;
                this.errors = {};
                
                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                            ...options.headers
                        },
                        body: JSON.stringify(this.data),
                        ...options
                    });
                    
                    const result = await response.json();
                    
                    if (!response.ok) {
                        if (result.errors) {
                            this.errors = result.errors;
                        }
                        throw new Error(result.message || 'Form submission failed');
                    }
                    
                    return result;
                    
                } catch (error) {
                    console.error('Form submission error:', error);
                    throw error;
                } finally {
                    this.isSubmitting = false;
                }
            }
        }));

        console.log('🧩 Basic Alpine components registered');
    }

    /**
     * Obtener lista de componentes registrados
     */
    static getRegisteredComponents() {
        return Array.from(AlpineAdapter.registeredComponents);
    }

    /**
     * Verificar si un componente está registrado
     */
    static isComponentRegistered(name) {
        return AlpineAdapter.registeredComponents.has(name);
    }

    /**
     * Limpiar todos los componentes registrados
     */
    static clearRegisteredComponents() {
        AlpineAdapter.registeredComponents.clear();
        console.log('🧹 Alpine registered components cleared');
    }

    /**
     * Obtener información de debug
     */
    static getDebugInfo() {
        return {
            hasInstance: !!AlpineAdapter.instance,
            alpineVersion: window.Alpine?.version || 'unknown',
            registeredComponents: Array.from(AlpineAdapter.registeredComponents),
            componentCount: AlpineAdapter.registeredComponents.size
        };
    }
}