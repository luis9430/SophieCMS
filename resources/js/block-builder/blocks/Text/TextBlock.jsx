import { useState, useRef, useEffect } from 'preact/hooks';
import { Text, Textarea } from '@mantine/core';

export default function TextBlock({ config, styles, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempContent, setTempContent] = useState(config.content || '');
    const textareaRef = useRef(null);

    // Enfocar el textarea cuando entra en modo edición
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            // Seleccionar todo el texto para facilitar la edición
            textareaRef.current.select();
        }
    }, [isEditing]);

    // Función para entrar en modo edición
    const startEditing = (e) => {
        e.stopPropagation(); // Evitar que se active el drag
        setTempContent(config.content || '');
        setIsEditing(true);
    };

    // Función para guardar cambios
    const saveChanges = () => {
        if (onUpdate && tempContent !== config.content) {
            onUpdate({ ...config, content: tempContent });
        }
        setIsEditing(false);
    };

    // Función para cancelar edición
    const cancelEditing = () => {
        setTempContent(config.content || '');
        setIsEditing(false);
    };

    // Manejar teclas
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            // Ctrl + Enter = guardar
            e.preventDefault();
            saveChanges();
        } else if (e.key === 'Escape') {
            // Escape = cancelar
            e.preventDefault();
            cancelEditing();
        }
    };

    // Manejar blur (cuando pierde el foco)
    const handleBlur = () => {
        saveChanges();
    };

    return (
        <div style={{ position: 'relative' }}>
            {isEditing ? (
                <Textarea
                    ref={textareaRef}
                    value={tempContent}
                    onChange={(e) => setTempContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    placeholder="Escribe tu contenido aquí..."
                    autosize
                    minRows={2}
                    maxRows={10}
                    style={{
                        border: '2px solid var(--mantine-color-blue-4)',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9ff'
                    }}
                />
            ) : (
                <Text
                    onDoubleClick={startEditing}
                    style={{
                        lineHeight: 1.6,
                        textAlign: styles?.textAlign || 'left',
                        cursor: 'text',
                        minHeight: '1.5em',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s',
                        position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    {config.content || 'Doble clic para editar texto...'}
                </Text>
            )}
            
            {/* Indicador de edición inline */}
            {!isEditing && (
                <div
                    style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        backgroundColor: 'var(--mantine-color-blue-6)',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '12px',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        pointerEvents: 'none',
                        fontWeight: 500
                    }}
                    className="edit-hint"
                >
                    ✏️ Doble clic
                </div>
            )}

            <style>{`
                .block-container:hover .edit-hint {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
}