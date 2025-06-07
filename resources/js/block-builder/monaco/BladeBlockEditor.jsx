// resources/js/block-builder/monaco/BladeBlockEditor.jsx
import { useState, useEffect } from 'preact/hooks';
import { Modal, Button, Group, Tabs, Loader, Text, Box } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import CodeEditor from './CodeEditor';

export default function BladeBlockEditor({ block, onUpdate, opened, onClose }) {
    const [code, setCode] = useState('');
    const [previewHtml, setPreviewHtml] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('code');
    
    // Cargar el código Blade inicial
    useEffect(() => {
        if (opened) {
            // Cargar la plantilla Blade desde el servidor
            fetchBlockTemplate(block);
        }
    }, [block, opened]);
    
    // Función para cargar la plantilla desde el servidor
    const fetchBlockTemplate = async (block) => {
        setLoading(true);
        
        try {
            const response = await fetch(`/admin/page-builder/block-template?type=${block.type}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al cargar la plantilla');
            }
            
            const data = await response.json();
            
            setCode(data.template);
            setPreviewHtml(data.rendered);
        } catch (error) {
            console.error('Error fetching template:', error);
            notifications.show({
                title: 'Error',
                message: 'No se pudo cargar la plantilla. Generando una por defecto.',
                color: 'red'
            });
            
            // Fallback a la generación local
            generateBladeTemplate(block);
        } finally {
            setLoading(false);
        }
    };
    
    // Función para generar la plantilla Blade basada en el tipo de bloque
    const generateBladeTemplate = (block) => {
        setLoading(true);
        
        try {
            let template = '';
            
            // Generar plantilla según el tipo de bloque
            switch (block.type) {
                case 'hero':
                    template = generateHeroTemplate(block.config);
                    break;
                case 'text':
                    template = generateTextTemplate(block.config);
                    break;
                case 'grid':
                    template = generateGridTemplate(block.config);
                    break;
                default:
                    template = `{{-- Plantilla para bloque tipo: ${block.type} --}}\n<div>Contenido del bloque</div>`;
            }
            
            setCode(template);
            
            // Simular una vista previa (en una implementación real, esto se haría a través de una API)
            simulatePreview(template, block.config);
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Error al generar la plantilla',
                color: 'red'
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Generar plantilla para bloque Hero
    const generateHeroTemplate = (config) => {
        return `{{-- Hero Block Template --}}
<section class="bg-gray-100 py-12 px-4 text-center" x-data="{ title: '{{ $config['title'] ?? 'Título Impactante' }}', subtitle: '{{ $config['subtitle'] ?? 'Subtítulo descriptivo' }}' }">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-gray-800" x-text="title">
            {{ $config['title'] ?? 'Título Impactante' }}
        </h1>
        
        <p class="text-xl text-gray-600 mb-8" x-text="subtitle">
            {{ $config['subtitle'] ?? 'Subtítulo que describe tu propuesta de valor' }}
        </p>
        
        <a href="{{ $config['buttonUrl'] ?? '#' }}" 
           class="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
            {{ $config['buttonText'] ?? 'Comenzar Ahora' }}
        </a>
    </div>
</section>`;
    };
    
    // Generar plantilla para bloque Text
    const generateTextTemplate = (config) => {
        return `{{-- Text Block Template --}}
<div class="py-8 px-4">
    <div class="max-w-3xl mx-auto">
        <p class="text-gray-700 leading-relaxed">
            {{ $config['content'] ?? 'Contenido de texto por defecto. Edita este texto para personalizarlo según tus necesidades.' }}
        </p>
    </div>
</div>`;
    };
    
    // Generar plantilla para bloque Grid
    const generateGridTemplate = (config) => {
        const columns = config.columns || 2;
        
        return `{{-- Grid Block Template --}}
<div class="py-8 px-4">
    <div class="grid grid-cols-1 md:grid-cols-${columns} gap-6">
        @foreach($columns as $column)
            <div class="bg-white p-4 rounded shadow">
                {{-- Contenido de la columna --}}
                @foreach($column['children'] as $child)
                    @include('blocks.' . $child['type'], ['config' => $child['config']])
                @endforeach
            </div>
        @endforeach
    </div>
</div>`;
    };
    
    // Simular una vista previa (en una implementación real, esto se haría a través de una API)
    const simulatePreview = (template, config) => {
        // Simulación simple de renderizado
        // En una implementación real, esto se enviaría al servidor para renderizar con Blade
        
        let html = template;
        
        // Reemplazar variables Blade con valores reales
        html = html.replace(/\{\{\s*\$config\['title'\]\s*\?\?\s*'([^']*)'\s*\}\}/g, config.title || '$1');
        html = html.replace(/\{\{\s*\$config\['subtitle'\]\s*\?\?\s*'([^']*)'\s*\}\}/g, config.subtitle || '$1');
        html = html.replace(/\{\{\s*\$config\['buttonText'\]\s*\?\?\s*'([^']*)'\s*\}\}/g, config.buttonText || '$1');
        html = html.replace(/\{\{\s*\$config\['buttonUrl'\]\s*\?\?\s*'([^']*)'\s*\}\}/g, config.buttonUrl || '#');
        html = html.replace(/\{\{\s*\$config\['content'\]\s*\?\?\s*'([^']*)'\s*\}\}/g, config.content || '$1');
        
        // Eliminar comentarios Blade
        html = html.replace(/\{\{--.*?--\}\}/g, '');
        
        setPreviewHtml(html);
    };
    
    // Función para previsualizar el código
    const previewCode = async () => {
        setLoading(true);
        
        try {
            const response = await fetch('/admin/page-builder/preview-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({
                    template: code,
                    config: block.config,
                    styles: block.styles
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al previsualizar');
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            setPreviewHtml(data.html);
            setActiveTab('preview');
        } catch (error) {
            console.error('Preview error:', error);
            notifications.show({
                title: 'Error',
                message: error.message || 'Error al previsualizar',
                color: 'red'
            });
            
            // Fallback a la simulación local
            simulatePreview(code, block.config);
            setActiveTab('preview');
        } finally {
            setLoading(false);
        }
    };
    
    // Función para extraer configuración del código
    const extractConfigFromTemplate = (template) => {
        const config = { ...block.config };
        
        // Extraer título
        const titleMatch = template.match(/\{\{\s*\$config\['title'\]\s*\?\?\s*'([^']*)'\s*\}\}/);
        if (titleMatch && titleMatch[1]) {
            config.title = titleMatch[1];
        }
        
        // Extraer subtítulo
        const subtitleMatch = template.match(/\{\{\s*\$config\['subtitle'\]\s*\?\?\s*'([^']*)'\s*\}\}/);
        if (subtitleMatch && subtitleMatch[1]) {
            config.subtitle = subtitleMatch[1];
        }
        
        // Extraer texto del botón
        const buttonTextMatch = template.match(/\{\{\s*\$config\['buttonText'\]\s*\?\?\s*'([^']*)'\s*\}\}/);
        if (buttonTextMatch && buttonTextMatch[1]) {
            config.buttonText = buttonTextMatch[1];
        }
        
        // Extraer URL del botón
        const buttonUrlMatch = template.match(/\{\{\s*\$config\['buttonUrl'\]\s*\?\?\s*'([^']*)'\s*\}\}/);
        if (buttonUrlMatch && buttonUrlMatch[1]) {
            config.buttonUrl = buttonUrlMatch[1];
        }
        
        // Extraer contenido de texto
        const contentMatch = template.match(/\{\{\s*\$config\['content'\]\s*\?\?\s*'([^']*)'\s*\}\}/);
        if (contentMatch && contentMatch[1]) {
            config.content = contentMatch[1];
        }
        
        return config;
    };
    
    // Función para guardar cambios
    const handleSave = async () => {
        setLoading(true);
        
        try {
            // Intentar extraer la configuración del servidor
            const response = await fetch('/admin/page-builder/update-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
                },
                body: JSON.stringify({
                    id: block.id,
                    type: block.type,
                    template: code
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al actualizar');
            }
            
            const data = await response.json();
            
            // Actualizar el bloque con la nueva configuración
            const newConfig = { ...block.config, ...data.config };
            onUpdate(newConfig);
            
            notifications.show({
                title: 'Éxito',
                message: 'Bloque actualizado correctamente',
                color: 'green'
            });
            
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            
            // Fallback a la extracción local
            try {
                const newConfig = extractConfigFromTemplate(code);
                onUpdate(newConfig);
                
                notifications.show({
                    title: 'Éxito',
                    message: 'Bloque actualizado (modo local)',
                    color: 'green'
                });
                
                onClose();
            } catch (extractError) {
                notifications.show({
                    title: 'Error',
                    message: 'Error al actualizar el bloque',
                    color: 'red'
                });
            }
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Modal 
            opened={opened} 
            onClose={onClose} 
            title={`Editar Código - ${block.name || block.type}`} 
            size="90%" 
            styles={{ modal: { height: '90vh' } }}
        >
            <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List>
                    <Tabs.Tab value="code">Código</Tabs.Tab>
                    <Tabs.Tab value="preview">Vista Previa</Tabs.Tab>
                </Tabs.List>
                
                <Tabs.Panel value="code" style={{ height: 'calc(90vh - 150px)' }}>
                    {loading && !code ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Loader />
                        </div>
                    ) : (
                        <Box mt="md">
                            <Text size="sm" mb="xs" c="dimmed">
                                Edita el código HTML/Blade con Tailwind CSS y Alpine.js
                            </Text>
                            <CodeEditor 
                                code={code} 
                                onCodeChange={setCode} 
                                language="blade" 
                            />
                        </Box>
                    )}
                </Tabs.Panel>
                
                <Tabs.Panel value="preview" style={{ height: 'calc(90vh - 150px)', overflow: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Loader />
                        </div>
                    ) : (
                        <Box mt="md" p="md" style={{ border: '1px solid #e9ecef', borderRadius: '8px' }}>
                            <Text size="sm" mb="md" c="dimmed">
                                Vista previa (simulada):
                            </Text>
                            <div 
                                dangerouslySetInnerHTML={{ __html: previewHtml }} 
                                style={{ 
                                    border: '1px dashed #ced4da', 
                                    padding: '20px', 
                                    borderRadius: '4px',
                                    backgroundColor: '#f8f9fa'
                                }}
                            />
                            <Text size="xs" mt="md" c="dimmed" style={{ fontStyle: 'italic' }}>
                                Nota: Esta es una vista previa simulada. En producción, el código se renderizaría en el servidor con Blade.
                            </Text>
                        </Box>
                    )}
                </Tabs.Panel>
            </Tabs>
            
            <Group position="apart" mt="md">
                <Button variant="light" onClick={previewCode} loading={loading}>
                    Previsualizar
                </Button>
                <Group>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleSave} loading={loading}>Guardar Cambios</Button>
                </Group>
            </Group>
        </Modal>
    );
}
