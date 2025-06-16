// ===================================================================
// resources/js/block-builder/plugins/preact-components/components/PreactComponentEditor.jsx
// NUEVO: Editor para ComponentSystem con component tags
// ===================================================================

import { useState, useRef, useEffect } from 'preact/hooks';
import { 
    Button, Stack, Tabs, Group, Text, Card, Badge, Alert,
    Select, TextInput, Textarea, ActionIcon, Tooltip, LoadingOverlay,
    JsonInput, Code, Divider, ScrollArea, Grid, Paper
} from '@mantine/core';
import { 
    IconCode, IconEye, IconDeviceFloppy, IconPlus, IconTrash,
    IconCopy, IconRefresh, IconAlertCircle, IconCircleCheck,
    IconComponents, IconPalette, IconSettings, IconDownload,
    IconUpload, IconBrandGithub, IconExternalLink, IconTemplate,
    IconBooks, IconSearch
} from '@tabler/icons-preact';
import CodeMirrorEditor from '../../../CodeMirrorEditor.jsx';
import PreactComponentPreview from './PreactComponentPreview.jsx';

const PreactComponentEditor = ({ 
    onSave = null, 
    onLoad = null,
    onCancel = null,
    initialComponent = null 
}) => {
    // ===================================================================
    // ESTADO DEL EDITOR
    // ===================================================================
    
    const [activeTab, setActiveTab] = useState('editor');
    const [editorContent, setEditorContent] = useState(
        initialComponent?.content || getDefaultTemplate()
    );
    
    // Metadatos del componente
    const [componentName, setComponentName] = useState(initialComponent?.name || 'MyTemplate');
    const [componentDescription, setComponentDescription] = useState(initialComponent?.description || '');
    
    // Estados de la interfaz
    const [availableComponents, setAvailableComponents] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [validationErrors, setValidationErrors] = useState([]);
    
    // ===================================================================
    // EFECTOS
    // ===================================================================
    
    // Cargar componentes disponibles
    useEffect(() => {
        loadAvailableComponents();
    }, []);
    
    // Validar en tiempo real
    useEffect(() => {
        validateContent();
    }, [editorContent]);
    
    // ===================================================================
    // CARGA DE DATOS
    // ===================================================================
    
    const loadAvailableComponents = async () => {
        try {
            if (window.getAllComponents) {
                const components = window.getAllComponents();
                setAvailableComponents(components);
                console.log('✅ Componentes cargados:', components.length);
            } else {
                console.warn('⚠️ getAllComponents no disponible');
            }
        } catch (error) {
            console.error('❌ Error cargando componentes:', error);
        }
    };
    
    const validateContent = () => {
        try {
            if (window.validateComponentTags) {
                const errors = window.validateComponentTags(editorContent);
                setValidationErrors(errors.filter(result => !result.valid));
            }
        } catch (error) {
            console.warn('⚠️ Error validando contenido:', error);
        }
    };
    
    // ===================================================================
    // HANDLERS
    // ===================================================================
    
    const handleContentChange = (value) => {
        setEditorContent(value);
    };
    
    const handleInsertComponent = (component) => {
        const componentTag = component.metadata.example || generateComponentTag(component);
        
        // Insertar en la posición del cursor o al final
        const newContent = editorContent + '\n\n' + componentTag;
        setEditorContent(newContent);
    };
    
    const handleSave = () => {
        const templateData = {
            name: componentName,
            description: componentDescription,
            content: editorContent,
            type: 'preact_template',
            uses_components: true
        };
        
        if (onSave) {
            onSave(templateData);
        }
    };
    
    const handleCopyContent = async () => {
        try {
            await navigator.clipboard.writeText(editorContent);
            console.log('✅ Contenido copiado al clipboard');
        } catch (error) {
            console.error('❌ Error copiando contenido:', error);
        }
    };
    
    // ===================================================================
    // UTILIDADES
    // ===================================================================
    
    const generateComponentTag = (component) => {
        const exampleProps = {};
        Object.entries(component.metadata.props || {}).forEach(([propName, propDef]) => {
            if (propDef.default !== undefined) {
                exampleProps[propName] = propDef.default;
            }
        });
        
        return `<preact-component
  name="${component.name}"
  props='${JSON.stringify(exampleProps)}'
/>`;
    };
    
    const getFilteredComponents = () => {
        return availableComponents.filter(component => {
            const matchesCategory = selectedCategory === 'all' || component.metadata.category === selectedCategory;
            const matchesSearch = !searchTerm || 
                component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                component.metadata.description.toLowerCase().includes(searchTerm.toLowerCase());
            
            return matchesCategory && matchesSearch;
        });
    };
    
    const getCategories = () => {
        const categories = ['all'];
        availableComponents.forEach(comp => {
            if (!categories.includes(comp.metadata.category)) {
                categories.push(comp.metadata.category);
            }
        });
        return categories;
    };
    
    // ===================================================================
    // RENDER
    // ===================================================================
    
    return (
        <div className="h-full flex">
            {/* Panel principal del editor */}
            <div className="flex-1 flex flex-col mr-4">
                {/* Header */}
                <Card className="mb-4 p-4">
                    <Group className="justify-between mb-4">
                        <Group>
                            <Text className="font-semibold text-lg">Template Editor</Text>
                            <Badge color="blue">Component Tags</Badge>
                            {validationErrors.length > 0 && (
                                <Badge color="red" size="sm">{validationErrors.length} errors</Badge>
                            )}
                        </Group>
                        
                        <Group>
                            <Button
                                size="sm"
                                variant="light"
                                leftIcon={<IconRefresh size={16} />}
                                onClick={loadAvailableComponents}
                            >
                                Refresh
                            </Button>
                        </Group>
                    </Group>
                    
                    {/* Configuración del template */}
                    <Group className="gap-4">
                        <TextInput
                            label="Template Name"
                            value={componentName}
                            onChange={(e) => setComponentName(e.target.value)}
                            placeholder="MyTemplate"
                            style={{ flex: 1 }}
                        />
                        <Textarea
                            label="Description"
                            value={componentDescription}
                            onChange={(e) => setComponentDescription(e.target.value)}
                            placeholder="Describe your template..."
                            style={{ flex: 2 }}
                        />
                    </Group>
                </Card>
                
                {/* Errores de validación */}
                {validationErrors.length > 0 && (
                    <Alert color="red" icon={<IconAlertCircle size={16} />} className="mb-4">
                        <Text size="sm" weight="bold">Validation Errors:</Text>
                        <ul className="mt-2">
                            {validationErrors.map((error, index) => (
                                <li key={index} className="text-sm">
                                    {error.component}: {error.errors.join(', ')}
                                </li>
                            ))}
                        </ul>
                    </Alert>
                )}
                
                {/* Tabs principales */}
                <Tabs value={activeTab} onTabChange={setActiveTab} className="flex-1 flex flex-col">
                    <Tabs.List>
                        <Tabs.Tab value="editor" icon={<IconCode size={16} />}>
                            Editor
                        </Tabs.Tab>
                        <Tabs.Tab value="preview" icon={<IconEye size={16} />}>
                            Preview
                        </Tabs.Tab>
                    </Tabs.List>
                    
                    <Tabs.Panel value="editor" className="flex-1 pt-4">
                        <div className="flex-1">
                            <CodeMirrorEditor
                                value={editorContent}
                                onChange={handleContentChange}
                                language="html"
                                height="500px"
                                placeholder="Write your template using component tags...

Example:
<div>
  <h1>My Page</h1>
  
  <preact-component
    name=&quot;CounterButton&quot;
    props='{&quot;initialCount&quot;: 0, &quot;color&quot;: &quot;blue&quot;}'
  />
</div>"
                            />
                        </div>
                    </Tabs.Panel>
                    
                    <Tabs.Panel value="preview" className="flex-1 pt-4">
                        <PreactComponentPreview
                            code={editorContent}
                            componentName={componentName}
                            useComponentSystem={true}
                        />
                    </Tabs.Panel>
                </Tabs>
                
                {/* Footer */}
                <Card className="mt-4 p-4">
                    <Group className="justify-between">
                        <Group>
                            <Text size="sm" color="dimmed">
                                Components available: {availableComponents.length}
                            </Text>
                        </Group>
                        
                        <Group>
                            <Button
                                size="sm"
                                variant="light"
                                leftIcon={<IconCopy size={16} />}
                                onClick={handleCopyContent}
                            >
                                Copy
                            </Button>
                            
                            {onCancel && (
                                <Button variant="subtle" onClick={onCancel}>
                                    Cancel
                                </Button>
                            )}
                            
                            <Button
                                leftIcon={<IconDeviceFloppy size={16} />}
                                onClick={handleSave}
                            >
                                Save Template
                            </Button>
                        </Group>
                    </Group>
                </Card>
            </div>
            
            {/* Panel lateral de componentes */}
            <div className="w-80 flex flex-col">
                <Card className="p-4">
                    <Group className="justify-between mb-4">
                        <Text className="font-semibold">Available Components</Text>
                        <Badge size="sm">{getFilteredComponents().length}</Badge>
                    </Group>
                    
                    {/* Filtros */}
                    <Stack spacing="sm" className="mb-4">
                        <TextInput
                            placeholder="Search components..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            leftIcon={<IconSearch size={16} />}
                        />
                        
                        <Select
                            label="Category"
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            data={getCategories().map(cat => ({
                                value: cat,
                                label: cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)
                            }))}
                        />
                    </Stack>
                    
                    {/* Lista de componentes */}
                    <ScrollArea style={{ height: 400 }}>
                        <Stack spacing="xs">
                            {getFilteredComponents().map((component, index) => (
                                <Paper key={index} className="p-3 border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors" onClick={() => handleInsertComponent(component)}>
                                    <Group className="justify-between mb-2">
                                        <Text className="font-medium text-sm">{component.name}</Text>
                                        <Badge size="xs" color="gray">{component.metadata.category}</Badge>
                                    </Group>
                                    
                                    <Text size="xs" color="dimmed" className="mb-2">
                                        {component.metadata.description}
                                    </Text>
                                    
                                    {/* Props preview */}
                                    {Object.keys(component.metadata.props || {}).length > 0 && (
                                        <div className="mt-2">
                                            <Text size="xs" weight="bold" color="dimmed">Props:</Text>
                                            <Text size="xs" color="dimmed">
                                                {Object.keys(component.metadata.props).join(', ')}
                                            </Text>
                                        </div>
                                    )}
                                </Paper>
                            ))}
                        </Stack>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
};

// ===================================================================
// HELPERS
// ===================================================================

function getDefaultTemplate() {
    return `<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">My Template</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <h2 class="text-xl font-semibold mb-4">Interactive Counter</h2>
      <preact-component
        name="CounterButton"
        props='{"initialCount": 0, "color": "blue", "label": "Clicks"}'
      />
    </div>
    
    <div>
      <h2 class="text-xl font-semibold mb-4">Toggle Content</h2>
      <preact-component
        name="ToggleButton"
        props='{"label": "Show Details", "content": "Here are the details!", "initialOpen": false}'
      />
    </div>
  </div>
  
  <div class="mt-8">
    <h2 class="text-xl font-semibold mb-4">Dropdown Menu</h2>
    <preact-component
      name="DropdownMenu"
      props='{"options": ["Option 1", "Option 2", "Option 3"], "label": "Choose an option"}'
    />
  </div>
</div>`;
}

export default PreactComponentEditor;