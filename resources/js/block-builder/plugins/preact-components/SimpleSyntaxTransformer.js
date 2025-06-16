// ===================================================================
// resources/js/block-builder/plugins/preact-components/SimpleSyntaxTransformer.js
// Transforma sintaxis simple (Alpine-like) a componentes Preact válidos
// ===================================================================

export class SimpleSyntaxTransformer {
    constructor() {
        this.setupTransformations();
    }
    
    setupTransformations() {
        // Mapeo de eventos Alpine → React/Preact
        this.eventMap = new Map([
            ['@click', 'onClick'],
            ['@change', 'onChange'],
            ['@submit', 'onSubmit'],
            ['@input', 'onInput'],
            ['@focus', 'onFocus'],
            ['@blur', 'onBlur'],
            ['@keydown', 'onKeyDown'],
            ['@keyup', 'onKeyUp'],
            ['@mouseenter', 'onMouseEnter'],
            ['@mouseleave', 'onMouseLeave']
        ]);
        
        // Patrones de transformación
        this.patterns = [
            // Eventos: @click="handler" → onClick={handler}
            {
                pattern: /@(\w+)="([^"]+)"/g,
                transform: (match, event, handler) => {
                    const reactEvent = this.eventMap.get(`@${event}`) || `on${this.capitalize(event)}`;
                    return `${reactEvent}={${this.wrapHandler(handler)}}`;
                }
            },
            
