// ===================================================================
// resources/js/block-builder/plugins/preact-components/components/PreactComponentEditor.jsx
// Editor completo para componentes Preact con integración Mantine
// ===================================================================

import { useState, useRef, useEffect } from 'preact/hooks';
import { 
    Button, Stack, Tabs, Group, Text, Card, Badge, Alert,
    Select, TextInput, Textarea, ActionIcon, Tooltip, LoadingOverlay,
    JsonInput, Code, Divider, ScrollArea
} from '@mantine/core';
import { 
    IconCode, IconEye, IconDeviceFloppy, IconPlus, IconTrash,
    IconCopy, IconRefresh, IconAlertCircle, IconCircleCheck,
    IconComponents, IconPalette, IconSettings, IconDownload,
    IconUpload, IconBrandGithub, IconExternalLink
} from '@tabler/icons-preact';
import CodeMirrorEditor from '../../..//CodeMirrorEditor.jsx';
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
    const [componentCode, setComponentCode] = useState(initialComponent?.content || getDefaultComponent());
    const [componentName, setComponentName] = useState(initialComponent?.name || 'MyComponent');
    const [componentCategory, setComponentCategory] = useState(initialComponent?.category || 'ui');
    const [componentDescription, setComponentDescription] = useState(initialComponent?.description || '');
    const [componentVersion, setComponentVersion] = useState(initialComponent?.component_version || '1.0.0');
    const [componentTags, setComponentTags] = useState(initialComponent?.component_tags?.join(', ') || '');
    const [componentProps, setComponentProps] = useState(JSON.stringify(initialComponent?.preact_props || {}, null, 2));
    const [componentConfig, setComponentConfig] = useState(JSON.stringify(initialComponent?.preact_config || {}, null, 2));
    
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
    const [validationErrors, setValidationErrors] = useState([]);
    const [previewKey, setPreviewKey] = useState(0); // Para forzar re-render del preview
    const [extractedInfo, setExtractedInfo] = useState(null); // Info extraída del código

    // ===================================================================
    // CONFIGURACIÓN
    // ===================================================================

    const categories = [
        { value: 'ui', label: '🎨 UI Components' },
        { value: 'marketing', label: '📢 Marketing' },
        { value: 'layout', label: '📐 Layout' },
        { value: 'interactive', label: '⚡ Interactive' },
        { value: 'form', label: '📝 Forms' },
        { value: 'navigation', label: '🧭 Navigation' },
        { value: 'data', label: '📊 Data Display' },
        { value: 'feedback', label: '💬 Feedback' },
        { value: 'utility', label: '🔧 Utility' }
    ];

    const componentTemplates = {
        hero: {
            name: 'Hero Section',
            category: 'marketing',
            description: 'Sección hero responsiva con CTA y animaciones',
            code: getHeroTemplate()
        },
        button: {
            name: 'Interactive Button',
            category: 'ui',
            description: 'Botón con múltiples variantes y estados',
            code: getButtonTemplate()
        },
        card: {
            name: 'Content Card',
            category: 'ui', 
            description: 'Tarjeta de contenido flexible',
            code: getCardTemplate()
        },
        modal: {
            name: 'Modal Dialog',
            category: 'ui',
            description: 'Modal responsive con overlay',
            code: getModalTemplate()
        },
        counter: {
            name: 'Counter Component',
            category: 'interactive',
            description: 'Contador interactivo con hooks',
            code: getCounterTemplate()
        },
        form: {
            name: 'Contact Form',
            category: 'form',
            description: 'Formulario de contacto con validación',
            code: getFormTemplate()
        }
    };

    // ===================================================================
    // EFECTOS
    // ===================================================================

    useEffect(() => {
        // Extraer información del código cuando cambie
        const info = extractComponentInfo(componentCode);
        setExtractedInfo(info);
        
        // Validar código
        const errors = validateComponentCode(componentCode);
        setValidationErrors(errors);
    }, [componentCode]);

    // ===================================================================
    // HANDLERS
    // ===================================================================

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus(null);

        try {
            // Validar antes de guardar
            const errors = validateComponentCode(componentCode);
            if (errors.length > 0) {
                setValidationErrors(errors);
                setSaveStatus('error');
                return;
            }

            // Parsear JSON fields
            let parsedProps = {};
            let parsedConfig = {};

            try {
                parsedProps = componentProps.trim() ? JSON.parse(componentProps) : {};
            } catch (e) {
                throw new Error('Props JSON inválido: ' + e.message);
            }

            try {
                parsedConfig = componentConfig.trim() ? JSON.parse(componentConfig) : {};
            } catch (e) {
                throw new Error('Config JSON inválido: ' + e.message);
            }

            const componentData = {
                name: componentName.trim(),
                type: 'preact_component',
                category: componentCategory,
                description: componentDescription.trim(),
                content: componentCode.trim(),
                component_version: componentVersion.trim(),
                component_tags: componentTags.split(',').map(tag => tag.trim()).filter(tag => tag),
                preact_props: parsedProps,
                preact_config: parsedConfig,
                preact_hooks: extractedInfo?.hooks || [],
                preact_dependencies: extractedInfo?.dependencies || []
            };

            // Guardar usando API
            const response = await saveComponentToAPI(componentData, initialComponent?.id);
            
            setSaveStatus('success');
            if (onSave) onSave(response.data);
            
        } catch (error) {
            console.error('Error saving component:', error);
            setSaveStatus('error');
            setValidationErrors([error.message]);
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadTemplate = (templateKey) => {
        const template = componentTemplates[templateKey];
        if (template) {
            setComponentCode(template.code);
            setComponentName(template.name);
            setComponentCategory(template.category);
            setComponentDescription(template.description);
            setComponentVersion('1.0.0');
            setComponentTags('');
            setComponentProps('{}');
            setComponentConfig('{}');
            setPreviewKey(prev => prev + 1);
        }
    };

    const handleRefreshPreview = () => {
        setPreviewKey(prev => prev + 1);
    };

    const handleExportComponent = () => {
        const componentData = {
            name: componentName,
            code: componentCode,
            props: componentProps,
            config: componentConfig,
            version: componentVersion,
            tags: componentTags,
            exported_at: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(componentData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${componentName.toLowerCase().replace(/\s+/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(componentCode);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 2000);
        } catch (error) {
            console.error('Error copying code:', error);
        }
    };

    // ===================================================================
    // RENDER
    // ===================================================================

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <LoadingOverlay visible={isSaving} />
            
            {/* Header con controles */}
            <div className="bg-white border-b p-4">
                <Group justify="space-between">
                    <Group>
                        <IconComponents size={20} className="text-blue-600" />
                        <Text size="lg" fw={600}>Editor de Componentes Preact</Text>
                        <Badge color="blue" variant="light">
                            {initialComponent ? 'Editando' : 'Nuevo'}
                        </Badge>
                        {extractedInfo && (
                            <Badge color="green" variant="light">
                                {extractedInfo.hooks.length} hooks
                            </Badge>
                        )}
                    </Group>
                    
                    <Group>
                        <Tooltip label="Copiar Código">
                            <ActionIcon 
                                variant="light" 
                                onClick={handleCopyCode}
                                size="lg"
                            >
                                <IconCopy size={16} />
                            </ActionIcon>
                        </Tooltip>
                        
                        <Tooltip label="Exportar Componente">
                            <ActionIcon 
                                variant="light" 
                                onClick={handleExportComponent}
                                size="lg"
                            >
                                <IconDownload size={16} />
                            </ActionIcon>
                        </Tooltip>
                        
                        <Tooltip label="Refrescar Preview">
                            <ActionIcon 
                                variant="light" 
                                onClick={handleRefreshPreview}
                                size="lg"
                            >
                                <IconRefresh size={16} />
                            </ActionIcon>
                        </Tooltip>
                        
                        {onCancel && (
                            <Button variant="light" onClick={onCancel}>
                                Cancelar
                            </Button>
                        )}
                        
                        <Button
                            leftSection={<IconDeviceFloppy size={16} />}
                            onClick={handleSave}
                            loading={isSaving}
                            disabled={!componentName.trim() || validationErrors.length > 0}
                        >
                            Guardar
                        </Button>
                    </Group>
                </Group>

                {/* Status alerts */}
                {saveStatus === 'success' && (
                    <Alert 
                        icon={<IconCircleCheck size={16} />} 
                        color="green" 
                        className="mt-3"
                        withCloseButton
                        onClose={() => setSaveStatus(null)}
                    >
                        Componente guardado exitosamente
                    </Alert>
                )}
                
                {(saveStatus === 'error' || validationErrors.length > 0) && (
                    <Alert 
                        icon={<IconAlertCircle size={16} />} 
                        color="red" 
                        className="mt-3"
                        withCloseButton
                        onClose={() => {
                            setSaveStatus(null);
                            setValidationErrors([]);
                        }}
                    >
                        <div>
                            <Text fw={600}>Errores encontrados:</Text>
                            <ul className="mt-1">
                                {validationErrors.map((error, index) => (
                                    <li key={index} className="text-sm">{error}</li>
                                ))}
                            </ul>
                        </div>
                    </Alert>
                )}
            </div>

            {/* Tabs principales */}
            <div className="flex-1 flex flex-col">
                <Tabs value={activeTab} onChange={setActiveTab} className="flex-1 flex flex-col">
                    <Tabs.List className="bg-white border-b px-4">
                        <Tabs.Tab value="editor" leftSection={<IconCode size={16} />}>
                            Editor JSX
                        </Tabs.Tab>
                        <Tabs.Tab value="config" leftSection={<IconSettings size={16} />}>
                            Configuración
                        </Tabs.Tab>
                        <Tabs.Tab value="preview" leftSection={<IconEye size={16} />}>
                            Preview
                        </Tabs.Tab>
                        <Tabs.Tab value="templates" leftSection={<IconPalette size={16} />}>
                            Templates
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* Panel Editor */}
                    <Tabs.Panel value="editor" className="flex-1 p-4">
                        <div className="h-full flex flex-col">
                            <Group justify="space-between" className="mb-4">
                                <Text size="sm" c="dimmed">
                                    Escribe tu componente usando Preact + JSX + Tailwind
                                </Text>
                                <Group>
                                    <Badge variant="light">JSX</Badge>
                                    <Badge variant="light">Hooks</Badge>
                                    <Badge variant="light">Tailwind</Badge>
                                </Group>
                            </Group>
                            
                            <div className="flex-1 border rounded-lg overflow-hidden">
                                <CodeMirrorEditor
                                    value={componentCode}
                                    onChange={setComponentCode}
                                    language="jsx"
                                    theme="light"
                                    placeholder="// Escribe tu componente Preact aquí..."
                                    className="h-full"
                                    extensions={[
                                        // Aquí agregarías las extensiones de Preact
                                    ]}
                                />
                            </div>
                            
                            {/* Info extraída del código */}
                            {extractedInfo && (
                                <Card className="mt-4 p-3">
                                    <Group justify="space-between">
                                        <Group>
                                            <Text size="sm" fw={600}>Info del Componente:</Text>
                                            <Badge size="sm">{extractedInfo.name}</Badge>
                                            <Text size="xs" c="dimmed">
                                                {extractedInfo.props.length} props
                                            </Text>
                                        </Group>
                                        <Group>
                                            {extractedInfo.hooks.map(hook => (
                                                <Badge key={hook} size="xs" variant="light" color="blue">
                                                    {hook}
                                                </Badge>
                                            ))}
                                        </Group>
                                    </Group>
                                </Card>
                            )}
                        </div>
                    </Tabs.Panel>

                    {/* Panel Configuración */}
                    <Tabs.Panel value="config" className="flex-1">
                        <ScrollArea className="h-full p-4">
                            <Stack>
                                <Card>
                                    <Text fw={600} className="mb-3">Información General</Text>
                                    
                                    <Group grow className="mb-3">
                                        <TextInput
                                            label="Nombre del Componente"
                                            placeholder="Ej: HeroSection"
                                            value={componentName}
                                            onChange={(e) => setComponentName(e.target.value)}
                                            required
                                        />
                                        <Select
                                            label="Categoría"
                                            data={categories}
                                            value={componentCategory}
                                            onChange={setComponentCategory}
                                        />
                                    </Group>
                                    
                                    <Group grow className="mb-3">
                                        <TextInput
                                            label="Versión"
                                            placeholder="1.0.0"
                                            value={componentVersion}
                                            onChange={(e) => setComponentVersion(e.target.value)}
                                        />
                                        <TextInput
                                            label="Tags (separados por coma)"
                                            placeholder="hero, marketing, landing"
                                            value={componentTags}
                                            onChange={(e) => setComponentTags(e.target.value)}
                                        />
                                    </Group>
                                    
                                    <Textarea
                                        label="Descripción"
                                        placeholder="Describe qué hace este componente..."
                                        value={componentDescription}
                                        onChange={(e) => setComponentDescription(e.target.value)}
                                        rows={3}
                                    />
                                </Card>

                                <Card>
                                    <Text fw={600} className="mb-3">Props del Componente</Text>
                                    <JsonInput
                                        label="Definición de Props (JSON)"
                                        placeholder='{\n  "title": {"type": "string", "required": true},\n  "subtitle": {"type": "string", "required": false}\n}'
                                        value={componentProps}
                                        onChange={setComponentProps}
                                        rows={8}
                                        validationError="JSON inválido"
                                    />
                                </Card>

                                <Card>
                                    <Text fw={600} className="mb-3">Configuración Avanzada</Text>
                                    <JsonInput
                                        label="Configuración del Componente (JSON)"
                                        placeholder='{\n  "theme": "default",\n  "animations": true\n}'
                                        value={componentConfig}
                                        onChange={setComponentConfig}
                                        rows={6}
                                        validationError="JSON inválido"
                                    />
                                </Card>
                            </Stack>
                        </ScrollArea>
                    </Tabs.Panel>

                    {/* Panel Preview */}
                    <Tabs.Panel value="preview" className="flex-1 p-4">
                        <PreactComponentPreview 
                            key={previewKey}
                            code={componentCode} 
                            componentName={componentName}
                            props={componentProps ? JSON.parse(componentProps || '{}') : {}}
                        />
                    </Tabs.Panel>

                    {/* Panel Templates */}
                    <Tabs.Panel value="templates" className="flex-1">
                        <ScrollArea className="h-full p-4">
                            <Stack>
                                <Group justify="space-between">
                                    <Text fw={600}>Templates Disponibles</Text>
                                    <Badge variant="light">
                                        {Object.keys(componentTemplates).length} templates
                                    </Badge>
                                </Group>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(componentTemplates).map(([key, template]) => (
                                        <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
                                            <Group justify="space-between" className="mb-2">
                                                <Text fw={600}>{template.name}</Text>
                                                <Badge variant="light">{template.category}</Badge>
                                            </Group>
                                            
                                            <Text size="sm" c="dimmed" className="mb-3">
                                                {template.description}
                                            </Text>
                                            
                                            <Group>
                                                <Button 
                                                    size="sm" 
                                                    variant="light"
                                                    onClick={() => handleLoadTemplate(key)}
                                                    fullWidth
                                                >
                                                    Usar Template
                                                </Button>
                                            </Group>
                                        </Card>
                                    ))}
                                </div>
                            </Stack>
                        </ScrollArea>
                    </Tabs.Panel>
                </Tabs>
            </div>
        </div>
    );
};

