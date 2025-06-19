// ===================================================================
// resources/js/mdx-system/core/ComponentRegistry.js - FIX NESTING P
// ===================================================================

import { Button as MantineButton, Alert as MantineAlert, Card as MantineCard, Text as MantineText, Container, Grid, Paper, Badge, Group } from '@mantine/core';
import { createElement as h } from 'preact';

// ===================================================================
// IMPORTAR NUESTROS NUEVOS COMPONENTES
// ===================================================================
import { MDXComponents, ComponentMetadata } from '../components/index.js';

export class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.loadCustomUIComponents(); 
    this.loadDefaultComponents();
    this.loadTailwindComponents();
    this.loadMissingComponents();
    
    console.log('🎨 ComponentRegistry initialized with', this.components.size, 'components');
  }

  loadCustomUIComponents() {
    console.log('🚀 Loading custom UI components...');
    
    // Registrar nuestros componentes principales con alta prioridad
    Object.entries(MDXComponents).forEach(([name, component]) => {
      const metadata = ComponentMetadata[name.split('.')[0]];
      
      this.registerComponent(name, component, {
        category: metadata?.category || 'ui',
        description: metadata?.description || `Componente ${name}`,
        example: metadata?.example || `<${name}>Content</${name}>`,
        priority: 'high',
        metadata
      });
    });

    console.log('✅ Custom UI components loaded:', Object.keys(MDXComponents));
  }

  loadDefaultComponents() {
    // ===================================================================
    // FIX: Componente Text personalizado para evitar nesting de <p>
    // ===================================================================
    this.registerComponent('Text', ({ children, ...props }) => {
      // Si ya estamos dentro de un párrafo MDX, usar span
      // Si no, usar div para evitar problemas de nesting
      return h(MantineText, {
        ...props,
        component: 'span', // 👈 CLAVE: Forzar renderizado como span
        style: {
          display: 'inline', // Mantener comportamiento inline
          ...props.style
        }
      }, children);
    }, { category: 'mantine', priority: 'high' });

    // ===================================================================
    // Componente Container mejorado
    // ===================================================================
    this.registerComponent('Container', ({ children, ...props }) => {
      return h(Container, {
        ...props,
        style: {
          // Asegurar que no interfiera con el layout
          ...props.style
        }
      }, children);
    }, { category: 'mantine', priority: 'medium' });

    // Otros componentes Mantine básicos
    this.registerComponent('MantineButton', MantineButton, { category: 'mantine', priority: 'low' });
    this.registerComponent('Button', MantineButton, { category: 'mantine', priority: 'medium' });
    this.registerComponent('Alert', MantineAlert, { category: 'mantine', priority: 'medium' });
    this.registerComponent('Card', MantineCard, { category: 'mantine', priority: 'medium' });
    this.registerComponent('Grid', Grid, { category: 'mantine', priority: 'low' });
    this.registerComponent('GridCol', Grid.Col, { category: 'mantine', priority: 'low' });
    this.registerComponent('Paper', Paper, { category: 'mantine', priority: 'low' });
    this.registerComponent('Badge', Badge, { category: 'mantine', priority: 'low' });
    this.registerComponent('Group', Group, { category: 'mantine', priority: 'low' });
  }

  loadMissingComponents() {
    // ===================================================================
    // FIX: Elementos HTML básicos con mejor manejo de párrafos
    // ===================================================================
    
    // DIV seguro
    this.registerComponent('div', ({ children, className = '', style = {} }) => {
      return h('div', { className, style }, children);
    }, { category: 'html', priority: 'low' });

    // Headings seguros
    this.registerComponent('h1', ({ children, className = '' }) => {
      return h('h1', { className }, children);
    }, { category: 'html', priority: 'low' });

    this.registerComponent('h2', ({ children, className = '' }) => {
      return h('h2', { className }, children);
    }, { category: 'html', priority: 'low' });

    this.registerComponent('h3', ({ children, className = '' }) => {
      return h('h3', { className }, children);
    }, { category: 'html', priority: 'low' });

    // ===================================================================
    // IMPORTANTE: P mejorado para evitar anidamiento
    // ===================================================================
    this.registerComponent('p', ({ children, className = '', ...props }) => {
      // Si ya hay contenido de texto, usar span para evitar nesting
      return h('div', { 
        className: `prose-p ${className}`, 
        style: { 
          marginBottom: '1rem',
          lineHeight: '1.6',
          ...props.style 
        },
        ...props 
      }, children);
    }, { category: 'html', priority: 'medium' });

    // SPAN seguro
    this.registerComponent('span', ({ children, className = '' }) => {
      return h('span', { className }, children);
    }, { category: 'html', priority: 'low' });

    // ===================================================================
    // FeatureGrid mejorado
    // ===================================================================
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
            h('div', { className: 'text-gray-600' }, feature.description) // 👈 Cambio: div en lugar de p
          ])
        )
      );
    }, { category: 'helper', priority: 'medium' });
  }

  loadTailwindComponents() {
    // Componentes legacy Tailwind (mantener compatibilidad)
    this.registerComponent('TailwindContainer', ({ 
      children,
      size = 'default'
    }) => {
      const sizes = {
        sm: 'max-w-3xl',
        default: 'max-w-6xl',
        lg: 'max-w-7xl',
        full: 'max-w-full'
      };

      return h('div', {
        className: `${sizes[size]} mx-auto px-4 sm:px-6 lg:px-8`
      }, children);
    }, { category: 'legacy', priority: 'low' });

    this.registerComponent('Section', ({ 
      children,
      background = 'white',
      padding = 'normal'
    }) => {
      const backgrounds = {
        white: 'bg-white',
        gray: 'bg-gray-50',
        dark: 'bg-gray-900 text-white',
        gradient: 'bg-gradient-to-r from-blue-50 to-purple-50'
      };

      const paddings = {
        sm: 'py-8',
        normal: 'py-16',
        lg: 'py-24'
      };

      return h('section', {
        className: `${backgrounds[background]} ${paddings[padding]}`
      }, children);
    }, { category: 'legacy', priority: 'low' });
  }

  // ===================================================================
  // MÉTODOS DE REGISTRO Y GESTIÓN
  // ===================================================================
  
  registerComponent(name, component, options = {}) {
    this.components.set(name, {
      name,
      component,
      category: options.category || 'custom',
      description: options.description || '',
      example: options.example || this.generateExample(name),
      priority: options.priority || 'medium',
      metadata: options.metadata || {}
    });
  }

  generateExample(name) {
    const examples = {
      // Mantine
      'Text': '<Text size="lg" fw={500}>Your text here</Text>',
      'Button': '<Button color="blue" size="md">Click me</Button>',
      'Alert': '<Alert color="blue" title="Notice">Your message here</Alert>',
      'Card': '<Card><Text>Card content</Text></Card>',
      'Badge': '<Badge color="green">Status</Badge>',
      'Container': '<Container><Text>Content</Text></Container>',
      'Grid': '<Grid><GridCol span={6}>Column 1</GridCol><GridCol span={6}>Column 2</GridCol></Grid>',
      
      // Helpers
      'FeatureGrid': '<FeatureGrid features={[{ icon: "🚀", title: "Fast", description: "Super fast" }]} />',
      'Section': '<Section background="gradient" padding="lg">Content here</Section>',
      'TailwindContainer': '<TailwindContainer>Content here</TailwindContainer>',
      
      // HTML básico
      'div': '<div className="p-4">Content</div>',
      'h1': '<h1 className="text-3xl font-bold">Title</h1>',
      'h2': '<h2 className="text-2xl font-semibold">Subtitle</h2>',
      'p': '<p className="text-gray-600">Paragraph text</p>'
    };
    
    return examples[name] || `<${name}>Content</${name}>`;
  }

  // ===================================================================
  // MÉTODOS PÚBLICOS MEJORADOS
  // ===================================================================
  getComponent(name) {
    return this.components.get(name);
  }

  getAllComponents() {
    // Ordenar por prioridad: high -> medium -> low
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    
    return Array.from(this.components.values()).sort((a, b) => {
      return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
    });
  }

  getComponentsByCategory(category) {
    return this.getAllComponents().filter(comp => comp.category === category);
  }

  getCustomComponents() {
    return this.getComponentsByCategory('ui').concat(this.getComponentsByCategory('layout'));
  }

  getRecommendedComponents() {
    // Componentes recomendados para empezar
    return ['Button', 'Card', 'Alert', 'Hero'].map(name => this.getComponent(name)).filter(Boolean);
  }

  getMDXComponents() {
    // Retorna el mapa de componentes para MDX
    const mdxComponents = {};
    
    for (const [name, comp] of this.components) {
      mdxComponents[name] = comp.component;
    }
    
    return mdxComponents;
  }

  // ===================================================================
  // DEBUG Y UTILIDADES
  // ===================================================================
  
  debugComponents() {
    console.group('🎨 Component Registry Debug');
    console.log('Total components:', this.components.size);
    
    const categories = {};
    this.getAllComponents().forEach(comp => {
      if (!categories[comp.category]) categories[comp.category] = [];
      categories[comp.category].push(comp.name);
    });
    
    Object.entries(categories).forEach(([category, components]) => {
      console.log(`${category}:`, components);
    });
    
    console.groupEnd();
  }
}