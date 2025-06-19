// ===================================================================
// resources/js/mdx-system/core/ComponentRegistry.js - ACTUALIZADO
// Integra los nuevos componentes UI
// ===================================================================

import { Button as MantineButton, Alert as MantineAlert, Card as MantineCard, Text, Container, Grid, Paper, Badge, Group } from '@mantine/core';
import { createElement as h } from 'preact';

// ===================================================================
// IMPORTAR NUESTROS NUEVOS COMPONENTES
// ===================================================================
import { MDXComponents, ComponentMetadata } from '../components/index.js';

export class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.loadCustomUIComponents(); // ← PRIORIDAD: Nuestros componentes primero
    this.loadDefaultComponents();
    this.loadTailwindComponents();
    this.loadMissingComponents();
    
    console.log('🎨 ComponentRegistry initialized with', this.components.size, 'components');
  }

  // ===================================================================
  // CARGAR NUESTROS COMPONENTES PERSONALIZADOS (PRIORIDAD)
  // ===================================================================
  loadCustomUIComponents() {
    console.log('🚀 Loading custom UI components...');
    
    // Registrar nuestros componentes principales con alta prioridad
    Object.entries(MDXComponents).forEach(([name, component]) => {
      const metadata = ComponentMetadata[name.split('.')[0]];
      
      this.registerComponent(name, component, {
        category: metadata?.category || 'ui',
        description: metadata?.description || `Componente ${name}`,
        example: metadata?.example || `<${name}>Content</${name}>`,
        priority: 'high', // ← Prioridad alta para nuestros componentes
        metadata
      });
    });

    console.log('✅ Custom UI components loaded:', Object.keys(MDXComponents));
  }

  loadDefaultComponents() {
    // Componentes Mantine básicos (con prefijo para evitar conflictos)
    this.registerComponent('MantineButton', MantineButton, { category: 'mantine', priority: 'low' });
    this.registerComponent('MantineAlert', MantineAlert, { category: 'mantine', priority: 'low' });
    this.registerComponent('MantineCard', MantineCard, { category: 'mantine', priority: 'low' });
    this.registerComponent('Text', Text, { category: 'mantine', priority: 'low' });
    this.registerComponent('Container', Container, { category: 'mantine', priority: 'low' });
    this.registerComponent('Grid', Grid, { category: 'mantine', priority: 'low' });
    this.registerComponent('GridCol', Grid.Col, { category: 'mantine', priority: 'low' });
    this.registerComponent('Paper', Paper, { category: 'mantine', priority: 'low' });
    this.registerComponent('Badge', Badge, { category: 'mantine', priority: 'low' });
    this.registerComponent('Group', Group, { category: 'mantine', priority: 'low' });
  }

  loadMissingComponents() {
    // Elementos HTML básicos
    this.registerComponent('div', ({ children, className = '', style = {} }) => {
      return h('div', { className, style }, children);
    }, { category: 'html', priority: 'low' });

    this.registerComponent('h1', ({ children, className = '' }) => {
      return h('h1', { className }, children);
    }, { category: 'html', priority: 'low' });

    this.registerComponent('h2', ({ children, className = '' }) => {
      return h('h2', { className }, children);
    }, { category: 'html', priority: 'low' });

    this.registerComponent('h3', ({ children, className = '' }) => {
      return h('h3', { className }, children);
    }, { category: 'html', priority: 'low' });

    this.registerComponent('p', ({ children, className = '' }) => {
      return h('p', { className }, children);
    }, { category: 'html', priority: 'low' });

    this.registerComponent('span', ({ children, className = '' }) => {
      return h('span', { className }, children);
    }, { category: 'html', priority: 'low' });

    // FeatureGrid helper component
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
  // MÉTODO DE REGISTRO MEJORADO
  // ===================================================================
  registerComponent(name, component, options = {}) {
    const {
      category = 'basic',
      description = `Componente ${name}`,
      example = null,
      priority = 'medium',
      metadata = null
    } = options;

    this.components.set(name, {
      name,
      component,
      category,
      description,
      priority,
      metadata,
      example: example || this.generateExample(name, metadata),
      registered: new Date().toISOString()
    });
  }

  // ===================================================================
  // GENERADOR DE EJEMPLOS MEJORADO
  // ===================================================================
  generateExample(name, metadata = null) {
    // Si tenemos metadata de nuestros componentes, usar sus ejemplos
    if (metadata && metadata.example) {
      return metadata.example;
    }

    // Ejemplos por defecto para nuestros componentes
    const examples = {
      // Nuestros componentes nuevos (PRIORIDAD)
      'Button': '<Button variant="primary">Click me</Button>',
      'Card': '<Card title="My Card" description="Beautiful card">Content here</Card>',
      'Alert': '<Alert type="info" title="Information">This is an alert</Alert>',
      'Hero': '<Hero title="Welcome" subtitle="Build amazing things" primaryButton="Get Started" />',
      
      // Subcomponentes
      'Alert.Info': '<Alert.Info title="Info">Information message</Alert.Info>',
      'Alert.Success': '<Alert.Success title="Success">Success message</Alert.Success>',
      'Alert.Warning': '<Alert.Warning title="Warning">Warning message</Alert.Warning>',
      'Alert.Error': '<Alert.Error title="Error">Error message</Alert.Error>',
      
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

  // ===================================================================
  // NUEVO: MÉTODOS ESPECÍFICOS PARA NUESTROS COMPONENTES
  // ===================================================================
  getCustomComponents() {
    return this.getComponentsByCategory('ui').concat(this.getComponentsByCategory('layout'));
  }

  getRecommendedComponents() {
    // Componentes recomendados para empezar
    return ['Button', 'Card', 'Alert', 'Hero'].map(name => this.getComponent(name)).filter(Boolean);
  }

  getMDXComponents() {
    const components = {};
    
    // Priorizar nuestros componentes
    for (const [name, config] of this.components) {
      components[name] = config.component;
    }
    
    return components;
  }

  // ===================================================================
  // MÉTODOS DE BÚSQUEDA Y SUGERENCIAS
  // ===================================================================
  searchComponents(query) {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllComponents().filter(comp => 
      comp.name.toLowerCase().includes(lowercaseQuery) ||
      comp.description.toLowerCase().includes(lowercaseQuery) ||
      comp.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  getComponentSuggestions(partialName) {
    const lowercase = partialName.toLowerCase();
    return Array.from(this.components.keys())
      .filter(name => name.toLowerCase().startsWith(lowercase))
      .slice(0, 5);
  }

  // ===================================================================
  // MÉTODOS DE ANÁLISIS Y DEBUG
  // ===================================================================
  getStats() {
    const components = this.getAllComponents();
    const categories = {};
    const priorities = {};
    
    components.forEach(comp => {
      categories[comp.category] = (categories[comp.category] || 0) + 1;
      priorities[comp.priority] = (priorities[comp.priority] || 0) + 1;
    });

    return {
      total: components.length,
      categories,
      priorities,
      customComponents: this.getCustomComponents().length,
      recommendedComponents: this.getRecommendedComponents().length
    };
  }

  debugMissingComponent(componentName) {
    console.log(`❌ Componente faltante: ${componentName}`);
    
    // Mostrar componentes disponibles por categoría
    const byCategory = {};
    this.getAllComponents().forEach(comp => {
      if (!byCategory[comp.category]) byCategory[comp.category] = [];
      byCategory[comp.category].push(comp.name);
    });
    
    console.log('✅ Componentes disponibles por categoría:', byCategory);
    
    // Sugerir componentes similares
    const suggestions = this.getComponentSuggestions(componentName);
    if (suggestions.length > 0) {
      console.log('🔍 Sugerencias:', suggestions);
    }

    // Buscar por descripción
    const searchResults = this.searchComponents(componentName);
    if (searchResults.length > 0) {
      console.log('📝 Encontrados por búsqueda:', searchResults.map(c => c.name));
    }
  }

  // ===================================================================
  // MÉTODO PARA EXPORTAR CONFIGURACIÓN
  // ===================================================================
  exportConfig() {
    return {
      components: Object.fromEntries(this.components),
      stats: this.getStats(),
      categories: [...new Set(this.getAllComponents().map(c => c.category))],
      customComponents: this.getCustomComponents().map(c => c.name),
      recommendedComponents: this.getRecommendedComponents().map(c => c.name)
    };
  }
}

// ===================================================================
// UTILIDADES GLOBALES PARA DEBUG
// ===================================================================
if (typeof window !== 'undefined') {
  window.debugComponents = {
    registry: null,
    
    init() {
      this.registry = new ComponentRegistry();
      return this.registry;
    },

    listAll() {
      if (!this.registry) this.init();
      console.table(this.registry.getAllComponents().map(c => ({
        name: c.name,
        category: c.category,
        description: c.description,
        hasMetadata: !!c.metadata
      })));
    },
    
    listByCategory(category) {
      if (!this.registry) this.init();
      const components = this.registry.getComponentsByCategory(category);
      console.table(components.map(c => ({
        name: c.name,
        description: c.description
      })));
    },

    stats() {
      if (!this.registry) this.init();
      console.log('📊 Component Registry Stats:', this.registry.getStats());
    },
    
    checkComponent(name) {
      if (!this.registry) this.init();
      const component = this.registry.getComponent(name);
      if (component) {
        console.log('✅ Componente encontrado:', component);
        console.log('📄 Ejemplo:', component.example);
      } else {
        this.registry.debugMissingComponent(name);
      }
    },

    search(query) {
      if (!this.registry) this.init();
      const results = this.registry.searchComponents(query);
      console.log(`🔍 Resultados para "${query}":`, results.map(c => c.name));
      return results;
    },

    suggest(partial) {
      if (!this.registry) this.init();
      const suggestions = this.registry.getComponentSuggestions(partial);
      console.log(`💡 Sugerencias para "${partial}":`, suggestions);
      return suggestions;
    }
  };
}

export default ComponentRegistry;