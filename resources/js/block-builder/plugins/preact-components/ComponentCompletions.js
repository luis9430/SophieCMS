// ===================================================================
// resources/js/block-builder/plugins/preact-components/ComponentCompletions.js
// Autocompletado inteligente para component tags
// ===================================================================

import { getComponentSystem } from './ComponentSystem.js';

export class ComponentCompletions {
    constructor() {
        this.componentSystem = null;
    }

    async initialize() {
        this.componentSystem = getComponentSystem();
        if (!this.componentSystem.isInitialized) {
            await this.componentSystem.initialize();
        }
    }

    // ===================================================================
    // FUNCIÓN DE AUTOCOMPLETADO PRINCIPAL
    // ===================================================================

    createCompletionSource() {
        return async (context) => {
            if (!this.componentSystem) {
                await this.initialize();
            }

            // Obtener texto antes del cursor
            const beforeCursor = context.state.doc.sliceString(
                Math.max(0, context.pos - 100), 
                context.pos
            );

            // Detectar contexto de escritura
            const completionType = this.detectCompletionContext(beforeCursor);

            switch (completionType.type) {
                case 'component-tag':
                    return this.getComponentTagCompletions(context, completionType);
                
                case 'component-name':
                    return this.getComponentNameCompletions(context, completionType);
                
                case 'component-props':
                    return this.getComponentPropsCompletions(context, completionType);
                
                case 'snippet':
                    return this.getSnippetCompletions(context);
                
                default:
                    return null;
            }
        };
    }

    // ===================================================================
    // DETECCIÓN DE CONTEXTO
    // ===================================================================

