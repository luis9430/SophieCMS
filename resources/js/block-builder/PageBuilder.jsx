import { useState, useCallback, useEffect, useRef } from 'preact/hooks';
import {
    AppShell, Text, Button, Group, Container, Flex, Box, ActionIcon, Tooltip,
    Collapse
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconDeviceFloppy, IconEye, IconRefresh, IconCode, IconPalette, 
    IconSun, IconMoon, IconPlus, IconList,
    IconVariable, IconCopy, IconChevronDown, IconChevronRight
} from '@tabler/icons-preact';

import CodeMirrorEditor from './codemirror/CodeMirrorEditor';

// ✅ IMPORTAR HOOKS DESDE ARCHIVOS SEPARADOS
import { useVariables } from './hooks/useVariables.js';
import { useApi } from './hooks/useApi.js';

// ===================================================================
// COMPONENTE VARIABLES PANEL - USANDO HOOK EXTERNO
// ===================================================================

const VariablesPanel = ({ onInsertVariable }) => {
    // ✅ USAR HOOK EXTERNO EN LUGAR DE INLINE
    const {
        showVariablesPanel,
        expandedSections,
        searchTerm,
        filteredVariables,
        variableStats,
        toggleVariablesPanel,
        hidePanel,
        toggleSection,
        updateSearchTerm,
        clearSearch,
        formatVariable
    } = useVariables();

    const handleInsertVariable = (varPath) => {
        const formatted = formatVariable(varPath);
        onInsertVariable(formatted);
    };

    if (!showVariablesPanel) {
        return (
            <ActionIcon 
                variant="light" 
                color="purple"
                onClick={toggleVariablesPanel}
                size="lg"
                style={{ position: 'fixed', left: 10, top: 100, zIndex: 1000 }}
            >
                <IconVariable size={18} />
            </ActionIcon>
        );
    }

    return (
        <Box style={{
            position: 'fixed',
            left: 10,
            top: 100,
            width: 300,
            maxHeight: 'calc(100vh - 120px)',
            overflowY: 'auto',
            backgroundColor: '#ffffff',
            border: '1px solid #e9ecef',
            borderRadius: 8,
            padding: 16,
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
            <Group justify="space-between" mb="md">
                <Group gap="xs">
                    <IconVariable size={20} color="purple" />
                    <Text fw={600}>Variables</Text>
                    <Text size="xs" c="dimmed">({variableStats.filtered})</Text>
                </Group>
                <ActionIcon 
                    variant="subtle" 
                    onClick={hidePanel}
                >
                    ✕
                </ActionIcon>
            </Group>

            {/* Buscador */}
            <input
                type="text"
                placeholder="Buscar variables..."
                value={searchTerm}
                onChange={(e) => updateSearchTerm(e.target.value)}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}
            />

            {/* Variables organizadas */}
            {Object.entries(filteredVariables).map(([sectionKey, section]) => (
                <Box key={sectionKey} mb="md">
                    <Group 
                        gap="xs" 
                        mb="xs" 
                        style={{ cursor: 'pointer' }}
                        onClick={() => toggleSection(sectionKey)}
                    >
                        {expandedSections[sectionKey] ? 
                            <IconChevronDown size={16} /> : 
                            <IconChevronRight size={16} />
                        }
                        <Text fw={500} size="sm">{section.title}</Text>
                        <Text size="xs" c="dimmed">({Object.keys(section.variables).length})</Text>
                    </Group>
                    
                    <Collapse in={expandedSections[sectionKey]}>
                        {Object.entries(section.variables).map(([varPath, value]) => (
                            <Box 
                                key={varPath}
                                p="xs"
                                mb="xs"
                                style={{
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: 4,
                                    border: '1px solid #e9ecef',
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleInsertVariable(varPath)}
                            >
                                <Text size="xs" fw={500} c="blue">
                                    {`{{ ${varPath} }}`}
                                </Text>
                                <Text size="xs" c="dimmed" truncate>
                                    {String(value)}
                                </Text>
                            </Box>
                        ))}
                    </Collapse>
                </Box>
            ))}
            
            {/* Stats */}
            {searchTerm && (
                <Box mt="md" p="xs" style={{ backgroundColor: '#e8f5e8', borderRadius: 4 }}>
                    <Text size="xs">
                        {variableStats.filtered} de {variableStats.total} variables
                        {variableStats.filtered !== variableStats.total && (
                            <Button 
                                size="xs" 
                                variant="subtle" 
                                onClick={clearSearch}
                                style={{ marginLeft: 8 }}
                            >
                                Limpiar
                            </Button>
                        )}
                    </Text>
                </Box>
            )}
        </Box>
    );
};

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export default function PageBuilder() {
    // ✅ USAR HOOKS EXTERNOS EN LUGAR DE INLINE
    const variablesHook = useVariables();
    const apiHook = useApi();
    
    // Estado local con template inicial
    const [theme, setTheme] = useState('light');
    const [code, setCode] = useState(`<div class="p-8 text-center">
    <h1 class="text-3xl font-bold mb-4">¡Hola {{ user.name }}!</h1>
    <p class="text-lg text-gray-600 mb-4">Bienvenido a {{ app.name }}</p>
    <p class="text-sm text-gray-500">Hoy es {{ current.date }} y son las {{ current.time }}</p>
    
    <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm">💡 <strong>Tip:</strong> Usa el panel de variables (icono púrpura) para insertar más variables automáticamente</p>
    </div>
</div>`);
    const [previewHTML, setPreviewHTML] = useState('');
    // Estado adicional para controlar updates
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
    
    // Estado para templates con ejemplos
    const [templates, setTemplates] = useState([
        {
            id: 1,
            name: "Landing Page Básica",
            code: `<div class="min-h-screen bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
    <div class="text-center text-white p-8">
        <h1 class="text-4xl font-bold mb-4">Hola {{ user.name }}</h1>
        <p class="text-xl mb-6">Bienvenido a {{ app.name }}</p>
        <p class="text-lg opacity-90">Tu email: {{ user.email }}</p>
        <p class="text-sm opacity-75 mt-4">Fecha: {{ current.date }}</p>
    </div>
</div>`,
            created_at: "2024-01-15T10:30:00Z"
        },
        {
            id: 2,
            name: "Card de Usuario",
            code: `<div class="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 m-8">
    <div class="text-center">
        <div class="w-20 h-20 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
            {{ user.name | first_letter }}
        </div>
        <h2 class="text-2xl font-bold text-gray-800">{{ user.name }}</h2>
        <p class="text-gray-600">{{ user.email }}</p>
        <p class="text-sm text-gray-500 mt-2">Usuario ID: {{ user.id }}</p>
        
        <div class="mt-6 pt-4 border-t border-gray-200">
            <p class="text-xs text-gray-400">Generado por {{ app.name }}</p>
            <p class="text-xs text-gray-400">{{ current.time }}</p>
        </div>
    </div>
</div>`,
            created_at: "2024-01-16T14:20:00Z"
        },
        {
            id: 3,
            name: "Dashboard Simple",
            code: `<div class="p-6 bg-gray-100 min-h-screen">
    <header class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">Dashboard de {{ user.name }}</h1>
        <p class="text-gray-600">{{ current.date }} - {{ current.time }}</p>
    </header>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold text-gray-700">Usuario</h3>
            <p class="text-2xl font-bold text-blue-600">{{ user.name }}</p>
            <p class="text-sm text-gray-500">{{ user.email }}</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold text-gray-700">Sistema</h3>
            <p class="text-2xl font-bold text-green-600">{{ app.name }}</p>
            <p class="text-sm text-gray-500">Activo</p>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold text-gray-700">Fecha</h3>
            <p class="text-2xl font-bold text-purple-600">{{ current.date }}</p>
            <p class="text-sm text-gray-500">{{ current.time }}</p>
        </div>
    </div>
</div>`,
            created_at: "2024-01-17T09:15:00Z"
        }
    ]);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [savedCode, setSavedCode] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateName, setTemplateName] = useState('');

    // Función para insertar variables
    const insertVariable = useCallback((variableText) => {
        setCode(prev => prev + variableText);
        setIsDirty(true);
        
        notifications.show({
            title: 'Variable insertada',
            message: `Se agregó: ${variableText}`,
            color: 'purple'
        });
    }, []);

    // Forzar procesamiento manual de variables
    const updatePreview = useCallback(() => {
        console.log('Procesamiento manual iniciado...');
        
        try {
            const processedHTML = variablesHook.processCode(code);
            setPreviewHTML(processedHTML);
            
            console.log('Procesamiento manual completado:', processedHTML.length, 'caracteres');
            
            notifications.show({
                title: 'Variables reprocesadas',
                message: `Preview actualizado (${processedHTML.length} caracteres)`,
                color: 'green',
                icon: <IconEye size={18} />
            });
        } catch (error) {
            console.error('Error en procesamiento manual:', error);
            notifications.show({
                title: 'Error',
                message: `Error procesando variables: ${error.message}`,
                color: 'red'
            });
        }
    }, [code, variablesHook]);

    // Cargar templates
    const loadTemplates = useCallback(async () => {
        try {
            const response = await apiHook.get('/templates');
            setTemplates(response.data || response);
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'No se pudieron cargar los templates',
                color: 'red'
            });
        }
    }, [apiHook]);

    // Guardar template
    const saveTemplate = useCallback(async () => {
        if (!code.trim()) {
            notifications.show({
                title: 'Advertencia',
                message: 'No hay código para guardar',
                color: 'yellow'
            });
            return;
        }

        if (!currentTemplate && !templateName.trim()) {
            const name = prompt('Nombre del template:');
            if (!name) return;
            setTemplateName(name);
        }

        setSaving(true);
        try {
            const data = {
                name: currentTemplate ? currentTemplate.name : templateName,
                code: code,
                type: 'html'
            };

            let response;
            if (currentTemplate) {
                response = await apiHook.put(`/templates/${currentTemplate.id}`, data);
            } else {
                response = await apiHook.post('/templates', data);
                setTemplates(prev => [response.template, ...prev]);
            }

            setCurrentTemplate(response.template);
            setSavedCode(code);
            setIsDirty(false);
            setTemplateName('');

            notifications.show({
                title: 'Éxito',
                message: 'Template guardado correctamente',
                color: 'green',
                icon: <IconDeviceFloppy size={18} />
            });

        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'No se pudo guardar el template',
                color: 'red'
            });
        } finally {
            setSaving(false);
        }
    }, [code, currentTemplate, templateName, apiHook]);

    // Función mejorada para cambios de código
    const handleCodeChange = useCallback((newCode) => {
        console.log('Código cambiado:', newCode.length, 'caracteres');
        setCode(newCode);
        setIsDirty(newCode !== savedCode);
    }, [savedCode]);

    const toggleTheme = useCallback(() => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        notifications.show({
            title: `Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`,
            message: `Editor cambiado a modo ${newTheme === 'dark' ? 'oscuro' : 'claro'}`,
            color: newTheme === 'dark' ? 'dark' : 'blue',
            icon: newTheme === 'dark' ? <IconMoon size={18} /> : <IconSun size={18} />
        });
    }, [theme]);

    const resetCode = useCallback(() => {
        if (isDirty && !confirm('Tienes cambios sin guardar. ¿Continuar?')) {
            return;
        }

        setCurrentTemplate(null);
        setCode('');
        setSavedCode('');
        setIsDirty(false);
        setPreviewHTML('');
        
        notifications.show({
            title: 'Editor reseteado',
            message: 'Se ha iniciado un nuevo template',
            color: 'orange',
            icon: <IconRefresh size={18} />
        });
    }, [isDirty]);

    // Cargar templates al iniciar (comentado porque usamos ejemplos)
    // useEffect(() => {
    //     loadTemplates();
    // }, [loadTemplates]);

    // Auto-actualizar preview cuando cambia el código
    useEffect(() => {
        // 🔧 EVITAR CONFLICTOS DURANTE CARGA DE TEMPLATES
        if (isLoadingTemplate) {
            console.log('⏸️ Auto-update pausado - cargando template');
            return;
        }
        
        // 🔧 MEJORAR AUTO-UPDATE DEL PREVIEW
        const updatePreviewContent = () => {
            if (code) {
                try {
                    console.log('🔄 Auto-update iniciado para:', code.length, 'caracteres');
                    const processedHTML = variablesHook.processCode(code);
                    setPreviewHTML(processedHTML);
                    console.log('✅ Auto-update completado:', processedHTML.length, 'caracteres');
                } catch (error) {
                    console.error('❌ Error en auto-update:', error);
                    setPreviewHTML(`<div style="padding: 20px; color: red;">Error procesando variables: ${error.message}</div>`);
                }
            } else {
                console.log('📄 Código vacío - limpiando preview');
                setPreviewHTML('');
            }
        };

        // Pequeño delay para evitar updates muy frecuentes
        const timeoutId = setTimeout(updatePreviewContent, 150);
        return () => clearTimeout(timeoutId);
    }, [code, variablesHook, isLoadingTemplate]);

    // ===================================================================
    // RENDER
    // ===================================================================

    return (
        <AppShell
            header={{ height: 70 }}
            padding={0}
            style={{ 
                height: '100vh', 
                overflow: 'hidden',
                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
            }}
        >
            <AppShell.Header style={{ backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff' }}>
                <Container size="100%" h="100%">
                    <Flex justify="space-between" align="center" h="100%" px="md">
                        <Group gap="sm">
                            <IconPalette size={28} color="#228be6" />
                            <Text size="lg" fw={700} c={theme === 'dark' ? 'white' : 'dark'}>
                                Page Builder
                            </Text>
                            
                            {/* Status indicators */}
                            {currentTemplate && (
                                <Group gap="xs">
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: isDirty ? '#f59e0b' : '#10b981'
                                    }} />
                                    <Text size="sm" c={isDirty ? 'yellow' : 'green'}>
                                        {autoSaving ? 'Auto-guardando...' : isDirty ? 'Sin guardar' : 'Guardado'}
                                    </Text>
                                </Group>
                            )}
                            
                            {apiHook.loading && (
                                <Text size="xs" c="blue">🔄 Cargando...</Text>
                            )}
                            {apiHook.hasError && (
                                <Text size="xs" c="red">❌ Error API</Text>
                            )}
                        </Group>
                        
                        <Group>
                            <Tooltip label="Gestionar templates">
                                <ActionIcon 
                                    variant="light" 
                                    color="green"
                                    onClick={() => setShowTemplates(!showTemplates)}
                                    size="lg"
                                >
                                    <IconList size={18} />
                                </ActionIcon>
                            </Tooltip>
                            
                            <Tooltip label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}>
                                <ActionIcon 
                                    variant="light" 
                                    color={theme === 'dark' ? 'yellow' : 'blue'}
                                    onClick={toggleTheme}
                                    size="lg"
                                >
                                    {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                                </ActionIcon>
                            </Tooltip>
                            
                            <Tooltip label="Resetear código">
                                <ActionIcon 
                                    variant="light" 
                                    color="orange" 
                                    onClick={resetCode}
                                    size="lg"
                                >
                                    <IconRefresh size={18} />
                                </ActionIcon>
                            </Tooltip>
                            
                            <Button 
                                leftSection={<IconEye size={18} />} 
                                size="sm" 
                                variant="light"
                                onClick={updatePreview}
                            >
                                Procesar Variables
                            </Button>
                            
                            <Button 
                                leftSection={<IconDeviceFloppy size={18} />} 
                                size="sm"
                                onClick={saveTemplate}
                                loading={saving || apiHook.loading}
                                disabled={!isDirty && !currentTemplate}
                                color={isDirty ? 'orange' : 'blue'}
                            >
                                {saving ? 'Guardando...' : isDirty ? 'Guardar cambios' : 'Guardar'}
                            </Button>
                        </Group>
                    </Flex>
                </Container>
            </AppShell.Header>

            <AppShell.Main style={{ height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
                <Flex style={{ height: '100%' }}>
                    {/* TEMPLATES SIDEBAR */}
                    {showTemplates && (
                        <Box style={{ 
                            width: '300px', 
                            borderRight: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                            backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff'
                        }}>
                            <Box p="md">
                                <Group justify="space-between" mb="md">
                                    <Text size="lg" fw={600} c={theme === 'dark' ? 'white' : 'dark'}>
                                        Templates
                                    </Text>
                                    <ActionIcon 
                                        variant="subtle" 
                                        onClick={() => setShowTemplates(false)}
                                    >
                                        ✕
                                    </ActionIcon>
                                </Group>
                                
                                {/* Botón nuevo template */}
                                <Button
                                    fullWidth
                                    variant="light"
                                    leftSection={<IconPlus size={16} />}
                                    mb="md"
                                    onClick={() => {
                                        // 🔧 PREVENIR CONFLICTOS CON AUTO-UPDATE
                                        setIsLoadingTemplate(true);
                                        
                                        // 🔧 MEJORAR "NUEVO TEMPLATE"
                                        if (isDirty && !confirm('Tienes cambios sin guardar. ¿Continuar?')) {
                                            setIsLoadingTemplate(false);
                                            return;
                                        }
                                        
                                        const newCode = `<div class="p-8 text-center">
    <h1 class="text-3xl font-bold mb-4">Nuevo Template</h1>
    <p class="text-lg text-gray-600 mb-4">Hola {{ user.name }}!</p>
    <p class="text-sm text-gray-500">Comenzando en {{ app.name }}</p>
</div>`;
                                        
                                        console.log('=== CREANDO NUEVO TEMPLATE ===');
                                        setCurrentTemplate(null);
                                        setCode(newCode);
                                        setSavedCode('');
                                        setIsDirty(true);
                                        setTemplateName('');
                                        
                                        // 🚀 FORZAR UPDATE DEL PREVIEW
                                        setTimeout(() => {
                                            try {
                                                const processedHTML = variablesHook.processCode(newCode);
                                                setPreviewHTML(processedHTML);
                                                console.log('✅ Nuevo template creado y procesado');
                                                
                                                setTimeout(() => {
                                                    setIsLoadingTemplate(false);
                                                }, 100);
                                            } catch (error) {
                                                console.error('Error creando nuevo template:', error);
                                                setIsLoadingTemplate(false);
                                            }
                                        }, 200);
                                        
                                        notifications.show({
                                            title: 'Nuevo template',
                                            message: 'Template en blanco creado',
                                            color: 'green'
                                        });
                                    }}
                                >
                                    Nuevo Template
                                </Button>
                                
                                {/* Lista de templates */}
                                <div style={{ maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' }}>
                                    {templates.length === 0 ? (
                                        <Box p="md" style={{ textAlign: 'center' }}>
                                            <Text size="sm" c="dimmed">
                                                No hay templates guardados
                                            </Text>
                                            <Text size="xs" c="dimmed" mt="xs">
                                                Crea tu primer template escribiendo código y guardándolo
                                            </Text>
                                        </Box>
                                    ) : (
                                        templates.map((template, index) => (
                                            <Box 
                                                key={template.id || index}
                                                p="sm"
                                                mb="xs"
                                                style={{
                                                    border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    backgroundColor: currentTemplate?.id === template.id ? 
                                                        (theme === 'dark' ? '#2d2d2d' : '#f8f9fa') : 'transparent',
                                                    borderColor: currentTemplate?.id === template.id ? 
                                                        '#228be6' : (theme === 'dark' ? '#404040' : '#e9ecef')
                                                }}
                                                onClick={() => {
                                                    // 🔧 PREVENIR CONFLICTOS CON AUTO-UPDATE
                                                    setIsLoadingTemplate(true);
                                                    
                                                    // 🔧 DEBUGGING MEJORADO PARA TEMPLATES
                                                    console.log('=== CARGANDO TEMPLATE ===');
                                                    console.log('Template seleccionado:', template);
                                                    console.log('Código del template:', template.code);
                                                    console.log('Longitud del código:', template.code?.length || 0);
                                                    
                                                    const templateCode = template.code || '';
                                                    
                                                    if (!templateCode) {
                                                        setIsLoadingTemplate(false);
                                                        notifications.show({
                                                            title: 'Template vacío',
                                                            message: 'Este template no tiene código',
                                                            color: 'yellow'
                                                        });
                                                        return;
                                                    }
                                                    
                                                    // 🚀 SECUENCIA CONTROLADA DE CARGA
                                                    console.log('Estableciendo template actual...');
                                                    setCurrentTemplate(template);
                                                    
                                                    console.log('Estableciendo código...', templateCode.substring(0, 100) + '...');
                                                    setCode(templateCode);
                                                    
                                                    console.log('Estableciendo savedCode...');
                                                    setSavedCode(templateCode);
                                                    
                                                    console.log('Limpiando isDirty...');
                                                    setIsDirty(false);
                                                    
                                                    // 🚀 FORZAR UPDATE DEL PREVIEW CON SECUENCIA CONTROLADA
                                                    setTimeout(() => {
                                                        console.log('Ejecutando update del preview...');
                                                        try {
                                                            const processedHTML = variablesHook.processCode(templateCode);
                                                            console.log('HTML procesado:', processedHTML.substring(0, 200) + '...');
                                                            setPreviewHTML(processedHTML);
                                                            console.log('Preview actualizado exitosamente');
                                                            
                                                            // 🔧 REACTIVAR AUTO-UPDATE
                                                            setTimeout(() => {
                                                                setIsLoadingTemplate(false);
                                                                console.log('✅ Auto-update reactivado');
                                                            }, 100);
                                                            
                                                        } catch (error) {
                                                            console.error('Error procesando template:', error);
                                                            setIsLoadingTemplate(false);
                                                        }
                                                    }, 300);
                                                    
                                                    notifications.show({
                                                        title: 'Template cargado',
                                                        message: `"${template.name}" (${templateCode.length} caracteres)`,
                                                        color: 'blue'
                                                    });
                                                    
                                                    console.log('=== FIN CARGA TEMPLATE ===');
                                                }}
                                            >
                                                <Group justify="space-between">
                                                    <div style={{ flex: 1 }}>
                                                        <Text size="sm" fw={500} c={theme === 'dark' ? 'white' : 'dark'}>
                                                            {template.name || `Template ${index + 1}`}
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            {template.created_at ? 
                                                                new Date(template.created_at).toLocaleDateString() : 
                                                                'Fecha desconocida'
                                                            }
                                                        </Text>
                                                        <Text size="xs" c="dimmed">
                                                            {template.code ? `${template.code.length} caracteres` : 'Sin código'}
                                                        </Text>
                                                    </div>
                                                    <ActionIcon 
                                                        variant="subtle" 
                                                        color="red"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm(`¿Eliminar "${template.name}"?`)) {
                                                                setTemplates(prev => prev.filter(t => t.id !== template.id));
                                                                if (currentTemplate?.id === template.id) {
                                                                    setCurrentTemplate(null);
                                                                    setCode('');
                                                                    setSavedCode('');
                                                                    setIsDirty(false);
                                                                }
                                                                notifications.show({
                                                                    title: 'Template eliminado',
                                                                    message: `"${template.name}" eliminado`,
                                                                    color: 'red'
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        🗑️
                                                    </ActionIcon>
                                                </Group>
                                            </Box>
                                        ))
                                    )}
                                </div>
                                
                                {/* Info de templates con DEBUG */}
                                <Box mt="md" p="xs" style={{ 
                                    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa', 
                                    borderRadius: 4,
                                    fontSize: '11px'
                                }}>
                                    <Text size="xs" c="dimmed">
                                        📁 {templates.length} template{templates.length !== 1 ? 's' : ''}
                                        {currentTemplate && (
                                            <><br />✏️ Editando: {currentTemplate.name}</>
                                        )}
                                        <br />📝 Código actual: {code.length} caracteres
                                        <br />🔄 Preview: {previewHTML.length} caracteres
                                        {isLoadingTemplate && (
                                            <><br />⏳ Cargando template...</>
                                        )}
                                    </Text>
                                    
                                    {/* 🔧 BOTÓN DEBUG */}
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        mt="xs"
                                        onClick={() => {
                                            console.log('=== DEBUG INFO ===');
                                            console.log('Código actual:', code);
                                            console.log('Preview HTML:', previewHTML);
                                            console.log('Template actual:', currentTemplate);
                                            console.log('Variables hook:', variablesHook);
                                            
                                            // Force reprocess
                                            const reprocessed = variablesHook.processCode(code);
                                            setPreviewHTML(reprocessed);
                                            
                                            notifications.show({
                                                title: 'Debug info',
                                                message: 'Revisa la consola del navegador',
                                                color: 'blue'
                                            });
                                        }}
                                    >
                                        🔧 Debug
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    )}
                    
                    {/* EDITOR PANEL */}
                    <Box style={{ 
                        width: showTemplates ? 'calc(50% - 150px)' : '50%',
                        borderRight: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                        backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff'
                    }}>
                        <Box p="sm" style={{ 
                            borderBottom: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`, 
                            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa' 
                        }}>
                            <Group justify="space-between">
                                <Group gap="xs">
                                    <IconCode size={16} />
                                    <Text size="sm" fw={600} c={theme === 'dark' ? 'white' : 'dark'}>
                                        {currentTemplate ? currentTemplate.name : 'Editor HTML'}
                                    </Text>
                                    {code && (
                                        <Text size="xs" c="dimmed">
                                            {variablesHook.analyzeCode(code).totalVariables} variables
                                        </Text>
                                    )}
                                </Group>
                                {!currentTemplate && (
                                    <input
                                        type="text"
                                        placeholder="Nombre del template..."
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        style={{
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            borderRadius: '4px',
                                            border: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`,
                                            backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                                            color: theme === 'dark' ? '#ffffff' : '#000000'
                                        }}
                                    />
                                )}
                            </Group>
                        </Box>
                        <Box style={{ height: 'calc(100% - 52px)', minHeight: '400px' }}>
                            <CodeMirrorEditor 
                                code={code}
                                onCodeChange={handleCodeChange}
                                language="html"
                                theme={theme}
                            />
                        </Box>
                    </Box>

                    {/* PREVIEW PANEL */}
                    <Box style={{ 
                        width: showTemplates ? 'calc(50% - 150px)' : '50%',
                        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
                    }}>
                        <Box p="sm" style={{ 
                            borderBottom: `1px solid ${theme === 'dark' ? '#404040' : '#e9ecef'}`, 
                            backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa' 
                        }}>
                            <Group justify="space-between">
                                <Group gap="xs">
                                    <IconEye size={16} />
                                    <Text size="sm" fw={600} c={theme === 'dark' ? 'white' : 'dark'}>
                                        Vista Previa
                                    </Text>
                                </Group>
                                <Text size="xs" c="dimmed">
                                    Se actualiza automáticamente al escribir
                                </Text>
                            </Group>
                        </Box>
                        <Box style={{ height: 'calc(100% - 52px)', overflow: 'auto' }}>
                            {!previewHTML ? (
                                <Box 
                                    style={{ 
                                        height: '100%', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8f9fa',
                                        flexDirection: 'column'
                                    }}
                                >
                                    <Text c="dimmed" size="lg" mb="md">📄 Preview vacío</Text>
                                    <Text c="dimmed" size="sm">Escribe código en el editor o carga un template</Text>
                                </Box>
                            ) : (
                                <iframe
                                    srcDoc={previewHTML}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        backgroundColor: 'white'
                                    }}
                                    title="Preview"
                                />
                            )}
                        </Box>
                    </Box>
                </Flex>
                
                {/* Panel de variables */}
                <VariablesPanel onInsertVariable={insertVariable} />
                
            </AppShell.Main>
        </AppShell>
    );
}