// ===================================================================
// TEMPLATES DE COMPONENTES
// ===================================================================

function getDefaultComponent() {
    return `// Componente Preact básico
const MyComponent = ({ title = "Hola Mundo", subtitle = "Componente Preact" }) => {
    const [count, setCount] = useState(0);

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
            <p className="text-gray-600 mb-4">{subtitle}</p>
            
            <div className="text-center">
                <button
                    onClick={() => setCount(count + 1)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Contador: {count}
                </button>
            </div>
        </div>
    );
};`;
}

function getHeroTemplate() {
    return `// Hero Section con Preact + Hooks
const HeroSection = ({ 
    title = "Construye Sitios Web Increíbles",
    subtitle = "Con nuestro page builder revolucionario",
    ctaText = "Comenzar Ahora",
    ctaUrl = "/signup",
    backgroundImage = "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920"
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [stats, setStats] = useState({ users: 0, websites: 0, templates: 0 });

    useEffect(() => {
        setIsVisible(true);
        
        // Animar contadores
        const animateCounter = (key, target) => {
            let current = 0;
            const increment = target / 100;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                setStats(prev => ({ ...prev, [key]: Math.floor(current) }));
            }, 30);
        };

        animateCounter('users', 10000);
        animateCounter('websites', 5000);
        animateCounter('templates', 500);
    }, []);

    const handleCTAClick = () => {
        window.open(ctaUrl, '_blank');
    };

    return (
        <section 
            className="relative h-screen flex items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: \`url(\${backgroundImage})\` }}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black opacity-70"></div>
            
            {/* Content */}
            <div className={\`relative z-10 text-center text-white max-w-4xl mx-auto px-4 transition-all duration-1000 \${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }\`}>
                <h1 className="text-5xl md:text-7xl font-bold mb-6">
                    {title}
                </h1>
                
                <p className="text-xl md:text-2xl mb-8 opacity-90">
                    {subtitle}
                </p>
                
                <button
                    onClick={handleCTAClick}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 mb-12"
                >
                    {ctaText}
                </button>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 text-center">
                    <div>
                        <div className="text-3xl font-bold">{stats.users.toLocaleString()}+</div>
                        <div className="text-sm opacity-75">Usuarios Activos</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{stats.websites.toLocaleString()}+</div>
                        <div className="text-sm opacity-75">Sitios Creados</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{stats.templates}+</div>
                        <div className="text-sm opacity-75">Templates</div>
                    </div>
                </div>
            </div>
        </section>
    );
};`;
}

