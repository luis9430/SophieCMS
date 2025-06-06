import { render } from 'preact';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import PageBuilder from './block-builder/PageBuilder';

// Estilos de Mantine
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

// Función para inicializar Preact Page Builder
function initPreactPageBuilder() {
    const container = document.getElementById('preact-page-builder');
    
    if (container) {
        render(
            <MantineProvider defaultColorScheme="light">
                <Notifications />
                <PageBuilder />
            </MantineProvider>,
            container
        );
    }
}

// Exportar función para usar desde el HTML
window.initPreactPageBuilder = initPreactPageBuilder;

console.log('🚀 Preact Page Builder loaded!');