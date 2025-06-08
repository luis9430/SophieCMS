import { useState, useCallback, useEffect  } from 'preact/hooks';
import {
    AppShell, Text, Button, Group, Container, Flex, Box, ActionIcon, Tooltip
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconDeviceFloppy, IconEye, IconRefresh, IconCode, IconPalette, IconSun, IconMoon
} from '@tabler/icons-preact';

// ✅ Import del CodeMirrorEditor mejorado
import CodeMirrorEditor from './codemirror/CodeMirrorEditor';

export default function PageBuilder() {
    const [theme, setTheme] = useState('light'); // Estado para el tema

    useEffect(() => {
        console.log('El tema del editor ha cambiado a:', theme);
    }, [theme]);

    // Función para alternar tema
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

    // HTML inicial de ejemplo con más ejemplos de Alpine.js, Tailwind y Blade
    const initialHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Página</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        [x-cloak] { display: none !important; }
    </style>
</head>
<body>
    <!-- Este editor soporta sintaxis Blade: {{-- comentarios --}}, @if, @foreach, etc. -->
    <!-- Para ver Blade en acción, utiliza: @extends('layouts.app'), @section('content') -->
    <!-- Hero Section con Alpine.js y Tailwind -->
    <section class="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-20 px-4 transition-all duration-500 hover:shadow-2xl" 
             x-data="{ 
                title: '¡Bienvenido a tu Página!', 
                subtitle: 'Editor con sintaxis highlighting para Alpine.js, Tailwind CSS y Blade', 
                showButton: true,
                count: 0 
             }" x-init="console.log('Alpine inicializado')">
        <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-5xl font-bold mb-6 hover:text-yellow-300 transition-colors" 
                x-text="title" 
                @click="title = 'Título Clickeado!'"></h1>
            <p class="text-xl mb-8 opacity-90 leading-relaxed" x-text="subtitle"></p>
            
            <!-- Botón con Alpine.js -->
            <button x-show="showButton" 
                    @click="showButton = false; count++; $nextTick(() => showButton = true)"
                    class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 hover:scale-105 transition-all duration-300 shadow-lg">
                Comenzar Ahora (Clicks: <span x-text="count"></span>)
            </button>
        </div>
    </section>

    <!-- Counter Demo con Alpine avanzado -->
    <section class="py-12 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div class="max-w-4xl mx-auto text-center">
            <div x-data="{ 
                    count: 0, 
                    step: 1,
                    history: [],
                    get canUndo() { return this.history.length > 0 }
                 }" 
                 class="bg-white p-8 rounded-xl shadow-lg inline-block border-2 border-gray-100 hover:border-blue-200 transition-all">
                    
                    <h3 class="text-2xl font-semibold mb-6 text-gray-800">Demo Alpine.js Avanzado</h3>
                    
                    <!-- Controls -->
                    <div class="mb-6 space-y-4">
                        <div class="flex items-center justify-center space-x-4">
                            <label class="text-sm font-medium text-gray-600">Paso:</label>
                            <input type="number" x-model="step" min="1" max="10" 
                                   class="w-16 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                    </div>
                    
                    <!-- Counter Display -->
                    <div class="flex items-center justify-center space-x-6 mb-6">
                        <button @click="count = Math.max(0, count - step); history.push(count + step)" 
                                class="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all transform hover:scale-105 shadow-md">
                            -<span x-text="step"></span>
                        </button>
                        
                        <div class="text-center">
                            <div x-text="count" 
                                 class="text-4xl font-bold w-24 h-16 flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg"></div>
                            <p class="text-xs text-gray-500 mt-2">Valor actual</p>
                        </div>
                        
                        <button @click="count += step; history.push(count - step)" 
                                class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all transform hover:scale-105 shadow-md">
                            +<span x-text="step"></span>
                        </button>
                    </div>
                    
                    <!-- Undo button -->
                    <button x-show="canUndo" 
                            @click="count = history.pop()" 
                            class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors text-sm">
                        ↶ Deshacer
                    </button>
                    
                    <p class="text-gray-600 mt-4 text-sm">
                        Contador interactivo con historial - 
                        <span x-text="history.length"></span> acciones en historial
                    </p>
                </div>
            </div>
        </section>
    @endif

    {{-- Blade loop example --}}
    @foreach(['Alpine.js', 'Tailwind CSS', 'Laravel Blade'] as $tech)
        <!-- Features Section for {{ $tech }} -->
    @endforeach
    
    <!-- Content Section -->
    <section class="py-16 px-4 bg-white">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Características Destacadas
            </h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4 shadow-md">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-3 text-blue-900">CodeMirror Editor</h3>
                    <p class="text-blue-700 leading-relaxed">
                        Editor estable con autocompletado inteligente para Tailwind CSS, Alpine.js y Laravel Blade. 
                        <strong>Sin problemas de cursor!</strong>
                    </p>
                </div>

                <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-4 shadow-md">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-3 text-green-900">Tailwind CSS</h3>
                    <p class="text-green-700 leading-relaxed">
                        Framework CSS utilitario con <span class="bg-green-200 px-2 py-1 rounded text-green-800 font-medium">highlighting sintáctico</span> 
                        para crear diseños responsive rápidamente.
                    </p>
                </div>

                <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-4 shadow-md">
                        <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-semibold mb-3 text-purple-900">Alpine.js + Blade</h3>
                    <p class="text-purple-700 leading-relaxed">
                        <code class="bg-purple-200 text-purple-800 px-1 rounded">x-data</code>, 
                        <code class="bg-purple-200 text-purple-800 px-1 rounded">@click</code>, 
                        <code class="bg-purple-200 text-purple-800 px-1 rounded">@if</code> 
                        con colorización específica para mejor legibilidad.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <!-- Interactive Demo with complex Alpine.js -->
    <section class="py-12 px-4 bg-gradient-to-r from-indigo-50 to-cyan-50" 
             x-data="{ 
                tabs: ['Form', 'List', 'Settings'], 
                activeTab: 'Form',
                formData: { name: '', email: '', message: '' },
                items: ['Item 1', 'Item 2', 'Item 3'],
                settings: { theme: 'light', notifications: true }
             }">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-center mb-8 text-gray-800">Demo Interactivo Avanzado</h2>
            
            <!-- Tabs -->
            <div class="flex justify-center mb-6">
                <div class="bg-white rounded-lg p-1 shadow-lg border">
                    <template x-for="tab in tabs">
                        <button @click="activeTab = tab" 
                                :class="activeTab === tab ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-blue-500'"
                                class="px-6 py-2 rounded-md transition-all duration-200 font-medium"
                                x-text="tab">
                        </button>
                    </template>
                </div>
            </div>
            
            <!-- Tab Content -->
            <div class="bg-white rounded-xl shadow-lg p-6 border">
                <!-- Form Tab -->
                <div x-show="activeTab === 'Form'" x-transition.duration.300ms>
                    <h3 class="text-xl font-semibold mb-4">Formulario de Contacto</h3>
                    <div class="space-y-4">
                        <input type="text" x-model="formData.name" placeholder="Tu nombre" 
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                        <input type="email" x-model="formData.email" placeholder="Tu email" 
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                        <textarea x-model="formData.message" placeholder="Tu mensaje" rows="4"
                                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"></textarea>
                        
                        <div x-show="formData.name && formData.email && formData.message" 
                             x-transition
                             class="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 class="font-semibold text-green-800 mb-2">Vista previa:</h4>
                            <p class="text-green-700">
                                <strong>Nombre:</strong> <span x-text="formData.name"></span><br>
                                <strong>Email:</strong> <span x-text="formData.email"></span><br>
                                <strong>Mensaje:</strong> <span x-text="formData.message"></span>
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- List Tab -->
                <div x-show="activeTab === 'List'" x-transition.duration.300ms>
                    <h3 class="text-xl font-semibold mb-4">Lista Dinámica</h3>
                    <div class="space-y-3">
                        <template x-for="(item, index) in items" :key="index">
                            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                <span x-text="item" class="font-medium"></span>
                                <button @click="items.splice(index, 1)" 
                                        class="text-red-500 hover:text-red-700 font-bold">✕</button>
                            </div>
                        </template>
                        <button @click="items.push('Nuevo Item ' + (items.length + 1))" 
                                class="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
                            + Agregar Item
                        </button>
                    </div>
                </div>
                
                <!-- Settings Tab -->
                <div x-show="activeTab === 'Settings'" x-transition.duration.300ms>
                    <h3 class="text-xl font-semibold mb-4">Configuraciones</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <label class="font-medium">Notificaciones</label>
                            <button @click="settings.notifications = !settings.notifications"
                                    :class="settings.notifications ? 'bg-green-500' : 'bg-gray-300'"
                                    class="w-12 h-6 rounded-full transition-colors relative">
                                <div :class="settings.notifications ? 'translate-x-6' : 'translate-x-1'"
                                     class="w-4 h-4 bg-white rounded-full transition-transform absolute top-1"></div>
                            </button>
                        </div>
                        <div x-show="settings.notifications" class="text-sm text-green-600">
                            ✓ Las notificaciones están habilitadas
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-8 px-4">
        <div class="max-w-4xl mx-auto text-center">
            <p class="text-lg">&copy; 2025 Page Builder con CodeMirror, Tailwind y Alpine.js</p>
            <p class="text-gray-400 mt-2">Con highlighting sintáctico avanzado para mejor desarrollo</p>
        </div>
    </footer>
