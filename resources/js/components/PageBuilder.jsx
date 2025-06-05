import { useState, useEffect, useRef } from 'preact/hooks';
import {
    AppShell,
    Text,
    Button,
    Card,
    Group,
    Stack,
    Badge,
    ActionIcon,
    Tooltip,
    Container,
    Paper,
    Divider,
    Box,
    Flex,
    SimpleGrid
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { 
    IconLayout, 
    IconLetterCaseLower, 
    IconPointer,
    IconSettings,
    IconTrash,
    IconMenu2,
    IconPlus,
    IconDeviceFloppy,
    IconEye,
    IconPalette,
    IconCode,
    IconPhoto,
    IconBoxMultiple,
    IconCopy,
    IconGrid3x3,
    IconColumns,
    IconStack,
    IconContainer
} from '@tabler/icons-preact';
import Sortable from 'sortablejs';
import SettingsPanel from './SettingsPanel';

export default function PageBuilder() {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const canvasRef = useRef(null);
    const sortableInstances = useRef(new Map());

    // Bloques disponibles expandidos con contenedores
    const availableBlocks = [
        // Contenedores
        {
            id: 'container',
            name: 'Container',
            description: 'Contenedor para agrupar elementos',
            icon: IconContainer,
            category: 'layout',
            color: 'blue',
            isContainer: true
        },
        {
            id: 'grid',
            name: 'Grid Layout',
            description: 'Sistema de grilla responsive',
            icon: IconGrid3x3,
            category: 'layout',
            color: 'indigo',
            isContainer: true
        },
        {
            id: 'flexbox',
            name: 'Flex Layout',
            description: 'Layout flexbox horizontal/vertical',
            icon: IconColumns,
            category: 'layout',
            color: 'violet',
            isContainer: true
        },
        {
            id: 'stack',
            name: 'Stack Layout',
            description: 'Elementos apilados verticalmente',
            icon: IconStack,
            category: 'layout',
            color: 'cyan',
            isContainer: true
        },
        // Elementos de contenido
        {
            id: 'hero',
            name: 'Hero Section',
            description: 'Sección principal con título y CTA',
            icon: IconLayout,
            category: 'content',
            color: 'blue'
        },
        {
            id: 'text',
            name: 'Text Block',
            description: 'Párrafo de texto enriquecido',
            icon: IconLetterCaseLower,
            category: 'content',
            color: 'green'
        },
        {
            id: 'button',
            name: 'Button',
            description: 'Botón de acción personalizable',
            icon: IconPointer,
            category: 'action',
            color: 'orange'
        },
        {
            id: 'image',
            name: 'Image',
            description: 'Imagen con opciones de diseño',
            icon: IconPhoto,
            category: 'media',
            color: 'purple'
        }
    ];

    // Inicializar Sortable para el canvas principal y contenedores anidados
    const initializeSortable = (element, isNested = false, containerId = null) => {
        if (!element) return null;

        const sortableId = containerId || 'main-canvas';
        
        // Destruir instancia anterior si existe
        if (sortableInstances.current.has(sortableId)) {
            sortableInstances.current.get(sortableId).destroy();
        }

        const sortableInstance = Sortable.create(element, {
            group: 'page-builder', // Permite mover entre diferentes contenedores
            animation: 200,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            handle: '.drag-handle',
            forceFallback: true,
            fallbackOnBody: true,
            swapThreshold: 0.65,
            onStart: () => {
                document.body.style.userSelect = 'none';
            },
            onEnd: (evt) => {
                document.body.style.userSelect = '';
                handleSortEnd(evt, containerId);
            }
        });

        sortableInstances.current.set(sortableId, sortableInstance);
        return sortableInstance;
    };

    // Manejar el final del drag & drop
    const handleSortEnd = (evt, containerId) => {
        const { from, to, oldIndex, newIndex, item } = evt;
        
        if (oldIndex === undefined || newIndex === undefined) return;

        const blockId = item.getAttribute('data-block-id');
        const fromContainerId = from.getAttribute('data-container-id') || null;
        const toContainerId = to.getAttribute('data-container-id') || null;

        if (fromContainerId === toContainerId) {
            // Mover dentro del mismo contenedor
            updateBlockOrder(fromContainerId, oldIndex, newIndex);
        } else {
            // Mover entre contenedores diferentes
            moveBlockBetweenContainers(blockId, fromContainerId, toContainerId, newIndex);
        }
    };

    // Actualizar orden dentro del mismo contenedor
    const updateBlockOrder = (containerId, oldIndex, newIndex) => {
        setBlocks(prevBlocks => {
            const newBlocks = [...prevBlocks];
            
            if (!containerId) {
                // Mover en el canvas principal
                const movedItem = newBlocks.splice(oldIndex, 1)[0];
                newBlocks.splice(newIndex, 0, movedItem);
            } else {
                // Mover dentro de un contenedor
                const containerBlock = findBlockById(newBlocks, containerId);
                if (containerBlock && containerBlock.children) {
                    const movedItem = containerBlock.children.splice(oldIndex, 1)[0];
                    containerBlock.children.splice(newIndex, 0, movedItem);
                }
            }
            
            return newBlocks;
        });

        notifications.show({
            title: 'Orden actualizado',
            message: 'Los componentes se reordenaron correctamente',
            color: 'blue',
            icon: <IconBoxMultiple size={18} />
        });
    };

    // Mover bloque entre contenedores
    const moveBlockBetweenContainers = (blockId, fromContainerId, toContainerId, newIndex) => {
        setBlocks(prevBlocks => {
            const newBlocks = [...prevBlocks];
            let movedBlock = null;

            // Remover del contenedor origen
            if (!fromContainerId) {
                const blockIndex = newBlocks.findIndex(b => b.id === blockId);
                if (blockIndex !== -1) {
                    movedBlock = newBlocks.splice(blockIndex, 1)[0];
                }
            } else {
                const fromContainer = findBlockById(newBlocks, fromContainerId);
                if (fromContainer && fromContainer.children) {
                    const blockIndex = fromContainer.children.findIndex(b => b.id === blockId);
                    if (blockIndex !== -1) {
                        movedBlock = fromContainer.children.splice(blockIndex, 1)[0];
                    }
                }
            }

            // Agregar al contenedor destino
            if (movedBlock) {
                if (!toContainerId) {
                    newBlocks.splice(newIndex, 0, movedBlock);
                } else {
                    const toContainer = findBlockById(newBlocks, toContainerId);
                    if (toContainer) {
                        if (!toContainer.children) toContainer.children = [];
                        toContainer.children.splice(newIndex, 0, movedBlock);
                    }
                }
            }

            return newBlocks;
        });
    };

    // Encontrar bloque por ID recursivamente
    const findBlockById = (blocks, id) => {
        for (const block of blocks) {
            if (block.id === id) return block;
            if (block.children) {
                const found = findBlockById(block.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    // Configurar Sortable para canvas principal
    useEffect(() => {
        if (canvasRef.current) {
            initializeSortable(canvasRef.current, false, null);
        }

        return () => {
            // Limpiar todas las instancias
            sortableInstances.current.forEach(instance => instance.destroy());
            sortableInstances.current.clear();
        };
    }, [blocks.length]);

    // Configurar Sortable para contenedores anidados
    useEffect(() => {
        const containers = document.querySelectorAll('[data-sortable-container]');
        containers.forEach(container => {
            const containerId = container.getAttribute('data-container-id');
            if (containerId && !sortableInstances.current.has(containerId)) {
                initializeSortable(container, true, containerId);
            }
        });
    }, [blocks]);

    const addBlock = (blockType, parentId = null) => {
        const newBlock = {
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: blockType.id,
            name: blockType.name,
            config: getDefaultConfig(blockType.id),
            styles: getDefaultStyles(blockType.id),
            color: blockType.color,
            isContainer: blockType.isContainer,
            children: blockType.isContainer ? [] : undefined
        };

        if (!parentId) {
            setBlocks(prevBlocks => [...prevBlocks, newBlock]);
        } else {
            setBlocks(prevBlocks => {
                const newBlocks = [...prevBlocks];
                const parentBlock = findBlockById(newBlocks, parentId);
                if (parentBlock) {
                    if (!parentBlock.children) parentBlock.children = [];
                    parentBlock.children.push(newBlock);
                }
                return newBlocks;
            });
        }

        setSelectedBlock(newBlock);
        setShowSettings(true);
        
        notifications.show({
            title: 'Componente agregado',
            message: `${blockType.name} se agregó ${parentId ? 'al contenedor' : 'al canvas'}`,
            color: blockType.color,
            icon: <IconPlus size={18} />
        });
    };

    const selectBlock = (block, event) => {
        if (event && event.target.closest('.action-button')) {
            return;
        }
        setSelectedBlock(block);
        setShowSettings(true);
    };

    const openSettings = (block, event) => {
        event.stopPropagation();
        setSelectedBlock(block);
        setShowSettings(true);
    };

    const closeSettings = () => {
        setShowSettings(false);
        setTimeout(() => setSelectedBlock(null), 150);
    };

    const updateBlock = (blockId, newConfig, newStyles) => {
        const updateBlockInArray = (blocks) => {
            return blocks.map(block => {
                if (block.id === blockId) {
                    return { ...block, config: newConfig, styles: newStyles };
                }
                if (block.children) {
                    return { ...block, children: updateBlockInArray(block.children) };
                }
                return block;
            });
        };

        setBlocks(prevBlocks => updateBlockInArray(prevBlocks));
        
        if (selectedBlock && selectedBlock.id === blockId) {
            setSelectedBlock(prev => ({
                ...prev,
                config: newConfig,
                styles: newStyles
            }));
        }
    };

    const getDefaultConfig = (type) => {
        const defaults = {
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
                content: 'Este es un párrafo de contenido. Puedes editarlo para agregar tu propio texto y darle formato según tus necesidades.'
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
        return defaults[type] || {};
    };

    const getDefaultStyles = (type) => {
        const baseStyles = {
            padding: 'md',
            margin: 'sm',
            textAlign: 'left',
            backgroundColor: 'transparent'
        };

        const containerStyles = {
            container: { ...baseStyles, border: '1px dashed #dee2e6' },
            grid: { ...baseStyles, border: '1px dashed #dee2e6' },
            flexbox: { ...baseStyles, border: '1px dashed #dee2e6' },
            stack: { ...baseStyles, border: '1px dashed #dee2e6' }
        };

        return containerStyles[type] || baseStyles;
    };

    const removeBlock = (blockId, event) => {
        event.stopPropagation();
        
        const removeBlockFromArray = (blocks) => {
            return blocks.filter(block => {
                if (block.id === blockId) return false;
                if (block.children) {
                    block.children = removeBlockFromArray(block.children);
                }
                return true;
            });
        };

        const blockToRemove = findBlockById(blocks, blockId);
        setBlocks(prevBlocks => removeBlockFromArray(prevBlocks));
        
        if (selectedBlock?.id === blockId) {
            setSelectedBlock(null);
            setShowSettings(false);
        }
        
        notifications.show({
            title: 'Componente eliminado',
            message: `${blockToRemove?.name} se eliminó correctamente`,
            color: 'red',
            icon: <IconTrash size={18} />
        });
    };

    const duplicateBlock = (blockId, event) => {
        event.stopPropagation();
        const blockToDuplicate = findBlockById(blocks, blockId);
        if (blockToDuplicate) {
            const newBlock = {
                ...JSON.parse(JSON.stringify(blockToDuplicate)), // Deep clone
                id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: `${blockToDuplicate.name} (Copia)`
            };
            
            // Asignar nuevos IDs a los hijos también
            const assignNewIds = (block) => {
                block.id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                if (block.children) {
                    block.children.forEach(assignNewIds);
                }
            };
            if (newBlock.children) {
                newBlock.children.forEach(assignNewIds);
            }
            
            setBlocks(prevBlocks => [...prevBlocks, newBlock]);
            setSelectedBlock(newBlock);
            setShowSettings(true);
            
            notifications.show({
                title: 'Componente duplicado',
                message: `${blockToDuplicate.name} se duplicó correctamente`,
                color: 'green',
                icon: <IconCopy size={18} />
            });
        }
    };

    // Renderizar bloque recursivamente
    const renderBlock = (block, isNested = false) => {
        const isSelected = selectedBlock?.id === block.id;
        
        return (
            <Paper
                key={block.id}
                mb="md"
                p="md"
                withBorder
                data-block-id={block.id}
                style={{
                    backgroundColor: 'white',
                    border: isSelected 
                        ? `2px solid var(--mantine-color-${block.color}-4)` 
                        : '1px solid #e9ecef',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                }}
                onClick={(e) => selectBlock(block, e)}
            >
                {/* Header del bloque */}
                <Group justify="space-between" mb="sm">
                    <Group gap="sm">
                        <div 
                            className="drag-handle" 
                            style={{ 
                                cursor: 'grab',
                                padding: '4px',
                                borderRadius: '4px'
                            }}
                        >
                            <IconMenu2 size={16} color="#868e96" />
                        </div>
                        <Badge 
                            variant="light" 
                            color={block.color}
                            size="sm"
                        >
                            {block.name}
                        </Badge>
                        {isSelected && (
                            <Badge variant="filled" size="xs" color={block.color}>
                                Seleccionado
                            </Badge>
                        )}
                        {block.isContainer && (
                            <Badge variant="outline" size="xs" color="gray">
                                Contenedor
                            </Badge>
                        )}
                    </Group>

                    {!previewMode && (
                        <Group gap="xs" className="action-button">
                            {block.isContainer && (
                                <Tooltip label="Agregar hijo">
                                    <ActionIcon 
                                        variant="light" 
                                        size="sm"
                                        color="cyan"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Mostrar mini selector o agregar elemento básico
                                            addBlock(availableBlocks.find(b => b.id === 'text'), block.id);
                                        }}
                                    >
                                        <IconPlus size={14} />
                                    </ActionIcon>
                                </Tooltip>
                            )}
                            <Tooltip label="Configurar">
                                <ActionIcon 
                                    variant="light" 
                                    size="sm"
                                    color="blue"
                                    onClick={(e) => openSettings(block, e)}
                                >
                                    <IconSettings size={14} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Duplicar">
                                <ActionIcon 
                                    variant="light" 
                                    size="sm"
                                    color="green"
                                    onClick={(e) => duplicateBlock(block.id, e)}
                                >
                                    <IconCopy size={14} />
                                </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Eliminar">
                                <ActionIcon
                                    variant="light"
                                    color="red"
                                    size="sm"
                                    onClick={(e) => removeBlock(block.id, e)}
                                >
                                    <IconTrash size={14} />
                                </ActionIcon>
                            </Tooltip>
                        </Group>
                    )}
                </Group>
                
                {/* Contenido del bloque */}
                {renderBlockContent(block)}
            </Paper>
        );
    };

    // Renderizar contenido específico del bloque
    const renderBlockContent = (block) => {
        if (block.isContainer && block.children && block.children.length > 0) {
            return renderContainerContent(block);
        } else if (block.isContainer) {
            return renderEmptyContainer(block);
        } else {
            return renderElementContent(block);
        }
    };

    // Renderizar contenedor con hijos
    const renderContainerContent = (block) => {
        const containerStyle = {
            minHeight: '100px',
            backgroundColor: block.styles?.backgroundColor || '#f8f9fa',
            borderRadius: '6px',
            border: '1px dashed #dee2e6',
            padding: '16px'
        };

        const commonProps = {
            'data-sortable-container': true,
            'data-container-id': block.id,
            style: containerStyle
        };

        switch (block.type) {
            case 'grid':
                return (
                    <SimpleGrid
                        cols={block.config.columns || 2}
                        spacing={block.config.gap || 'md'}
                        {...commonProps}
                    >
                        {block.children.map(child => renderBlock(child, true))}
                    </SimpleGrid>
                );
            
            case 'flexbox':
                return (
                    <Flex
                        direction={block.config.direction || 'row'}
                        align={block.config.align || 'stretch'}
                        justify={block.config.justify || 'flex-start'}
                        gap={block.config.gap || 'md'}
                        wrap={block.config.wrap ? 'wrap' : 'nowrap'}
                        {...commonProps}
                    >
                        {block.children.map(child => renderBlock(child, true))}
                    </Flex>
                );
            
            case 'stack':
                return (
                    <Stack
                        spacing={block.config.spacing || 'md'}
                        align={block.config.align || 'stretch'}
                        {...commonProps}
                    >
                        {block.children.map(child => renderBlock(child, true))}
                    </Stack>
                );
            
            default: // container
                return (
                    <div {...commonProps}>
                        {block.children.map(child => renderBlock(child, true))}
                    </div>
                );
        }
    };

    // Renderizar contenedor vacío
    const renderEmptyContainer = (block) => (
        <Box
            data-sortable-container
            data-container-id={block.id}
            style={{
                minHeight: '100px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '2px dashed #dee2e6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
        >
            <Text c="dimmed" ta="center">
                <IconBoxMultiple size={32} color="#ced4da" />
                <br />
                Arrastra componentes aquí
            </Text>
        </Box>
    );

    // Renderizar elemento de contenido
    const renderElementContent = (block) => (
        <Box
            p="md"
            style={{ 
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px dashed #dee2e6'
            }}
        >
            {block.type === 'hero' && (
                <div style={{ textAlign: block.styles?.textAlign || 'center' }}>
                    <Text size="xl" fw={700} mb="xs">
                        {block.config.title}
                    </Text>
                    <Text c="dimmed" mb="lg">
                        {block.config.subtitle}
                    </Text>
                    <Button variant="filled" color={block.color}>
                        {block.config.buttonText}
                    </Button>
                </div>
            )}
            {block.type === 'text' && (
                <Text 
                    style={{ 
                        lineHeight: 1.6,
                        textAlign: block.styles?.textAlign || 'left'
                    }}
                >
                    {block.config.content}
                </Text>
            )}
            {block.type === 'button' && (
                <div style={{ textAlign: block.styles?.textAlign || 'left' }}>
                    <Button 
                        variant={block.config.variant} 
                        size={block.config.size}
                        color={block.color}
                    >
                        {block.config.text}
                    </Button>
                </div>
            )}
            {block.type === 'image' && (
                <div style={{ textAlign: block.styles?.textAlign || 'left' }}>
                    <img 
                        src={block.config.url} 
                        alt={block.config.alt}
                        style={{ 
                            width: '100%', 
                            height: 'auto',
                            borderRadius: '4px',
                            maxHeight: '300px',
                            objectFit: 'cover'
                        }}
                    />
                    {block.config.caption && (
                        <Text size="sm" c="dimmed" mt="xs" ta="center">
                            {block.config.caption}
                        </Text>
                    )}
                </div>
            )}
        </Box>
    );

    const saveProject = () => {
        notifications.show({
            title: 'Guardando...',
            message: 'Guardando proyecto...',
            color: 'blue',
            loading: true,
            autoClose: false,
            id: 'save-project'
        });

        setTimeout(() => {
            notifications.update({
                id: 'save-project',
                title: 'Proyecto guardado',
                message: 'Todos los cambios se guardaron exitosamente',
                color: 'green',
                icon: <IconDeviceFloppy size={18} />,
                loading: false,
                autoClose: 3000
            });
        }, 1000);
    };

    // Agrupar bloques por categoría
    const blocksByCategory = availableBlocks.reduce((acc, block) => {
        if (!acc[block.category]) acc[block.category] = [];
        acc[block.category].push(block);
        return acc;
    }, {});

    return (
        <AppShell
            navbar={{ width: 320, breakpoint: 'sm' }}
            header={{ height: 70 }}
            padding={0}
        >
            {/* Header */}
            <AppShell.Header>
                <Container size="100%" h="100%">
                    <Flex justify="space-between" align="center" h="100%" px="md">
                        <Group gap="sm">
                            <IconPalette size={28} color="#228be6" />
                            <div>
                                <Text size="lg" fw={700} c="dark">
                                    Page Builder Grid
                                </Text>
                                <Text size="xs" c="dimmed">
                                    Sistema avanzado con contenedores anidados
                                </Text>
                            </div>
                        </Group>

                        <Group gap="xs">
                            <Badge 
                                variant="light" 
                                color="blue" 
                                size="md"
                                leftSection={<IconBoxMultiple size={14} />}
                            >
                                {blocks.length} {blocks.length === 1 ? 'elemento' : 'elementos'}
                            </Badge>
                            
                            <Tooltip label={previewMode ? "Modo Edición" : "Vista Previa"}>
                                <ActionIcon
                                    variant={previewMode ? "filled" : "light"}
                                    color="gray"
                                    size="lg"
                                    onClick={() => setPreviewMode(!previewMode)}
                                >
                                    <IconEye size={18} />
                                </ActionIcon>
                            </Tooltip>

                            <Button 
                                leftSection={<IconDeviceFloppy size={18} />}
                                variant="filled"
                                size="sm"
                                onClick={saveProject}
                            >
                                Guardar
                            </Button>
                        </Group>
                    </Flex>
                </Container>
            </AppShell.Header>

            {/* Sidebar */}
            <AppShell.Navbar p="md" style={{ borderRight: '1px solid #e9ecef' }}>
                <Text fw={600} mb="lg" size="sm" c="dark.7">
                    COMPONENTES DISPONIBLES
                </Text>
                
                {Object.entries(blocksByCategory).map(([category, categoryBlocks]) => (
                    <div key={category} style={{ marginBottom: '20px' }}>
                        <Text fw={500} size="xs" c="dimmed" mb="sm" tt="uppercase">
                            {category === 'layout' ? 'Contenedores' : 
                             category === 'content' ? 'Contenido' :
                             category === 'action' ? 'Acciones' : 
                             category === 'media' ? 'Media' : category}
                        </Text>
                        <Stack gap="xs">
                            {categoryBlocks.map((block) => {
                                const IconComponent = block.icon;
                                return (
                                    <Paper
                                        key={block.id}
                                        p="sm"
                                        withBorder
                                        style={{ 
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => addBlock(block)}
                                        sx={{
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                            }
                                        }}
                                    >
                                        <Group gap="sm" wrap="nowrap">
                                            <Box
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '8px',
                                                    backgroundColor: `var(--mantine-color-${block.color}-1)`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <IconComponent 
                                                    size={18} 
                                                    color={`var(--mantine-color-${block.color}-6)`}
                                                />
                                            </Box>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Text fw={500} size="sm" truncate>
                                                    {block.name}
                                                </Text>
                                                <Text size="xs" c="dimmed" truncate>
                                                    {block.description}
                                                </Text>
                                            </div>
                                            <ActionIcon variant="subtle" size="sm" color="gray">
                                                <IconPlus size={14} />
                                            </ActionIcon>
                                        </Group>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </div>
                ))}

                <Divider my="md" />

                <Text fw={500} size="xs" c="dimmed" mb="sm">
                    AYUDA
                </Text>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.4 }}>
                    • Arrastra elementos entre contenedores<br />
                    • Los contenedores pueden anidar otros elementos<br />
                    • Grid: Sistema de columnas responsive<br />
                    • Flex: Layout horizontal/vertical<br />
                    • Stack: Elementos apilados
                </Text>
            </AppShell.Navbar>

            {/* Canvas principal */}
            <AppShell.Main style={{ backgroundColor: '#f8f9fa' }}>
                <Container size="lg" py="xl">
                    {blocks.length === 0 ? (
                        <Paper 
                            p="xl" 
                            withBorder 
                            style={{ 
                                textAlign: 'center',
                                backgroundColor: 'white',
                                minHeight: '60vh',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <IconGrid3x3 size={64} color="#ced4da" />
                            <Text size="xl" fw={600} c="dark.3" mt="md">
                                Canvas vacío
                            </Text>
                            <Text size="sm" c="dimmed" mt="xs" maw={400}>
                                Comienza creando un layout con contenedores Grid, Flex o Stack. 
                                Luego arrastra elementos de contenido dentro de ellos.
                            </Text>
                            <Group mt="lg">
                                <Button 
                                    variant="light" 
                                    leftSection={<IconGrid3x3 size={16} />}
                                    onClick={() => addBlock(availableBlocks.find(b => b.id === 'grid'))}
                                >
                                    Crear Grid
                                </Button>
                                <Button 
                                    variant="outline" 
                                    leftSection={<IconColumns size={16} />}
                                    onClick={() => addBlock(availableBlocks.find(b => b.id === 'flexbox'))}
                                >
                                    Crear Flexbox
                                </Button>
                            </Group>
                        </Paper>
                    ) : (
                        <div 
                            ref={canvasRef} 
                            data-container-id={null}
                            style={{ minHeight: '200px' }}
                        >
                            {blocks.map(block => renderBlock(block))}
                        </div>
                    )}
                </Container>
            </AppShell.Main>

            {/* Panel de Configuración */}
            {showSettings && selectedBlock && (
                <SettingsPanel
                    selectedBlock={selectedBlock}
                    updateBlock={updateBlock}
                    onClose={closeSettings}
                />
            )}

            {/* Overlay para cerrar configuraciones */}
            {showSettings && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        zIndex: 999
                    }}
                    onClick={closeSettings}
                />
            )}
        </AppShell>
    );
}