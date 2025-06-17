// ===================================================================
// resources/js/mdx-system/core/MDXEngine.js - FIX VARIABLES FRONTMATTER
// ===================================================================

import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'preact/jsx-runtime';

export class MDXEngine {
  constructor(components = {}) {
    this.components = components;
    this.cache = new Map();
  }

  async compile(mdxContent, variables = {}) {
    const cacheKey = this.generateSafeCacheKey(mdxContent, variables);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Procesar variables antes de compilar
      const processedContent = this.processVariables(mdxContent, variables);
      
      // Extraer frontmatter y contenido
      const { content, frontmatter } = this.extractFrontmatter(processedContent);
      
      // ===================================================================
      // FIX: Inyectar frontmatter como variables en el contenido
      // ===================================================================
      const contentWithFrontmatterVars = this.injectFrontmatterVariables(content, frontmatter);
      
      // Compilar contenido con variables disponibles
      const { default: Component } = await evaluate(contentWithFrontmatterVars, {
        ...runtime,
        useMDXComponents: () => this.components
      });

      const result = { Component, frontmatter, error: null };
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('MDX Compilation Error:', error);
      const result = { Component: null, frontmatter: null, error: error.message };
      return result;
    }
  }

  // ===================================================================
  // NUEVA FUNCIÓN: Inyectar variables del frontmatter
  // ===================================================================
  
  injectFrontmatterVariables(content, frontmatter) {
    if (!frontmatter || Object.keys(frontmatter).length === 0) {
      return content;
    }

    // Crear declaraciones de variables desde el frontmatter
    const frontmatterVars = Object.entries(frontmatter)
      .map(([key, value]) => `export const ${key} = ${JSON.stringify(value)};`)
      .join('\n');

    // Inyectar al inicio del contenido
    return frontmatterVars + '\n\n' + content;
  }

  extractFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (match) {
      const [, frontmatterYaml, contentWithoutFrontmatter] = match;
      
      try {
        const frontmatter = this.parseSimpleYaml(frontmatterYaml);
        return {
          content: contentWithoutFrontmatter.trim(),
          frontmatter
        };
      } catch (error) {
        console.warn('Error parsing frontmatter:', error);
        return {
          content: content,
          frontmatter: {}
        };
      }
    }
    
    return {
      content: content,
      frontmatter: {}
    };
  }

  parseSimpleYaml(yamlText) {
    const result = {};
    const lines = yamlText.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;
      
      const key = trimmed.slice(0, colonIndex).trim();
      let value = trimmed.slice(colonIndex + 1).trim();
      
      // Remover comillas si las tiene
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      result[key] = value;
    }
    
    return result;
  }

  processVariables(content, variables) {
    let processedContent = content;
    
    // Procesar variables globales pasadas como parámetro
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processedContent = processedContent.replace(regex, String(value));
    });

    // Inyectar variables globales como JavaScript (si las hay)
    if (Object.keys(variables).length > 0) {
      const variablesCode = `export const variables = ${JSON.stringify(variables, null, 2)};`;
      
      // Buscar final del frontmatter
      const frontmatterEnd = processedContent.indexOf('---', 3);
      if (frontmatterEnd !== -1) {
        const endOfSecondDashes = processedContent.indexOf('\n', frontmatterEnd + 3);
        if (endOfSecondDashes !== -1) {
          const beforeContent = processedContent.slice(0, endOfSecondDashes + 1);
          const afterContent = processedContent.slice(endOfSecondDashes + 1);
          processedContent = beforeContent + '\n' + variablesCode + '\n' + afterContent;
        }
      } else {
        processedContent = variablesCode + '\n\n' + processedContent;
      }
    }

    return processedContent;
  }

  generateSafeCacheKey(content, variables) {
    const input = content + JSON.stringify(variables);
    let hash = 0;
    if (input.length === 0) return hash.toString();
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return Math.abs(hash).toString(36).slice(0, 12);
  }

  clearCache() {
    this.cache.clear();
  }

  updateComponents(newComponents) {
    this.components = { ...this.components, ...newComponents };
    this.clearCache();
  }
}

// ===================================================================
// TEMPLATE CORREGIDO - Portfolio sin errores
// ===================================================================

export const fixedPortfolioTemplate = `---
title: "Mi Portfolio"
name: "Tu Nombre"
profession: "Desarrollador Full Stack"
email: "tu@email.com"
---

<Section background="gradient" padding="lg">
  <TailwindContainer size="default">
    <div className="text-center">
      <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-8 flex items-center justify-center text-white text-4xl font-bold">
        {name?.charAt(0) || 'T'}
      </div>
      
      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        {name || 'Tu Nombre'}
      </h1>
      
      <p className="text-xl text-gray-600 mb-8">
        {profession || 'Tu Profesión'}
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
        children={"Escríbeme a " + (email || "tu@email.com") + " para discutir tu proyecto"}
      />
      
      <div className="mt-8">
        <TailwindButton variant="primary" size="lg">
          Enviar mensaje
        </TailwindButton>
      </div>
    </div>
  </TailwindContainer>
</Section>`;

// ===================================================================
// DEBUGGING: Para verificar variables
// ===================================================================

if (typeof window !== 'undefined') {
  window.debugMDXVariables = {
    testFrontmatter: (content) => {
      const engine = new MDXEngine();
      const { content: extracted, frontmatter } = engine.extractFrontmatter(content);
      
      console.log('📄 Frontmatter extraído:', frontmatter);
      console.log('📝 Contenido sin frontmatter:', extracted.substring(0, 200) + '...');
      
      const withVars = engine.injectFrontmatterVariables(extracted, frontmatter);
      console.log('🔗 Contenido con variables inyectadas:', withVars.substring(0, 300) + '...');
      
      return { frontmatter, extracted, withVars };
    }
  };
}