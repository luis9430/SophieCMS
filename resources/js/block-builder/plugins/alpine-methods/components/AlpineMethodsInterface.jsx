// ===================================================================
// resources/js/block-builder/plugins/alpine-methods/components/AlpineMethodsInterface.jsx
// Interfaz completa integrada con tu sistema CodeMirror existente
// ===================================================================

import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { createCodeMirrorExtensions } from '../../../extensions/CodeMirrorExtensions.js';
import { Play, Save, RefreshCw, Code, Eye, Settings, Plus, Trash2, Copy, Download, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Interfaz principal del editor de métodos Alpine
 * Reutiliza tu sistema CodeMirror existente
 */
const AlpineMethodsInterface = ({ 
  pluginInstance = null,
  onSave = null,
  onLoad = null 
}) => {
  // ===================================================================
  // ESTADOS PRINCIPALES
  // ===================================================================
  
  const [inputCode, setInputCode] = useState(`// Ejemplo de función Alpine reutilizable
function toggleModal() {
  return {
    isOpen: false,
    toggle() {
      this.isOpen = !this.isOpen;
    },
    open() {
      this.isOpen = true;
    },
    close() {
      this.isOpen = false;
    }
  }
}`);

  const [outputCode, setOutputCode] = useState('');
  const [previewHtml, setPreviewHtml] = useState(`<div x-data="toggleModal()">
  <button @click="toggle()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
    Toggle Modal
  </button>
  
  <div x-show="isOpen" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 transform scale-95" x-transition:enter-end="opacity-100 transform scale-100" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
      <h2 class="text-xl font-bold mb-4 text-gray-900">Modal de Ejemplo</h2>
      <p class="mb-4 text-gray-600">¡Función Alpine reutilizable funcionando!</p>
      <div class="flex space-x-3">
        <button @click="close()" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
          Cerrar
        </button>
        <button @click="toggle()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Toggle
        </button>
      </div>
    </div>
  </div>
</div>`);

  const [activeTab, setActiveTab] = useState('editor');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [methodMetadata, setMethodMetadata] = useState({
    name: '',
    description: '',
    category: 'utility',
    parameters: {}
  });

  // ===================================================================
  // REFERENCIAS PARA CODEMIRROR
  // ===================================================================
  
  const inputEditorRef = useRef(null);
  const outputEditorRef = useRef(null);
  const previewEditorRef = useRef(null);
  const previewFrameRef = useRef(null);
  
  const inputEditorView = useRef(null);
  const outputEditorView = useRef(null);
  const previewEditorView = useRef(null);

  // ===================================================================
  // CONFIGURACIÓN DE CODEMIRROR (USANDO TU SISTEMA)
  // ===================================================================

  const createJSEditor = useCallback((container, initialValue, onChange) => {
    if (!container) return null;

    // Usar tus extensiones existentes
    const extensions = [
      ...createCodeMirrorExtensions([], [], 'light'),
      javascript(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          onChange(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        '&': { 
          fontSize: '14px',
          fontFamily: 'Fira Code, Monaco, Consolas, monospace'
        },
        '.cm-content': { padding: '16px' },
        '.cm-focused': { outline: 'none' }
      })
    ];

    const state = EditorState.create({
      doc: initialValue,
      extensions
    });

    return new EditorView({
      state,
      parent: container
    });
  }, []);

  const createHTMLEditor = useCallback((container, initialValue, onChange) => {
    if (!container) return null;

    const extensions = [
      ...createCodeMirrorExtensions([], [], 'light'),
      html(),
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          onChange(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        '&': { 
          fontSize: '14px',
          fontFamily: 'Fira Code, Monaco, Consolas, monospace'
        },
        '.cm-content': { padding: '16px' },
        '.cm-focused': { outline: 'none' }
      })
    ];

    const state = EditorState.create({
      doc: initialValue,
      extensions
    });

    return new EditorView({
      state,
      parent: container
    });
  }, []);

  // ===================================================================
  // INICIALIZACIÓN DE EDITORES
  // ===================================================================

  useEffect(() => {
    // Editor de entrada (JavaScript)
    if (inputEditorRef.current && !inputEditorView.current) {
      inputEditorView.current = createJSEditor(
        inputEditorRef.current,
        inputCode,
        setInputCode
      );
    }

    // Editor de salida (solo lectura)
    if (outputEditorRef.current && !outputEditorView.current) {
      outputEditorView.current = createJSEditor(
        outputEditorRef.current,
        outputCode,
        null // Solo lectura
      );
    }

    // Editor de preview HTML
    if (previewEditorRef.current && !previewEditorView.current) {
      previewEditorView.current = createHTMLEditor(
        previewEditorRef.current,
        previewHtml,
        setPreviewHtml
      );
    }

    return () => {
      // Cleanup
      inputEditorView.current?.destroy();
      outputEditorView.current?.destroy();
      previewEditorView.current?.destroy();
    };
  }, []);

  // ===================================================================
  // PROCESAMIENTO DE MÉTODOS ALPINE (USANDO TU PLUGIN)
  // ===================================================================

  const processAlpineMethod = useCallback(async () => {
    if (!inputCode.trim()) {
      setOutputCode('');
      setProcessingError(null);
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);
    
    try {
      let processedCode = '';
      
      // Si tienes el plugin disponible, usarlo
      if (pluginInstance && typeof pluginInstance.processMethod === 'function') {
        processedCode = await pluginInstance.processMethod(inputCode, methodMetadata);
      } else {
        // Fallback: procesamiento básico
        const methodName = extractMethodName(inputCode);
        processedCode = `// Método Alpine procesado - ${methodName}
Alpine.data('${methodName}', () => ${inputCode.replace(/^function\s+\w+\s*\(\)\s*/, '')});

// Función original para referencia
${inputCode}

// Para usar en tu HTML:
// <div x-data="${methodName}()">
//   <!-- Tu contenido aquí -->
// </div>`;
      }

      setOutputCode(processedCode);
      
      // Actualizar editor de salida
      if (outputEditorView.current) {
        outputEditorView.current.dispatch({
          changes: {
            from: 0,
            to: outputEditorView.current.state.doc.length,
            insert: processedCode
          }
        });
      }

    } catch (error) {
      const errorMessage = `// Error procesando el método Alpine:
// ${error.message}

// Código original:
${inputCode}`;
      
      setOutputCode(errorMessage);
      setProcessingError(error.message);
      
      console.error('Error processing Alpine method:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [inputCode, methodMetadata, pluginInstance]);

  // ===================================================================
  // FUNCIONES AUXILIARES
  // ===================================================================

  const extractMethodName = (code) => {
    const functionMatch = code.match(/function\s+(\w+)/);
    const arrowMatch = code.match(/const\s+(\w+)\s*=/);
    return functionMatch?.[1] || arrowMatch?.[1] || 'customMethod';
  };

  const updateMethodMetadata = () => {
    const name = extractMethodName(inputCode);
    setMethodMetadata(prev => ({
      ...prev,
      name: name || prev.name
    }));
  };

  // ===================================================================
  // EFECTOS
  // ===================================================================

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      processAlpineMethod();
      updateMethodMetadata();
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [processAlpineMethod]);

  useEffect(() => {
    // Actualizar editor de entrada cuando cambie el código externamente
    if (inputEditorView.current && inputEditorView.current.state.doc.toString() !== inputCode) {
      inputEditorView.current.dispatch({
        changes: {
          from: 0,
          to: inputEditorView.current.state.doc.length,
          insert: inputCode
        }
      });
    }
  }, [inputCode]);

  useEffect(() => {
    // Actualizar preview HTML editor
    if (previewEditorView.current && previewEditorView.current.state.doc.toString() !== previewHtml) {
      previewEditorView.current.dispatch({
        changes: {
          from: 0,
          to: previewEditorView.current.state.doc.length,
          insert: previewHtml
        }
      });
    }
  }, [previewHtml]);

  // ===================================================================
  // HANDLERS DE ACCIONES
  // ===================================================================

  const saveMethod = async () => {
    const method = {
      id: selectedMethod?.id || Date.now(),
      ...methodMetadata,
      name: methodMetadata.name || extractMethodName(inputCode),
      inputCode,
      outputCode,
      previewHtml,
      createdAt: selectedMethod?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      // Si hay callback personalizado, usarlo
      if (onSave && typeof onSave === 'function') {
        await onSave(method);
      }
      
      // Si hay plugin disponible, usar su API
      if (pluginInstance && typeof pluginInstance.saveMethod === 'function') {
        await pluginInstance.saveMethod(method);
      }
      
      // Actualizar estado local
      setSavedMethods(prev => {
        const existing = prev.findIndex(m => m.id === method.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = method;
          return updated;
        }
        return [...prev, method];
      });

      alert(`Método "${method.name}" guardado exitosamente!`);
      
    } catch (error) {
      console.error('Error saving method:', error);
      alert(`Error guardando método: ${error.message}`);
    }
  };

  const loadMethod = (method) => {
    setInputCode(method.inputCode);
    setOutputCode(method.outputCode);
    setPreviewHtml(method.previewHtml);
    setMethodMetadata({
      name: method.name,
      description: method.description || '',
      category: method.category || 'utility',
      parameters: method.parameters || {}
    });
    setSelectedMethod(method);
    
    // Callback personalizado
    if (onLoad && typeof onLoad === 'function') {
      onLoad(method);
    }
  };

  const newMethod = () => {
    setInputCode(`// Nueva función Alpine
function newMethod() {
  return {
    // Agrega tu lógica aquí
    init() {
      console.log('Método Alpine inicializado');
    }
  }
}`);
    setPreviewHtml(`<div x-data="newMethod()">
  <!-- Tu HTML de prueba aquí -->
  <p>Nuevo método Alpine</p>
</div>`);
    setMethodMetadata({
      name: '',
      description: '',
      category: 'utility',
      parameters: {}
    });
    setSelectedMethod(null);
  };

  const deleteMethod = async (methodId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este método?')) {
      return;
    }

    try {
      // Si hay plugin disponible, usar su API
      if (pluginInstance && typeof pluginInstance.deleteMethod === 'function') {
        await pluginInstance.deleteMethod(methodId);
      }
      
      setSavedMethods(prev => prev.filter(m => m.id !== methodId));
      
      if (selectedMethod?.id === methodId) {
        setSelectedMethod(null);
      }
      
    } catch (error) {
      console.error('Error deleting method:', error);
      alert(`Error eliminando método: ${error.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Código copiado al portapapeles!');
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      // Fallback para navegadores que no soportan clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Código copiado al portapapeles!');
    });
  };

  const exportMethod = (method) => {
    const exportData = {
      alpineMethod: method,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alpine-method-${method.name}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===================================================================
  // CARGAR MÉTODOS GUARDADOS AL INICIALIZAR
  // ===================================================================

  useEffect(() => {
    const loadSavedMethods = async () => {
      try {
        if (pluginInstance && typeof pluginInstance.getAllMethods === 'function') {
          const methods = await pluginInstance.getAllMethods();
          setSavedMethods(methods);
        }
      } catch (error) {
        console.error('Error loading saved methods:', error);
      }
    };

    loadSavedMethods();
  }, [pluginInstance]);

  // ===================================================================
  // RENDER PRINCIPAL
  // ===================================================================

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alpine Methods Editor</h1>
              <p className="text-sm text-gray-600">Crea y prueba funciones Alpine reutilizables</p>
            </div>
            
            {processingError && (
              <div className="flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-1 rounded">
                <AlertCircle size={16} />
                <span className="text-sm">Error de procesamiento</span>
              </div>
            )}
            
            {!processingError && outputCode && (
              <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded">
                <CheckCircle size={16} />
                <span className="text-sm">Código procesado</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={newMethod}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus size={16} />
              <span>Nuevo</span>
            </button>
            
            <button
              onClick={saveMethod}
              disabled={!inputCode.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Metadata del método actual */}
        {methodMetadata.name && (
          <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
            <span><strong>Método:</strong> {methodMetadata.name}</span>
            <span><strong>Categoría:</strong> {methodMetadata.category}</span>
            {selectedMethod && (
              <span><strong>Última modificación:</strong> {new Date(selectedMethod.updatedAt).toLocaleString()}</span>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'editor', label: 'Editor', icon: Code },
              { id: 'preview', label: 'Preview', icon: Eye },
              { id: 'methods', label: 'Métodos Guardados', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'editor' && (
          <div className="h-full flex">
            {/* Input Editor */}
            <div className="w-1/2 flex flex-col border-r border-gray-200">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Función Alpine (Entrada)</h3>
                <div className="flex items-center space-x-2">
                  {isProcessing && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <RefreshCw size={14} className="animate-spin" />
                      <span className="text-xs">Procesando...</span>
                    </div>
                  )}
                  <button
                    onClick={() => copyToClipboard(inputCode)}
                    className="text-gray-500 hover:text-gray-700"
                    title="Copiar código"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 relative">
                <div
                  ref={inputEditorRef}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Output Editor */}
            <div className="w-1/2 flex flex-col">
              <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Código Generado (Resultado)</h3>
                <button
                  onClick={() => copyToClipboard(outputCode)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Copiar código generado"
                >
                  <Copy size={16} />
                </button>
              </div>
              
              <div className="flex-1">
                <div
                  ref={outputEditorRef}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="h-full flex flex-col">
            {/* Preview Controls */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Vista Previa en Tiempo Real</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(previewHtml)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    <Copy size={14} />
                    <span>Copiar HTML</span>
                  </button>
                  <button
                    onClick={() => {
                      if (previewFrameRef.current) {
                        previewFrameRef.current.src = previewFrameRef.current.src;
                      }
                    }}
                    className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
                  >
                    <RefreshCw size={14} />
                    <span>Refrescar</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 flex">
              {/* HTML Editor */}
              <div className="w-1/2 flex flex-col border-r border-gray-200">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-700">HTML de Prueba</h4>
                </div>
                
                <div className="flex-1">
                  <div
                    ref={previewEditorRef}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="w-1/2 flex flex-col">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
                  <h4 className="font-medium text-gray-700">Preview en Vivo</h4>
                </div>
                
                <div className="flex-1 overflow-auto bg-white">
                  {/* Preview iframe para aislamiento */}
                  <iframe
                    ref={previewFrameRef}
                    srcDoc={`
                      <!DOCTYPE html>
                      <html lang="es">
                      <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Alpine Method Preview</title>
                        <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
                        <script src="https://cdn.tailwindcss.com"></script>
                        <style>
                          body { 
                            font-family: ui-sans-serif, system-ui, sans-serif; 
                            margin: 0; 
                            padding: 20px; 
                            background: #f9fafb;
                          }
                          .preview-container {
                            background: white;
                            border-radius: 8px;
                            padding: 20px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                          }
                        </style>
                      </head>
                      <body>
                        <div class="preview-container">
                          <script>
                            ${outputCode}
                          </script>
                          ${previewHtml}
                        </div>
                        
                        <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px;">
                          <h5 style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">Script Generado:</h5>
                          <pre style="margin: 0; font-size: 12px; color: #78350f; overflow-x: auto; white-space: pre-wrap;"><code>${outputCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                        </div>
                      </body>
                      </html>
                    `}
                    className="w-full h-full border-none"
                    title="Alpine Method Preview"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="h-full p-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Métodos Alpine Guardados</h3>
                <div className="text-sm text-gray-500">
                  {savedMethods.length} método{savedMethods.length !== 1 ? 's' : ''} guardado{savedMethods.length !== 1 ? 's' : ''}
                </div>
              </div>
              
              {savedMethods.length === 0 ? (
                <div className="text-center py-12">
                  <Code size={48} className="mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No hay métodos guardados</h4>
                  <p className="text-gray-600 mb-4">Crea tu primer método Alpine para comenzar</p>
                  <button
                    onClick={() => setActiveTab('editor')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ir al Editor
                  </button>
                </div>
              ) : (
                <div className="grid gap-6">
                  {savedMethods.map(method => (
                    <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-1">{method.name}</h4>
                          {method.description && (
                            <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Categoría: {method.category}</span>
                            <span>Creado: {new Date(method.createdAt).toLocaleDateString()}</span>
                            {method.updatedAt && method.updatedAt !== method.createdAt && (
                              <span>Modificado: {new Date(method.updatedAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              loadMethod(method);
                              setActiveTab('editor');
                            }}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Editar
                          </button>
                          
                          <button
                            onClick={() => {
                              loadMethod(method);
                              setActiveTab('preview');
                            }}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            Preview
                          </button>
                          
                          <button
                            onClick={() => copyToClipboard(method.outputCode)}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                          
                          <button
                            onClick={() => exportMethod(method)}
                            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                          >
                            <Download size={14} />
                          </button>
                          
                          <button
                            onClick={() => deleteMethod(method.id)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-xs text-gray-600 mb-2">Vista previa del código:</div>
                        <code className="text-xs text-gray-800 font-mono">
                          {method.inputCode.substring(0, 300)}
                          {method.inputCode.length > 300 && '...'}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Métodos guardados: {savedMethods.length}</span>
          {selectedMethod && (
            <span>Editando: {selectedMethod.name}</span>
          )}
          {pluginInstance && (
            <span className="text-green-600">• Plugin conectado</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-yellow-400' : processingError ? 'bg-red-400' : 'bg-green-400'}`}></div>
          <span>
            {isProcessing ? 'Procesando...' : processingError ? 'Error' : 'Listo'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AlpineMethodsInterface;