function getButtonTemplate() {
    return `// Interactive Button Component
const InteractiveButton = ({ 
    children = "Click me",
    variant = "primary",
    size = "md",
    disabled = false,
    onClick = null
}) => {
    const [isPressed, setIsPressed] = useState(false);
    const [clickCount, setClickCount] = useState(0);

    const handleClick = () => {
        setClickCount(prev => prev + 1);
        if (onClick) onClick();
    };

    const variants = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
        success: "bg-green-600 hover:bg-green-700 text-white",
        danger: "bg-red-600 hover:bg-red-700 text-white"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2",
        lg: "px-6 py-3 text-lg"
    };

    return (
        <button
            className={\`
                \${variants[variant]} \${sizes[size]}
                rounded-lg font-medium transition-all duration-200
                transform hover:scale-105 active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                \${isPressed ? 'scale-95' : ''}
            \`}
            disabled={disabled}
            onClick={handleClick}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
        >
            {children} {clickCount > 0 && \`(\${clickCount})\`}
        </button>
    );
};`;
}

function getCardTemplate() {
    return `// Flexible Content Card
const ContentCard = ({
    image = "https://via.placeholder.com/400x200",
    title = "Card Title",
    description = "Card description goes here...",
    buttonText = "Learn More",
    buttonUrl = "#"
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
            className={\`
                bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300
                \${isHovered ? 'shadow-xl transform scale-105' : ''}
            \`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <img 
                src={image} 
                alt={title}
                className="w-full h-48 object-cover"
            />
            
            <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-gray-600 mb-4">{description}</p>
                
                <a
                    href={buttonUrl}
                    className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                    {buttonText}
                </a>
            </div>
        </div>
    );
};`;
}

