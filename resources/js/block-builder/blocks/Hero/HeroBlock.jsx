import { useState, useRef, useEffect } from 'preact/hooks';
import { Text, Button, TextInput, Textarea, ActionIcon, Tooltip } from '@mantine/core';
import { IconCode } from '@tabler/icons-preact';
import BladeBlockEditor from '../../monaco/BladeBlockEditor';

export default function HeroBlock({ config, styles, color, onUpdate }) {
    const [editingField, setEditingField] = useState(null); // 'title', 'subtitle', 'buttonText'
    const [tempValues, setTempValues] = useState({
        title: config.title || '',
        subtitle: config.subtitle || '',
        buttonText: config.buttonText || ''
    });
    const [codeEditorOpened, setCodeEditorOpened] = useState(false);
    
    const inputRef = useRef(null);

    // Enfocar el input cuando entra en modo edición
    useEffect(() => {
        if (editingField && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingField]);

    // Función para entrar en modo edición
    const startEditing = (field, e) => {
        e.stopPropagation();
        setTempValues({
            title: config.title || '',
            subtitle: config.subtitle || '',
            buttonText: config.buttonText || ''
        });
        setEditingField(field);
    };

    // Función para guardar cambios
    const saveChanges = () => {
        if (onUpdate) {
            const newConfig = {
                ...config,
                [editingField]: tempValues[editingField]
            };
            onUpdate(newConfig);
        }
        setEditingField(null);
    };

    // Función para cancelar edición
    const cancelEditing = () => {
        setTempValues({
            title: config.title || '',
            subtitle: config.subtitle || '',
            buttonText: config.buttonText || ''
        });
        setEditingField(null);
    };

    // Manejar teclas
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && (editingField === 'title' || editingField === 'buttonText')) {
            // Enter para campos de una línea
            e.preventDefault();
            saveChanges();
        } else if (e.key === 'Enter' && e.ctrlKey && editingField === 'subtitle') {
            // Ctrl + Enter para el subtítulo (textarea)
            e.preventDefault();
            saveChanges();
        } else if (e.key === 'Escape') {
            // Escape = cancelar
            e.preventDefault();
            cancelEditing();
        }
    };

    // Manejar blur
    const handleBlur = () => {
        saveChanges();
    };

    // Actualizar valor temporal
    const updateTempValue = (field, value) => {
        setTempValues(prev => ({ ...prev, [field]: value }));
    };

    const finalStyles = {
        textAlign: styles?.textAlign || 'center',
        padding: '40px 20px',
        position: 'relative'
    };

    return (
        <div style={finalStyles}>
            {/* TÍTULO */}
            <div style={{ marginBottom: '12px' }}>
                {editingField === 'title' ? (
                    <TextInput
                        ref={inputRef}
                        value={tempValues.title}
                        onChange={(e) => updateTempValue('title', e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        placeholder="Título impactante..."
                        size="xl"
                        style={{
                            fontSize: '2rem',
                            fontWeight: 700,
                            border: '2px solid var(--mantine-color-blue-4)',
                            backgroundColor: '#f8f9ff'
                        }}
                        styles={{
                            input: {
                                fontSize: '2rem',
                                fontWeight: 700,
                                textAlign: styles?.textAlign || 'center'
                            }
                        }}
                    />
                ) : (
                    <Text 
                        size="xl" 
                        fw={700}
                        onDoubleClick={(e) => startEditing('title', e)}
                        style={{ 
                            cursor: 'text',
                            padding: '8px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s',
                            minHeight: '1.5em'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {config.title || 'Doble clic para editar título...'}
                    </Text>
                )}
            </div>

            {/* SUBTÍTULO */}
            <div style={{ marginBottom: '32px' }}>
                {editingField === 'subtitle' ? (
                    <Textarea
                        ref={inputRef}
                        value={tempValues.subtitle}
                        onChange={(e) => updateTempValue('subtitle', e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        placeholder="Describe tu propuesta de valor..."
                        autosize
                        minRows={2}
                        maxRows={4}
                        style={{
                            border: '2px solid var(--mantine-color-blue-4)',
                            backgroundColor: '#f8f9ff'
                        }}
                        styles={{
                            input: {
                                textAlign: styles?.textAlign || 'center'
                            }
                        }}
                    />
                ) : (
                    <Text 
                        c="dimmed"
                        onDoubleClick={(e) => startEditing('subtitle', e)}
                        style={{ 
                            cursor: 'text',
                            padding: '8px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s',
                            minHeight: '1.5em'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {config.subtitle || 'Doble clic para editar subtítulo...'}
                    </Text>
                )}
            </div>

            {/* BOTÓN */}
            <div>
                {editingField === 'buttonText' ? (
                    <TextInput
                        ref={inputRef}
                        value={tempValues.buttonText}
                        onChange={(e) => updateTempValue('buttonText', e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleBlur}
                        placeholder="Texto del botón..."
                        style={{
                            border: '2px solid var(--mantine-color-blue-4)',
                            backgroundColor: '#f8f9ff',
                            maxWidth: '200px',
                            margin: '0 auto'
                        }}
                        styles={{
                            input: {
                                textAlign: 'center',
                                fontWeight: 500
                            }
                        }}
                    />
                ) : (
                    <Button 
                        variant="filled" 
                        color={color}
                        onDoubleClick={(e) => startEditing('buttonText', e)}
                        style={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        {config.buttonText || 'Doble clic para editar'}
                    </Button>
                )}
            </div>

            {/* Indicadores de edición */}
            {!editingField && (
                <>
                    <div className="edit-hint title-hint" style={hintStyle(-10, 50)}>
                        ✏️ Título
                    </div>
                    <div className="edit-hint subtitle-hint" style={hintStyle(80, 50)}>
                        ✏️ Subtítulo  
                    </div>
                    <div className="edit-hint button-hint" style={hintStyle(170, 50)}>
                        ✏️ Botón
                    </div>
                </>
            )}

            {/* Botón de edición de código */}
            <Tooltip label="Editar Código">
                <ActionIcon 
                    variant="light" 
                    color="blue" 
                    style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}
                    onClick={() => setCodeEditorOpened(true)}
                >
                    <IconCode size={16} />
                </ActionIcon>
            </Tooltip>
            
            {/* Editor de código Blade */}
            <BladeBlockEditor 
                block={{ id: 'hero-block', type: 'hero', name: 'Hero Section', config, styles }}
                onUpdate={(newConfig) => onUpdate(newConfig)}
                opened={codeEditorOpened}
                onClose={() => setCodeEditorOpened(false)}
            />

            <style>{`
                .block-container:hover .edit-hint {
                    opacity: 1 !important;
                }
                .edit-hint {
                    position: absolute;
                    right: 8px;
                    backgroundColor: var(--mantine-color-blue-6);
                    color: white;
                    fontSize: 10px;
                    padding: 2px 6px;
                    borderRadius: 12px;
                    opacity: 0;
                    transition: opacity 0.2s;
                    pointerEvents: none;
                    fontWeight: 500;
                    zIndex: 10;
                }
            `}</style>
        </div>
    );
}

// Helper para posicionar hints
const hintStyle = (top, right) => ({
    top: `${top}px`,
    right: `${right}px`
});
