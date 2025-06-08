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
import { useAlpinePreview } from './hooks/useAlpinePreview.js';

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
    const alpineHook = useAlpinePreview();

    // ✅ PRIMERO: DECLARAR TODO EL ESTADO
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
    const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
    
    // Estado para templates con ejemplos (incluyendo Alpine.js)
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
        },
        {
            id: 4,
            name: "🚀 Contador Alpine.js",
            code: `<div class="p-8 bg-gradient-to-r from-blue-500 to-purple-600 min-h-screen flex items-center justify-center" x-data="{ count: 0, name: '{{ user.name }}' }">
    <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">
            ¡Hola <span x-text="name" class="text-blue-600"></span>!
        </h1>
        
        <div class="text-center mb-6">
            <p class="text-lg text-gray-600 mb-4">Has clickeado:</p>
            <div class="text-6xl font-bold text-blue-600 mb-4" x-text="count"></div>
            <p class="text-sm text-gray-500">veces</p>
        </div>
        
        <div class="flex gap-4 justify-center">
            <button 
                @click="count++" 
                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
                + Incrementar
            </button>
            <button 
                @click="count = 0" 
                class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
                🔄 Reset
            </button>
        </div>
        
        <div class="mt-6 text-center">
            <p class="text-xs text-gray-400">{{ current.date }} - {{ current.time }}</p>
            <p class="text-xs text-gray-400">Generado por {{ app.name }}</p>
        </div>
    </div>
</div>`,
            created_at: "2024-01-18T11:30:00Z"
        },
        {
            id: 5,
            name: "🎯 Modal Alpine.js",
            code: `<div class="p-8 bg-gray-100 min-h-screen" x-data="{ modalOpen: false, user: '{{ user.name }}', app: '{{ app.name }}' }">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold text-gray-800 mb-8">Dashboard Alpine.js</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Usuario</h3>
                <p class="text-2xl font-bold text-blue-600" x-text="user"></p>
                <p class="text-sm text-gray-500">{{ user.email }}</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Sistema</h3>
                <p class="text-2xl font-bold text-green-600" x-text="app"></p>
                <p class="text-sm text-gray-500">🟢 Activo</p>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-lg transform hover:scale-105 transition-transform">
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Fecha</h3>
                <p class="text-xl font-bold text-purple-600">{{ current.date }}</p>
                <p class="text-sm text-gray-500">{{ current.time }}</p>
            </div>
        </div>
        
        <button 
            @click="modalOpen = true"
            class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transform hover:scale-105 transition-all"
        >
            🎯 Abrir Modal
        </button>
    </div>
    
    <!-- Modal con animaciones Alpine -->
    <div x-show="modalOpen" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0" x-transition:enter-end="opacity-100" x-transition:leave="transition ease-in duration-200" x-transition:leave-start="opacity-100" x-transition:leave-end="opacity-0" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div x-show="modalOpen" x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 transform scale-90" x-transition:enter-end="opacity-100 transform scale-100" x-transition:leave="transition ease-in duration-200" x-transition:leave-start="opacity-100 transform scale-100" x-transition:leave-end="opacity-0 transform scale-90" class="bg-white p-8 rounded-lg max-w-md w-full mx-4 shadow-2xl" @click.away="modalOpen = false">
            <h2 class="text-2xl font-bold mb-4 text-gray-800">¡Hola desde el Modal!</h2>
            <p class="text-gray-600 mb-4">Esta es una demostración de Alpine.js funcionando con variables procesadas.</p>
            <div class="bg-blue-50 p-4 rounded-lg mb-6">
                <p class="text-sm font-semibold text-blue-800">👤 Usuario: <span x-text="user" class="font-normal"></span></p>
                <p class="text-sm font-semibold text-blue-800">🚀 App: <span x-text="app" class="font-normal"></span></p>
                <p class="text-sm font-semibold text-blue-800">📅 Fecha: {{ current.date }}</p>
            </div>
            <div class="flex gap-3 justify-end">
                <button 
                    @click="modalOpen = false"
                    class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                >
                    Cerrar
                </button>
                <button 
                    @click="modalOpen = false"
                    class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                >
                    ✅ Entendido
                </button>
            </div>
        </div>
    </div>
</div>`,
            created_at: "2024-01-18T12:45:00Z"
        },
        {
            id: 6,
            name: "🎮 Formulario Alpine.js",
            code: `<div class="p-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 min-h-screen flex items-center justify-center" x-data="{ name: '{{ user.name }}', email: '{{ user.email }}', message: '', submitted: false, showPreview: false }">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full">
        <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">Formulario Interactivo</h1>
        
        <div x-show="!submitted">
            <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                <input 
                    x-model="name" 
                    type="text" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Tu nombre..."
                >
                <p class="text-xs text-gray-500 mt-1">Nombre actual: <span x-text="name" class="font-semibold"></span></p>
            </div>
            
            <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input 
                    x-model="email" 
                    type="email" 
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="tu@email.com"
                >
            </div>
            
            <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Mensaje</label>
                <textarea 
                    x-model="message" 
                    rows="4"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Escribe tu mensaje aquí..."
                ></textarea>
                <p class="text-xs text-gray-500 mt-1">Caracteres: <span x-text="message.length"></span></p>
            </div>
            
            <div class="flex gap-3 mb-4">
                <button 
                    @click="showPreview = !showPreview"
                    class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                    <span x-text="showPreview ? '👁️ Ocultar Preview' : '👀 Ver Preview'"></span>
                </button>
                <button 
                    @click="submitted = true"
                    :disabled="!name || !email || !message"
                    :class="(!name || !email || !message) ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'"
                    class="flex-1 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                    🚀 Enviar
                </button>
            </div>
            
            <!-- Preview del formulario -->
            <div x-show="showPreview" x-transition class="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 class="font-semibold text-gray-700 mb-2">📋 Preview:</h4>
                <p class="text-sm"><strong>Nombre:</strong> <span x-text="name || 'No especificado'"></span></p>
                <p class="text-sm"><strong>Email:</strong> <span x-text="email || 'No especificado'"></span></p>
                <p class="text-sm"><strong>Mensaje:</strong> <span x-text="message || 'No escrito'"></span></p>
            </div>
        </div>
        
        <!-- Mensaje de éxito -->
        <div x-show="submitted" x-transition class="text-center">
            <div class="text-6xl mb-4">🎉</div>
            <h2 class="text-2xl font-bold text-green-600 mb-4">¡Mensaje Enviado!</h2>
            <p class="text-gray-600 mb-4">Gracias <span x-text="name"></span>, hemos recibido tu mensaje.</p>
            <div class="bg-green-50 p-4 rounded-lg mb-6 text-left">
                <h4 class="font-semibold text-green-800 mb-2">📧 Resumen del envío:</h4>
                <p class="text-sm text-green-700"><strong>De:</strong> <span x-text="name"></span> (<span x-text="email"></span>)</p>
                <p class="text-sm text-green-700"><strong>Mensaje:</strong> <span x-text="message"></span></p>
                <p class="text-sm text-green-700"><strong>Fecha:</strong> {{ current.date }} - {{ current.time }}</p>
                <p class="text-sm text-green-700"><strong>App:</strong> {{ app.name }}</p>
            </div>
            <button 
                @click="submitted = false; message = ''"
                class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
                📝 Enviar otro mensaje
            </button>
        </div>
    </div>
</div>`,
            created_at: "2024-01-18T14:15:00Z"
        }
    ]);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [savedCode, setSavedCode] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [templateName, setTemplateName] = useState('');

    // ✅ SEGUNDO: FUNCIONES QUE DEPENDEN DEL ESTADO (DESPUÉS DE LA DECLARACIÓN)

    /**
     * Añadir template al código existente
     */
    const handleAddTemplate = useCallback((template, position = 'append') => {
        setIsLoadingTemplate(true);
        
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
        
        console.log('=== AÑADIENDO TEMPLATE ===');
        console.log('Template:', template.name);
        console.log('Posición:', position);
        console.log('Código actual:', code.length, 'caracteres');
        console.log('Código template:', templateCode.length, 'caracteres');
        
        // 🔥 AQUÍ ESTÁ LA MAGIA - AÑADIR EN LUGAR DE REEMPLAZAR
        let newCode;
        switch (position) {
            case 'prepend':
                newCode = templateCode + '\n\n' + code;
                break;
            case 'append':
            default:
                newCode = code + '\n\n' + templateCode;
                break;
        }
        
        console.log('Código combinado:', newCode.length, 'caracteres');
        
        // Actualizar el código
        setCode(newCode);
        setIsDirty(true);
        
        // 🚀 FORZAR UPDATE DEL PREVIEW CON ALPINE
        setTimeout(() => {
            try {
                const processedHTML = alpineHook.processCodeWithAlpine(newCode);
                setPreviewHTML(processedHTML);
                console.log('✅ Template añadido y procesado con Alpine');
                
                setTimeout(() => {
                    setIsLoadingTemplate(false);
                }, 100);
            } catch (error) {
                console.error('Error añadiendo template con Alpine:', error);
                setIsLoadingTemplate(false);
            }
        }, 200);
        
        notifications.show({
            title: 'Template añadido',
            message: `"${template.name}" añadido ${position === 'prepend' ? 'al inicio' : 'al final'}`,
            color: 'green',
            icon: <IconPlus size={18} />
        });
        
        console.log('=== FIN AÑADIR TEMPLATE ===');
    }, [code, alpineHook]);

    /**
     * Cargar template reemplazando todo (función original)
     */
    const handleLoadTemplate = useCallback((template, mode = 'replace') => {
        if (mode === 'replace' && isDirty && !confirm('Tienes cambios sin guardar. ¿Continuar?')) {
            return;
        }
        
        setIsLoadingTemplate(true);
        
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
        
        console.log('=== CARGANDO TEMPLATE (REEMPLAZAR) ===');
        
        // 🚀 SECUENCIA CONTROLADA DE CARGA
        setCurrentTemplate(template);
        setCode(templateCode); // ✅ REEMPLAZAR TODO
        setSavedCode(templateCode);
        setIsDirty(false);
        
        // 🚀 FORZAR UPDATE DEL PREVIEW CON ALPINE
        setTimeout(() => {
            try {
                const processedHTML = alpineHook.processCodeWithAlpine(templateCode);
                setPreviewHTML(processedHTML);
                
                setTimeout(() => {
                    setIsLoadingTemplate(false);
                }, 100);
            } catch (error) {
                console.error('Error procesando template con Alpine:', error);
                setIsLoadingTemplate(false);
            }
        }, 300);
        
        notifications.show({
            title: 'Template cargado',
            message: `"${template.name}" cargado (código reemplazado)`,
            color: 'blue',
            icon: <IconRefresh size={18} />
        });
        
        console.log('=== FIN CARGA TEMPLATE ===');
    }, [code, isDirty, alpineHook]);

    // ✅ RESTO DE FUNCIONES...

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

    // Forzar procesamiento manual de variables con Alpine.js
    const updatePreview = useCallback(() => {
        console.log('🔄 Procesamiento manual con Alpine.js iniciado...');
        
        try {
            // ✅ USAR EL NUEVO HOOK DE ALPINE
            const processedHTML = alpineHook.processCodeWithAlpine(code);
            setPreviewHTML(processedHTML);
            
            console.log('✅ Procesamiento manual con Alpine completado:', processedHTML.length, 'caracteres');
            
            notifications.show({
                title: '🚀 Variables + Alpine procesadas',
                message: `Preview actualizado con Alpine.js (${processedHTML.length} caracteres)`,
                color: 'green',
                icon: <IconEye size={18} />
            });
        } catch (error) {
            console.error('❌ Error en procesamiento manual con Alpine:', error);
            notifications.show({
                title: 'Error',
                message: `Error procesando con Alpine.js: ${error.message}`,
                color: 'red'
            });
        }
    }, [code, alpineHook]);

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

    // Auto-actualizar preview cuando cambia el código
    useEffect(() => {
        // 🔧 EVITAR CONFLICTOS DURANTE CARGA DE TEMPLATES
        if (isLoadingTemplate) {
            console.log('⏸️ Auto-update pausado - cargando template');
            return;
        }
        
        // 🔧 MEJORAR AUTO-UPDATE DEL PREVIEW CON ALPINE
        const updatePreviewContent = () => {
            if (code) {
                try {
                    console.log('🔄 Auto-update con Alpine iniciado para:', code.length, 'caracteres');
                    const processedHTML = alpineHook.processCodeWithAlpine(code);
                    setPreviewHTML(processedHTML);
                    console.log('✅ Auto-update con Alpine completado:', processedHTML.length, 'caracteres');
                } catch (error) {
                    console.error('❌ Error en auto-update con Alpine:', error);
                    setPreviewHTML(`<div style="padding: 20px; color: red;">Error procesando con Alpine.js: ${error.message}</div>`);
                }
            } else {
                console.log('📄 Código vacío - limpiando preview');
                setPreviewHTML('');
            }
        };

        // Pequeño delay para evitar updates muy frecuentes
        const timeoutId = setTimeout(updatePreviewContent, 150);
        return () => clearTimeout(timeoutId);
    }, [code, alpineHook, isLoadingTemplate]);

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
                                🚀 Procesar Variables + Alpine
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
                                        
                                        // 🚀 FORZAR UPDATE DEL PREVIEW CON ALPINE
                                        setTimeout(() => {
                                            try {
                                                const processedHTML = alpineHook.processCodeWithAlpine(newCode);
                                                setPreviewHTML(processedHTML);
                                                console.log('✅ Nuevo template creado y procesado con Alpine');
                                                
                                                setTimeout(() => {
                                                    setIsLoadingTemplate(false);
                                                }, 100);
                                            } catch (error) {
                                                console.error('Error creando nuevo template con Alpine:', error);
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
                                                    backgroundColor: currentTemplate?.id === template.id ? 
                                                        (theme === 'dark' ? '#2d2d2d' : '#f8f9fa') : 'transparent',
                                                    borderColor: currentTemplate?.id === template.id ? 
                                                        '#228be6' : (theme === 'dark' ? '#404040' : '#e9ecef')
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
                                                    
                                                    {/* 🆕 BOTONES SEPARADOS PARA ACCIONES */}
                                                    <Group gap="xs">
                                                        {/* Botón: Añadir al final */}
                                                        <Tooltip label="Añadir al final del código actual">
                                                            <ActionIcon 
                                                                variant="light" 
                                                                color="blue"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAddTemplate(template, 'append');
                                                                }}
                                                            >
                                                                <IconPlus size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        
                                                        {/* Botón: Reemplazar todo */}
                                                        <Tooltip label="Reemplazar todo el código">
                                                            <ActionIcon 
                                                                variant="light" 
                                                                color="orange"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleLoadTemplate(template, 'replace');
                                                                }}
                                                            >
                                                                <IconRefresh size={14} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        
                                                        {/* Botón: Eliminar */}
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
                                            console.log('Alpine hook:', alpineHook);
                                            
                                            // Force reprocess con Alpine
                                            const reprocessed = alpineHook.processCodeWithAlpine(code);
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
                                    Se actualiza automáticamente con Alpine.js + Tailwind CSS
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