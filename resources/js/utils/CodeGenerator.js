// utils/CodeGenerator.js

/**
 * Convierte los estilos de Mantine a CSS estándar
 */
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

    // Width & Height
    if (styles.widthPreset) {
        switch (styles.widthPreset) {
            case 'auto': cssStyles.width = 'auto'; break;
            case '100%': cssStyles.width = '100%'; break;
            case '100vw': cssStyles.width = '100vw'; break;
            case 'container':
                cssStyles.width = '100%';
                cssStyles.maxWidth = '1200px';
                cssStyles.marginLeft = 'auto';
                cssStyles.marginRight = 'auto';
                break;
            case 'custom':
                if (styles.width) cssStyles.width = styles.width;
                break;
        }
    }
    
    if (styles.heightPreset) {
        switch (styles.heightPreset) {
            case 'auto': cssStyles.height = 'auto'; break;
            case '100vh': cssStyles.height = '100vh'; break;
            case '50vh': cssStyles.height = '50vh'; break;
            case 'custom':
                if (styles.height) cssStyles.height = styles.height;
                break;
        }
    }

    if (styles.maxWidth && styles.widthPreset !== 'container') {
        cssStyles.maxWidth = styles.maxWidth;
    }
    if (styles.minHeight) cssStyles.minHeight = styles.minHeight;

    // Background
    if (styles.backgroundColor) cssStyles.backgroundColor = styles.backgroundColor;
    if (styles.backgroundImage) cssStyles.backgroundImage = `url(${styles.backgroundImage})`;
    if (styles.backgroundSize) cssStyles.backgroundSize = styles.backgroundSize;
    if (styles.backgroundPosition) cssStyles.backgroundPosition = styles.backgroundPosition;

    // Border & Effects
    if (styles.borderRadius) cssStyles.borderRadius = `${styles.borderRadius}px`;
    if (styles.borderWidth) cssStyles.borderWidth = `${styles.borderWidth}px`;
    if (styles.borderColor) cssStyles.borderColor = styles.borderColor;
    if (styles.borderStyle) cssStyles.borderStyle = styles.borderStyle;
    
    if (styles.boxShadow && styles.boxShadow !== 'none') {
        const shadowMap = {
            sm: '0 1px 3px rgba(0,0,0,0.12)',
            md: '0 4px 6px rgba(0,0,0,0.1)',
            lg: '0 10px 15px rgba(0,0,0,0.1)',
            xl: '0 20px 25px rgba(0,0,0,0.15)'
        };
        cssStyles.boxShadow = shadowMap[styles.boxShadow] || styles.boxShadow;
    }

    // Visibility & Layers
    if (styles.opacity !== undefined) cssStyles.opacity = styles.opacity / 100;
    if (styles.overflow) cssStyles.overflow = styles.overflow;
    if (styles.zIndex) cssStyles.zIndex = styles.zIndex;

    return cssStyles;
}

/**
 * Convierte un objeto de estilos CSS a string
 */
function stylesToString(styleObj) {
    if (!styleObj || Object.keys(styleObj).length === 0) return '';
    
    return Object.entries(styleObj)
        .map(([key, value]) => {
            // Convertir camelCase a kebab-case
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            return `${kebabKey}: ${value}`;
        })
        .join('; ');
}

/**
 * Genera HTML para un bloque de texto
 */
function generateTextBlockHTML(block, indent = 0) {
    const { config, styles } = block;
    const cssStyles = convertStylesToCSS(styles);
    const styleString = stylesToString(cssStyles);
    const indentStr = '  '.repeat(indent);
    
    const customId = styles?.customId ? ` id="${styles.customId}"` : '';
    const customClasses = styles?.customClasses && styles.customClasses.length > 0 
        ? ` class="${styles.customClasses.join(' ')}"` 
        : '';
    const inlineStyles = styleString ? ` style="${styleString}"` : '';
    
    return `${indentStr}<p${customId}${customClasses}${inlineStyles}>
${indentStr}  ${config.content || 'Contenido de texto'}
${indentStr}</p>`;
}

/**
 * Genera HTML para un bloque hero
 */
function generateHeroBlockHTML(block, indent = 0) {
    const { config, styles } = block;
    const cssStyles = convertStylesToCSS(styles);
    const styleString = stylesToString(cssStyles);
    const indentStr = '  '.repeat(indent);
    
    const customId = styles?.customId ? ` id="${styles.customId}"` : '';
    const customClasses = styles?.customClasses && styles.customClasses.length > 0 
        ? ` class="hero-section ${styles.customClasses.join(' ')}"` 
        : ' class="hero-section"';
    const inlineStyles = styleString ? ` style="${styleString}"` : '';
    
    return `${indentStr}<section${customId}${customClasses}${inlineStyles}>
${indentStr}  <div class="hero-content">
${indentStr}    <h1 class="hero-title">${config.title || 'Título Impactante'}</h1>
${indentStr}    <p class="hero-subtitle">${config.subtitle || 'Subtítulo descriptivo'}</p>
${indentStr}    <a href="${config.buttonUrl || '#'}" class="hero-button">${config.buttonText || 'Comenzar Ahora'}</a>
${indentStr}  </div>
${indentStr}</section>`;
}

/**
 * Genera HTML para un grid
 */
function generateGridHTML(block, indent = 0) {
    const { config, styles, children } = block;
    const cssStyles = convertStylesToCSS(styles);
    const styleString = stylesToString(cssStyles);
    const indentStr = '  '.repeat(indent);
    
    const customId = styles?.customId ? ` id="${styles.customId}"` : '';
    const customClasses = styles?.customClasses && styles.customClasses.length > 0 
        ? ` class="grid-container ${styles.customClasses.join(' ')}"` 
        : ' class="grid-container"';
    const inlineStyles = styleString ? ` style="display: grid; grid-template-columns: repeat(${config.columns || 2}, 1fr); gap: ${config.gap || '16px'}; ${styleString}"` : ` style="display: grid; grid-template-columns: repeat(${config.columns || 2}, 1fr); gap: ${config.gap || '16px'}"`;
    
    let gridHTML = `${indentStr}<div${customId}${customClasses}${inlineStyles}>`;
    
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

/**
 * Genera HTML para un bloque genérico
 */
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

/**
 * Genera CSS básico para los componentes
 */
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

/**
 * Función principal que genera el código HTML completo
 */
export function generateHTML(blocks) {
    if (!blocks || blocks.length === 0) {
        return {
            html: '<!-- No hay componentes para generar -->',
            css: generateCSS()
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

export default { generateHTML };