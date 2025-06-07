import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import {
    AppShell, Text, Button, Group, Stack, Badge, ActionIcon, Tooltip,
    Container, Paper, Divider, Box, Flex, SimpleGrid
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconTrash, IconMenu2, IconPlus, IconDeviceFloppy,
    IconPalette, IconCopy, IconGrid3x3, IconCode
} from '@tabler/icons-preact';
import Sortable from 'sortablejs';
import blockRegistry, { availableBlocks } from './blocks/BlockRegistry';
import CodeViewer from './CodeViewer';

export default function PageBuilder() {
    const [blocks, setBlocks] = useState([]);
    const [isDraggingFromSidebar, setIsDraggingFromSidebar] = useState(false);
    const [draggedBlockId, setDraggedBlockId] = useState(null);
    const [showCodeViewer, setShowCodeViewer] = useState(false);
    const canvasRef = useRef(null);
    const sortableInstances = useRef(new Map());

    // --- FUNCIONES AUXILIARES ---

    const findBlockById = (blockArray, id) => {
        for (const block of blockArray) {
            if (block.id === id) return block;
            if (block.children) {
                const found = findBlockById(block.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    // --- LÓGICA DE DRAG-AND-DROP (SORTABLEJS) ---

    const destroyAllSortables = () => {
        sortableInstances.current.forEach(instance => {
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        });
        sortableInstances.current.clear();
    };

    const initializeSortable = (element, options, id) => {
        if (!element) return;
        
        if (sortableInstances.current.has(id)) {
            const existingInstance = sortableInstances.current.get(id);
            if (existingInstance && typeof existingInstance.destroy === 'function') {
                existingInstance.destroy();
            }
        }

        try {
            const sortableInstance = Sortable.create(element, {
                ...options,
                animation: 200,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
            });
            sortableInstances.current.set(id, sortableInstance);
        } catch (error) {
            console.error('Error creating sortable instance:', error);
        }
    };

    const handleSortStart = (evt) => {
        const { from, item } = evt;
        const isFromSidebar = from.classList.contains('sidebar-blocks-list');
        const blockId = item.getAttribute('data-block-id');

        setIsDraggingFromSidebar(isFromSidebar);
        setDraggedBlockId(blockId);
        
        console.log('Drag started', { fromSidebar: isFromSidebar, blockType: blockId });
    };

    const handleSortEnd = (evt) => {
        const { from, to, oldIndex, newIndex, item, clone } = evt;

        if (from === to) {
            console.log('Arrastre cancelado, el elemento volvió a su origen.');
            setIsDraggingFromSidebar(false);
            setDraggedBlockId(null);
            return;
        }

        if (from.classList.contains('sidebar-blocks-list')) {
            let blockId = item.getAttribute('data-block-id');
            if (!blockId && clone) {
                blockId = clone.getAttribute('data-block-id');
            }
            if (!blockId) {
                const blockElement = item.querySelector('[data-block-id]') || clone?.querySelector('[data-block-id]');
                if (blockElement) {
                    blockId = blockElement.getAttribute('data-block-id');
                }
            }
            
            if (!blockId) {
                console.error('No se pudo encontrar el block ID');
                return;
            }

            const containerId = to.getAttribute('data-container-id') || to.getAttribute('data-sortable-id');
            const parentId = containerId === 'main-canvas' ? null : containerId;

            if (item.parentNode) {
                item.parentNode.removeChild(item);
            }
            
            addBlock(blockId, parentId, newIndex);
        } else {
            console.log("Reordenando bloque existente");
        }
    };

    const initializeAllSortables = () => {
        destroyAllSortables();
        const sidebarOptions = {
            group: {
                name: 'blocks',
                pull: 'clone',
                put: false,
                revertClone: true,
            },
            sort: false,
            onStart: handleSortStart,
            onEnd: handleSortEnd,
        };
        const dropZoneOptions = {
            group: 'blocks',
            onStart: handleSortStart,
            onEnd: handleSortEnd,
            handle: '.drag-handle',
        };
        document.querySelectorAll('.sidebar-blocks-list').forEach((el) => initializeSortable(el, sidebarOptions, el.dataset.sortableId));
        if (canvasRef.current) {
            initializeSortable(canvasRef.current, dropZoneOptions, 'main-canvas');
        }
        document.querySelectorAll('[data-sortable-container]').forEach(el => initializeSortable(el, dropZoneOptions, el.dataset.containerId));
    };

    useEffect(() => {
        initializeAllSortables();
        return () => destroyAllSortables();
    }, [blocks]);

    // --- MANEJO DE BLOQUES (CRUD) ---

    const addBlock = useCallback((blockId, parentId = null, index = 0) => {
        if (!blockId) {
            console.error('Block ID is required');
            return;
        }
        const blockDef = blockRegistry.get(blockId);
        if (!blockDef) {
            console.error('Block definition not found:', blockId);
            return;
        }

        const newBlock = {
            id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: blockDef.id,
            name: blockDef.name,
            color: blockDef.color,
            config: { ...(blockDef.defaultConfig || {}) },
            styles: { ...(blockDef.defaultStyles || {}) },
            isContainer: !!blockDef.isContainer,
            children: blockDef.id === 'grid'
                ? Array.from({ length: blockDef.defaultConfig.columns || 2 }, (_, i) => ({
                    id: `col_${Date.now()}_${i}`,
                    type: 'column',
                    children: [],
                }))
                : (blockDef.isContainer ? [] : undefined),
        };

        setBlocks(prevBlocks => {
            const newBlocksState = JSON.parse(JSON.stringify(prevBlocks));

            if (!parentId) {
                newBlocksState.splice(index, 0, newBlock);
                return newBlocksState;
            }

            const findAndInsert = (currentLevelBlocks) => {
                for (const block of currentLevelBlocks) {
                    if (block.id === parentId) {
                        if (!block.children) block.children = [];
                        block.children.splice(index, 0, newBlock);
                        return true;
                    }
                    if (block.children && findAndInsert(block.children)) {
                        return true;
                    }
                }
                return false;
            };

            findAndInsert(newBlocksState);
            return newBlocksState;
        });

        notifications.show({
            title: 'Componente agregado',
            message: `${newBlock.name} se agregó correctamente`,
            color: newBlock.color,
            icon: <IconPlus size={18} />,
        });
    }, []);

    const updateBlock = (blockId, newConfig, newStyles) => {
        const updateBlockInArray = (blockArray) => {
            return blockArray.map(block => {
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
    };
    
    const removeBlock = (blockId, event) => {
        event.stopPropagation();
        const removeRecursively = (b, id) => b.filter(block => {
            if (block.id === id) return false;
            if (block.children) block.children = removeRecursively(block.children, id);
            return true;
        });
        setBlocks(prev => removeRecursively(prev, blockId));
        notifications.show({ 
            title: 'Componente eliminado', 
            color: 'red', 
            icon: <IconTrash size={18} /> 
        });
    };

    const duplicateBlock = (blockId, event) => {
        event.stopPropagation();
        const blockToDuplicate = findBlockById(blocks, blockId);
        if (!blockToDuplicate) return;

        const newBlock = JSON.parse(JSON.stringify(blockToDuplicate));
        newBlock.id = `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newBlock.name = `${blockToDuplicate.name} (Copia)`;

        setBlocks(prevBlocks => {
            const newBlocksState = JSON.parse(JSON.stringify(prevBlocks));
            
            const findAndDuplicate = (currentLevelBlocks, targetId) => {
                for (let i = 0; i < currentLevelBlocks.length; i++) {
                    const block = currentLevelBlocks[i];
                    
                    if (block.id === targetId) {
                        currentLevelBlocks.splice(i + 1, 0, newBlock);
                        return true;
                    }
                    
                    if (block.children && findAndDuplicate(block.children, targetId)) {
                        return true;
                    }
                }
                return false;
            };

            findAndDuplicate(newBlocksState, blockId);
            return newBlocksState;
        });

        notifications.show({ 
            title: 'Componente duplicado', 
            message: `Se creó una copia debajo del original`,
            color: 'green', 
            icon: <IconCopy size={18} /> 
        });
    };

    // --- FUNCIONES DE RENDERIZADO ---
    
    const renderBlockContent = (block) => {
        if (block.type === 'grid') {
            return (
                <SimpleGrid
                    cols={block.config.columns || 2}
                    spacing={block.config.gap || 'md'}
                >
                    {block.children.map((column) => (
                        <Box
                            key={column.id}
                            data-sortable-container
                            data-container-id={column.id}
                            style={{
                                minHeight: '150px',
                                backgroundColor: '#f1f3f5',
                                borderRadius: '8px',
                                border: '2px dashed #ced4da',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '16px',
                                gap: '16px',
                            }}
                        >
                            {column.children && column.children.length > 0
                                ? column.children.map(childBlock => renderBlock(childBlock))
                                : <Text c="dimmed" ta="center" style={{ margin: 'auto', fontSize: '14px' }}>
                                    Arrastra aquí
                                  </Text>
                            }
                        </Box>
                    ))}
                </SimpleGrid>
            );
        }

        if (block.isContainer) {
            return (
                <Box
                    data-sortable-container
                    data-container-id={block.id}
                    style={{ minHeight: '100px', backgroundColor: '#f8f9fa', padding: '20px', gap: '16px', border: '2px dashed #dee2e6', borderRadius: '6px' }}
                >
                    {block.children && block.children.length > 0 
                        ? block.children.map(child => renderBlock(child))
                        : <Text c="dimmed" ta="center" style={{ margin: 'auto' }}>Arrastra componentes aquí</Text>
                    }
                </Box>
            );
        }

        const BlockComponent = blockRegistry.get(block.type)?.component;
        return BlockComponent ? 
            <BlockComponent 
                config={block.config} 
                styles={block.styles} 
                color={block.color}
                onUpdate={(newConfig) => updateBlock(block.id, newConfig, block.styles)}
            /> : 
            <Text c="red">Error: Componente "{block.type}" no encontrado.</Text>;
    };

    const renderBlock = (block) => {
        return (
            <Paper 
                key={block.id} 
                mb="md" 
                p="md" 
                withBorder 
                data-block-id={block.id}
                className="block-container"
                style={{ 
                    border: '1px solid #e9ecef', 
                    cursor: 'pointer', 
                    position: 'relative',
                    transition: 'border-color 0.2s'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = `var(--mantine-color-${block.color}-4)`;
                    const actions = e.currentTarget.querySelector('.block-actions');
                    if (actions) actions.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e9ecef';
                    const actions = e.currentTarget.querySelector('.block-actions');
                    if (actions) actions.style.opacity = '0';
                }}
            >
                <Group justify="space-between" mb="sm">
                    <Group gap="sm">
                        <div className="drag-handle" style={{ cursor: 'grab', padding: '4px' }} title="Arrastra para mover">
                            <IconMenu2 size={16} color="#868e96" />
                        </div>
                        <Badge variant="light" color={block.color}>{block.name}</Badge>
                    </Group>
                    <Group 
                        gap="xs" 
                        className="block-actions"
                        style={{ 
                            opacity: 0,
                            transition: 'opacity 0.2s ease'
                        }}
                    >
                        <Tooltip label="Duplicar">
                            <ActionIcon 
                                variant="filled" 
                                size="sm" 
                                color="green" 
                                onClick={(e) => duplicateBlock(block.id, e)}
                            >
                                <IconCopy size={14} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Eliminar">
                            <ActionIcon 
                                variant="filled" 
                                color="red" 
                                size="sm" 
                                onClick={(e) => removeBlock(block.id, e)}
                            >
                                <IconTrash size={14} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                </Group>
                {renderBlockContent(block)}
            </Paper>
        );
    };

    const blocksByCategory = availableBlocks.reduce((acc, block) => {
        const category = block.category || 'general';
        if (!acc[category]) acc[category] = [];
        acc[category].push(block);
        return acc;
    }, {});

    // --- JSX DEL COMPONENTE PRINCIPAL ---
    return (
        <AppShell
            navbar={{ width: 320, breakpoint: 'sm' }}
            header={{ height: 70 }}
            padding={0}
            style={{ height: '100vh', overflow: 'hidden' }}
        >
            <AppShell.Header>
                <Container size="100%" h="100%">
                    <Flex justify="space-between" align="center" h="100%" px="md">
                        <Group gap="sm">
                            <IconPalette size={28} color="#228be6" />
                            <Text size="lg" fw={700}>Page Builder</Text>
                        </Group>
                        <Group>
                            <Button 
                                leftSection={<IconCode size={18} />} 
                                size="sm" 
                                variant="light"
                                onClick={() => setShowCodeViewer(true)}
                            >
                                Ver Código
                            </Button>
                            <Button leftSection={<IconDeviceFloppy size={18} />} size="sm">
                                Guardar
                            </Button>
                        </Group>
                    </Flex>
                </Container>
            </AppShell.Header>

            <AppShell.Navbar 
                p="md" 
                style={{ 
                    overflow: 'auto',
                    height: 'calc(100vh - 70px)'
                }}
            >
                <Text fw={600} mb="lg">COMPONENTES</Text>
                <Stack gap="lg">
                    {Object.entries(blocksByCategory).map(([category, categoryBlocks]) => (
                        <div key={category}>
                            <Text fw={500} size="xs" c="dimmed" mb="sm" tt="uppercase">{category}</Text>
                            <div className="sidebar-blocks-list" data-sortable-id={`sidebar-${category}`} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {categoryBlocks.map((blockDef) => (
                                    <Paper key={blockDef.id} p="sm" withBorder data-block-id={blockDef.id} style={{ cursor: 'grab', userSelect: 'none' }}>
                                        <Group wrap="nowrap" style={{ pointerEvents: 'none' }}>
                                            <blockDef.icon size={20} color={`var(--mantine-color-${blockDef.color}-6)`} />
                                            <div>
                                                <Text size="sm" fw={500}>{blockDef.name}</Text>
                                                <Text size="xs" c="dimmed" truncate>{blockDef.description}</Text>
                                            </div>
                                        </Group>
                                    </Paper>
                                ))}
                            </div>
                        </div>
                    ))}
                </Stack>
            </AppShell.Navbar>

            <AppShell.Main 
                style={{ 
                    backgroundColor: '#f8f9fa', 
                    overflow: 'auto',
                    height: 'calc(100vh - 70px)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Container 
                    size="100%" 
                    style={{ 
                        flex: 1, 
                        paddingTop: 'var(--mantine-spacing-xl)', 
                        paddingBottom: 'var(--mantine-spacing-xl)',
                        maxWidth: '100%',
                        width: '100%'
                    }}
                >
                    {blocks.length === 0 ? (
                        <Paper 
                            ref={canvasRef} 
                            data-sortable-id="main-canvas" 
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
                            <Text size="xl" fw={600} mt="md">Canvas Vacío</Text>
                            <Text c="dimmed" mt="xs">Arrastra componentes desde la izquierda para comenzar.</Text>
                        </Paper>
                    ) : (
                        <div ref={canvasRef} data-sortable-id="main-canvas" style={{ minHeight: '200px' }}>
                            {blocks.map(block => renderBlock(block))}
                        </div>
                    )}
                </Container>
            </AppShell.Main>

            {/* Modal del visualizador de código */}
            <CodeViewer 
                opened={showCodeViewer}
                onClose={() => setShowCodeViewer(false)}
                blocks={blocks}
            />
                
            <style>{`
                .sortable-ghost { 
                    opacity: 0.4; 
                    background: #f1f3f4 !important; 
                }
                .drag-handle:hover { 
                    background-color: #f8f9fa; 
                    border-radius: 4px; 
                }
                
                .mantine-AppShell-navbar,
                .mantine-AppShell-main {
                    overflow-y: auto !important;
                }
            `}</style>
        </AppShell>
    );
}       