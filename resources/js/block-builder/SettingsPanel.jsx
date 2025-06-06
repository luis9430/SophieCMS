import { useState, useEffect, useRef } from 'preact/hooks';
import {
    Paper,
    Text,
    Group,
    Stack,
    Divider,
    Tabs,
    Badge,
    ActionIcon,
    Tooltip,
    Select,
    ColorInput,
    NumberInput,
    TextInput,
    Textarea,
    Slider,
} from '@mantine/core';
import {
    IconSettings,
    IconPalette,
    IconX,
} from '@tabler/icons-preact';
import blockRegistry from './blocks/BlockRegistry';

// Componente reutilizable para los ajustes de estilo comunes (contenedores)
function StyleSettings({ styles, updateStyle }) {
    return (
        <Stack gap="lg">
            {/* 📐 LAYOUT & SPACING */}
            <div>
                <Text fw={600} size="sm" mb="sm" c="blue">📐 LAYOUT & SPACING</Text>
                <Stack gap="sm">
                    <Group grow>
                        <Select
                            label="Padding"
                            data={['xs', 'sm', 'md', 'lg', 'xl']}
                            value={styles.padding || 'md'}
                            onChange={(value) => updateStyle('padding', value)}
                        />
                        <Select
                            label="Margin"
                            data={['xs', 'sm', 'md', 'lg', 'xl']}
                            value={styles.margin || 'sm'}
                            onChange={(value) => updateStyle('margin', value)}
                        />
                    </Group>
                    <Select
                        label="Alineación de Texto"
                        data={['left', 'center', 'right', 'justify']}
                        value={styles.textAlign || 'left'}
                        onChange={(value) => updateStyle('textAlign', value)}
                    />
                    <Group grow>
                        <TextInput
                            label="Max Width"
                            placeholder="100%, 800px, auto"
                            value={styles.maxWidth || ''}
                            onChange={(e) => updateStyle('maxWidth', e.target.value)}
                        />
                        <TextInput
                            label="Min Height"
                            placeholder="auto, 300px, 50vh"
                            value={styles.minHeight || ''}
                            onChange={(e) => updateStyle('minHeight', e.target.value)}
                        />
                    </Group>
                </Stack>
            </div>

            {/* 🎨 BACKGROUND */}
            <div>
                <Text fw={600} size="sm" mb="sm" c="orange">🎨 BACKGROUND</Text>
                <Stack gap="sm">
                    <ColorInput
                        label="Color de Fondo"
                        value={styles.backgroundColor || 'transparent'}
                        onChange={(value) => updateStyle('backgroundColor', value)}
                    />
                    <TextInput
                        label="Imagen de Fondo (URL)"
                        placeholder="https://ejemplo.com/imagen.jpg"
                        value={styles.backgroundImage || ''}
                        onChange={(e) => updateStyle('backgroundImage', e.target.value)}
                    />
                    <Group grow>
                        <Select
                            label="Background Size"
                            data={['cover', 'contain', 'auto', '100%']}
                            value={styles.backgroundSize || 'cover'}
                            onChange={(value) => updateStyle('backgroundSize', value)}
                        />
                        <Select
                            label="Background Position"
                            data={['center', 'top', 'bottom', 'left', 'right']}
                            value={styles.backgroundPosition || 'center'}
                            onChange={(value) => updateStyle('backgroundPosition', value)}
                        />
                    </Group>
                </Stack>
            </div>

            {/* 🔲 BORDER & EFFECTS */}
            <div>
                <Text fw={600} size="sm" mb="sm" c="violet">🔲 BORDER & EFFECTS</Text>
                <Stack gap="sm">
                    <Group grow>
                        <NumberInput
                            label="Border Radius (px)"
                            min={0}
                            max={50}
                            value={styles.borderRadius || 0}
                            onChange={(value) => updateStyle('borderRadius', value)}
                        />
                        <NumberInput
                            label="Border Width (px)"
                            min={0}
                            max={10}
                            value={styles.borderWidth || 0}
                            onChange={(value) => updateStyle('borderWidth', value)}
                        />
                    </Group>
                    <Group grow>
                        <ColorInput
                            label="Border Color"
                            value={styles.borderColor || '#e9ecef'}
                            onChange={(value) => updateStyle('borderColor', value)}
                        />
                        <Select
                            label="Border Style"
                            data={['solid', 'dashed', 'dotted', 'double']}
                            value={styles.borderStyle || 'solid'}
                            onChange={(value) => updateStyle('borderStyle', value)}
                        />
                    </Group>
                    <Select
                        label="Box Shadow"
                        data={['none', 'sm', 'md', 'lg', 'xl']}
                        value={styles.boxShadow || 'none'}
                        onChange={(value) => updateStyle('boxShadow', value)}
                    />
                </Stack>
            </div>

            {/* 👁️ VISIBILITY & LAYERS */}
            <div>
                <Text fw={600} size="sm" mb="sm" c="green">👁️ VISIBILITY & LAYERS</Text>
                <Stack gap="sm">
                    <div>
                        <Text size="sm" mb="xs">Opacity: {styles.opacity || 100}%</Text>
                        <Slider
                            min={0}
                            max={100}
                            value={styles.opacity || 100}
                            onChange={(value) => updateStyle('opacity', value)}
                            marks={[
                                { value: 0, label: '0%' },
                                { value: 50, label: '50%' },
                                { value: 100, label: '100%' }
                            ]}
                        />
                    </div>
                    <Group grow>
                        <Select
                            label="Overflow"
                            data={['visible', 'hidden', 'scroll', 'auto']}
                            value={styles.overflow || 'visible'}
                            onChange={(value) => updateStyle('overflow', value)}
                        />
                        <NumberInput
                            label="Z-Index"
                            min={0}
                            max={1000}
                            value={styles.zIndex || 1}
                            onChange={(value) => updateStyle('zIndex', value)}
                        />
                    </Group>
                </Stack>
            </div>

            {/* ⚙️ ADVANCED & CUSTOM */}
            <div>
                <Text fw={600} size="sm" mb="sm" c="red">⚙️ ADVANCED & CUSTOM</Text>
                <Stack gap="sm">
                    <TextInput
                        label="ID Personalizado"
                        placeholder="mi-seccion"
                        value={styles.customId || ''}
                        onChange={(e) => updateStyle('customId', e.target.value)}
                    />
                    <TextInput
                        label="CSS Classes"
                        placeholder="clase1 clase2 bg-red-500"
                        value={styles.customClasses || ''}
                        onChange={(e) => updateStyle('customClasses', e.target.value)}
                    />
                    <Textarea
                        label="CSS Personalizado"
                        placeholder="transform: rotate(5deg); transition: all 0.3s;"
                        rows={3}
                        value={styles.customCSS || ''}
                        onChange={(e) => updateStyle('customCSS', e.target.value)}
                    />
                </Stack>
            </div>
        </Stack>
    );
}

