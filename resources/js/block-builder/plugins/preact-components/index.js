// ===================================================================
// resources/js/block-builder/plugins/preact-components/index.js
// Plugin Principal para Componentes Preact - VERSIÓN COMPLETA
// ===================================================================

const preactComponentsPlugin = {
    name: 'preact-components',
    version: '1.0.0',
    dependencies: ['tailwind'],
    
    async init(context) {
        console.log('✅ Preact Components Plugin Initialized');
        
        // Registrar tipos de componentes Preact
        this.registerComponentTypes();
        
        // Configurar sistema de hooks
        this.setupHooksSystem();
        
        return this;
    },

    // Configuración del editor
    getEditorExtensions() {
        return [
            this.getPreactCompletions(),
            this.getJSXSupport(),
            this.getHooksCompletions()
        ];
    },

    // Template para preview usando Preact
    getPreviewTemplate() {
        return `
            <script type="module">
                import { render, h } from 'https://esm.sh/preact@10.26.8';
                import { useState, useEffect } from 'https://esm.sh/preact@10.26.8/hooks';
                
                // Sistema de renderizado dinámico
                window.PreactRenderer = {
                    render: render,
                    h: h,
                    hooks: { useState, useEffect },
                    
                    // Renderizar componente desde código del editor
                    renderComponent(componentCode, container, props = {}) {
                        try {
                            // Transformar código JSX a función ejecutable
                            const Component = this.transformCode(componentCode);
                            render(h(Component, props), container);
                            return true;
                        } catch (error) {
                            console.error('Error rendering Preact component:', error);
                            container.innerHTML = \`<div class="error-display p-4 bg-red-50 border border-red-200 rounded">
                                <h3 class="text-red-800 font-bold">Error en componente:</h3>
                                <pre class="text-red-600 text-sm mt-2">\${error.message}</pre>
                            </div>\`;
                            return false;
                        }
                    },
                    
                    // Transformar código del editor a función Preact
                    transformCode(code) {
                        try {
                            // Función que convierte el código JSX del editor a función ejecutable
                            const functionBody = \`
                                const { useState, useEffect } = window.PreactRenderer.hooks;
                                const h = window.PreactRenderer.h;
                                
                                \${code}
                                
                                // Retornar el último componente definido
                                const componentNames = [
                                    \${this.extractComponentNames(code).map(name => \`'\${name}'\`).join(', ')}
                                ];
                                const lastComponent = componentNames[componentNames.length - 1];
                                return eval(lastComponent);
                            \`;
                            
                            return new Function(functionBody)();
                        } catch (error) {
                            console.error('Error transforming code:', error);
                            throw error;
                        }
                    },
                    
                    // Extraer nombres de componentes del código
                    extractComponentNames(code) {
                        const matches = code.match(/(?:const|function)\\s+([A-Z][a-zA-Z0-9]*)\\s*=/g);
                        return matches ? matches.map(m => m.match(/([A-Z][a-zA-Z0-9]*)/)[1]) : ['Component'];
                    }
                };
                
                // Configurar Tailwind para el preview
                if (window.tailwind) {
                    window.tailwind.config = {
                        theme: {
                            extend: {
                                animation: {
                                    'fade-in': 'fadeIn 0.5s ease-in',
                                    'slide-up': 'slideUp 0.6s ease-out'
                                }
                            }
                        }
                    };
                }
                
                console.log('🎨 Preact Preview System Ready');
            </script>
        `;
    },

    // Autocompletado específico para Preact
    getPreactCompletions() {
        return {
            name: 'preact-completions',
            completions: [
                {
                    label: 'useState',
                    type: 'function',
                    info: 'Hook para manejo de estado local',
                    detail: 'const [state, setState] = useState(initialValue)',
                    apply: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialValue});'
                },
                {
                    label: 'useEffect',
                    type: 'function', 
                    info: 'Hook para efectos secundarios',
                    detail: 'useEffect(() => { /* effect */ }, [dependencies])',
                    apply: 'useEffect(() => {\\n  ${1:// effect code}\\n}, [${2:dependencies}]);'
                },
                {
                    label: 'Component Template',
                    type: 'snippet',
                    info: 'Template básico de componente Preact',
                    apply: `const \${1:ComponentName} = ({ \${2:props} }) => {
  const [state, setState] = useState(\${3:initialValue});
  
  return (
    <div className="\${4:container-classes}">
      \${5:// JSX content}
    </div>
  );
};`
                },
                {
                    label: 'useCallback',
                    type: 'function',
                    info: 'Hook para memoización de funciones',
                    detail: 'const memoizedCallback = useCallback(() => {}, [deps])',
                    apply: 'const ${1:memoizedFn} = useCallback(() => {\\n  ${2:// callback code}\\n}, [${3:dependencies}]);'
                },
                {
                    label: 'useMemo',
                    type: 'function',
                    info: 'Hook para memoización de valores',
                    detail: 'const memoizedValue = useMemo(() => computation, [deps])',
                    apply: 'const ${1:memoizedValue} = useMemo(() => {\\n  return ${2:// computation}\\n}, [${3:dependencies}]);'
                },
                {
                    label: 'useRef',
                    type: 'function',
                    info: 'Hook para referencias mutables',
                    detail: 'const ref = useRef(initialValue)',
                    apply: 'const ${1:ref} = useRef(${2:null});'
                }
            ]
        };
    },

    // Soporte para JSX
    getJSXSupport() {
        return {
            name: 'jsx-support',
            transform: {
                // Transformaciones específicas para JSX
                'className': 'class',
                'onClick': 'onclick',
                'onChange': 'onchange'
            }
        };
    },

    // Completions para hooks comunes
    getHooksCompletions() {
        return {
            name: 'hooks-completions',
            patterns: [
                {
                    pattern: /use[A-Z]/,
                    suggestions: [
                        'useState', 'useEffect', 'useCallback', 'useMemo', 
                        'useRef', 'useContext', 'useReducer'
                    ]
                }
            ]
        };
    },

    // Registrar tipos de componentes disponibles
    registerComponentTypes() {
        this.componentTypes = {
            'ui': {
                name: 'UI Components',
                icon: '🎨',
                templates: ['Button', 'Card', 'Modal', 'Dropdown']
            },
            'layout': {
                name: 'Layout',
                icon: '📐',
                templates: ['Container', 'Grid', 'Sidebar', 'Header']
            },
            'marketing': {
                name: 'Marketing',
                icon: '📢',
                templates: ['Hero', 'CTA', 'Testimonial', 'Pricing']
            },
            'interactive': {
                name: 'Interactive',
                icon: '⚡',
                templates: ['Counter', 'Toggle', 'Accordion', 'Tabs']
            }
        };
    },

    // Configurar sistema de hooks
    setupHooksSystem() {
        this.availableHooks = [
            {
                name: 'useState',
                description: 'Manejo de estado local',
                import: "import { useState } from 'preact/hooks';",
                example: 'const [count, setCount] = useState(0);'
            },
            {
                name: 'useEffect', 
                description: 'Efectos secundarios y cleanup',
                import: "import { useEffect } from 'preact/hooks';",
                example: 'useEffect(() => { /* effect */ }, [dependencies]);'
            },
            {
                name: 'useCallback',
                description: 'Memoización de funciones',
                import: "import { useCallback } from 'preact/hooks';",
                example: 'const memoizedCallback = useCallback(() => {}, []);'
            },
            {
                name: 'useMemo',
                description: 'Memoización de valores computados',
                import: "import { useMemo } from 'preact/hooks';",
                example: 'const memoizedValue = useMemo(() => computation, [deps]);'
            },
            {
                name: 'useRef',
                description: 'Referencias mutables',
                import: "import { useRef } from 'preact/hooks';",
                example: 'const ref = useRef(null);'
            }
        ];
    },

    // Obtener tab principal
    getTab() {
        return () => import('./components/PreactComponentsTab.jsx');
    },

    // Obtener componente de preview
    getPreview() {
        return () => import('./components/PreactComponentPreview.jsx');
    },

    // Obtener metadata del plugin
    getMetadata() {
        return {
            name: 'Preact Components',
            description: 'Sistema de componentes usando Preact + Mantine + Tailwind',
            version: this.version,
            author: 'Page Builder Team',
            features: [
                'Componentes Preact con JSX',
                'Hooks modernos (useState, useEffect)',
                'Preview en tiempo real',
                'Integración con Mantine UI',
                'Autocompletado inteligente'
            ]
        };
    },

    // Validar componente Preact
    validateComponent(code) {
        const errors = [];

        // Verificaciones básicas
        if (!code.includes('const ') && !code.includes('function ')) {
            errors.push('El componente debe definirse como const o function');
        }

        if (!code.includes('return')) {
            errors.push('El componente debe tener un return statement');
        }

        // Verificar JSX básico
        if (code.includes('return') && !code.includes('<')) {
            errors.push('El componente debe retornar JSX (elementos con <...>)');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    },

    // Extraer información del componente
    extractComponentInfo(code) {
        const info = {
            name: 'Component',
            props: [],
            hooks: [],
            dependencies: []
        };

        // Extraer nombre del componente
        const nameMatch = code.match(/(?:const|function)\s+([A-Z][a-zA-Z0-9]*)/);
        if (nameMatch) {
            info.name = nameMatch[1];
        }

        // Extraer props
        const propsMatch = code.match(/\(\s*{\s*([^}]+)\s*}\s*\)/);
        if (propsMatch) {
            info.props = propsMatch[1]
                .split(',')
                .map(prop => prop.trim().split('=')[0].trim())
                .filter(prop => prop.length > 0);
        }

        // Extraer hooks
        const hookMatches = code.match(/use[A-Z]\w*/g);
        if (hookMatches) {
            info.hooks = [...new Set(hookMatches)];
        }

        return info;
    },

    // Generar código de ejemplo
    generateExample(type) {
        const examples = {
            button: `const InteractiveButton = ({ 
  children = "Click me",
  variant = "primary",
  onClick = null 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <button
      className={\`px-4 py-2 rounded-lg \${variant === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-200'}\`}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {children}
    </button>
  );
};`,

            hero: `const HeroSection = ({ 
  title = "Construye Sitios Web Increíbles",
  subtitle = "Con nuestro page builder revolucionario",
  ctaText = "Comenzar Ahora"
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);
  
  return (
    <section className="relative h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600">
      <div className={\`text-center text-white max-w-4xl mx-auto px-4 transition-all duration-1000 \${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }\`}>
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          {title}
        </h1>
        <p className="text-xl md:text-2xl mb-8 opacity-90">
          {subtitle}
        </p>
        <button className="bg-white text-blue-600 font-bold py-4 px-8 rounded-lg text-lg hover:scale-105 transform transition-all">
          {ctaText}
        </button>
      </div>
    </section>
  );
};`,

            card: `const ContentCard = ({
  title = "Card Title",
  description = "Card description goes here...",
  image = "https://via.placeholder.com/400x200"
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={\`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 \${
        isHovered ? 'shadow-xl transform scale-105' : ''
      }\`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={image} alt={title} className="w-full h-48 object-cover" />
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
};`
        };

        return examples[type] || examples.button;
    }
};

export default preactComponentsPlugin;