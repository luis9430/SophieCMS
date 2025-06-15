// ===================================================================
// resources/js/block-builder/plugins/alpine-methods/components/AlpineMethodsTab.jsx
// Componente Alpine Methods diseñado para integrarse perfectamente con tu PageBuilder
// ===================================================================

import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { createCodeMirrorExtensions } from '../../../extensions/CodeMirrorExtensions.js';
import { 
  IconPlayerPlay, 
  IconDeviceFloppy, 
  IconRefresh, 
  IconCode, 
  IconEye, 
  IconPlus, 
  IconTrash, 
  IconCopy, 
  IconAlertCircle, 
  IconCircleCheck 
} from '@tabler/icons-preact';

/**
 * Componente Alpine Methods Tab que mantiene el diseño consistente con tu sistema
 */
const AlpineMethodsTab = ({ 
  pluginInstance = null,
  onSave = null,
  onLoad = null 
}) => {
  // ===================================================================
  // ESTADOS
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
  
  <div x-show="isOpen" x-transition class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
      <h2 class="text-xl font-bold mb-4 text-gray-900">Modal de Ejemplo</h2>
      <p class="mb-4 text-gray-600">¡Función Alpine reutilizable funcionando!</p>
      <div class="flex space-x-3">
        <button @click="close()" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</div>`);

  const [activeSubTab, setActiveSubTab] = useState('editor'); // 'editor' | 'preview' | 'methods'
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [savedMethods, setSavedMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [methodMetadata, setMethodMetadata] = useState({
    name: '',
    description: '',
    category: 'utility'
  });

  // Refs para editores
  const inputEditorRef = useRef(null);
  const outputEditorRef = useRef(null);
  const previewEditorRef = useRef(null);
  const previewFrameRef = useRef(null);
  
  const inputEditorView = useRef(null);
  const outputEditorView = useRef(null);
  const previewEditorView = useRef(null);

  // ===================================================================
  // CODEMIRROR SETUP
  // ===================================================================

  const createJSEditor = useCallback((container, initialValue, onChange) => {
    if (!container) return null;

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
        '.cm-focused': { outline: 'none' },
        '.cm-editor': { 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }
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
        '.cm-focused': { outline: 'none' },
        '.cm-editor': { 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }
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
    if (inputEditorRef.current && !inputEditorView.current) {
      inputEditorView.current = createJSEditor(
        inputEditorRef.current,
        inputCode,
        setInputCode
      );
    }

    if (outputEditorRef.current && !outputEditorView.current) {
      outputEditorView.current = createJSEditor(
        outputEditorRef.current,
        outputCode,
        null
      );
    }

    if (previewEditorRef.current && !previewEditorView.current) {
      previewEditorView.current = createHTMLEditor(
        previewEditorRef.current,
        previewHtml,
        setPreviewHtml
      );
    }

    return () => {
      inputEditorView.current?.destroy();
      outputEditorView.current?.destroy();
      previewEditorView.current?.destroy();
    };
  }, []);

  // ===================================================================
  // PROCESAMIENTO DE CÓDIGO
  // ===================================================================

  const extractMethodName = (code) => {
    const functionMatch = code.match(/function\s+(\w+)/);
    const arrowMatch = code.match(/const\s+(\w+)\s*=/);
    return functionMatch?.[1] || arrowMatch?.[1] || 'customMethod';
  };

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
      
      if (pluginInstance && typeof pluginInstance.processMethod === 'function') {
        processedCode = await pluginInstance.processMethod(inputCode, methodMetadata);
      } else {
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
      
    } finally {
      setIsProcessing(false);
    }
  }, [inputCode, methodMetadata, pluginInstance]);

  // ===================================================================
  // HANDLERS
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
      if (onSave && typeof onSave === 'function') {
        await onSave(method);
      }
      
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

  const newMethod = () => {
    setInputCode(`// Nueva función Alpine
function newMethod() {
  return {
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
      category: 'utility'
    });
    setSelectedMethod(null);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Código copiado al portapapeles!');
    }).catch(err => {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Código copiado al portapapeles!');
    });
  };

  // ===================================================================
  // EFECTOS
  // ===================================================================

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      processAlpineMethod();
      const name = extractMethodName(inputCode);
      setMethodMetadata(prev => ({
        ...prev,
        name: name || prev.name
      }));
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [processAlpineMethod]);

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
  // RENDER
  // ===================================================================

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header consistente con tu diseño */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-3">
              <span>⚡</span>
              <span>Alpine Methods</span>
            </h2>
            <p className="text-blue-100 mt-1">
              {savedMethods.length} método{savedMethods.length !== 1 ? 's' : ''} disponible{savedMethods.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={newMethod}
              className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition-colors"
            >
              <IconPlus size={16} />
              <span>Nuevo Método</span>
            </button>
            
            <button
              onClick={saveMethod}
              disabled={!inputCode.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <IconDeviceFloppy size={16} />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="mt-4 flex space-x-1">
          {[
            { id: 'editor', label: 'Editor', icon: IconCode },
            { id: 'preview', label: 'Preview', icon: IconEye },
            { id: 'methods', label: 'Métodos Guardados', icon: IconRefresh }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSubTab === tab.id
                    ? 'bg-white bg-opacity-30 text-white'
                    : 'text-blue-100 hover:bg-white hover:bg-opacity-20'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'editor' && (
          <div className="h-full flex">
            {/* Input Editor */}
            <div className="w-1/2 flex flex-col border-r border-gray-200">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Función Alpine (Entrada)</h3>
                <div className="flex items-center space-x-2">
                  {isProcessing && (
                    <div className="flex items-center space-x-1 text-blue-600">
                      <IconRefresh size={14} className="animate-spin" />
                      <span className="text-xs">Procesando...</span>
                    </div>
                  )}
                  <button
                    onClick={() => copyToClipboard(inputCode)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                    title="Copiar código"
                  >
                    <IconCopy size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 p-4">
                <div
                  ref={inputEditorRef}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Output Editor */}
            <div className="w-1/2 flex flex-col">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Código Generado (Resultado)</h3>
                <div className="flex items-center space-x-2">
                  {processingError ? (
                    <div className="flex items-center space-x-1 text-red-600">
                      <IconAlertCircle size={14} />
                      <span className="text-xs">Error</span>
                    </div>
                  ) : outputCode ? (
                    <div className="flex items-center space-x-1 text-green-600">
                      <IconCircleCheck size={14} />
                      <span className="text-xs">Listo</span>
                    </div>
                  ) : null}
                  <button
                    onClick={() => copyToClipboard(outputCode)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                    title="Copiar código generado"
                  >
                    <IconCopy size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 p-4">
                <div
                  ref={outputEditorRef}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'preview' && (
          <div className="h-full flex">
            {/* HTML Editor */}
            <div className="w-1/2 flex flex-col border-r border-gray-200">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="font-medium text-gray-700">HTML de Prueba</h4>
              </div>
              
              <div className="flex-1 p-4">
                <div
                  ref={previewEditorRef}
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="w-1/2 flex flex-col">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Preview en Vivo</h4>
                <button
                  onClick={() => {
                    if (previewFrameRef.current) {
                      previewFrameRef.current.src = previewFrameRef.current.src;
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                  title="Refrescar preview"
                >
                  <IconRefresh size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto bg-gray-50">
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
                    </body>
                    </html>
                  `}
                  className="w-full h-full border-none"
                  title="Alpine Method Preview"
                />
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'methods' && (
          <div className="h-full overflow-auto p-6">
            {savedMethods.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconCode size={32} className="text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No hay métodos guardados</h4>
                <p className="text-gray-600 mb-4">Crea tu primer método Alpine para comenzar</p>
                <button
                  onClick={() => setActiveSubTab('editor')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ir al Editor
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Métodos Guardados</h3>
                  <div className="text-sm text-gray-500">
                    {savedMethods.length} método{savedMethods.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {savedMethods.map(method => (
                    <div key={method.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{method.name}</h4>
                          {method.description && (
                            <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                          )}
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {method.category}
                            </span>
                            <span>Creado: {new Date(method.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => {
                              setInputCode(method.inputCode);
                              setOutputCode(method.outputCode);
                              setPreviewHtml(method.previewHtml);
                              setMethodMetadata({
                                name: method.name,
                                description: method.description || '',
                                category: method.category || 'utility'
                              });
                              setSelectedMethod(method);
                              setActiveSubTab('editor');
                            }}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Editar
                          </button>
                          
                          <button
                            onClick={() => {
                              setInputCode(method.inputCode);
                              setPreviewHtml(method.previewHtml);
                              setActiveSubTab('preview');
                            }}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            Preview
                          </button>
                          
                          <button
                            onClick={() => copyToClipboard(method.outputCode)}
                            className="p-1 text-gray-500 hover:text-gray-700"
                            title="Copiar código"
                          >
                            <IconCopy size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-3 bg-gray-50 rounded p-3">
                        <div className="text-xs text-gray-600 mb-1">Vista previa:</div>
                        <code className="text-xs text-gray-800 font-mono">
                          {method.inputCode.substring(0, 200)}
                          {method.inputCode.length > 200 && '...'}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer con información del método actual */}
      {methodMetadata.name && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-gray-600">
              <span><strong>Método:</strong> {methodMetadata.name}</span>
              <span><strong>Categoría:</strong> {methodMetadata.category}</span>
              {selectedMethod && (
                <span><strong>ID:</strong> {selectedMethod.id}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                isProcessing ? 'bg-yellow-400' : 
                processingError ? 'bg-red-400' : 
                'bg-green-400'
              }`}></div>
              <span className="text-gray-600">
                {isProcessing ? 'Procesando...' : 
                 processingError ? 'Error' : 
                 'Listo'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlpineMethodsTab;