// CodeViewer.jsx
import { useState } from 'preact/hooks';
import {
    Modal,
    Tabs,
    Text,
    Button,
    Group,
    Stack,
    ActionIcon,
    Tooltip,
    Badge,
    ScrollArea
} from '@mantine/core';
import {
    IconCopy,
    IconCheck,
    IconDownload,
    IconEye
} from '@tabler/icons-preact';
import { notifications } from '@mantine/notifications';

// Generador de código integrado
function convertStylesToCSS(styles) {
    if (!styles) return {};

    const cssStyles = {};

    // Layout & Spacing
    if (styles.padding) {
        const paddingMap = { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '40px' };
        cssStyles.padding = paddingMap[styles.padding] || styles.padding;
    }
    if (styles.margin) {
        const marginMap = { xs: '8px', sm: '16px', md: '24px', lg: '32px', xl: '40px' };
        cssStyles.margin = marginMap[styles.margin] || styles.margin;
    }
    if (styles.textAlign) cssStyles.textAlign = styles.textAlign;

    // Background
    if (styles.backgroundColor) cssStyles.backgroundColor = styles.backgroundColor;
    if (styles.backgroundImage) cssStyles.backgroundImage = `url(${styles.backgroundImage})`;

    // Border & Effects
    if (styles.borderRadius) cssStyles.borderRadius = `${styles.borderRadius}px`;
    if (styles.borderWidth) cssStyles.borderWidth = `${styles.borderWidth}px`;
    if (styles.borderColor) cssStyles.borderColor = styles.borderColor;
    if (styles.borderStyle) cssStyles.borderStyle = styles.borderStyle;

    return cssStyles;
}

