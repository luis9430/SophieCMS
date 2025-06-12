#!/usr/bin/env node

// ===================================================================
// scripts/generate-tailwind-safelist.mjs
// Generador universal compatible con ES modules y CommonJS
// ===================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Detectar si estamos en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para detectar el directorio del proyecto
function getProjectRoot() {
    let currentDir = __dirname;
    
    // Buscar package.json subiendo directorios
    while (currentDir !== path.dirname(currentDir)) {
        if (fs.existsSync(path.join(currentDir, 'package.json'))) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }
    
    // Fallback al directorio padre del script
    return path.resolve(__dirname, '..');
}

async function ensureDirectoryExists(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) {
            await fs.promises.mkdir(dirPath, { recursive: true });
            console.log(`✅ Created directory: ${dirPath}`);
        }
        return true;
    } catch (error) {
        console.error(`❌ Failed to create directory ${dirPath}:`, error);
        return false;
    }
}

class TailwindSafelistGenerator {
    constructor() {
        this.projectRoot = getProjectRoot();
        
        this.colors = [
            'slate', 'gray', 'zinc', 'neutral', 'stone', 
            'red', 'orange', 'amber', 'yellow', 'lime', 
            'green', 'emerald', 'teal', 'cyan', 'sky', 
            'blue', 'indigo', 'violet', 'purple', 'fuchsia', 
            'pink', 'rose', 'white', 'black'
        ];
        
        this.shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
        
        this.spacing = [
            0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 
            14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96
        ];
        
        this.breakpoints = ['', 'sm:', 'md:', 'lg:', 'xl:', '2xl:'];
        this.modifiers = ['', 'hover:', 'focus:', 'active:', 'group-hover:', 'focus-within:', 'dark:'];
        
        this.classes = new Set();
        
        // 🎯 CLASES ESPECÍFICAS PARA PAGE BUILDER
        this.pageBuilderClasses = [
            // Editor específico
            'cursor-pointer', 'cursor-move', 'cursor-grab', 'cursor-grabbing',
            'select-none', 'user-select-none', 'pointer-events-none', 'pointer-events-auto',
            'outline-dashed', 'outline-2', 'outline-blue-500', 'outline-red-500',
            'min-h-screen', 'min-h-full', 'max-w-none', 'max-h-96', 'max-h-screen',
            
            // Animaciones y transiciones
            'transform', 'transition-all', 'transition-colors', 'transition-transform',
            'duration-75', 'duration-100', 'duration-150', 'duration-200', 'duration-300', 
            'duration-500', 'duration-700', 'duration-1000',
            'ease-in', 'ease-out', 'ease-in-out', 'ease-linear',
            'scale-95', 'scale-100', 'scale-105', 'scale-110',
            'rotate-1', 'rotate-2', 'rotate-3', 'rotate-6', 'rotate-12', '-rotate-1', '-rotate-2',
            'translate-x-1', 'translate-x-2', 'translate-y-1', 'translate-y-2',
            
            // Z-index para capas del editor
            'z-0', 'z-10', 'z-20', 'z-30', 'z-40', 'z-50', 'z-auto',
            
            // Alpine.js y interactividad
            'opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100',
            'invisible', 'visible',
            
            // Bordes y efectos especiales
            'border-dotted', 'border-dashed', 'border-double',
            'ring-1', 'ring-2', 'ring-4', 'ring-8',
            'ring-blue-500', 'ring-red-500', 'ring-green-500', 'ring-yellow-500',
            'ring-offset-1', 'ring-offset-2', 'ring-offset-4',
            
            // Efectos de sombra avanzados
            'drop-shadow-sm', 'drop-shadow', 'drop-shadow-md', 'drop-shadow-lg', 'drop-shadow-xl',
            
            // Backdrop filters (para modales, etc.)
            'backdrop-blur-none', 'backdrop-blur-sm', 'backdrop-blur', 'backdrop-blur-md',
            'backdrop-brightness-50', 'backdrop-brightness-75', 'backdrop-brightness-100',
            
            // Scroll específico
            'overflow-x-auto', 'overflow-y-auto', 'overflow-x-hidden', 'overflow-y-hidden',
            'overscroll-contain', 'overscroll-auto',
            'scroll-smooth', 'scroll-auto',
            
            // Aspect ratio
            'aspect-square', 'aspect-video', 'aspect-auto',
            
            // Container queries y responsive
            'container', 'mx-auto'
        ];
        
        console.log(`🎯 Proyecto detectado en: ${this.projectRoot}`);
    }

