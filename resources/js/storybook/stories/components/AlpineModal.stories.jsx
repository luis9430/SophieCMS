// resources/js/storybook/stories/components/AlpineModal.stories.jsx
// 🎭 Alpine Modal - COMPONENTES DEMO (Simulan Alpine.js)

import { useState } from 'preact/hooks';

export default {
  title: 'Components/Alpine Modal',
  parameters: {
    docs: {
      description: {
        component: '🎭 Componentes que simulan Alpine.js para preview en Storybook. El código real usa Alpine.js en tu Page Builder.'
      }
    }
  }
};

// ===================================================================
// COMPONENTE DEMO QUE SIMULA ALPINE.JS
// ===================================================================

const AlpineModalDemo = ({ 
  modalTitle = 'Confirmar Acción',
  modalContent = '¿Estás seguro de que quieres continuar?',
  triggerText = 'Abrir Modal',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-2">🎭 Alpine Modal Demo</h2>
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
          <strong>💡 Nota:</strong> Esta es una demostración usando Preact. 
          El código real en tu Page Builder usa Alpine.js.
        </div>
      </div>

      {/* Demo Counter (Simula Alpine x-data="{ count: 0 }") */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-3">🧪 Demo Counter (Alpine.js simulado)</h3>
        <div className="p-4 bg-white rounded border">
          <p className="mb-3">
            Contador: <span className="font-bold text-blue-600 text-lg">{count}</span>
          </p>
          <div className="space-x-2">
            <button 
              onClick={() => setCount(count + 1)}
              className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
            >
              ➕ Sumar
            </button>
            <button 
              onClick={() => setCount(count - 1)}
              className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600"
            >
              ➖ Restar
            </button>
            <button 
              onClick={() => setCount(0)}
              className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
            >
              🔄 Reset
            </button>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
          <strong>Código Alpine.js real:</strong>
          <pre className="mt-1 text-xs">{`<div x-data="{ count: 0 }">
  <span x-text="count"></span>
  <button x-on:click="count++">➕</button>
</div>`}</pre>
        </div>
      </div>

      {/* Demo Modal (Simula Alpine x-data="{ open: false }") */}
      <div className="mb-8 p-4 bg-purple-50 rounded-lg">
        <h3 className="font-bold text-purple-800 mb-3">🎭 Demo Modal (Alpine.js simulado)</h3>
        
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600"
        >
          {triggerText}
        </button>
        
        {/* Modal */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div 
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black bg-opacity-50"
            ></div>
            
            <div className="bg-white p-6 rounded-lg shadow-xl relative max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{modalTitle}</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ✕
                </button>
              </div>
              
              <p className="text-gray-600 mb-6">{modalContent}</p>
              
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                >
                  {cancelText}
                </button>
                <button 
                  onClick={() => {
                    alert('¡Acción confirmada!');
                    setIsOpen(false);
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-3 p-3 bg-gray-100 rounded text-sm">
          <strong>Código Alpine.js real:</strong>
          <pre className="mt-1 text-xs">{`<div x-data="{ open: false }">
  <button x-on:click="open = true">Abrir</button>
  <div x-show="open">Modal content</div>
</div>`}</pre>
        </div>
      </div>

      {/* Código para guardar en BD */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h3 className="font-bold text-green-800 mb-3">💾 Código para tu BD</h3>
        <p className="text-green-700 text-sm mb-3">
          Este es el código real que se guardaría en tu base de datos:
        </p>
        
        <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
{`{
  "name": "Modal Alpine.js",
  "type": "alpine_method", 
  "category": "ui",
  "content": "<div x-data='{ open: false }'>
    <button x-on:click='open = true' 
            class='bg-purple-500 text-white px-6 py-3 rounded-lg'>
      {{ triggerText }}
    </button>
    
    <div x-show='open' class='fixed inset-0 z-50'>
      <div x-on:click='open = false' 
           class='fixed inset-0 bg-black bg-opacity-50'></div>
      <div class='flex items-center justify-center min-h-screen px-4'>
        <div class='bg-white p-6 rounded-lg shadow-xl max-w-md w-full'>
          <h3 class='text-lg font-bold mb-4'>{{ modalTitle }}</h3>
          <p class='text-gray-600 mb-6'>{{ modalContent }}</p>
          <div class='flex justify-end space-x-2'>
            <button x-on:click='open = false' 
                    class='bg-gray-300 px-4 py-2 rounded'>
              {{ cancelText }}
            </button>
            <button x-on:click='handleConfirm()' 
                    class='bg-blue-500 text-white px-4 py-2 rounded'>
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>",
  "variables": {
    "triggerText": "Abrir Modal",
    "modalTitle": "Confirmar Acción", 
    "modalContent": "¿Estás seguro?",
    "confirmText": "Confirmar",
    "cancelText": "Cancelar"
  }
}`}
        </pre>
      </div>
    </div>
  );
};

// ===================================================================
// STORIES CON CONTROLES
// ===================================================================

export const BasicModal = {
  render: (args) => <AlpineModalDemo {...args} />,
  args: {
    modalTitle: 'Confirmar Acción',
    modalContent: '¿Estás seguro de que quieres continuar con esta acción?',
    triggerText: 'Abrir Modal',
    confirmText: 'Sí, continuar',
    cancelText: 'Cancelar'
  },
  argTypes: {
    modalTitle: { 
      control: 'text',
      description: 'Título del modal'
    },
    modalContent: { 
      control: 'text',
      description: 'Contenido del modal'
    },
    triggerText: { 
      control: 'text',
      description: 'Texto del botón que abre el modal'
    },
    confirmText: { 
      control: 'text',
      description: 'Texto del botón de confirmación'
    },
    cancelText: { 
      control: 'text',
      description: 'Texto del botón de cancelar'
    }
  }
};

export const DeleteConfirmation = {
  render: (args) => <AlpineModalDemo {...args} />,
  args: {
    modalTitle: 'Eliminar Elemento',
    modalContent: '¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.',
    triggerText: 'Eliminar',
    confirmText: 'Sí, eliminar',
    cancelText: 'Cancelar'
  }
};

export const SaveConfirmation = {
  render: (args) => <AlpineModalDemo {...args} />,
  args: {
    modalTitle: 'Guardar Cambios',
    modalContent: '¿Quieres guardar los cambios realizados antes de salir?',
    triggerText: 'Guardar y Salir',
    confirmText: 'Guardar',
    cancelText: 'Descartar'
  }
};