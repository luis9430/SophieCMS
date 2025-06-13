// ===================================================================
// resources/js/block-builder/components/TemplateManager.jsx
// VERSIÓN MEJORADA - Interfaz Moderna + Bug Fix
// ===================================================================

import { useState, useEffect } from 'preact/hooks';
import templatesApi from '../services/templatesApi.js';

const TemplateManager = ({ 
    onSave, 
    onLoad, 
    onDelete, 
    currentContent = '', 
    currentType = 'html' 
}) => {
    
    // ===================================================================
    // ESTADO DEL COMPONENTE
    // ===================================================================
    
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [selectedTemplateData, setSelectedTemplateData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveMode, setSaveMode] = useState('create');
    const [newTemplateName, setNewTemplateName] = useState('');

    // ===================================================================
    // EFECTOS - CARGA INICIAL
    // ===================================================================

    useEffect(() => {
        loadTemplates();
    }, []);

    useEffect(() => {
        if (searchQuery) {
            searchTemplates();
        } else {
            loadTemplates();
        }
    }, [searchQuery]);

    // ===================================================================
    // FUNCIONES DE API
    // ===================================================================

    const loadTemplates = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Llamada directa al endpoint usando fetch
            const response = await fetch('/api/templates', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            const templatesList = result.data || result.templates || result;
            setTemplates(Array.isArray(templatesList) ? templatesList : []);
        } catch (err) {
            console.error('❌ Error loading templates:', err);
            setError('Error al cargar plantillas: ' + err.message);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const searchTemplates = async () => {
        if (!searchQuery.trim()) {
            loadTemplates();
            return;
        }

        setLoading(true);
        try {
            // Llamada directa al endpoint con parámetros de búsqueda
            const params = new URLSearchParams({ search: searchQuery });
            if (currentType && currentType !== 'html') {
                params.append('type', currentType);
            }

            const response = await fetch(`/api/templates?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            const templatesList = result.data || result.templates || result;
            setTemplates(Array.isArray(templatesList) ? templatesList : []);
        } catch (err) {
            console.error('❌ Error searching templates:', err);
            setError('Error en la búsqueda: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // ===================================================================
    // MANEJADORES DE EVENTOS
    // ===================================================================

    const handleLoadChange = async (e) => {
        const templateId = e.target.value;
        setSelectedTemplate(templateId);
        
        if (templateId) {
            setLoading(true);
            try {
                // Llamada directa al endpoint usando fetch
                const response = await fetch(`/api/templates/${templateId}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    credentials: 'same-origin'
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                const template = data.data || data.template || data;
                
                setSelectedTemplateData(template);
                console.log('🔍 Template completo obtenido:', template);
                console.log('🔍 Content field:', template.content);
                
                if (template && onLoad) {
                    onLoad(template);
                }
            } catch (error) {
                console.error('❌ Error obteniendo template completo:', error);
                setError('Error al cargar template: ' + error.message);
            } finally {
                setLoading(false);
            }
        } else {
            setSelectedTemplateData(null);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleClearSelection = () => {
        setSelectedTemplate('');
        setSelectedTemplateData(null);
        setError(null);
        
        if (onLoad) {
            onLoad({ content: '' });
        }
    };

    // ===================================================================
    // FUNCIONES DE GUARDADO
    // ===================================================================

    const handleCreateNew = () => {
        setSaveMode('create');
        setShowSaveDialog(true);
        setNewTemplateName('');
        setError(null);
    };

    const handleUpdateExisting = async () => {
        if (!selectedTemplateData) return;

        setSaving(true);
        setError(null);

        try {
            const templateData = {
                name: selectedTemplateData.name,
                content: currentContent,
                type: selectedTemplateData.type,
                description: selectedTemplateData.description,
                category: selectedTemplateData.category
            };

            // Llamada directa al endpoint usando fetch
            const response = await fetch(`/api/templates/${selectedTemplateData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'same-origin',
                body: JSON.stringify(templateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const result = await response.json();
            
            await loadTemplates();

            if (onSave) {
                onSave(result.template || result.data || result);
            }

            console.log('✅ Template actualizado:', selectedTemplateData.name);
            return true;

        } catch (err) {
            console.error('❌ Error updating template:', err);
            setError('Error al actualizar: ' + err.message);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAs = () => {
        setSaveMode('save_as');
        setShowSaveDialog(true);
        setNewTemplateName(selectedTemplateData ? `${selectedTemplateData.name} (Copia)` : '');
        setError(null);
    };

    const saveTemplate = async (name) => {
        if (!name.trim()) {
            setError('El nombre de la plantilla es requerido');
            return false;
        }

        if (!currentContent.trim()) {
            setError('No hay contenido para guardar');
            return false;
        }

        setSaving(true);
        setError(null);

        try {
            const templateData = {
                name: name.trim(),
                content: currentContent, // Cambié de 'code' a 'content'
                type: currentType
            };

            // Validación básica
            if (name.length > 255) {
                setError('El nombre no puede exceder 255 caracteres');
                return false;
            }

            // Llamada directa al endpoint usando fetch
            const response = await fetch('/api/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'same-origin',
                body: JSON.stringify(templateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const result = await response.json();
            
            // Actualizar lista local
            await loadTemplates();

            if (onSave) {
                onSave(result.template || result.data || result);
            }

            return true;

        } catch (err) {
            console.error('❌ Error saving template:', err);
            setError('Error al guardar: ' + err.message);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleSaveConfirm = async (e) => {
        e.preventDefault();
        
        if (saveMode === 'create' || saveMode === 'save_as') {
            const success = await saveTemplate(newTemplateName);
            if (success) {
                setShowSaveDialog(false);
                setNewTemplateName('');
            }
        }
    };

    const handleDeleteClick = async () => {
        if (!selectedTemplate) {
            setError('Selecciona una plantilla para eliminar');
            return;
        }

        const template = templates.find(t => t.id.toString() === selectedTemplate);
        const templateName = template?.name || 'esta plantilla';
        
        if (confirm(`¿Estás seguro de que quieres eliminar "${templateName}"?`)) {
            const success = await deleteTemplate(selectedTemplate);
            if (success) {
                setSelectedTemplate('');
                setSelectedTemplateData(null);
            }
        }
    };

    const deleteTemplate = async (templateId) => {
        if (!templateId) return false;

        setLoading(true);
        setError(null);

        try {
            // Llamada directa al endpoint usando fetch
            const response = await fetch(`/api/templates/${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            // Actualizar lista local
            setTemplates(prev => prev.filter(t => t.id.toString() !== templateId.toString()));
            
            // Limpiar selección si era la plantilla seleccionada
            if (selectedTemplate === templateId.toString()) {
                setSelectedTemplate('');
            }

            if (onDelete) {
                onDelete(templateId);
            }

            return true;

        } catch (err) {
            console.error('❌ Error deleting template:', err);
            setError('Error al eliminar: ' + err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const clearError = () => {
        setError(null);
    };

    // ===================================================================
    // ESTADO DE LA INTERFAZ
    // ===================================================================

    const isEditMode = selectedTemplateData !== null;
    const canUpdate = isEditMode && currentContent.trim() !== '';
    const canCreate = currentContent.trim() !== '';

    // ===================================================================
    // RENDER - INTERFAZ MODERNA
    // ===================================================================

    return (
        <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            marginBottom: '16px'
        }}>
            {/* Error Message */}
            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#dc2626',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>{error}</span>
                    <button 
                        onClick={clearError}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#dc2626', 
                            cursor: 'pointer',
                            fontSize: '18px',
                            lineHeight: 1,
                            padding: '4px'
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Header */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '20px'
            }}>
                <div>
                    <h2 style={{ 
                        margin: 0, 
                        color: 'white', 
                        fontSize: '24px', 
                        fontWeight: '700',
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                        📄 Plantillas
                    </h2>
                    <p style={{ 
                        margin: '4px 0 0 0', 
                        color: 'rgba(255,255,255,0.8)', 
                        fontSize: '14px' 
                    }}>
                        {loading ? 'Cargando...' : `${templates.length} plantilla${templates.length !== 1 ? 's' : ''} disponible${templates.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                
                {isEditMode && (
                    <div style={{ 
                        background: 'rgba(255,255,255,0.2)', 
                        backdropFilter: 'blur(10px)',
                        color: 'white', 
                        padding: '8px 16px', 
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                        ✏️ Editando: {selectedTemplateData.name}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 2fr auto', 
                gap: '16px', 
                alignItems: 'center',
                marginBottom: '16px'
            }}>
                {/* Search Input */}
                <input
                    type="text"
                    placeholder="🔍 Buscar plantillas..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: 'white',
                        '::placeholder': { color: 'rgba(255,255,255,0.6)' }
                    }}
                />

                {/* Template Selector */}
                <select 
                    value={selectedTemplate} 
                    onChange={handleLoadChange}
                    disabled={loading}
                    style={{ 
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <option value="" style={{ background: '#1f2937', color: 'white' }}>
                        {loading ? '⏳ Cargando...' : '📋 Seleccionar plantilla...'}
                    </option>
                    {templates.map(template => (
                        <option key={template.id} value={template.id} style={{ background: '#1f2937', color: 'white' }}>
                            {template.name} ({template.type})
                            {template.updated_at && ` - ${new Date(template.updated_at).toLocaleDateString()}`}
                        </option>
                    ))}
                </select>

                {/* Refresh Button */}
                <button 
                    onClick={loadTemplates}
                    disabled={loading}
                    style={{ 
                        background: 'rgba(255,255,255,0.2)', 
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (!loading) {
                            e.target.style.background = 'rgba(255,255,255,0.3)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.2)';
                    }}
                >
                    {loading ? '⟳' : '🔄'}
                </button>
            </div>

            {/* Action Buttons */}
            <div style={{ 
                display: 'flex', 
                gap: '12px', 
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                {isEditMode ? (
                    // Modo Edición
                    <>
                        <button 
                            onClick={handleUpdateExisting}
                            disabled={saving || !canUpdate}
                            style={{ 
                                background: (saving || !canUpdate) ? 'rgba(156, 163, 175, 0.5)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '12px', 
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: (saving || !canUpdate) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {saving ? '⏳ Actualizando...' : '✅ Actualizar'}
                        </button>

                        <button 
                            onClick={handleSaveAs}
                            disabled={saving || !currentContent.trim()}
                            style={{ 
                                background: (saving || !currentContent.trim()) ? 'rgba(156, 163, 175, 0.5)' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '12px', 
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: (saving || !currentContent.trim()) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            📄 Guardar Como
                        </button>

                        <button 
                            onClick={handleDeleteClick}
                            disabled={loading || saving}
                            style={{ 
                                background: (loading || saving) ? 'rgba(156, 163, 175, 0.5)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '12px', 
                                padding: '12px 24px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: (loading || saving) ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            🗑️ Eliminar
                        </button>

                        <button 
                            onClick={handleClearSelection}
                            disabled={loading || saving}
                            style={{ 
                                background: 'rgba(255,255,255,0.2)', 
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '12px',
                                padding: '12px 24px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: (loading || saving) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            🧹 Limpiar
                        </button>
                    </>
                ) : (
                    // Modo Creación
                    <button 
                        onClick={handleCreateNew}
                        disabled={saving || !canCreate}
                        style={{ 
                            background: (saving || !canCreate) ? 'rgba(156, 163, 175, 0.5)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '12px', 
                            padding: '16px 32px',
                            fontSize: '16px',
                            fontWeight: '700',
                            cursor: (saving || !canCreate) ? 'not-allowed' : 'pointer',
                            boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {saving ? '⏳ Guardando...' : '✨ Crear Nueva Plantilla'}
                    </button>
                )}
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        padding: '32px',
                        borderRadius: '20px',
                        minWidth: '400px',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        <h3 style={{ 
                            margin: '0 0 24px 0', 
                            color: 'white',
                            fontSize: '24px',
                            fontWeight: '700',
                            textAlign: 'center'
                        }}>
                            {saveMode === 'create' && '✨ Crear Nueva Plantilla'}
                            {saveMode === 'save_as' && '📄 Guardar Como Nueva Plantilla'}
                        </h3>
                        
                        <form onSubmit={handleSaveConfirm}>
                            <input
                                type="text"
                                placeholder="Nombre de la plantilla"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '24px',
                                    fontSize: '16px',
                                    color: 'white',
                                    boxSizing: 'border-box'
                                }}
                                autoFocus
                            />
                            
                            <div style={{ 
                                display: 'flex', 
                                gap: '16px', 
                                justifyContent: 'center' 
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowSaveDialog(false)}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        borderRadius: '12px',
                                        padding: '12px 24px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !newTemplateName.trim()}
                                    style={{
                                        background: (saving || !newTemplateName.trim()) ? 'rgba(156, 163, 175, 0.5)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        border: 'none',
                                        borderRadius: '12px',
                                        padding: '12px 24px',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: (saving || !newTemplateName.trim()) ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {saving ? '⏳ Guardando...' : '✅ Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TemplateManager;