    detectCompletionContext(beforeCursor) {
        // Detectar si está escribiendo <preact-
        if (beforeCursor.match(/<preact-?$/)) {
            return { type: 'component-tag' };
        }

        // Detectar si está en name="
        const nameMatch = beforeCursor.match(/<preact-component\s+name="([^"]*)$/);
        if (nameMatch) {
            return { 
                type: 'component-name', 
                partial: nameMatch[1] 
            };
        }

        // Detectar si está en props='
        const propsMatch = beforeCursor.match(/<preact-component\s+name="([^"]+)"\s+props='([^']*)$/);
        if (propsMatch) {
            return { 
                type: 'component-props', 
                componentName: propsMatch[1],
                partial: propsMatch[2]
            };
        }

        // Detectar si puede insertar snippet
        if (beforeCursor.match(/(\n|^)\s*$/)) {
            return { type: 'snippet' };
        }

        return { type: 'none' };
    }

    // ===================================================================
    // COMPLETIONS ESPECÍFICOS
    // ===================================================================

    getComponentTagCompletions(context, completionType) {
        return {
            from: context.pos - 'preact-'.length,
            options: [{
                label: 'preact-component',
                type: 'element',
                info: 'Preact component tag',
                detail: 'Insert a Preact component',
                apply: 'preact-component name="" props=\'{}\'/>',
                boost: 100
            }]
        };
    }

    getComponentNameCompletions(context, completionType) {
        const components = this.componentSystem.getAllComponents();
        const partial = completionType.partial || '';
        
        const options = components
            .filter(comp => comp.name.toLowerCase().includes(partial.toLowerCase()))
            .map(comp => ({
                label: comp.name,
                type: 'class',
                info: comp.metadata.description,
                detail: `Category: ${comp.metadata.category}`,
                boost: 90,
                apply: comp.name
            }));

        if (options.length === 0) return null;

        return {
            from: context.pos - partial.length,
            options
        };
    }

    getComponentPropsCompletions(context, completionType) {
        const component = this.componentSystem.getComponent(completionType.componentName);
        if (!component) return null;

        const propDefinitions = component.metadata.props || {};
        const partial = completionType.partial || '';

        // Generar ejemplo de props válido
        const exampleProps = {};
        Object.entries(propDefinitions).forEach(([propName, propDef]) => {
            if (propDef.default !== undefined) {
                exampleProps[propName] = propDef.default;
            } else {
                // Generar ejemplo basado en tipo
                switch (propDef.type) {
                    case 'string':
                        exampleProps[propName] = propDef.description || 'example';
                        break;
                    case 'number':
                        exampleProps[propName] = 1;
                        break;
                    case 'boolean':
                        exampleProps[propName] = true;
                        break;
                    case 'array':
                        exampleProps[propName] = ['item1', 'item2'];
                        break;
                    default:
                        exampleProps[propName] = 'value';
                }
            }
        });

        const options = [
            {
                label: 'Complete props',
                type: 'snippet',
                info: `Complete props for ${component.name}`,
                detail: 'Insert all available props',
                apply: JSON.stringify(exampleProps, null, 2).replace(/\n/g, ''),
                boost: 100
            }
        ];

        // Agregar props individuales si el usuario está editando
        if (partial.includes('{')) {
            Object.entries(propDefinitions).forEach(([propName, propDef]) => {
                options.push({
                    label: `"${propName}"`,
                    type: 'property',
                    info: propDef.description || `${propName} prop`,
                    detail: `Type: ${propDef.type}, Default: ${propDef.default}`,
                    apply: `"${propName}": ${JSON.stringify(propDef.default || '')}`,
                    boost: 80
                });
            });
        }

        return {
            from: context.pos - partial.length,
            options
        };
    }

    getSnippetCompletions(context) {
        const components = this.componentSystem.getAllComponents();
        
        const snippets = [
            // Snippet para tag básico
            {
                label: 'preact-component',
                type: 'snippet',
                info: 'Insert Preact component',
                detail: 'Basic component tag',
                apply: '<preact-component\n  name="ComponentName"\n  props=\'{}\'\n/>',
                boost: 95
            },
            
            // Snippets para componentes específicos
            ...components.map(comp => ({
                label: `${comp.name.toLowerCase()}-component`,
                type: 'snippet',
                info: `Insert ${comp.name} component`,
                detail: comp.metadata.description,
                apply: comp.metadata.example || this.generateComponentSnippet(comp),
                boost: 85
            }))
        ];

        return {
            from: context.pos,
            options: snippets
        };
    }

    // ===================================================================
    // UTILIDADES
    // ===================================================================

    generateComponentSnippet(component) {
        const exampleProps = {};
        Object.entries(component.metadata.props || {}).forEach(([propName, propDef]) => {
            if (propDef.default !== undefined) {
                exampleProps[propName] = propDef.default;
            }
        });

        return `<preact-component
  name="${component.name}"
  props='${JSON.stringify(exampleProps)}'
/>`;
    }

    // ===================================================================
    // VALIDACIÓN EN TIEMPO REAL
    // ===================================================================

    createValidationExtension() {
        return {
            // Se puede agregar validación en tiempo real aquí
            // Por ejemplo, subrayar componentes inexistentes
        };
    }
}

// ===================================================================
// FUNCIÓN DE INTEGRACIÓN
// ===================================================================

export function createComponentCompletionsExtension() {
    const completions = new ComponentCompletions();
    
    return [
        completions.createCompletionSource(),
        completions.createValidationExtension()
    ];
}

// ===================================================================
// HELPERS ADICIONALES
// ===================================================================

export function getComponentInfo(componentName) {
    const system = getComponentSystem();
    return system.getComponent(componentName);
}

export function validateComponentTag(html) {
    const system = getComponentSystem();
    const components = system.parseComponentTags(html);
    const errors = [];

    components.forEach(({ componentName, props }) => {
        const validation = system.validateComponentProps(componentName, props);
        if (!validation.valid) {
            errors.push({
                component: componentName,
                errors: validation.errors
            });
        }
    });

    return {
        valid: errors.length === 0,
        errors
    };
}