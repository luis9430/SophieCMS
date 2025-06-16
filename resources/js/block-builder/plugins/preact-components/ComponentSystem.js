// ===================================================================
// resources/js/block-builder/plugins/preact-components/ComponentSystem.js
// Sistema de componentes compilados con sintaxis de tags
// ===================================================================

export class ComponentSystem {
    constructor() {
        this.registry = new Map();
        this.compiledComponents = new Map();
        this.isInitialized = false;
    }

    // ===================================================================
    // INICIALIZACIÓN
    // ===================================================================

    async initialize() {
        if (this.isInitialized) {
            console.log('✅ ComponentSystem ya inicializado');
            return;
        }

        try {
            console.log('🚀 Inicializando ComponentSystem...');

            // Registrar componentes base
            await this.registerBaseComponents();

            // Cargar componentes dinámicos si existen
            await this.loadDynamicComponents();

            this.isInitialized = true;
            console.log('✅ ComponentSystem inicializado exitosamente');

        } catch (error) {
            console.error('❌ Error inicializando ComponentSystem:', error);
            throw error;
        }
    }

    // ===================================================================
    // REGISTRO DE COMPONENTES
    // ===================================================================

    registerComponent(name, component, metadata = {}) {
        const componentData = {
            name,
            component,
            metadata: {
                description: metadata.description || `${name} component`,
                props: metadata.props || {},
                category: metadata.category || 'general',
                example: metadata.example || null,
                ...metadata
            }
        };

        this.registry.set(name, componentData);
        console.log(`✅ Componente registrado: ${name}`);

        return componentData;
    }

    async registerBaseComponents() {
        // Componente contador básico
        this.registerComponent('CounterButton', this.createCounterButton(), {
            description: 'Botón contador con estado',
            category: 'interactive',
            props: {
                initialCount: { type: 'number', default: 0, description: 'Valor inicial del contador' },
                color: { type: 'string', default: 'blue', description: 'Color del botón' },
                label: { type: 'string', default: 'Count', description: 'Texto del botón' }
            },
            example: `<preact-component
  name="CounterButton"
  props='{"initialCount": 5, "color": "green", "label": "Clicks"}'
/>`
        });

        // Componente toggle
        this.registerComponent('ToggleButton', this.createToggleButton(), {
            description: 'Botón que muestra/oculta contenido',
            category: 'interactive',
            props: {
                label: { type: 'string', default: 'Toggle', description: 'Texto del botón' },
                content: { type: 'string', default: 'Content', description: 'Contenido a mostrar/ocultar' },
                initialOpen: { type: 'boolean', default: false, description: 'Estado inicial' }
            },
            example: `<preact-component
  name="ToggleButton"
  props='{"label": "Ver más", "content": "Contenido oculto", "initialOpen": false}'
/>`
        });

        // Componente dropdown
        this.registerComponent('DropdownMenu', this.createDropdownMenu(), {
            description: 'Menú desplegable con opciones',
            category: 'navigation',
            props: {
                options: { type: 'array', default: [], description: 'Lista de opciones' },
                label: { type: 'string', default: 'Select', description: 'Etiqueta del dropdown' },
                placeholder: { type: 'string', default: 'Choose option', description: 'Placeholder' }
            },
            example: `<preact-component
  name="DropdownMenu"
  props='{"options": ["Opción 1", "Opción 2", "Opción 3"], "label": "Seleccionar"}'
/>`
        });

        // Componente de alerta
        this.registerComponent('AlertBox', this.createAlertBox(), {
            description: 'Caja de alerta con diferentes tipos',
            category: 'feedback',
            props: {
                type: { type: 'string', default: 'info', description: 'Tipo de alerta (info, success, warning, error)' },
                title: { type: 'string', default: '', description: 'Título de la alerta' },
                message: { type: 'string', default: 'Alert message', description: 'Mensaje de la alerta' },
                dismissible: { type: 'boolean', default: true, description: 'Puede cerrarse' }
            },
            example: `<preact-component
  name="AlertBox"
  props='{"type": "success", "title": "Éxito", "message": "Operación completada", "dismissible": true}'
/>`
        });

        console.log('✅ Componentes base registrados');
    }

    // ===================================================================
    // CREADORES DE COMPONENTES
    // ===================================================================

    createCounterButton() {
        return ({ initialCount = 0, color = 'blue', label = 'Count', ...props }) => {
            const [count, setCount] = window.preact?.hooks?.useState?.(initialCount) || 
                                     [initialCount, () => {}];
            
            const h = window.preact?.h || window.h;
            
            return h('button', {
                className: `px-4 py-2 rounded font-medium text-white bg-${color}-500 hover:bg-${color}-600 transition-colors`,
                onClick: () => setCount(count + 1),
                ...props
            }, `${label}: ${count}`);
        };
    }

    createToggleButton() {
        return ({ label = 'Toggle', content = 'Content', initialOpen = false, ...props }) => {
            const [isOpen, setIsOpen] = window.preact?.hooks?.useState?.(initialOpen) || 
                                       [initialOpen, () => {}];
            
            const h = window.preact?.h || window.h;
            
            return h('div', { className: 'space-y-2' }, [
                h('button', {
                    className: 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors',
                    onClick: () => setIsOpen(!isOpen),
                    ...props
                }, label),
                
                isOpen && h('div', {
                    className: 'p-4 bg-gray-100 border rounded'
                }, content)
            ]);
        };
    }