function stylesToString(styleObj) {
    if (!styleObj || Object.keys(styleObj).length === 0) return '';
    
    return Object.entries(styleObj)
        .map(([key, value]) => {
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${kebabKey}: ${value}`;
        })
        .join('; ');
}

function generateTextBlockHTML(block, indent = 0) {
    const { config, styles } = block;
    const cssStyles = convertStylesToCSS(styles);
    const styleString = stylesToString(cssStyles);
    const indentStr = '  '.repeat(indent);
    
    const inlineStyles = styleString ? ` style="${styleString}"` : '';
    
    return `${indentStr}<p${inlineStyles}>
${indentStr}  ${config.content || 'Contenido de texto'}
${indentStr}</p>`;
}

function generateHeroBlockHTML(block, indent = 0) {
    const { config, styles } = block;
    const cssStyles = convertStylesToCSS(styles);
    const styleString = stylesToString(cssStyles);
    const indentStr = '  '.repeat(indent);
    
    const inlineStyles = styleString ? ` style="${styleString}"` : '';
    
    return `${indentStr}<section class="hero-section"${inlineStyles}>
${indentStr}  <div class="hero-content">
${indentStr}    <h1 class="hero-title">${config.title || 'Título Impactante'}</h1>
${indentStr}    <p class="hero-subtitle">${config.subtitle || 'Subtítulo descriptivo'}</p>
${indentStr}    <a href="${config.buttonUrl || '#'}" class="hero-button">${config.buttonText || 'Comenzar Ahora'}</a>
${indentStr}  </div>
${indentStr}</section>`;
}

function generateGridHTML(block, indent = 0) {
    const { config, styles, children } = block;
    const cssStyles = convertStylesToCSS(styles);
    const styleString = stylesToString(cssStyles);
    const indentStr = '  '.repeat(indent);
    
    const gridStyle = `display: grid; grid-template-columns: repeat(${config.columns || 2}, 1fr); gap: ${config.gap || '16px'};`;
    const inlineStyles = styleString ? ` style="${gridStyle} ${styleString}"` : ` style="${gridStyle}"`;
    
    let gridHTML = `${indentStr}<div class="grid-container"${inlineStyles}>`;
    
    if (children && children.length > 0) {
        children.forEach(column => {
            gridHTML += `\n${indentStr}  <div class="grid-column">`;
            if (column.children && column.children.length > 0) {
                column.children.forEach(childBlock => {
                    gridHTML += '\n' + generateBlockHTML(childBlock, indent + 2);
                });
            }
            gridHTML += `\n${indentStr}  </div>`;
        });
    }
    
    gridHTML += `\n${indentStr}</div>`;
    return gridHTML;
}

function generateBlockHTML(block, indent = 0) {
    switch (block.type) {
        case 'text':
            return generateTextBlockHTML(block, indent);
        case 'hero':
            return generateHeroBlockHTML(block, indent);
        case 'grid':
            return generateGridHTML(block, indent);
        default:
            const indentStr = '  '.repeat(indent);
            return `${indentStr}<!-- Bloque desconocido: ${block.type} -->`;
    }
}

function generateCSS() {
    return `/* Estilos generados por Page Builder */

/* Reset básico */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

/* Hero Section */
.hero-section {
  padding: 80px 20px;
  text-align: center;
  background-color: #f8f9fa;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #212529;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #6c757d;
  margin-bottom: 2rem;
}

.hero-button {
  display: inline-block;
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background-color 0.2s;
}

.hero-button:hover {
  background-color: #0056b3;
}

/* Grid System */
.grid-container {
  width: 100%;
}

.grid-column {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Text Blocks */
p {
  margin-bottom: 1rem;
  line-height: 1.6;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .grid-container {
    grid-template-columns: 1fr !important;
  }
}`;
}

function generateHTML(blocks) {
    if (!blocks || blocks.length === 0) {
        return {
            html: '<!-- No hay componentes para generar -->',
            css: generateCSS(),
            htmlOnly: ''
        };
    }
    
    let htmlContent = blocks.map(block => generateBlockHTML(block, 0)).join('\n\n');
    
    const fullHTML = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Página Generada - Page Builder</title>
    <style>
${generateCSS()}
    </style>
</head>
<body>
${htmlContent}
</body>
</html>`;

    return {
        html: fullHTML,
        css: generateCSS(),
        htmlOnly: htmlContent
    };
}

export default function CodeViewer({ opened, onClose, blocks }) {
    const [activeTab, setActiveTab] = useState('html');
    const [copiedStates, setCopiedStates] = useState({});

    // Generar el código
    const { html: fullHTML, css, htmlOnly } = generateHTML(blocks);

    // Función para copiar al portapapeles
    const copyToClipboard = async (text, type) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedStates(prev => ({ ...prev, [type]: true }));
            
            notifications.show({
                title: 'Código copiado',
                message: `${type.toUpperCase()} copiado al portapapeles`,
                color: 'green',
                icon: <IconCheck size={18} />
            });

            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [type]: false }));
            }, 2000);
        } catch (err) {
            notifications.show({
                title: 'Error',
                message: 'No se pudo copiar al portapapeles',
                color: 'red'
            });
        }
    };

    // Función para descargar archivo
    const downloadFile = (content, filename, type = 'text/html') => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        notifications.show({
            title: 'Descarga iniciada',
            message: `${filename} descargado`,
            color: 'blue',
            icon: <IconDownload size={18} />
        });
    };

    // Función para previsualizar en nueva ventana
    const previewInNewWindow = () => {
        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(fullHTML);
            newWindow.document.close();
        }
    };

    const codeStats = {
        blocks: blocks.length,
        lines: fullHTML.split('\n').length,
        characters: fullHTML.length
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="sm">
                    <Text fw={600} size="lg">Código Generado</Text>
                    <Badge variant="light" color="blue">
                        {codeStats.blocks} componente{codeStats.blocks !== 1 ? 's' : ''}
                    </Badge>
                </Group>
            }
            size="90%"
            styles={{
                modal: { height: '90vh' },
                body: { height: 'calc(90vh - 120px)', padding: 0 }
            }}
        >
            <Stack gap={0} style={{ height: '100%' }}>
                {/* Header con estadísticas y acciones */}
                <Group justify="space-between" p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
                    <Group gap="lg">
                        <Text size="sm" c="dimmed">
                            📄 {codeStats.lines} líneas
                        </Text>
                        <Text size="sm" c="dimmed">
                            📝 {codeStats.characters.toLocaleString()} caracteres
                        </Text>
                    </Group>
                    <Group gap="xs">
                        <Tooltip label="Vista previa en nueva ventana">
                            <ActionIcon variant="light" color="blue" onClick={previewInNewWindow}>
                                <IconEye size={16} />
                            </ActionIcon>
                        </Tooltip>
                        <Button
                            leftSection={<IconDownload size={16} />}
                            variant="light"
                            size="sm"
                            onClick={() => downloadFile(fullHTML, 'pagina-generada.html')}
                        >
                            Descargar HTML
                        </Button>
                    </Group>
                </Group>

                {/* Tabs con el código */}
                <Tabs value={activeTab} onChange={setActiveTab} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Tabs.List grow px="md" pt="md">
                        <Tabs.Tab value="html">HTML Limpio</Tabs.Tab>
                        <Tabs.Tab value="css">CSS</Tabs.Tab>
                        <Tabs.Tab value="full">HTML Completo</Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="html" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Group justify="space-between" p="md" pb="xs">
                            <Text size="sm" c="dimmed">
                                Solo el contenido HTML de tus componentes
                            </Text>
                            <Button
                                leftSection={copiedStates.html ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                variant="light"
                                size="xs"
                                color={copiedStates.html ? "green" : "blue"}
                                onClick={() => copyToClipboard(htmlOnly, 'html')}
                            >
                                {copiedStates.html ? 'Copiado' : 'Copiar'}
                            </Button>
                        </Group>
                        <ScrollArea style={{ flex: 1 }} px="md" pb="md">
                            <pre style={codeStyle}>
                                <code>{htmlOnly}</code>
                            </pre>
                        </ScrollArea>
                    </Tabs.Panel>

                    <Tabs.Panel value="css" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Group justify="space-between" p="md" pb="xs">
                            <Text size="sm" c="dimmed">
                                Estilos CSS para tus componentes
                            </Text>
                            <Button
                                leftSection={copiedStates.css ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                variant="light"
                                size="xs"
                                color={copiedStates.css ? "green" : "blue"}
                                onClick={() => copyToClipboard(css, 'css')}
                            >
                                {copiedStates.css ? 'Copiado' : 'Copiar'}
                            </Button>
                        </Group>
                        <ScrollArea style={{ flex: 1 }} px="md" pb="md">
                            <pre style={codeStyle}>
                                <code>{css}</code>
                            </pre>
                        </ScrollArea>
                    </Tabs.Panel>

                    <Tabs.Panel value="full" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Group justify="space-between" p="md" pb="xs">
                            <Text size="sm" c="dimmed">
                                Documento HTML completo listo para usar
                            </Text>
                            <Button
                                leftSection={copiedStates.full ? <IconCheck size={14} /> : <IconCopy size={14} />}
                                variant="light"
                                size="xs"
                                color={copiedStates.full ? "green" : "blue"}
                                onClick={() => copyToClipboard(fullHTML, 'full')}
                            >
                                {copiedStates.full ? 'Copiado' : 'Copiar'}
                            </Button>
                        </Group>
                        <ScrollArea style={{ flex: 1 }} px="md" pb="md">
                            <pre style={codeStyle}>
                                <code>{fullHTML}</code>
                            </pre>
                        </ScrollArea>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Modal>
    );
}

// Estilos para el código
const codeStyle = {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '6px',
    padding: '16px',
    margin: 0,
    fontSize: '13px',
    fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
    lineHeight: 1.5,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
};