    // Todos los métodos de generación son iguales que en el script anterior
    generateColorClasses() {
        const properties = ['bg', 'text', 'border', 'ring', 'decoration', 'outline', 'shadow', 'from', 'via', 'to'];
        
        this.breakpoints.forEach(breakpoint => {
            this.modifiers.forEach(modifier => {
                properties.forEach(property => {
                    this.colors.forEach(color => {
                        if (['white', 'black'].includes(color)) {
                            this.classes.add(`${breakpoint}${modifier}${property}-${color}`);
                        } else {
                            this.shades.forEach(shade => {
                                this.classes.add(`${breakpoint}${modifier}${property}-${color}-${shade}`);
                            });
                        }
                    });
                });
            });
        });
        
        ['transparent', 'current', 'inherit'].forEach(special => {
            ['bg', 'text', 'border'].forEach(property => {
                this.classes.add(`${property}-${special}`);
            });
        });
    }

    generateSpacingClasses() {
        const properties = [
            'p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
            'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
            'gap', 'gap-x', 'gap-y',
            'space-x', 'space-y',
            'top', 'right', 'bottom', 'left',
            'inset', 'inset-x', 'inset-y'
        ];
        
        this.breakpoints.forEach(breakpoint => {
            properties.forEach(property => {
                this.spacing.forEach(value => {
                    this.classes.add(`${breakpoint}${property}-${value}`);
                    
                    if (['m', 'mx', 'my', 'mt', 'mr', 'mb', 'ml', 'top', 'right', 'bottom', 'left'].includes(property) && value !== 0) {
                        this.classes.add(`${breakpoint}-${property}-${value}`);
                    }
                });
                
                ['auto', 'full', 'screen', '1/2', '1/3', '2/3', '1/4', '3/4'].forEach(special => {
                    this.classes.add(`${breakpoint}${property}-${special}`);
                });
            });
        });
    }

    generateLayoutClasses() {
        const layouts = [
            'block', 'inline-block', 'inline', 'flex', 'inline-flex', 
            'table', 'inline-table', 'table-caption', 'table-cell', 
            'table-column', 'table-column-group', 'table-footer-group', 
            'table-header-group', 'table-row', 'table-row-group', 
            'flow-root', 'grid', 'inline-grid', 'contents', 'list-item', 'hidden',
            'static', 'fixed', 'absolute', 'relative', 'sticky',
            'flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse',
            'flex-wrap', 'flex-wrap-reverse', 'flex-nowrap',
            'flex-1', 'flex-auto', 'flex-initial', 'flex-none',
            'grow', 'grow-0', 'shrink', 'shrink-0',
            'justify-start', 'justify-end', 'justify-center', 'justify-between', 
            'justify-around', 'justify-evenly', 'justify-stretch',
            'items-start', 'items-end', 'items-center', 'items-baseline', 'items-stretch',
            'content-start', 'content-end', 'content-center', 'content-between', 
            'content-around', 'content-evenly', 'content-baseline', 'content-stretch',
            'self-auto', 'self-start', 'self-end', 'self-center', 'self-stretch', 'self-baseline'
        ];

        this.breakpoints.forEach(breakpoint => {
            layouts.forEach(layout => {
                this.classes.add(`${breakpoint}${layout}`);
            });
            
            for (let i = 1; i <= 12; i++) {
                this.classes.add(`${breakpoint}grid-cols-${i}`);
                this.classes.add(`${breakpoint}col-span-${i}`);
                this.classes.add(`${breakpoint}col-start-${i}`);
                this.classes.add(`${breakpoint}col-end-${i}`);
            }
            
            for (let i = 1; i <= 6; i++) {
                this.classes.add(`${breakpoint}grid-rows-${i}`);
                this.classes.add(`${breakpoint}row-span-${i}`);
                this.classes.add(`${breakpoint}row-start-${i}`);
                this.classes.add(`${breakpoint}row-end-${i}`);
            }
        });
    }