function getModalTemplate() {
    return `// Modal Dialog Component
const Modal = ({ 
    isOpen = false,
    onClose = null,
    title = "Modal Title",
    children = "Modal content goes here..."
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            setTimeout(() => setIsVisible(false), 300);
        }
    }, [isOpen]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget && onClose) {
            onClose();
        }
    };

    if (!isVisible && !isOpen) return null;

    return (
        <div 
            className={\`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 \${
                isOpen ? 'opacity-100' : 'opacity-0'
            }\`}
            onClick={handleOverlayClick}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            
            {/* Modal */}
            <div className={\`
                relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300
                \${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
            \`}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    
                    <div className="text-gray-600">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};`;
}

function getCounterTemplate() {
    return `// Interactive Counter with Hooks
const Counter = ({ 
    initialValue = 0,
    step = 1,
    min = null,
    max = null
}) => {
    const [count, setCount] = useState(initialValue);
    const [isAnimating, setIsAnimating] = useState(false);

    const increment = () => {
        if (max === null || count < max) {
            setCount(prev => prev + step);
            animate();
        }
    };

    const decrement = () => {
        if (min === null || count > min) {
            setCount(prev => prev - step);
            animate();
        }
    };

    const reset = () => {
        setCount(initialValue);
        animate();
    };

    const animate = () => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 200);
    };

    return (
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-sm mx-auto">
            <h3 className="text-lg font-semibold mb-4">Counter</h3>
            
            <div className={\`
                text-4xl font-bold mb-6 transition-all duration-200
                \${isAnimating ? 'scale-110 text-blue-600' : 'text-gray-800'}
            \`}>
                {count}
            </div>
            
            <div className="space-x-2">
                <button
                    onClick={decrement}
                    disabled={min !== null && count <= min}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    -
                </button>
                
                <button
                    onClick={reset}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                >
                    Reset
                </button>
                
                <button
                    onClick={increment}
                    disabled={max !== null && count >= max}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    +
                </button>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
                {min !== null && <span>Min: {min} </span>}
                {max !== null && <span>Max: {max}</span>}
            </div>
        </div>
    );
};`;
}

