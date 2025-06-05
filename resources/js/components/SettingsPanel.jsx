import { useState, useEffect } from 'preact/hooks';
import {
    Paper,
    Text,
    TextInput,
    Textarea,
    Select,
    Switch,
    Button,
    Group,
    Stack,
    Divider,
    ColorInput,
    NumberInput,
    Tabs,
    Badge,
    ActionIcon,
    Tooltip,
    Slider,
    SegmentedControl
} from '@mantine/core';
import { 
    IconSettings,
    IconPalette,
    IconLayout,
    IconX,
    IconCheck,
    IconRefresh,
    IconGrid3x3,
    IconColumns,
    IconStack,
    IconContainer
} from '@tabler/icons-preact';

export default function SettingsPanel({ selectedBlock, updateBlock, onClose }) {
    const [localConfig, setLocalConfig] = useState({});
    const [localStyles, setLocalStyles] = useState({});

    // Sincronizar con el bloque seleccionado
    useEffect(() => {
        if (selectedBlock) {
            setLocalConfig(selectedBlock.config || {});
            setLocalStyles(selectedBlock.styles || {});
        }
    }, [selectedBlock]);

    if (!selectedBlock) return null;

    // Aplicar cambios inmediatamente (reactivo)
    const applyChanges = (newConfig = localConfig, newStyles = localStyles) => {
        updateBlock(selectedBlock.id, newConfig, newStyles);
    };

    // Actualizar configuración y aplicar inmediatamente
    const updateConfig = (key, value) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig);
        applyChanges(newConfig, localStyles);
    };

    // Actualizar estilos y aplicar inmediatamente
    const updateStyle = (key, value) => {
        const newStyles = { ...localStyles, [key]: value };
        setLocalStyles(newStyles);
        applyChanges(localConfig, newStyles);
    };

    const resetToDefaults = () => {
        const defaultConfigs = {
            container: {
                padding: 'md',
                background: 'transparent',
                border: false
            },
            grid: {
                columns: 2,
                gap: 'md',
                responsive: true
            },
            flexbox: {
                direction: 'row',
                align: 'stretch',
                justify: 'flex-start',
                gap: 'md',
                wrap: false
            },
            stack: {
                spacing: 'md',
                align: 'stretch'
            },
            hero: {
                title: 'Título Impactante',
                subtitle: 'Subtítulo que describe tu propuesta de valor',
                buttonText: 'Comenzar Ahora',
                buttonUrl: '#'
            },
            text: {
                content: 'Este es un párrafo de contenido personalizable.'
            },
            button: {
                text: 'Botón de Acción',
                url: '#',
                variant: 'filled',
                size: 'md'
            },
            image: {
                url: 'https://via.placeholder.com/600x300/e9ecef/495057?text=Imagen+de+Ejemplo',
                alt: 'Imagen de ejemplo',
                caption: ''
            }
        };

        const defaultStyles = {
            padding: 'md',
            margin: 'sm',
            textAlign: 'left',
            backgroundColor: 'transparent'
        };

        const newConfig = defaultConfigs[selectedBlock.type] || {};
        const newStyles = defaultStyles;

        setLocalConfig(newConfig);
        setLocalStyles(newStyles);
        applyChanges(newConfig, newStyles);
    };

    const renderContentSettings = () => {
        switch (selectedBlock.type) {
            case 'container':
                return (
                    <Stack gap="sm">
                        <Text size="sm" fw={500} mb="xs">Configuración del Contenedor</Text>
                        <Select
                            label="Padding Interno"
                            data={[
                                { value: 'xs', label: 'Muy pequeño' },
                                { value: 'sm', label: 'Pequeño' },
                                { value: 'md', label: 'Mediano' },
                                { value: 'lg', label: 'Grande' },
                                { value: 'xl', label: 'Muy grande' }
                            ]}
                            value={localConfig.padding || 'md'}
                            onChange={(value) => updateConfig('padding', value)}
                        />
                        <Switch
                            label="Mostrar borde"
                            checked={localConfig.border || false}
                            onChange={(event) => updateConfig('border', event.currentTarget.checked)}
                        />
                        <ColorInput
                            label="Color de Fondo"
                            placeholder="Selecciona un color"
                            value={localConfig.background || 'transparent'}
                            onChange={(value) => updateConfig('background', value)}
                            swatches={['transparent', '#ffffff', '#f8f9fa', '#e9ecef']}
                        />
                    </Stack>
                );

            case 'grid':
                return (
                    <Stack gap="sm">
                        <Text size="sm" fw={500} mb="xs">Configuración del Grid</Text>
                        <div>
                            <Text size="sm" mb="xs">Número de Columnas: {localConfig.columns || 2}</Text>
                            <Slider
                                value={localConfig.columns || 2}
                                onChange={(value) => updateConfig('columns', value)}
                                min={1}
                                max={6}
                                step={1}
                                marks={[
                                    { value: 1, label: '1' },
                                    { value: 2, label: '2' },
                                    { value: 3, label: '3' },
                                    { value: 4, label: '4' },
                                    { value: 5, label: '5' },
                                    { value: 6, label: '6' }
                                ]}
                                mb="md"
                            />
                        </div>
                        <Select
                            label="Espaciado entre elementos"
                            data={[
                                { value: 'xs', label: 'Muy pequeño' },
                                { value: 'sm', label: 'Pequeño' },
                                { value: 'md', label: 'Mediano' },
                                { value: 'lg', label: 'Grande' },
                                { value: 'xl', label: 'Muy grande' }
                            ]}
                            value={localConfig.gap || 'md'}
                            onChange={(value) => updateConfig('gap', value)}
                        />
                        <Switch
                            label="Grid Responsive"
                            description="Se adapta automáticamente a pantallas pequeñas"
                            checked={localConfig.responsive !== false}
                            onChange={(event) => updateConfig('responsive', event.currentTarget.checked)}
                        />
                    </Stack>
                );

            case 'flexbox':
                return (
                    <Stack gap="sm">
                        <Text size="sm" fw={500} mb="xs">Configuración Flexbox</Text>
                        <SegmentedControl
                            label="Dirección"
                            data={[
                                { label: 'Horizontal', value: 'row' },
                                { label: 'Vertical', value: 'column' }
                            ]}
                            value={localConfig.direction || 'row'}
                            onChange={(value) => updateConfig('direction', value)}
                            fullWidth
                        />
                        <Select
                            label="Alineación Principal"
                            description={localConfig.direction === 'column' ? 'Alineación vertical' : 'Alineación horizontal'}
                            data={[
                                { value: 'flex-start', label: 'Inicio' },
                                { value: 'center', label: 'Centro' },
                                { value: 'flex-end', label: 'Final' },
                                { value: 'space-between', label: 'Espaciado entre' },
                                { value: 'space-around', label: 'Espaciado alrededor' },
                                { value: 'space-evenly', label: 'Espaciado uniforme' }
                            ]}
                            value={localConfig.justify || 'flex-start'}
                            onChange={(value) => updateConfig('justify', value)}
                        />
                        <Select
                            label="Alineación Cruzada"
                            description={localConfig.direction === 'column' ? 'Alineación horizontal' : 'Alineación vertical'}
                            data={[
                                { value: 'stretch', label: 'Estirar' },
                                { value: 'flex-start', label: 'Inicio' },
                                { value: 'center', label: 'Centro' },
                                { value: 'flex-end', label: 'Final' }
                            ]}
                            value={localConfig.align || 'stretch'}
                            onChange={(value) => updateConfig('align', value)}
                        />
                        <Select
                            label="Espaciado entre elementos"
                            data={[
                                { value: 'xs', label: 'Muy pequeño' },
                                { value: 'sm', label: 'Pequeño' },
                                { value: 'md', label: 'Mediano' },
                                { value: 'lg', label: 'Grande' },
                                { value: 'xl', label: 'Muy grande' }
                            ]}
                            value={localConfig.gap || 'md'}
                            onChange={(value) => updateConfig('gap', value)}
                        />
                        <Switch
                            label="Permitir wrap"
                            description="Los elementos pueden saltar a la siguiente línea"
                            checked={localConfig.wrap || false}
                            onChange={(event) => updateConfig('wrap', event.currentTarget.checked)}
                        />
                    </Stack>
                );

            case 'stack':
                return (
                    <Stack gap="sm">
                        <Text size="sm" fw={500} mb="xs">Configuración Stack</Text>
                        <Select
                            label="Espaciado entre elementos"
                            data={[
                                { value: 'xs', label: 'Muy pequeño' },
                                { value: 'sm', label: 'Pequeño' },
                                { value: 'md', label: 'Mediano' },
                                { value: 'lg', label: 'Grande' },
                                { value: 'xl', label: 'Muy grande' }
                            ]}
                            value={localConfig.spacing || 'md'}
                            onChange={(value) => updateConfig('spacing', value)}
                        />
                        <Select
                            label="Alineación"
                            data={[
                                { value: 'stretch', label: 'Estirar (ancho completo)' },
                                { value: 'flex-start', label: 'Izquierda' },
                                { value: 'center', label: 'Centro' },
                                { value: 'flex-end', label: 'Derecha' }
                            ]}
                            value={localConfig.align || 'stretch'}
                            onChange={(value) => updateConfig('align', value)}
                        />
                    </Stack>
                );

            case 'hero':
                return (
                    <Stack gap="sm">
                        <TextInput
                            label="Título Principal"
                            placeholder="Escribe el título..."
                            value={localConfig.title || ''}
                            onChange={(e) => updateConfig('title', e.target.value)}
                        />
                        <Textarea
                            label="Subtítulo"
                            placeholder="Describe tu propuesta de valor..."
                            rows={3}
                            value={localConfig.subtitle || ''}
                            onChange={(e) => updateConfig('subtitle', e.target.value)}
                        />
                        <TextInput
                            label="Texto del Botón"
                            placeholder="Texto del botón..."
                            value={localConfig.buttonText || ''}
                            onChange={(e) => updateConfig('buttonText', e.target.value)}
                        />
                        <TextInput
                            label="URL del Botón"
                            placeholder="https://ejemplo.com"
                            value={localConfig.buttonUrl || ''}
                            onChange={(e) => updateConfig('buttonUrl', e.target.value)}
                        />
                    </Stack>
                );

            case 'text':
                return (
                    <Textarea
                        label="Contenido"
                        placeholder="Escribe tu contenido aquí..."
                        rows={6}
                        value={localConfig.content || ''}
                        onChange={(e) => updateConfig('content', e.target.value)}
                    />
                );

            case 'button':
                return (
                    <Stack gap="sm">
                        <TextInput
                            label="Texto del Botón"
                            placeholder="Texto visible..."
                            value={localConfig.text || ''}
                            onChange={(e) => updateConfig('text', e.target.value)}
                        />
                        <TextInput
                            label="URL de Destino"
                            placeholder="https://ejemplo.com"
                            value={localConfig.url || ''}
                            onChange={(e) => updateConfig('url', e.target.value)}
                        />
                        <Select
                            label="Variante"
                            data={[
                                { value: 'filled', label: 'Relleno' },
                                { value: 'outline', label: 'Contorno' },
                                { value: 'light', label: 'Ligero' },
                                { value: 'subtle', label: 'Sutil' }
                            ]}
                            value={localConfig.variant || 'filled'}
                            onChange={(value) => updateConfig('variant', value)}
                        />
                        <Select
                            label="Tamaño"
                            data={[
                                { value: 'xs', label: 'Muy pequeño' },
                                { value: 'sm', label: 'Pequeño' },
                                { value: 'md', label: 'Mediano' },
                                { value: 'lg', label: 'Grande' },
                                { value: 'xl', label: 'Muy grande' }
                            ]}
                            value={localConfig.size || 'md'}
                            onChange={(value) => updateConfig('size', value)}
                        />
                    </Stack>
                );

            case 'image':
                return (
                    <Stack gap="sm">
                        <TextInput
                            label="URL de la Imagen"
                            placeholder="https://ejemplo.com/imagen.jpg"
                            value={localConfig.url || ''}
                            onChange={(e) => updateConfig('url', e.target.value)}
                        />
                        <TextInput
                            label="Texto Alternativo"
                            placeholder="Descripción de la imagen"
                            value={localConfig.alt || ''}
                            onChange={(e) => updateConfig('alt', e.target.value)}
                        />
                        <TextInput
                            label="Pie de Imagen"
                            placeholder="Pie de imagen opcional"
                            value={localConfig.caption || ''}
                            onChange={(e) => updateConfig('caption', e.target.value)}
                        />
                    </Stack>
                );

            default:
                return (
                    <Text c="dimmed" ta="center" py="xl">
                        No hay configuración disponible para este tipo de componente.
                    </Text>
                );
        }
    };

    const renderStyleSettings = () => (
        <Stack gap="sm">
            <Select
                label="Padding"
                data={[
                    { value: 'xs', label: 'Muy pequeño' },
                    { value: 'sm', label: 'Pequeño' },
                    { value: 'md', label: 'Mediano' },
                    { value: 'lg', label: 'Grande' },
                    { value: 'xl', label: 'Muy grande' }
                ]}
                value={localStyles.padding || 'md'}
                onChange={(value) => updateStyle('padding', value)}
            />

            <Select
                label="Margen"
                data={[
                    { value: 'xs', label: 'Muy pequeño' },
                    { value: 'sm', label: 'Pequeño' },
                    { value: 'md', label: 'Mediano' },
                    { value: 'lg', label: 'Grande' },
                    { value: 'xl', label: 'Muy grande' }
                ]}
                value={localStyles.margin || 'sm'}
                onChange={(value) => updateStyle('margin', value)}
            />

            {!selectedBlock.isContainer && (
                <Select
                    label="Alineación de Texto"
                    data={[
                        { value: 'left', label: 'Izquierda' },
                        { value: 'center', label: 'Centro' },
                        { value: 'right', label: 'Derecha' }
                    ]}
                    value={localStyles.textAlign || 'left'}
                    onChange={(value) => updateStyle('textAlign', value)}
                />
            )}

            <ColorInput
                label="Color de Fondo"
                placeholder="Selecciona un color"
                value={localStyles.backgroundColor || '#ffffff'}
                onChange={(value) => updateStyle('backgroundColor', value)}
                swatches={[
                    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', 
                    '#ced4da', '#adb5bd', '#6c757d', '#495057'
                ]}
            />

            {selectedBlock.isContainer && (
                <>
                    <Divider my="sm" />
                    <Text size="sm" fw={500}>Configuración de Contenedor</Text>
                    <NumberInput
                        label="Radio del borde (px)"
                        placeholder="0"
                        min={0}
                        max={20}
                        value={localStyles.borderRadius || 0}
                        onChange={(value) => updateStyle('borderRadius', value)}
                    />
                    <ColorInput
                        label="Color del borde"
                        value={localStyles.borderColor || '#dee2e6'}
                        onChange={(value) => updateStyle('borderColor', value)}
                        swatches={['#dee2e6', '#ced4da', '#adb5bd', '#6c757d']}
                    />
                </>
            )}
        </Stack>
    );

    const getBlockIcon = () => {
        const iconMap = {
            container: IconContainer,
            grid: IconGrid3x3,
            flexbox: IconColumns,
            stack: IconStack,
            hero: IconLayout,
            text: IconX,
            button: IconX,
            image: IconX
        };
        
        const IconComponent = iconMap[selectedBlock.type] || IconSettings;
        return <IconComponent size={20} color="#228be6" />;
    };

    return (
        <Paper 
            p="md" 
            withBorder 
            style={{ 
                position: 'fixed',
                top: 70,
                right: 0,
                width: 380, // Aumenté el ancho para acomodar más controles
                height: 'calc(100vh - 70px)',
                zIndex: 1000,
                backgroundColor: 'white',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
                overflowY: 'auto',
                borderLeft: '3px solid var(--mantine-color-blue-4)'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <Group justify="space-between" mb="md">
                <Group gap="sm">
                    {getBlockIcon()}
                    <div>
                        <Text fw={600} size="sm">
                            Configuración
                        </Text>
                        <Group gap="xs">
                            <Badge variant="light" color={selectedBlock.color} size="xs">
                                {selectedBlock.name}
                            </Badge>
                            {selectedBlock.isContainer && (
                                <Badge variant="outline" size="xs" color="gray">
                                    Contenedor
                                </Badge>
                            )}
                        </Group>
                    </div>
                </Group>
                <Tooltip label="Cerrar Panel">
                    <ActionIcon 
                        variant="subtle" 
                        onClick={onClose}
                        size="lg"
                    >
                        <IconX size={18} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            <Divider mb="md" />

            {/* Tabs para organizar configuraciones */}
            <Tabs defaultValue="content" variant="pills">
                <Tabs.List grow mb="md">
                    <Tabs.Tab 
                        value="content" 
                        leftSection={<IconSettings size={14} />}
                    >
                        {selectedBlock.isContainer ? 'Layout' : 'Contenido'}
                    </Tabs.Tab>
                    <Tabs.Tab 
                        value="style" 
                        leftSection={<IconPalette size={14} />}
                    >
                        Estilo
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="content">
                    {renderContentSettings()}
                </Tabs.Panel>

                <Tabs.Panel value="style">
                    {renderStyleSettings()}
                </Tabs.Panel>
            </Tabs>

            {/* Action buttons */}
            <Divider my="md" />
            
            <Stack gap="xs">
                <Button 
                    fullWidth
                    variant="light"
                    leftSection={<IconRefresh size={16} />}
                    onClick={resetToDefaults}
                    color="gray"
                >
                    Restaurar Valores
                </Button>

                <Button 
                    fullWidth
                    variant="light"
                    leftSection={<IconX size={16} />}
                    onClick={onClose}
                    color="red"
                >
                    Cerrar Panel
                </Button>
            </Stack>

            {/* Info footer */}
            <Paper p="sm" mt="md" style={{ backgroundColor: '#f8f9fa' }}>
                <Text size="xs" c="dimmed" ta="center">
                    ✨ Los cambios se aplican automáticamente
                </Text>
                {selectedBlock.isContainer && (
                    <Text size="xs" c="dimmed" ta="center" mt="xs">
                        🎯 Arrastra elementos desde la sidebar a este contenedor
                    </Text>
                )}
            </Paper>
        </Paper>
    );
}