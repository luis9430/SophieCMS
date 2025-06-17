// ===================================================================
// resources/js/mdx-system/core/TemplateManager.js - CON TAILWIND
// ===================================================================

export class TemplateManager {
  constructor() {
    this.templates = new Map();
    this.loadDefaultTemplates();
    this.loadTailwindTemplates(); // ← NUEVO
  }

  loadDefaultTemplates() {
    // Templates existentes (mantener)
    this.addTemplate('basic', {
      name: 'Página básica',
      category: 'general',
      description: 'Plantilla simple para empezar',
      thumbnail: '📄',
      content: `---
title: "Mi página"
---

# Bienvenido

Este es mi **primer contenido** con MDX.

<Alert color="blue" title="¡Genial!">
  ¡Estás usando el sistema MDX!
</Alert>

<Button color="green">Mi primer botón</Button>`
    });

    this.addTemplate('landing', {
      name: 'Landing Page',
      category: 'marketing',
      description: 'Página de aterrizaje',
      thumbnail: '🚀',
      content: `---
title: "Mi Landing Page"
---

<Hero 
  title="Transforma tu negocio"
  subtitle="La solución que estabas esperando"
  buttonText="Comenzar ahora"
/>

<Container>
  <Grid>
    <GridCol span={4}>
      <Card>
        <Text fw={500}>Fácil</Text>
        <Text size="sm">Súper fácil de usar</Text>
      </Card>
    </GridCol>
    <GridCol span={4}>
      <Card>
        <Text fw={500}>Rápido</Text>
        <Text size="sm">Resultados inmediatos</Text>
      </Card>
    </GridCol>
    <GridCol span={4}>
      <Card>
        <Text fw={500}>Efectivo</Text>
        <Text size="sm">Resultados garantizados</Text>
      </Card>
    </GridCol>
  </Grid>
</Container>`
    });
  }

  // ===================================================================
  // NUEVOS TEMPLATES CON TAILWIND
  // ===================================================================
  