function getFormTemplate() {
    return `// Contact Form Component
const ContactForm = ({ 
    onSubmit = null,
    title = "Contáctanos",
    submitText = "Enviar Mensaje"
}) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        
        if (!formData.message.trim()) {
            newErrors.message = 'El mensaje es requerido';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        
        try {
            if (onSubmit) {
                await onSubmit(formData);
            }
            setSubmitted(true);
            setFormData({ name: '', email: '', message: '' });
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="max-w-md mx-auto p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="text-center">
                    <div className="text-green-600 text-4xl mb-4">✓</div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                        ¡Mensaje Enviado!
                    </h3>
                    <p className="text-green-700 mb-4">
                        Gracias por contactarnos. Te responderemos pronto.
                    </p>
                    <button
                        onClick={() => setSubmitted(false)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                        Enviar Otro Mensaje
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">{title}</h2>
            
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Nombre *
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 \${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                    }\`}
                    placeholder="Tu nombre completo"
                />
                {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Email *
                </label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 \${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                    }\`}
                    placeholder="tu@email.com"
                />
                {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
            </div>

            <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Mensaje *
                </label>
                <textarea
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    rows={4}
                    className={\`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none \${
                        errors.message ? 'border-red-500' : 'border-gray-300'
                    }\`}
                    placeholder="Escribe tu mensaje aquí..."
                />
                {errors.message && (
                    <p className="text-red-500 text-xs mt-1">{errors.message}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {isSubmitting ? 'Enviando...' : submitText}
            </button>
        </form>
    );
};`;
}