export default function SettingsPanel({ selectedBlock, updateBlock, onClose }) {
    const [localConfig, setLocalConfig] = useState({});
    const [localStyles, setLocalStyles] = useState({});
    
    // Referencias para debouncing
    const configTimeoutRef = useRef(null);
    const styleTimeoutRef = useRef(null);

    useEffect(() => {
        if (selectedBlock) {
            setLocalConfig(selectedBlock.config || {});
            setLocalStyles(selectedBlock.styles || {});
        }
    }, [selectedBlock]);

    if (!selectedBlock) return null;

    // Función debounced para aplicar cambios de config
    const debouncedConfigUpdate = (newConfig) => {
        if (configTimeoutRef.current) {
            clearTimeout(configTimeoutRef.current);
        }
        
        configTimeoutRef.current = setTimeout(() => {
            updateBlock(selectedBlock.id, newConfig, localStyles);
        }, 300); // 300ms de delay
    };

    // Función debounced para aplicar cambios de style
    const debouncedStyleUpdate = (newStyles) => {
        if (styleTimeoutRef.current) {
            clearTimeout(styleTimeoutRef.current);
        }
        
        styleTimeoutRef.current = setTimeout(() => {
            updateBlock(selectedBlock.id, localConfig, newStyles);
        }, 300); // 300ms de delay
    };

    const updateConfig = (key, value) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig); // Actualizar UI inmediatamente
        debouncedConfigUpdate(newConfig); // Aplicar cambios con delay
    };

    const updateStyle = (key, value) => {
        const newStyles = { ...localStyles, [key]: value };
        setLocalStyles(newStyles); // Actualizar UI inmediatamente
        debouncedStyleUpdate(newStyles); // Aplicar cambios con delay
    };

    // Limpiar timeouts al desmontar
    useEffect(() => {
        return () => {
            if (configTimeoutRef.current) clearTimeout(configTimeoutRef.current);
            if (styleTimeoutRef.current) clearTimeout(styleTimeoutRef.current);
        };
    }, []);

    // Obtener el componente de ajustes correcto desde el registro
    const blockDefinition = blockRegistry.get(selectedBlock.type);
    const SettingsComponent = blockDefinition?.settingsComponent;

    return (
        <Paper
            p="md" withBorder shadow="md"
            style={{
                position: 'fixed', top: 70, right: 0, width: 380,
                height: 'calc(100vh - 70px)', zIndex: 1000,
                backgroundColor: 'white', overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <Group justify="space-between" mb="md">
                <Text fw={600}>Configuración de {selectedBlock.name}</Text>
                <Tooltip label="Cerrar Panel">
                    <ActionIcon variant="subtle" onClick={onClose}>
                        <IconX size={18} />
                    </ActionIcon>
                </Tooltip>
            </Group>
            <Divider mb="md" />

            <Tabs defaultValue="content" variant="pills">
                <Tabs.List grow>
                    <Tabs.Tab value="content" leftSection={<IconSettings size={14} />}>
                        Contenido
                    </Tabs.Tab>
                    <Tabs.Tab value="style" leftSection={<IconPalette size={14} />}>
                        Estilo
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="content" pt="md">
                    {SettingsComponent ? (
                        <SettingsComponent config={localConfig} updateConfig={updateConfig} />
                    ) : (
                        <Text c="dimmed">No hay ajustes de contenido para este bloque.</Text>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="style" pt="md">
                    <StyleSettings styles={localStyles} updateStyle={updateStyle} />
                </Tabs.Panel>
            </Tabs>
        </Paper>
    );
}