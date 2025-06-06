// HeroBlock.jsx
import { Text, Button, ActionIcon, Group } from '@mantine/core';
import { IconTrash } from '@tabler/icons-preact';
import { convertStylesToCSS, getCustomAttributes } from '../../../utils/styleUtils';

export default function HeroBlock({ 
    config, 
    styles, 
    color, 
    previewMode, 
    isSelected, 
    onSelect, 
    onDelete 
}) {
    const cssStyles = convertStylesToCSS(styles);
    const customAttributes = getCustomAttributes(styles);
    
    const finalStyles = {
        ...cssStyles,
        textAlign: styles?.textAlign || 'center',
    };

    return (
        <div 
            style={finalStyles}
            {...customAttributes}
            className={!previewMode ? `builder-block ${isSelected ? 'selected' : ''}` : ''}
            onClick={onSelect}
        >
            {/* Botón de eliminar (solo en modo edición y hover) */}
            {!previewMode && (
                <Group 
                    style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        right: '8px',
                        opacity: isSelected ? 1 : 0,
                        transition: 'opacity 0.2s',
                        zIndex: 20
                    }}
                >
                    <ActionIcon 
                        color="red" 
                        variant="filled" 
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        <IconTrash size={12} />
                    </ActionIcon>
                </Group>
            )}

            <Text size="xl" fw={700} mb="xs">
                {config.title}
            </Text>
            <Text c="dimmed" mb="lg">
                {config.subtitle}
            </Text>
            <Button variant="filled" color={color}>
                {config.buttonText}
            </Button>
        </div>
    );
}