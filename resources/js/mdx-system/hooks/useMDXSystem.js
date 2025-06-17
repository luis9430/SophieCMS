// ===================================================================
// resources/js/mdx-system/hooks/useMDXSystem.js - HOOK PRINCIPAL
// ===================================================================

import { useState, useEffect, useCallback } from 'preact/hooks';
import { MDXEngine } from '../core/MDXEngine.js';
import { ComponentRegistry } from '../core/ComponentRegistry.js';
import { TemplateManager } from '../core/TemplateManager.js';

export function useMDXSystem(initialContent = '') {
  // Sistemas core
  const [componentRegistry] = useState(() => new ComponentRegistry());
  const [templateManager] = useState(() => new TemplateManager());
  const [mdxEngine] = useState(() => new MDXEngine(componentRegistry.getMDXComponents()));
  
  // Estado del editor
  const [content, setContent] = useState(initialContent);
  const [compiledResult, setCompiledResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState({});

  // Compilar contenido cuando cambie
  useEffect(() => {
    if (!content.trim()) {
      setCompiledResult(null);
      return;
    }

    const compile = async () => {
      setIsLoading(true);
      try {
        const result = await mdxEngine.compile(content, variables);
        setCompiledResult(result);
      } catch (error) {
        setCompiledResult({ error: error.message, Component: null, frontmatter: null });
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(compile, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [content, variables, mdxEngine]);

  // Métodos del sistema
  const loadTemplate = useCallback((templateId) => {
    const template = templateManager.getTemplate(templateId);
    if (template) {
      setContent(template.content);
      return true;
    }
    return false;
  }, [templateManager]);

  const saveAsTemplate = useCallback((name, category = 'custom') => {
    const id = Date.now().toString();
    templateManager.addTemplate(id, {
      name,
      category,
      content,
      description: 'Template personalizado',
      thumbnail: '📄'
    });
    return id;
  }, [content, templateManager]);

  const insertComponent = useCallback((componentName) => {
    const component = componentRegistry.getComponent(componentName);
    if (component && component.example) {
      setContent(prev => prev + '\n\n' + component.example + '\n\n');
      return true;
    }
    return false;
  }, [componentRegistry]);

  return {
    // Estado
    content,
    setContent,
    compiledResult,
    isLoading,
    variables,
    setVariables,
    
    // Sistemas
    componentRegistry,
    templateManager,
    mdxEngine,
    
    // Métodos
    loadTemplate,
    saveAsTemplate,
    insertComponent,
    
    // Getters útiles
    hasError: compiledResult?.error,
    isReady: compiledResult && !compiledResult.error,
    Component: compiledResult?.Component,
    frontmatter: compiledResult?.frontmatter
  };
}