            // Mostrar/ocultar: x-show="condition" → style={{display: condition ? 'block' : 'none'}}
            {
                pattern: /x-show="([^"]+)"/g,
                transform: (match, condition) => {
                    return `style={{display: (${this.transformExpression(condition)}) ? 'block' : 'none'}}`;
                }
            },
            
            // Texto dinámico: x-text="expression" → {expression}
            {
                pattern: /x-text="([^"]+)"/g,
                transform: (match, expression) => {
                    // Asegurar que sea una interpolación JSX válida
                    const transformedExpr = this.transformExpression(expression);
                    return `>{${transformedExpr}}<`;
                }
            },
            
            // Condicional: x-if="condition" → {condition && (
            {
                pattern: /x-if="([^"]+)"/g,
                transform: (match, condition) => {
                    return `{(${this.transformExpression(condition)}) && (`;
                }
            },
            
            // Clases dinámicas: :class="expression" → className={expression}
            {
                pattern: /:class="([^"]+)"/g,
                transform: (match, expression) => {
                    return `className={${this.transformExpression(expression)}}`;
                }
            },
            
            // Binding bidireccional: x-model="variable" → value={variable} onChange={...}
            {
                pattern: /x-model="([^"]+)"/g,
                transform: (match, variable) => {
                    const setter = `set${this.capitalize(variable.trim())}`;
                    return `value={${variable}} onChange={(e) => ${setter}(e.target.value)}`;
                }
            },
            
            // Limpiar HTML → JSX
            {
                pattern: /\bclass=/g,
                transform: () => 'className='
            },
            {
                pattern: /\bfor=/g,
                transform: () => 'htmlFor='
            }
        ];
    }
    
    // ===================================================================
    // MÉTODO PRINCIPAL DE TRANSFORMACIÓN
    // ===================================================================
    
    transform(template, options = {}) {
        const context = {
            variables: new Set(),
            handlers: new Set(),
            imports: new Set(['useState']),
            componentName: options.componentName || 'Component',
            defaultValues: options.defaultValues || {}
        };
        
        // 1. Limpiar template
        let transformed = this.cleanTemplate(template);
        
        // 2. Aplicar transformaciones
        transformed = this.applyTransformations(transformed, context);
        
        // 3. Procesar elementos con x-if para agregar cierre
        transformed = this.processConditionals(transformed);
        
        // 4. Generar componente completo
        return this.generateComponent(transformed, context);
    }
    
    // ===================================================================
    // PROCESAMIENTO DE TRANSFORMACIONES
    // ===================================================================
    
    applyTransformations(template, context) {
        let result = template;
        
        for (const { pattern, transform } of this.patterns) {
            result = result.replace(pattern, (...args) => {
                const transformed = transform(...args);
                
                // Extraer variables de la expresión original
                this.extractVariablesFromMatch(args[0], context);
                
                return transformed;
            });
        }
        
        return result;
    }
    
    extractVariablesFromMatch(match, context) {
        // Buscar variables en el match original, pero ser más selectivo
        const variablePattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
        let varMatch;
        
        while ((varMatch = variablePattern.exec(match)) !== null) {
            const variable = varMatch[1];
            // Solo agregar variables que realmente necesitan estado
            if (!this.isReservedWord(variable) && 
                !variable.startsWith('set') && 
                this.isStateVariable(variable, match)) {
                context.variables.add(variable);
            }
        }
    }
    
    // Nuevo método para determinar si una variable necesita estado
    isStateVariable(variable, context) {
        // Variables que claramente necesitan estado
        const stateIndicators = [
            'count', 'open', 'show', 'visible', 'active', 'selected', 
            'current', 'index', 'value', 'name', 'text', 'data',
            'sort', 'filter', 'search', 'loading', 'error'
        ];
        
        // Si la variable está en una asignación o comparación, probablemente necesita estado
        const needsState = context.includes(`${variable} =`) || 
                          context.includes(`${variable}!`) ||
                          context.includes(`${variable} >`) ||
                          context.includes(`${variable} <`) ||
                          context.includes(`${variable} !=`) ||
                          context.includes(`${variable} ==`) ||
                          stateIndicators.some(indicator => variable.toLowerCase().includes(indicator));
        
        return needsState;
    }
    
    // ===================================================================
    // TRANSFORMADORES ESPECÍFICOS
    // ===================================================================
    
    wrapHandler(handler) {
        // Dividir múltiples instrucciones por coma
        const instructions = handler.split(',').map(inst => inst.trim());
        const transformedInstructions = instructions.map(inst => this.transformExpression(inst));
        
        if (transformedInstructions.length === 1) {
            return `() => { ${transformedInstructions[0]} }`;
        } else {
            return `() => { ${transformedInstructions.join('; ')} }`;
        }
    }
    
    transformExpression(expression) {
        let transformed = expression.trim();
        
        // Asignaciones: variable = valor
        transformed = transformed.replace(/(\w+)\s*=\s*([^,;]+)/g, (match, variable, value) => {
            if (value.trim() === `!${variable}`) {
                // Toggle: variable = !variable
                return `set${this.capitalize(variable)}(!${variable})`;
            } else {
                return `set${this.capitalize(variable)}(${value})`;
            }
        });
        
        // Comparaciones y operadores lógicos (mantener tal como están)
        // No necesitan transformación especial
        
        return transformed;
    }
    
    processConditionals(template) {
        let result = template;
        
        // Arreglar patrones de x-text malformados
        // Patrón: >{ expression }<  →  >{expression}<
        result = result.replace(/>\s*\{\s*([^}]+)\s*\}\s*</g, '>{$1}<');
        
        // Arreglar casos donde x-text se procesó dentro de atributos
        // Patrón: <span {expression}> → <span>{expression}</span>
        result = result.replace(/<(\w+)\s+\{([^}]+)\}>/g, '<$1>{$2}</$1>');
        
        // Buscar elementos con x-if y agregar cierre donde sea necesario
        const ifMatches = result.match(/\{[^}]*&&\s*\(/g);
        let pendingCloses = 0;
        
        if (ifMatches) {
            pendingCloses = ifMatches.length;
        }
        
        // Agregar cierres al final si hay x-if sin cerrar
        if (pendingCloses > 0) {
            result += ')'.repeat(pendingCloses) + '}';
        }
        
        return result;
    }
    
    // ===================================================================
    // GENERACIÓN DEL COMPONENTE
    // ===================================================================
    
    generateComponent(jsx, context) {
        const { componentName, variables, imports } = context;
        
        // Generar imports
        const importStatements = Array.from(imports).length > 0 
            ? `import { ${Array.from(imports).join(', ')} } from 'preact/hooks';`
            : '';
        
        // Generar declaraciones de estado
        const stateDeclarations = Array.from(variables).map(variable => {
            const defaultValue = this.getDefaultValue(variable, context.defaultValues);
            return `  const [${variable}, set${this.capitalize(variable)}] = useState(${defaultValue});`;
        }).join('\n');
        
        // Generar props destructuring
        const propsDestructuring = context.props && context.props.length > 0
            ? `{ ${context.props.join(', ')} }`
            : 'props = {}';
        
        return `${importStatements}

const ${componentName} = (${propsDestructuring}) => {
${stateDeclarations}

  return (
    ${jsx}
  );
};

export default ${componentName};`.trim();
    }
    
    // ===================================================================
    // UTILIDADES
    // ===================================================================
    
    cleanTemplate(template) {
        return template
            .replace(/\s+/g, ' ') // Normalizar espacios
            .replace(/>\s+</g, '><') // Remover espacios entre tags
            .trim();
    }
    
    getDefaultValue(variable, defaultValues = {}) {
        // Valor proporcionado explícitamente
        if (defaultValues[variable] !== undefined) {
            return JSON.stringify(defaultValues[variable]);
        }
        
        // Inferir por nombre de variable
        const name = variable.toLowerCase();
        
        if (name.includes('open') || name.includes('show') || name.includes('visible') || name.startsWith('is')) {
            return 'false';
        }
        if (name.includes('count') || name.includes('index') || name.includes('number')) {
            return '0';
        }
        if (name.includes('text') || name.includes('name') || name.includes('title') || name.includes('type')) {
            return "''";
        }
        if (name.includes('list') || name.includes('array') || name.includes('items')) {
            return '[]';
        }
        if (name.includes('data') || name.includes('object') || name.includes('config')) {
            return '{}';
        }
        
        return 'null';
    }
    
    isReservedWord(word) {
        const reserved = [
            'const', 'let', 'var', 'function', 'if', 'else', 'for', 'while',
            'return', 'true', 'false', 'null', 'undefined', 'this', 'props',
            'useState', 'useEffect', 'e', 'event', 'target', 'value', 'style',
            'className', 'onClick', 'onChange', 'onSubmit', 'span', 'div', 'button',
            'href', 'class', 'text', 'click', 'x' // Agregar palabras que causan problemas
        ];
        return reserved.includes(word) || word.length <= 1;
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// ===================================================================
// FUNCIÓN DE CONVENIENCIA
// ===================================================================

export function transformSimpleSyntax(template, options = {}) {
    const transformer = new SimpleSyntaxTransformer();
    return transformer.transform(template, options);
}

// ===================================================================
// EJEMPLOS DE USO
// ===================================================================

export const examples = {
    // Ejemplo básico de contador
    counter: `<div>
  <button @click="count = count + 1">
    Clicks: <span x-text="count"></span>
  </button>
  <div x-show="count > 5">¡Muchos clicks!</div>
</div>`,

    // Ejemplo de dropdown (tu caso original)
    dropdown: `<div class="dropdown">
  <button @click="sortType='Most popular',openSort=!openSort" 
          class="flex items-center gap-2 px-4 py-2 bg-white border rounded">
    Sort: <span x-text="sortType"></span>
  </button>
  
  <div x-show="openSort" class="absolute mt-1 bg-white border rounded shadow-lg">
    <a @click="sortType='Most popular',openSort=false" 
       x-show="sortType != 'Most popular'"
       class="block px-4 py-2 hover:bg-gray-100">
      Most popular
    </a>
    <a @click="sortType='Newest',openSort=false"
       x-show="sortType != 'Newest'" 
       class="block px-4 py-2 hover:bg-gray-100">
      Newest
    </a>
  </div>
</div>`,

    // Ejemplo de formulario
    form: `<form @submit="handleSubmit">
  <input x-model="name" placeholder="Your name" class="border p-2 rounded" />
  <div x-show="name.length > 0">
    Hello, <span x-text="name"></span>!
  </div>
  <button type="submit">Submit</button>
</form>`
};

// Test rápido
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🧪 Testing SimpleSyntaxTransformer...');
    const transformer = new SimpleSyntaxTransformer();
    console.log('Counter example:', transformer.transform(examples.counter));
}