    createDropdownMenu() {
        return ({ options = [], label = 'Select', placeholder = 'Choose option', ...props }) => {
            const [isOpen, setIsOpen] = window.preact?.hooks?.useState?.(false) || [false, () => {}];
            const [selected, setSelected] = window.preact?.hooks?.useState?.(placeholder) || [placeholder, () => {}];
            
            const h = window.preact?.h || window.h;
            
            return h('div', { className: 'relative inline-block' }, [
                h('button', {
                    className: 'px-4 py-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 flex items-center justify-between min-w-32',
                    onClick: () => setIsOpen(!isOpen),
                    ...props
                }, [
                    h('span', null, selected),
                    h('span', { className: 'ml-2' }, isOpen ? '▲' : '▼')
                ]),
                
                isOpen && h('div', {
                    className: 'absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-full'
                }, options.map((option, index) =>
                    h('div', {
                        key: index,
                        className: 'px-4 py-2 hover:bg-gray-100 cursor-pointer',
                        onClick: () => {
                            setSelected(option);
                            setIsOpen(false);
                        }
                    }, option)
                ))
            ]);
        };
    }

    createAlertBox() {
        return ({ type = 'info', title = '', message = 'Alert message', dismissible = true, ...props }) => {
            const [visible, setVisible] = window.preact?.hooks?.useState?.(true) || [true, () => {}];
            
            if (!visible) return null;
            
            const h = window.preact?.h || window.h;
            
            const typeStyles = {
                info: 'bg-blue-50 border-blue-200 text-blue-800',
                success: 'bg-green-50 border-green-200 text-green-800',
                warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                error: 'bg-red-50 border-red-200 text-red-800'
            };
            
            return h('div', {
                className: `p-4 border rounded ${typeStyles[type] || typeStyles.info}`,
                ...props
            }, [
                h('div', { className: 'flex items-start justify-between' }, [
                    h('div', null, [
                        title && h('h4', { className: 'font-bold mb-1' }, title),
                        h('p', null, message)
                    ]),
                    
                    dismissible && h('button', {
                        className: 'ml-4 text-lg leading-none hover:opacity-70',
                        onClick: () => setVisible(false)
                    }, '×')
                ])
            ]);
        };
    }

    // ===================================================================
    // CARGA DINÁMICA DE COMPONENTES
    // ===================================================================

    async loadDynamicComponents() {
        // Intentar cargar componentes desde el directorio resources/js/components/
        try {
            // Esto se puede expandir para cargar componentes dinámicamente
            console.log('ℹ️ Carga dinámica de componentes no implementada aún');
        } catch (error) {
            console.warn('⚠️ No se pudieron cargar componentes dinámicos:', error);
        }
    }

    // ===================================================================
    // PARSER DE TAGS
    // ===================================================================

    parseComponentTags(html) {
        const componentTagPattern = /<preact-component\s+name="([^"]+)"\s+props='([^']+)'\s*\/?>/g;
        const results = [];
        let match;

        while ((match = componentTagPattern.exec(html)) !== null) {
            const [fullMatch, componentName, propsJson] = match;
            
            try {
                const props = JSON.parse(propsJson);
                results.push({
                    fullMatch,
                    componentName,
                    props,
                    startIndex: match.index,
                    endIndex: match.index + fullMatch.length
                });
            } catch (error) {
                console.warn(`⚠️ Error parsing props for component ${componentName}:`, error);
            }
        }

        return results;
    }

    renderComponentsInHTML(html) {
        const components = this.parseComponentTags(html);
        let result = html;
        
        // Procesar componentes de atrás hacia adelante para mantener índices
        for (let i = components.length - 1; i >= 0; i--) {
            const { fullMatch, componentName, props, startIndex, endIndex } = components[i];
            
            if (this.registry.has(componentName)) {
                // Por ahora, reemplazar con placeholder - el renderizado real se hará en el preview
                const placeholder = `<div data-preact-component="${componentName}" data-props='${JSON.stringify(props)}' class="border-2 border-dashed border-blue-300 p-2 bg-blue-50">
                    <small class="text-blue-600">📦 ${componentName}</small>
                </div>`;
                
                result = result.substring(0, startIndex) + placeholder + result.substring(endIndex);
            } else {
                console.warn(`⚠️ Componente no encontrado: ${componentName}`);
            }
        }

        return result;
    }

    // ===================================================================
    // UTILIDADES
    // ===================================================================

    getComponent(name) {
        return this.registry.get(name);
    }

    getAllComponents() {
        return Array.from(this.registry.values());
    }

    getComponentsByCategory(category) {
        return this.getAllComponents().filter(comp => comp.metadata.category === category);
    }

    getComponentNames() {
        return Array.from(this.registry.keys());
    }

    validateComponentProps(componentName, props) {
        const component = this.getComponent(componentName);
        if (!component) {
            return { valid: false, errors: [`Component ${componentName} not found`] };
        }

        const errors = [];
        const propDefinitions = component.metadata.props || {};

        // Validar props requeridas
        Object.entries(propDefinitions).forEach(([propName, propDef]) => {
            if (propDef.required && !(propName in props)) {
                errors.push(`Required prop '${propName}' missing`);
            }
        });

        return { valid: errors.length === 0, errors };
    }
}

// ===================================================================
// INSTANCIA GLOBAL
// ===================================================================

let globalComponentSystem = null;

export function getComponentSystem() {
    if (!globalComponentSystem) {
        globalComponentSystem = new ComponentSystem();
    }
    return globalComponentSystem;
}

export async function initializeComponentSystem() {
    const system = getComponentSystem();
    await system.initialize();
    return system;
}