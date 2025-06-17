// ===================================================================
// resources/js/mdx-system/core/ComponentRegistry.js - FIX COMPLETO
// ===================================================================

import { Button, Alert, Card, Text, Container, Grid, Paper, Badge, Group } from '@mantine/core';
import { createElement as h } from 'preact';

export class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.loadDefaultComponents();
    this.loadTailwindComponents();
    this.loadMissingComponents(); // ← NUEVO: Agregar componentes faltantes
  }

  loadDefaultComponents() {
    // Componentes Mantine básicos
    this.registerComponent('Button', Button);
    this.registerComponent('Alert', Alert);
    this.registerComponent('Card', Card);
    this.registerComponent('Text', Text);
    this.registerComponent('Container', Container);
    this.registerComponent('Grid', Grid);
    this.registerComponent('GridCol', Grid.Col);
    this.registerComponent('Paper', Paper);
    this.registerComponent('Badge', Badge);
    this.registerComponent('Group', Group);
  }

  // ===================================================================
  // FIX: AGREGAR COMPONENTES FALTANTES
  // ===================================================================
  
  loadMissingComponents() {
    // Hero original (Mantine style) - FALTABA ESTE
    this.registerComponent('Hero', ({ title = 'Título Hero', subtitle = 'Subtítulo', buttonText = 'Botón' }) => {
      return h('div', { 
        style: { 
          textAlign: 'center', 
          padding: '3rem 1rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '8px',
          margin: '2rem 0'
        } 
      }, [
        h('h1', { 
          style: { 
            fontSize: '2.5rem', 
            marginBottom: '1rem', 
            fontWeight: 'bold' 
          } 
        }, title),
        h('p', { 
          style: { 
            fontSize: '1.2rem', 
            marginBottom: '2rem',
            opacity: 0.9
          } 
        }, subtitle),
        h(Button, { 
          color: 'white', 
          variant: 'outline',
          size: 'lg',
          style: { borderColor: 'white', color: 'white' }
        }, buttonText)
      ]);
    });

    // Elementos HTML básicos que pueden faltar
    this.registerComponent('div', ({ children, className = '', style = {} }) => {
      return h('div', { className, style }, children);
    });

    this.registerComponent('h1', ({ children, className = '' }) => {
      return h('h1', { className }, children);
    });

    this.registerComponent('h2', ({ children, className = '' }) => {
      return h('h2', { className }, children);
    });

    this.registerComponent('h3', ({ children, className = '' }) => {
      return h('h3', { className }, children);
    });

    this.registerComponent('p', ({ children, className = '' }) => {
      return h('p', { className }, children);
    });

    this.registerComponent('span', ({ children, className = '' }) => {
      return h('span', { className }, children);
    });

    // Componente FeatureGrid mejorado (que se usa en templates)
    this.registerComponent('FeatureGrid', ({ features = [] }) => {
      const defaultFeatures = [
        { icon: '⚡', title: 'Super Fast', description: 'Lightning fast performance' },
        { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
        { icon: '🚀', title: 'Scalable', description: 'Grows with your business' }
      ];

      const featuresToShow = features.length > 0 ? features : defaultFeatures;

      return h('div', { 
        className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
      }, 
        featuresToShow.map((feature, index) => 
          h('div', { 
            key: index,
            className: 'text-center p-6 rounded-lg bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200'
          }, [
            h('div', { className: 'text-4xl mb-4' }, feature.icon),
            h('h3', { className: 'text-lg font-semibold mb-2 text-gray-900' }, feature.title),
            h('p', { className: 'text-gray-600' }, feature.description)
          ])
        )
      );
    });
  }

  loadTailwindComponents() {
    // TailwindHero
    this.registerComponent('TailwindHero', ({ 
      title = 'Amazing Title', 
      subtitle = 'Beautiful subtitle', 
      buttonText = 'Get Started',
      theme = 'blue'
    }) => {
      const themes = {
        blue: 'from-blue-600 to-purple-600',
        green: 'from-green-500 to-teal-600',
        red: 'from-red-500 to-pink-600',
        purple: 'from-purple-600 to-indigo-600'
      };

      return h('div', {
        className: `bg-gradient-to-r ${themes[theme]} text-white py-20 px-6`
      }, [
        h('div', { className: 'max-w-4xl mx-auto text-center' }, [
          h('h1', { 
            className: 'text-5xl md:text-6xl font-bold mb-6' 
          }, title),
          h('p', { 
            className: 'text-xl md:text-2xl mb-8 opacity-90' 
          }, subtitle),
          h('button', {
            className: 'bg-white text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg'
          }, buttonText)
        ])
      ]);
    });

    // TailwindCard
    this.registerComponent('TailwindCard', ({ 
      title = 'Card Title',
      description = 'Card description',
      image = null,
      badge = null,
      variant = 'default'
    }) => {
      const variants = {
        default: 'bg-white border-gray-200',
        primary: 'bg-blue-50 border-blue-200',
        success: 'bg-green-50 border-green-200',
        warning: 'bg-yellow-50 border-yellow-200'
      };

      return h('div', {
        className: `${variants[variant]} border-2 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden`
      }, [
        image && h('img', {
          src: image,
          alt: title,
          className: 'w-full h-48 object-cover'
        }),
        h('div', { className: 'p-6' }, [
          h('div', { className: 'flex items-start justify-between mb-3' }, [
            h('h3', { className: 'text-xl font-semibold text-gray-900' }, title),
            badge && h('span', {
              className: 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800'
            }, badge)
          ]),
          h('p', { className: 'text-gray-600 leading-relaxed' }, description)
        ])
      ]);
    });

    // TailwindButton
    this.registerComponent('TailwindButton', ({ 
      children = 'Button',
      variant = 'primary',
      size = 'md',
      disabled = false
    }) => {
      const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
        ghost: 'text-blue-600 hover:bg-blue-50'
      };

      const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
      };

      return h('button', {
        className: `
          ${variants[variant]} 
          ${sizes[size]} 
          font-medium rounded-lg transition-all duration-200 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:transform hover:scale-105'}
        `,
        disabled
      }, children);
    });

    // TailwindAlert
    this.registerComponent('TailwindAlert', ({ 
      type = 'info',
      title = 'Information',
      children = 'This is an alert message',
      dismissible = false
    }) => {
      const types = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        success: 'bg-green-50 border-green-200 text-green-800',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        error: 'bg-red-50 border-red-200 text-red-800'
      };

      const icons = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌'
      };

      return h('div', {
        className: `${types[type]} border-l-4 p-4 rounded-r-lg relative`
      }, [
        h('div', { className: 'flex' }, [
          h('div', { className: 'flex-shrink-0 mr-3' }, [
            h('span', { className: 'text-lg' }, icons[type])
          ]),
          h('div', { className: 'flex-1' }, [
            h('h4', { className: 'font-semibold mb-1' }, title),
            h('p', { className: 'text-sm opacity-90' }, children)
          ]),
          dismissible && h('button', {
            className: 'absolute top-2 right-2 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors'
          }, '×')
        ])
      ]);
    });

    // TailwindContainer
    this.registerComponent('TailwindContainer', ({ 
      children,
      size = 'default',
      className = ''
    }) => {
      const sizes = {
        sm: 'max-w-3xl',
        default: 'max-w-6xl',
        lg: 'max-w-7xl',
        full: 'max-w-full'
      };

      return h('div', {
        className: `${sizes[size]} mx-auto px-4 sm:px-6 lg:px-8 ${className}`
      }, children);
    });

    // Section
    this.registerComponent('Section', ({ 
      children,
      background = 'white',
      padding = 'normal'
    }) => {
      const backgrounds = {
        white: 'bg-white',
        gray: 'bg-gray-50',
        dark: 'bg-gray-900 text-white',
        blue: 'bg-blue-50',
        gradient: 'bg-gradient-to-r from-blue-50 to-purple-50'
      };

      const paddings = {
        none: '',
        sm: 'py-8',
        normal: 'py-16',
        lg: 'py-24'
      };

      return h('section', {
        className: `${backgrounds[background]} ${paddings[padding]}`
      }, children);
    });
  }

  registerComponent(name, component) {
    this.components.set(name, {
      name,
      component,
      category: name.startsWith('Tailwind') ? 'tailwind' : 'basic',
      description: `Componente ${name}`,
      example: this.generateExample(name)
    });
  }

  generateExample(name) {
    const examples = {
      // Mantine
      'Button': '<Button color="blue">Mi botón</Button>',
      'Alert': '<Alert color="blue" title="Información">Mensaje de alerta</Alert>',
      'Card': '<Card withBorder><Text>Contenido de la card</Text></Card>',
      'Hero': '<Hero title="Mi Hero" subtitle="Subtítulo" buttonText="Acción" />',
      
      // Tailwind
      'TailwindHero': '<TailwindHero title="¡Increíble!" subtitle="El futuro es ahora" buttonText="Comenzar" theme="blue" />',
      'TailwindCard': '<TailwindCard title="Mi Card" description="Descripción con Tailwind" badge="Nuevo" variant="primary" />',
      'FeatureGrid': '<FeatureGrid features={[{ icon: "🚀", title: "Rápido", description: "Super rápido" }]} />',
      'TailwindButton': '<TailwindButton variant="primary" size="lg">Mi Botón</TailwindButton>',
      'TailwindAlert': '<TailwindAlert type="success" title="¡Éxito!" children="Todo funcionó correctamente" />',
      'TailwindContainer': '<TailwindContainer size="lg">Contenido aquí</TailwindContainer>',
      'Section': '<Section background="gradient" padding="lg">Contenido de sección</Section>',
      
      // HTML básico
      'div': '<div className="p-4">Contenido</div>',
      'h1': '<h1 className="text-3xl font-bold">Título</h1>',
      'h2': '<h2 className="text-2xl font-semibold">Subtítulo</h2>',
      'p': '<p className="text-gray-600">Párrafo de texto</p>'
    };
    
    return examples[name] || `<${name}>Contenido</${name}>`;
  }

  getComponent(name) {
    return this.components.get(name);
  }

  getAllComponents() {
    return Array.from(this.components.values());
  }

  getComponentsByCategory(category) {
    return this.getAllComponents().filter(comp => comp.category === category);
  }

  getMDXComponents() {
    const components = {};
    for (const [name, config] of this.components) {
      components[name] = config.component;
    }
    return components;
  }

  // Debug helper
  debugMissingComponent(componentName) {
    console.log(`❌ Componente faltante: ${componentName}`);
    console.log('✅ Componentes disponibles:', Array.from(this.components.keys()));
    
    // Sugerir componentes similares
    const available = Array.from(this.components.keys());
    const similar = available.filter(name => 
      name.toLowerCase().includes(componentName.toLowerCase()) ||
      componentName.toLowerCase().includes(name.toLowerCase())
    );
    
    if (similar.length > 0) {
      console.log('🔍 Componentes similares:', similar);
    }
  }
}

// ===================================================================
// DEBUG HELPER GLOBAL
// ===================================================================

if (typeof window !== 'undefined') {
  window.debugComponents = {
    listAll: () => {
      const registry = new ComponentRegistry();
      console.table(registry.getAllComponents().map(c => ({
        name: c.name,
        category: c.category,
        description: c.description
      })));
    },
    
    checkComponent: (name) => {
      const registry = new ComponentRegistry();
      const component = registry.getComponent(name);
      if (component) {
        console.log('✅ Componente encontrado:', component);
      } else {
        registry.debugMissingComponent(name);
      }
    }
  };
}