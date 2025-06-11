// ===================================================================
// components/EditorVisualInterface.jsx
// Interfaz visual para autocompletado, validación y ayuda
// ===================================================================

import { useState, useEffect, useRef } from 'preact/hooks';

/**
 * Panel de autocompletado visual mejorado
 */
const AutocompletionPanel = ({ 
    suggestions = [], 
    visible = false, 
    position = { x: 0, y: 0 },
    onSelect,
    onClose,
    theme = 'light'
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filter, setFilter] = useState('');
    const panelRef = useRef(null);

    // Filtrar sugerencias
    const filteredSuggestions = suggestions.filter(suggestion =>
        !filter || suggestion.label.toLowerCase().includes(filter.toLowerCase())
    );

    // Agrupar por categorías
    const groupedSuggestions = filteredSuggestions.reduce((groups, suggestion) => {
        const category = suggestion.section || suggestion.info || 'General';
        if (!groups[category]) groups[category] = [];
        groups[category].push(suggestion);
        return groups;
    }, {});

    // Manejar navegación por teclado
    useEffect(() => {
        if (!visible) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev => 
                        prev < filteredSuggestions.length - 1 ? prev + 1 : 0
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => 
                        prev > 0 ? prev - 1 : filteredSuggestions.length - 1
                    );
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredSuggestions[selectedIndex]) {
                        onSelect(filteredSuggestions[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onClose();
                    break;
                default:
                    // Filtrar por lo que se está escribiendo
                    if (e.key.length === 1) {
                        setFilter(prev => prev + e.key);
                    } else if (e.key === 'Backspace') {
                        setFilter(prev => prev.slice(0, -1));
                    }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [visible, filteredSuggestions, selectedIndex, onSelect, onClose]);

    if (!visible || suggestions.length === 0) return null;

    return (
        <div
            ref={panelRef}
            className={`autocompletion-panel ${theme}`}
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 1000,
                maxHeight: '400px',
                width: '400px',
                overflowY: 'auto',
                backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                borderRadius: '8px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                fontFamily: 'system-ui, sans-serif'
            }}
        >
            {/* Header con estadísticas */}
            <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ 
                    fontWeight: 'bold', 
                    fontSize: '14px',
                    color: theme === 'dark' ? '#f3f4f6' : '#111827'
                }}>
                    💡 {filteredSuggestions.length} sugerencias
                </span>
                <span style={{ 
                    fontSize: '12px', 
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                }}>
                    ↕️ navegar • ⏎ seleccionar • ⎋ cerrar
                </span>
            </div>

            {/* Filtro de búsqueda visual */}
            {filter && (
                <div style={{
                    padding: '8px 16px',
                    backgroundColor: theme === 'dark' ? '#065f46' : '#d1fae5',
                    fontSize: '12px',
                    color: theme === 'dark' ? '#10b981' : '#065f46'
                }}>
                    🔍 Filtrando por: "{filter}"
                </div>
            )}

            {/* Lista de sugerencias agrupadas */}
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {Object.entries(groupedSuggestions).map(([category, items]) => (
                    <div key={category}>
                        {/* Header de categoría */}
                        <div style={{
                            padding: '8px 16px',
                            backgroundColor: theme === 'dark' ? '#4b5563' : '#f3f4f6',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: theme === 'dark' ? '#d1d5db' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            borderTop: `1px solid ${theme === 'dark' ? '#6b7280' : '#e5e7eb'}`
                        }}>
                            <span>{getCategoryIcon(category)}</span>
                            <span>{category}</span>
                            <div style={{
                                flex: 1,
                                height: '1px',
                                backgroundColor: theme === 'dark' ? '#6b7280' : '#d1d5db'
                            }} />
                            <span style={{ 
                                fontSize: '10px',
                                backgroundColor: theme === 'dark' ? '#6b7280' : '#d1d5db',
                                color: theme === 'dark' ? '#f3f4f6' : '#374151',
                                padding: '2px 6px',
                                borderRadius: '10px'
                            }}>
                                {items.length}
                            </span>
                        </div>

                        {/* Items de la categoría */}
                        {items.map((suggestion, index) => {
                            const globalIndex = filteredSuggestions.indexOf(suggestion);
                            const isSelected = globalIndex === selectedIndex;
                            
                            return (
                                <div
                                    key={`${category}-${index}`}
                                    onClick={() => onSelect(suggestion)}
                                    style={{
                                        padding: '10px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        backgroundColor: isSelected 
                                            ? (theme === 'dark' ? '#10b981' : '#059669')
                                            : 'transparent',
                                        color: isSelected 
                                            ? 'white' 
                                            : (theme === 'dark' ? '#f3f4f6' : '#111827'),
                                        borderLeft: isSelected ? '4px solid #fff' : '4px solid transparent',
                                        transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                                >
                                    {/* Icono */}
                                    <span style={{ 
                                        fontSize: '18px', 
                                        minWidth: '24px',
                                        textAlign: 'center'
                                    }}>
                                        {getCompletionIcon(suggestion.type)}
                                    </span>

                                    {/* Contenido principal */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ 
                                            fontWeight: '600',
                                            fontSize: '14px'
                                        }}>
                                            {highlightMatch(suggestion.label, filter)}
                                        </div>
                                        {suggestion.detail && (
                                            <div style={{ 
                                                fontSize: '12px',
                                                opacity: 0.8,
                                                marginTop: '2px'
                                            }}>
                                                {suggestion.detail}
                                            </div>
                                        )}
                                    </div>

                                    {/* Boost indicator */}
                                    {suggestion.boost > 90 && (
                                        <div style={{
                                            fontSize: '12px',
                                            backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#f59e0b',
                                            color: isSelected ? 'white' : '#ffffff',
                                            padding: '2px 6px',
                                            borderRadius: '10px',
                                            fontWeight: 'bold'
                                        }}>
                                            ⭐
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Panel de validación visual
 */
const ValidationPanel = ({ 
    errors = [], 
    warnings = [], 
    visible = false,
    onErrorClick,
    theme = 'light'
}) => {
    const [expandedSections, setExpandedSections] = useState({
        errors: true,
        warnings: true
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    if (!visible || (errors.length === 0 && warnings.length === 0)) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            maxHeight: '300px',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            fontFamily: 'system-ui, sans-serif',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                backgroundColor: errors.length > 0 
                    ? (theme === 'dark' ? '#7f1d1d' : '#fef2f2')
                    : (theme === 'dark' ? '#78350f' : '#fffbeb'),
                borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ fontSize: '16px' }}>
                    {errors.length > 0 ? '🚨' : '⚠️'}
                </span>
                <span style={{ 
                    fontWeight: 'bold',
                    color: errors.length > 0 
                        ? (theme === 'dark' ? '#fca5a5' : '#dc2626')
                        : (theme === 'dark' ? '#fbbf24' : '#d97706')
                }}>
                    {errors.length > 0 ? 'Errores' : 'Advertencias'} en el código
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ 
                    fontSize: '12px',
                    color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                }}>
                    {errors.length + warnings.length} total
                </span>
            </div>

            {/* Content */}
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                {/* Errores */}
                {errors.length > 0 && (
                    <div>
                        <button
                            onClick={() => toggleSection('errors')}
                            style={{
                                width: '100%',
                                padding: '8px 16px',
                                backgroundColor: theme === 'dark' ? '#7f1d1d' : '#fef2f2',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                color: theme === 'dark' ? '#fca5a5' : '#dc2626'
                            }}
                        >
                            <span>{expandedSections.errors ? '▼' : '▶'}</span>
                            <span style={{ fontWeight: 'bold' }}>
                                ❌ Errores ({errors.length})
                            </span>
                        </button>
                        
                        {expandedSections.errors && errors.map((error, index) => (
                            <div
                                key={`error-${index}`}
                                onClick={() => onErrorClick && onErrorClick(error)}
                                style={{
                                    padding: '8px 16px',
                                    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#f3f4f6'}`,
                                    cursor: onErrorClick ? 'pointer' : 'default',
                                    backgroundColor: onErrorClick && 'hover' ? 
                                        (theme === 'dark' ? '#374151' : '#f9fafb') : 'transparent'
                                }}
                            >
                                <div style={{ 
                                    fontSize: '14px',
                                    color: theme === 'dark' ? '#f3f4f6' : '#111827',
                                    marginBottom: '4px'
                                }}>
                                    {error.message}
                                </div>
                                {error.position !== undefined && (
                                    <div style={{ 
                                        fontSize: '12px',
                                        color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                                    }}>
                                        Posición: {error.position}
                                    </div>
                                )}
                                {error.suggestion && (
                                    <div style={{ 
                                        fontSize: '12px',
                                        color: theme === 'dark' ? '#60a5fa' : '#2563eb',
                                        marginTop: '4px',
                                        fontStyle: 'italic'
                                    }}>
                                        💡 {error.suggestion}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Advertencias */}
                {warnings.length > 0 && (
                    <div>
                        <button
                            onClick={() => toggleSection('warnings')}
                            style={{
                                width: '100%',
                                padding: '8px 16px',
                                backgroundColor: theme === 'dark' ? '#78350f' : '#fffbeb',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                color: theme === 'dark' ? '#fbbf24' : '#d97706'
                            }}
                        >
                            <span>{expandedSections.warnings ? '▼' : '▶'}</span>
                            <span style={{ fontWeight: 'bold' }}>
                                ⚠️ Advertencias ({warnings.length})
                            </span>
                        </button>
                        
                        {expandedSections.warnings && warnings.map((warning, index) => (
                            <div
                                key={`warning-${index}`}
                                onClick={() => onErrorClick && onErrorClick(warning)}
                                style={{
                                    padding: '8px 16px',
                                    borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#f3f4f6'}`,
                                    cursor: onErrorClick ? 'pointer' : 'default'
                                }}
                            >
                                <div style={{ 
                                    fontSize: '14px',
                                    color: theme === 'dark' ? '#f3f4f6' : '#111827',
                                    marginBottom: '4px'
                                }}>
                                    {warning.message}
                                </div>
                                {warning.position !== undefined && (
                                    <div style={{ 
                                        fontSize: '12px',
                                        color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                                    }}>
                                        Posición: {warning.position}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Panel de ayuda contextual
 */
const ContextualHelpPanel = ({ 
    visible = false, 
    content = null,
    position = { x: 0, y: 0 },
    onClose,
    theme = 'light'
}) => {
    if (!visible || !content) return null;

    return (
        <div style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: '300px',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            fontFamily: 'system-ui, sans-serif'
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                backgroundColor: theme === 'dark' ? '#374151' : '#f9fafb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ 
                    fontWeight: 'bold',
                    color: theme === 'dark' ? '#f3f4f6' : '#111827'
                }}>
                    📖 {content.title || 'Ayuda'}
                </span>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                    }}
                >
                    ×
                </button>
            </div>

            {/* Content */}
            <div style={{ padding: '16px' }}>
                {content.description && (
                    <p style={{ 
                        margin: '0 0 12px 0',
                        color: theme === 'dark' ? '#f3f4f6' : '#111827',
                        lineHeight: '1.5'
                    }}>
                        {content.description}
                    </p>
                )}

                {content.example && (
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ 
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
                            marginBottom: '4px'
                        }}>
                            EJEMPLO:
                        </div>
                        <code style={{
                            display: 'block',
                            padding: '8px',
                            backgroundColor: theme === 'dark' ? '#111827' : '#f3f4f6',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            color: theme === 'dark' ? '#10b981' : '#059669'
                        }}>
                            {content.example}
                        </code>
                    </div>
                )}

                {content.docs && (
                    <a
                        href={content.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            backgroundColor: theme === 'dark' ? '#10b981' : '#059669',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                    >
                        📚 Ver documentación
                    </a>
                )}
            </div>
        </div>
    );
};

/**
 * Componente principal que agrupa toda la interfaz visual
 */
const EditorVisualInterface = ({ 
    autocompletion = {},
    validation = {},
    help = {},
    theme = 'light'
}) => {
    return (
        <>
            <AutocompletionPanel 
                {...autocompletion}
                theme={theme}
            />
            <ValidationPanel 
                {...validation}
                theme={theme}
            />
            <ContextualHelpPanel 
                {...help}
                theme={theme}
            />
        </>
    );
};

// ===================================================================
// FUNCIONES AUXILIARES
// ===================================================================

const getCompletionIcon = (type) => {
    const icons = {
        'variable': '🎯',
        'alpine-directive': '⚡',
        'alpine-magic': '🪄',
        'alpine-event': '🖱️',
        'plugin': '🔌',
        'class': '🎨',
        'html-tag': '🏷️',
        'snippet': '📋',
        'template': '📄',
        'function': '🔧',
        'property': '🎯',
        'recent': '🕒',
        'favorite': '⭐'
    };
    return icons[type] || '💡';
};

const getCategoryIcon = (category) => {
    const icons = {
        'Variables': '🎯',
        'Alpine.js': '⚡',
        'HTML': '🏷️',
        'CSS': '🎨',
        'JavaScript': '⚙️',
        'Plugins': '🔌',
        'Snippets': '📋',
        'Templates': '📄',
        'Recent': '🕒'
    };
    return icons[category] || '📁';
};

const highlightMatch = (text, filter) => {
    if (!filter) return text;
    
    const index = text.toLowerCase().indexOf(filter.toLowerCase());
    if (index === -1) return text;
    
    return (
        <>
            {text.slice(0, index)}
            <mark style={{ 
                backgroundColor: '#fbbf24', 
                color: '#000',
                fontWeight: 'bold',
                padding: '0 2px',
                borderRadius: '2px'
            }}>
                {text.slice(index, index + filter.length)}
            </mark>
            {text.slice(index + filter.length)}
        </>
    );
};

export default EditorVisualInterface;
export { 
    AutocompletionPanel, 
    ValidationPanel, 
    ContextualHelpPanel 
};