    generateTypographyClasses() {
        const fontSizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl'];
        const fontWeights = ['thin', 'extralight', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'];
        const textAligns = ['left', 'center', 'right', 'justify', 'start', 'end'];
        
        this.breakpoints.forEach(breakpoint => {
            fontSizes.forEach(size => {
                this.classes.add(`${breakpoint}text-${size}`);
            });
            
            fontWeights.forEach(weight => {
                this.classes.add(`${breakpoint}font-${weight}`);
            });
            
            textAligns.forEach(align => {
                this.classes.add(`${breakpoint}text-${align}`);
            });
        });
        
        const decorations = [
            'underline', 'overline', 'line-through', 'no-underline',
            'uppercase', 'lowercase', 'capitalize', 'normal-case',
            'italic', 'not-italic', 'antialiased', 'subpixel-antialiased'
        ];
        
        decorations.forEach(decoration => {
            this.classes.add(decoration);
        });
    }

    generateSizingClasses() {
        const sizingProps = ['w', 'h', 'min-w', 'min-h', 'max-w', 'max-h'];
        const sizes = [
            'auto', 'full', 'screen', 'min', 'max', 'fit',
            '1/2', '1/3', '2/3', '1/4', '2/4', '3/4',
            '1/5', '2/5', '3/5', '4/5',
            '1/6', '2/6', '3/6', '4/6', '5/6',
            '1/12', '2/12', '3/12', '4/12', '5/12', '6/12', '7/12', '8/12', '9/12', '10/12', '11/12'
        ];
        
        this.breakpoints.forEach(breakpoint => {
            sizingProps.forEach(prop => {
                this.spacing.forEach(space => {
                    this.classes.add(`${breakpoint}${prop}-${space}`);
                });
                
                sizes.forEach(size => {
                    this.classes.add(`${breakpoint}${prop}-${size}`);
                });
            });
        });
    }

    generateEffectClasses() {
        const shadows = ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'inner'];
        const rounded = ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'];
        const opacity = [0, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100];
        
        this.breakpoints.forEach(breakpoint => {
            this.modifiers.forEach(modifier => {
                shadows.forEach(shadow => {
                    this.classes.add(`${breakpoint}${modifier}shadow-${shadow}`);
                });
                
                rounded.forEach(round => {
                    this.classes.add(`${breakpoint}${modifier}rounded-${round}`);
                });
                
                opacity.forEach(op => {
                    this.classes.add(`${breakpoint}${modifier}opacity-${op}`);
                });
            });
        });
    }

    generatePageBuilderClasses() {
        this.pageBuilderClasses.forEach(cls => {
            this.classes.add(cls);
            
            if (['cursor-pointer', 'hidden', 'block', 'flex'].includes(cls)) {
                this.breakpoints.forEach(breakpoint => {
                    if (breakpoint) {
                        this.classes.add(`${breakpoint}${cls}`);
                    }
                });
            }
        });
    }

    generate() {
        console.log('🎨 Generando safelist completo de Tailwind CSS v4...');
        
        this.generateColorClasses();
        console.log('✅ Clases de colores generadas');
        
        this.generateSpacingClasses();
        console.log('✅ Clases de espaciado generadas');
        
        this.generateLayoutClasses();
        console.log('✅ Clases de layout generadas');
        
        this.generateTypographyClasses();
        console.log('✅ Clases de tipografía generadas');
        
        this.generateSizingClasses();
        console.log('✅ Clases de sizing generadas');
        
        this.generateEffectClasses();
        console.log('✅ Clases de efectos generadas');
        
        this.generatePageBuilderClasses();
        console.log('✅ Clases específicas del Page Builder generadas');
        
        return Array.from(this.classes).sort();
    }

