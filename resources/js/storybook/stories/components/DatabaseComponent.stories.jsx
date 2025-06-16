// resources/js/storybook/stories/components/DatabaseComponent.stories.jsx
// 🗄️ Ejemplo de componente que carga desde tu base de datos

import LaravelTemplateAdapter from '../../adapters/LaravelTemplateAdapter.jsx';
import TemplateDatabaseService from '../../services/TemplateDatabaseService.js';

// ===================================================================
// COMPONENTE WRAPPER PARA BD
// ===================================================================

const DatabaseComponent = ({ 
  templateType = 'component',
  templateCategory = null,
  templateId = null,
  ...storyArgs 
}) => {
  return (
    <LaravelTemplateAdapter
      templateType={templateType}
      templateCategory={templateCategory}
      templateId={templateId}
      variables={storyArgs}
      config={storyArgs}
    />
  );
};

// ===================================================================
// CONFIGURACIÓN DE STORY
// ===================================================================

export default {
  title: 'Database/Components',
  component: DatabaseComponent,
  parameters: {
    docs: {
      description: {
        component: 'Componentes cargados desde tu base de datos Laravel. Estos componentes usan tu tabla `templates` y pueden ser del tipo `component`, `alpine_method`, etc.'
      }
    }
  },
  argTypes: {
    templateType: {
      control: { type: 'select' },
      options: ['component', 'partial', 'alpine_method'],
      description: 'Tipo de template desde tu BD'
    },
    templateCategory: {
      control: { type: 'select' },
      options: ['ui', 'marketing', 'navigation', 'content', 'storybook'],
      description: 'Categoría del template'
    },
    templateId: {
      control: { type: 'number' },
      description: 'ID específico del template (opcional)'
    }
  }
};

// ===================================================================
// STORIES BÁSICAS
// ===================================================================

export const LoadByType = {
  args: {
    templateType: 'component',
    templateCategory: 'ui'
  },
  parameters: {
    docs: {
      description: {
        story: 'Carga el primer componente disponible del tipo `component` y categoría `ui` desde tu base de datos.'
      }
    }
  }
};

export const LoadMarketing = {
  args: {
    templateType: 'component',
    templateCategory: 'marketing'
  },
  parameters: {
    docs: {
      description: {
        story: 'Carga componentes de marketing desde tu BD.'
      }
    }
  }
};

export const LoadAlpineMethod = {
  args: {
    templateType: 'alpine_method',
    templateCategory: 'ui'
  },
  parameters: {
    docs: {
      description: {
        story: 'Carga un método Alpine.js desde tu base de datos.'
      }
    }
  }
};

export const LoadSpecificTemplate = {
  args: {
    templateId: 1, // Cambia por un ID que exista en tu BD
  },
  parameters: {
    docs: {
      description: {
        story: 'Carga un template específico por ID.'
      }
    }
  }
};

// ===================================================================
// STORY CON VARIABLES DINÁMICAS
// ===================================================================

export const WithDynamicVariables = {
  args: {
    templateType: 'component',
    templateCategory: 'ui',
    // Variables que se pasarán al template
    title: 'Mi Título Dinámico',
    description: 'Esta descripción viene de Storybook',
    buttonText: 'Click Aquí',
    imageUrl: 'https://via.placeholder.com/400x300',
    backgroundColor: 'bg-blue-500',
    textColor: 'text-white'
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    buttonText: { control: 'text' },
    imageUrl: { control: 'text' },
    backgroundColor: { 
      control: 'select',
      options: ['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500']
    },
    textColor: {
      control: 'select', 
      options: ['text-white', 'text-black', 'text-gray-700']
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Template con variables dinámicas que puedes modificar desde los controles de Storybook.'
      }
    }
  }
};

// ===================================================================
// STORY PARA CREAR NUEVOS TEMPLATES
// ===================================================================

export const CreateNewTemplate = {
  render: () => {
    const [templateData, setTemplateData] = useState({
      name: 'New Component',
      content: '<div class="p-4 bg-blue-100 rounded">{{ title || "Default Title" }}</div>',
      type: 'component',
      category: 'storybook',
      description: 'Created from Storybook'
    });

    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);

    const saveTemplate = async () => {
      setSaving(true);
      try {
        const saved = await TemplateDatabaseService.createTemplate({
          ...templateData,
          storyName: 'CreateNewTemplate',
          storyArgs: { title: 'Hello from Storybook!' }
        });
        setResult(`✅ Template saved with ID: ${saved.id}`);
      } catch (error) {
        setResult(`❌ Error: ${error.message}`);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto p-6">
        <h3 className="text-lg font-bold mb-4">Crear Template desde Storybook</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre:</label>
            <input 
              type="text"
              value={templateData.name}
              onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Contenido HTML:</label>
            <textarea 
              value={templateData.content}
              onChange={(e) => setTemplateData({...templateData, content: e.target.value})}
              className="w-full p-2 border rounded h-32"
            />
          </div>
          
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo:</label>
              <select 
                value={templateData.type}
                onChange={(e) => setTemplateData({...templateData, type: e.target.value})}
                className="p-2 border rounded"
              >
                <option value="component">Component</option>
                <option value="partial">Partial</option>
                <option value="alpine_method">Alpine Method</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Categoría:</label>
              <select 
                value={templateData.category}
                onChange={(e) => setTemplateData({...templateData, category: e.target.value})}
                className="p-2 border rounded"
              >
                <option value="storybook">Storybook</option>
                <option value="ui">UI</option>
                <option value="marketing">Marketing</option>
                <option value="content">Content</option>
              </select>
            </div>
          </div>
          
          <button 
            onClick={saveTemplate}
            disabled={saving}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar en BD'}
          </button>
          
          {result && (
            <div className={`p-3 rounded ${result.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {result}
            </div>
          )}
        </div>
        
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h4 className="font-medium mb-2">Preview:</h4>
          <div dangerouslySetInnerHTML={{ __html: templateData.content.replace('{{ title || "Default Title" }}', 'Hello from Storybook!') }} />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Herramienta para crear nuevos templates directamente desde Storybook y guardarlos en tu base de datos.'
      }
    }
  }
};