</body>
</html>`;

    const [code, setCode] = useState(initialHTML);
    const [previewHTML, setPreviewHTML] = useState(initialHTML);
    const [isUpdatingPreview, setIsUpdatingPreview] = useState(false);

    // Funciones sin cambios
    const handleCodeChange = useCallback((newCode) => {
        setCode(newCode);
    }, []);

    const updatePreview = useCallback(() => {
        setIsUpdatingPreview(true);
        
        setTimeout(() => {
            setPreviewHTML(code);
            setIsUpdatingPreview(false);
            
            notifications.show({
                title: 'Preview actualizado',
                message: 'Los cambios se han aplicado correctamente',
                color: 'green',
                icon: <IconEye size={18} />
            });
        }, 300);
    }, [code]);

    const handleSave = useCallback(() => {
        notifications.show({
            title: 'Código guardado',
            message: 'Tu página se ha guardado correctamente',
            color: 'blue',
            icon: <IconDeviceFloppy size={18} />
        });
    }, []);

    const resetCode = useCallback(() => {
        setCode(initialHTML);
        setPreviewHTML(initialHTML);
        notifications.show({
            title: 'Código reseteado',
            message: 'Se ha restaurado el código inicial',
            color: 'orange',
            icon: <IconRefresh size={18} />
        });
    }, [initialHTML]);

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
            {/* Header */}
            <AppShell.Header style={{ backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff' }}>
                <Container size="100%" h="100%">
                    <Flex justify="space-between" align="center" h="100%" px="md">
                        <Group gap="sm">
                            <IconPalette size={28} color="#228be6" />
                            <Text size="lg" fw={700} c={theme === 'dark' ? 'white' : 'dark'}>
                                Page Builder
                            </Text>
                            <Text size="sm" c="dimmed">
                                CodeMirror + Syntax Highlighting
                            </Text>
                        </Group>
                        <Group>
                            {/* ✅ Botón para cambiar tema */}
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
                            
                            <Tooltip label="Sintaxis highlighting para Alpine.js, Tailwind CSS y Blade">
                                <ActionIcon 
                                    variant="light" 
                                    color="green"
                                    onClick={() => {
                                        notifications.show({
                                            title: 'Syntax Highlighting Activado',
                                            message: '🎨 Alpine.js (verde), Tailwind (azul), Blade (rosa). Ctrl+Space para autocompletado.',
                                            color: 'green',
                                            autoClose: 8000
                                        });
                                    }}
                                >
                                    <IconCode size={18} />
                                </ActionIcon>
                            </Tooltip>
                            
                            <Tooltip label="Resetear código">
                                <ActionIcon 
                                    variant="light" 
                                    color="orange" 
                                    onClick={resetCode}
                                >
                                    <IconRefresh size={18} />
                                </ActionIcon>
                            </Tooltip>
                            
                            <Button 
                                leftSection={<IconEye size={18} />} 
                                size="sm" 
                                variant="light"
                                loading={isUpdatingPreview}
                                onClick={updatePreview}
                            >
                                {isUpdatingPreview ? 'Actualizando...' : 'Actualizar Preview'}
                            </Button>
                            
                            <Button 
                                leftSection={<IconDeviceFloppy size={18} />} 
                                size="sm"
                                onClick={handleSave}
                            >
                                Guardar
                            </Button>
                        </Group>
                    </Flex>
                </Container>
            </AppShell.Header>

            {/* Main Content */}
            <AppShell.Main 
                style={{ 
                    height: 'calc(100vh - 70px)',
                    minHeight: '600px',
                    overflow: 'hidden'
                }}
            >
                <Flex style={{ height: '100%' }}>
                    {/* Editor Panel - 50% */}
                    <Box style={{ 
                        width: '50%', 
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
                                        CodeMirror HTML Editor
                                    </Text>
                                    <Text size="xs" c={theme === 'dark' ? 'gray.4' : 'blue.6'} fw={500}>
                                        {theme === 'dark' ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
                                    </Text>
                                </Group>
                                <Text size="xs" c="dimmed">
                                    🎨 Alpine.js | Tailwind | Blade highlighting | Ctrl+Space autocompletado
                                </Text>
                            </Group>
                        </Box>
                        <Box style={{ height: 'calc(100% - 52px)', minHeight: '400px' }}>
                            {/* ✅ Pasamos el tema al CodeMirrorEditor */}
                            <CodeMirrorEditor 
                                code={code}
                                onCodeChange={handleCodeChange}
                                language="html"
                                theme={theme}
                            />
                        </Box>
                    </Box>

                    {/* Preview Panel - 50% */}
                    <Box style={{ 
                        width: '50%',
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
                                    Da clic en "Actualizar Preview" para ver cambios
                                </Text>
                            </Group>
                        </Box>
                        <Box style={{ height: 'calc(100% - 52px)', overflow: 'auto' }}>
                            {isUpdatingPreview ? (
                                <Box 
                                    style={{ 
                                        height: '100%', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f8f9fa'
                                    }}
                                >
                                    <Text c="dimmed">Actualizando preview...</Text>
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
            </AppShell.Main>
        </AppShell>
    );
}