    async save(classes) {
        try {
            // 1. Ensure directories exist
            const dirs = {
                resources: path.join(this.projectRoot, 'resources'),
                css: path.join(this.projectRoot, 'resources', 'css'),
                js: path.join(this.projectRoot, 'resources', 'js'),
                plugin: path.join(this.projectRoot, 'resources', 'js', 'block-builder', 'plugins', 'tailwind')
            };

            for (const [name, dir] of Object.entries(dirs)) {
                const created = await ensureDirectoryExists(dir);
                if (!created) throw new Error(`Failed to create ${name} directory`);
            }

            // 2. Write files with verification
            const files = [
                {
                    path: path.join(dirs.css, 'tailwind-safelist.css'),
                    content: `@import "tailwindcss";\n\n/* Safelist generado - ${classes.length} clases */\n@source inline("${classes.join(' ')}");`
                },
                {
                    path: path.join(dirs.css, 'tailwind-safelist.txt'),
                    content: classes.join('\n')
                },
                {
                    path: path.join(dirs.js, 'tailwind-safelist.js'),
                    content: `export const tailwindSafelist = [\n  "${classes.join('",\n  "')}"\n];\n\nexport default tailwindSafelist;`
                },
                {
                    path: path.join(dirs.plugin, 'generated-classes.js'),
                    content: `export const pageBuilderClasses = [\n  "${classes.join('",\n  "')}"\n];\n\nexport default pageBuilderClasses;`
                }
            ];

            for (const file of files) {
                try {
                    await fs.promises.writeFile(file.path, file.content, 'utf8');
                    console.log(`✅ Generated: ${file.path}`);
                } catch (error) {
                    console.error(`❌ Failed to write ${file.path}:`, error);
                    throw error;
                }
            }

            return true;
        } catch (error) {
            console.error('❌ Error in save():', error);
            throw error;
        }
    }

    getStats(classes) {
        const stats = {
            total: classes.length,
            byCategory: {},
            estimatedFileSize: `${Math.round(classes.join(' ').length / 1024)}KB`
        };
        
        const categories = {
            colors: classes.filter(c => c.match(/-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose|white|black)(-|$)/)),
            spacing: classes.filter(c => c.match(/^(.*-)?(p|m|gap|space)-/)),
            layout: classes.filter(c => c.match(/^(.*)?(flex|grid|block|inline|hidden)/)),
            typography: classes.filter(c => c.match(/^(.*)?(text|font)-/)),
            sizing: classes.filter(c => c.match(/^(.*)?(w|h|min-|max-)-/)),
            effects: classes.filter(c => c.match(/^(.*)?(shadow|rounded|opacity)-/)),
            pageBuilder: classes.filter(c => this.pageBuilderClasses.includes(c.replace(/^(sm:|md:|lg:|xl:|2xl:)/, '')))
        };
        
        Object.entries(categories).forEach(([name, classList]) => {
            stats.byCategory[name] = classList.length;
        });
        
        return stats;
    }
}

// ===================================================================
// EJECUCIÓN PRINCIPAL
// ===================================================================

async function main() {
    try {
        console.log('🚀 Iniciando generador de safelist para Tailwind v4...\n');
        
        const generator = new TailwindSafelistGenerator();
        const classes = generator.generate();
        const stats = generator.getStats(classes);
        
        console.log('\n📊 Estadísticas del Safelist:');
        console.log(`   📦 Total: ${stats.total.toLocaleString()} clases`);
        console.log(`   🎨 Colores: ${stats.byCategory.colors.toLocaleString()}`);
        console.log(`   📏 Espaciado: ${stats.byCategory.spacing.toLocaleString()}`);
        console.log(`   📐 Layout: ${stats.byCategory.layout.toLocaleString()}`);
        console.log(`   ✏️  Tipografía: ${stats.byCategory.typography.toLocaleString()}`);
        console.log(`   📊 Sizing: ${stats.byCategory.sizing.toLocaleString()}`);
        console.log(`   ✨ Efectos: ${stats.byCategory.effects.toLocaleString()}`);
        console.log(`   🎛️  Page Builder: ${stats.byCategory.pageBuilder.toLocaleString()}`);
        console.log(`   💾 Tamaño estimado: ${stats.estimatedFileSize}`);
        
        await generator.save(classes);
        
        console.log('\n🎉 ¡Safelist generado exitosamente!');
        console.log('\n🔧 Próximos pasos:');
        console.log('   1. Importa el safelist en tu resources/css/app.css:');
        console.log('      @import "./tailwind-safelist.css";');
        console.log('   2. Recompila: npm run build');
        console.log('   3. ¡Las clases dinámicas ya funcionarán!');
        
    } catch (error) {
        console.error('\n❌ Error durante la generación:', error);
        process.exit(1);
    }
}

// Ejecutar solo si este archivo es el principal
main().catch(error => {
    console.error('❌ Fallo irrecuperable en la ejecución del script:', error);
    process.exit(1);
});

export { TailwindSafelistGenerator };