  loadTailwindTemplates() {
    this.addTemplate('tailwind-landing', {
      name: 'Landing con Tailwind',
      category: 'tailwind',
      description: 'Landing page moderna con Tailwind CSS',
      thumbnail: '🎨',
      content: `---
title: "Landing Page con Tailwind"
description: "Página de aterrizaje moderna"
author: "Tu nombre"
---

<TailwindHero 
  title="Transforma tu negocio hoy"
  subtitle="La solución moderna que estabas buscando"
  buttonText="Comenzar gratis"
  theme="purple"
/>

<Section background="white" padding="lg">
  <TailwindContainer size="default">
    <div className="text-center mb-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        ¿Por qué elegirnos?
      </h2>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Combinamos lo mejor de Mantine y Tailwind para crear experiencias increíbles
      </p>
    </div>
    
    <FeatureGrid features={[
      { 
        icon: "⚡", 
        title: "Super Rápido", 
        description: "Rendimiento optimizado con las mejores prácticas" 
      },
      { 
        icon: "🎨", 
        title: "Hermoso Diseño", 
        description: "Interfaces modernas que encantan a los usuarios" 
      },
      { 
        icon: "🔧", 
        title: "Fácil de usar", 
        description: "Herramientas intuitivas que ahorran tiempo" 
      }
    ]} />
  </TailwindContainer>
</Section>

<Section background="gradient" padding="lg">
  <TailwindContainer size="default">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Características increíbles
        </h2>
        
        <TailwindAlert 
          type="success" 
          title="¡Nuevo!" 
          children="Ahora con soporte completo para Tailwind CSS"
        />
        
        <div className="mt-6 space-y-4">
          <TailwindCard 
            title="Editor MDX" 
            description="Crea contenido con Markdown + componentes React"
            variant="primary"
            badge="Popular"
          />
        </div>
      </div>
      
      <div className="text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold mb-4">¿Listo para empezar?</h3>
          
          <div className="space-y-3">
            <TailwindButton variant="primary" size="lg">
              Prueba gratuita
            </TailwindButton>
            
            <TailwindButton variant="outline" size="md">
              Ver demo
            </TailwindButton>
          </div>
        </div>
      </div>
    </div>
  </TailwindContainer>
</Section>`
    });

    this.addTemplate('tailwind-blog', {
      name: 'Blog con Tailwind',
      category: 'tailwind',
      description: 'Artículo de blog con diseño moderno',
      thumbnail: '📝',
      content: `---
title: "Mi primer artículo con Tailwind"
date: "2024-01-01"
author: "Tu nombre"
description: "Un artículo hermoso con Tailwind CSS"
---

<TailwindContainer size="default">
  <article className="max-w-3xl mx-auto">
    <header className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        {title}
      </h1>
      <div className="text-gray-600 mb-6">
        Por **{author}** • {date}
      </div>
    </header>

    <TailwindAlert 
      type="info" 
      title="Bienvenido"
      children="Este es un ejemplo de artículo usando Tailwind CSS para el diseño"
    />

    ## Introducción

    Este artículo demuestra cómo combinar **MDX** con **Tailwind CSS** para crear contenido hermoso y funcional.

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      <TailwindCard 
        title="Tailwind CSS"
        description="Framework de CSS utilitario para diseño rápido"
        variant="primary"
        badge="CSS"
      />
      
      <TailwindCard 
        title="MDX"
        description="Markdown + JSX = Contenido poderoso"
        variant="success"
        badge="JS"
      />
    </div>

    ## Características principales

    <FeatureGrid features={[
      { icon: "🚀", title: "Rápido", description: "Desarrollo ágil" },
      { icon: "🎨", title: "Hermoso", description: "Diseños increíbles" },
      { icon: "📱", title: "Responsive", description: "Funciona everywhere" }
    ]} />

    ## Conclusión

    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 text-center my-8">
      <h3 className="text-2xl font-bold mb-4">¿Te gustó este artículo?</h3>
      <p className="text-gray-600 mb-6">Compártelo con tus amigos</p>
      
      <TailwindButton variant="primary" size="lg">
        Compartir artículo
      </TailwindButton>
    </div>
  </article>
</TailwindContainer>`
    });

    this.addTemplate('tailwind-portfolio', {
      name: 'Portfolio con Tailwind',
      category: 'tailwind',
      description: 'Portfolio personal moderno',
      thumbnail: '💼',
      content: `---
title: "Mi Portfolio"
name: "Tu Nombre"
profession: "Desarrollador Full Stack"
email: "tu@email.com"
---

<Section background="gradient" padding="lg">
  <TailwindContainer size="default">
    <div className="text-center">
      <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-8 flex items-center justify-center text-white text-4xl font-bold">
        {name.charAt(0)}
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        {name}
      </h1>
      
      <p className="text-xl text-gray-600 mb-8">
        {profession}
      </p>
      
      <div className="space-x-4">
        <TailwindButton variant="primary" size="lg">
          Ver proyectos
        </TailwindButton>
        
        <TailwindButton variant="outline" size="lg">
          Contactar
        </TailwindButton>
      </div>
    </div>
  </TailwindContainer>
</Section>

<Section background="white" padding="lg">
  <TailwindContainer size="default">
    <div className="text-center mb-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Sobre mí
      </h2>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto">
        Soy un desarrollador apasionado con experiencia en tecnologías modernas. 
        Me encanta crear experiencias web increíbles que resuelven problemas reales.
      </p>
    </div>

    <FeatureGrid features={[
      { icon: "💻", title: "Frontend", description: "React, Vue, Angular" },
      { icon: "⚙️", title: "Backend", description: "Node.js, Python, PHP" },
      { icon: "📱", title: "Mobile", description: "React Native, Flutter" },
      { icon: "☁️", title: "Cloud", description: "AWS, Google Cloud, Azure" }
    ]} />
  </TailwindContainer>
</Section>

<Section background="gray" padding="lg">
  <TailwindContainer size="default">
    <div className="text-center mb-16">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Proyectos destacados
      </h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <TailwindCard 
        title="E-commerce App"
        description="Aplicación de comercio electrónico completa con React y Node.js"
        variant="primary"
        badge="React"
      />
      
      <TailwindCard 
        title="Dashboard Analytics"
        description="Dashboard de analytics en tiempo real con Vue.js y Python"
        variant="success"
        badge="Vue"
      />
      
      <TailwindCard 
        title="Mobile App"
        description="App móvil para gestión de tareas con React Native"
        variant="warning"
        badge="Mobile"
      />
    </div>
  </TailwindContainer>
</Section>

<Section background="dark" padding="normal">
  <TailwindContainer size="default">
    <div className="text-center">
      <h2 className="text-3xl font-bold mb-4">
        ¿Trabajamos juntos?
      </h2>
      <p className="text-xl opacity-90 mb-8">
        Estoy disponible para nuevos proyectos
      </p>
      
      <TailwindAlert 
        type="info" 
        title="Contacto"
        children="Escríbeme a tu@email.com para discutir tu proyecto"
      />
      
      <div className="mt-8">
        <TailwindButton variant="primary" size="lg">
          Enviar mensaje
        </TailwindButton>
      </div>
    </div>
  </TailwindContainer>
</Section>`
    });
  }

  addTemplate(id, template) {
    this.templates.set(id, {
      id,
      created: new Date().toISOString(),
      ...template
    });
  }

  getTemplate(id) {
    return this.templates.get(id);
  }

  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category) {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  getCategories() {
    const categories = new Set();
    this.getAllTemplates().forEach(t => categories.add(t.category));
    return Array.from(categories);
  }

  deleteTemplate(id) {
    return this.templates.delete(id);
  }

  // ===================================================================
  // NUEVOS MÉTODOS PARA TAILWIND
  // ===================================================================
  
  getTailwindTemplates() {
    return this.getTemplatesByCategory('tailwind');
  }

  getStats() {
    const stats = {
      total: this.templates.size,
      byCategory: {}
    };

    this.getCategories().forEach(category => {
      stats.byCategory[category] = this.getTemplatesByCategory(category).length;
    });

    return stats;
  }
}