// ===================================================================
// UTILIDADES DEL EDITOR
// ===================================================================

// Extraer información del componente
function extractComponentInfo(code) {
    const info = {
        name: 'Component',
        props: [],
        hooks: [],
        dependencies: []
    };

    // Extraer nombre del componente
    const nameMatch = code.match(/(?:const|function)\s+([A-Z][a-zA-Z0-9]*)/);
    if (nameMatch) {
        info.name = nameMatch[1];
    }

    // Extraer props
    const propsMatch = code.match(/\(\s*{\s*([^}]+)\s*}\s*\)/);
    if (propsMatch) {
        info.props = propsMatch[1]
            .split(',')
            .map(prop => prop.trim().split('=')[0].trim())
            .filter(prop => prop.length > 0);
    }

    // Extraer hooks
    const hookMatches = code.match(/use[A-Z]\w*/g);
    if (hookMatches) {
        info.hooks = [...new Set(hookMatches)];
    }

    // Extraer dependencias (imports)
    const importMatches = code.match(/import\s+.*\s+from\s+['"][^'"]+['"]/g);
    if (importMatches) {
        info.dependencies = importMatches.map(imp => 
            imp.match(/from\s+['"]([^'"]+)['"]/)?.[1]
        ).filter(Boolean);
    }

    return info;
}

// Validar código del componente
function validateComponentCode(code) {
    const errors = [];

    // Verificaciones básicas
    if (!code.trim()) {
        errors.push('El código no puede estar vacío');
        return errors;
    }

    if (!code.includes('const ') && !code.includes('function ')) {
        errors.push('El componente debe definirse como const o function');
    }

    if (!code.includes('return')) {
        errors.push('El componente debe tener un return statement');
    }

    // Verificar JSX básico
    if (code.includes('return') && !code.includes('<')) {
        errors.push('El componente debe retornar JSX (elementos con <...>)');
    }

    // Verificar hooks válidos
    const invalidHooks = [];
    const hookMatches = code.match(/use[A-Z]\w*/g) || [];
    const validHooks = ['useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 'useContext', 'useReducer'];
    
    hookMatches.forEach(hook => {
        if (!validHooks.includes(hook)) {
            invalidHooks.push(hook);
        }
    });

    if (invalidHooks.length > 0) {
        errors.push(`Hooks no válidos encontrados: ${invalidHooks.join(', ')}`);
    }

    // Verificar paréntesis balanceados
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
        errors.push('Paréntesis no balanceados');
    }

    // Verificar llaves balanceadas
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
        errors.push('Llaves no balanceadas');
    }

    return errors;
}

// Guardar componente via API
async function saveComponentToAPI(componentData, componentId = null) {
    const url = componentId 
        ? `/api/templates/preact-components/${componentId}`
        : '/api/templates/preact-components';
    
    const method = componentId ? 'PUT' : 'POST';

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            'Accept': 'application/json'
        },
        body: JSON.stringify(componentData)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
}

export default PreactComponentEditor;