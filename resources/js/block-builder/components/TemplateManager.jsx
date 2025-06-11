// resources/js/block-builder/components/TemplateManager.jsx

import { useState, useEffect } from 'preact/hooks';

// Este es un componente de UI. Su única tarea es mostrar los botones
// y notificar al componente padre cuando se hace clic en ellos.
const TemplateManager = ({ onSave, onLoad, onDelete }) => {
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');

    // En el futuro, aquí usaremos window.templateEngine.list() para obtener las plantillas
    useEffect(() => {
        // Simulamos la carga de plantillas
        setTemplates(['hero-section', 'contact-form', 'testimonial-card']);
    }, []);

    const handleLoadChange = (e) => {
        const value = e.target.value;
        setSelectedTemplate(value);
        if (value) {
            onLoad(value);
        }
    };
    
    const handleDeleteClick = () => {
        if (selectedTemplate && confirm(`¿Estás seguro de que quieres eliminar la plantilla "${selectedTemplate}"?`)) {
            onDelete(selectedTemplate);
        } else if (!selectedTemplate) {
            alert('Por favor, selecciona una plantilla para eliminar.');
        }
    };

    return (
        <div style={{ padding: '12px 1rem', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '1rem', alignItems: 'center', background: '#f9fafb' }}>
            <strong>Plantillas:</strong>
            <select 
                value={selectedTemplate} 
                onChange={handleLoadChange} 
                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
                <option value="">Cargar plantilla...</option>
                {templates.map(name => (
                    <option key={name} value={name}>{name}</option>
                ))}
            </select>
            <button onClick={onSave} style={{ padding: '8px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Guardar
            </button>
            <button onClick={handleDeleteClick} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Eliminar
            </button>
        </div>
    );
};

export default TemplateManager;