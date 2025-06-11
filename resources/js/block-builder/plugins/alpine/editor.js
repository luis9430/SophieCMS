// plugins/alpine/editor.js - Editor funcionalidad como plugin

import { alpineDirectives, alpineModifiers } from './metadata.js';

export class AlpineEditor {
    constructor() {
        this.name = 'alpine-editor';
        this.version = '1.0.0';
        this.directives = alpineDirectives;
        this.modifiers = alpineModifiers;
    }

    // ✅ Autocompletado de directivas Alpine
    getCompletions(context) {
        const { line, ch, token } = context;
        const completions = [];

        // Completado de directivas x-
        if (token.string.startsWith('x-') || token.string === 'x') {
            Object.keys(this.directives).forEach(directive => {
                completions.push({
                    text: directive,
                    displayText: directive,
                    info: this.directives[directive].description,
                    type: 'directive'
                });
            });
        }

        // Completado de modificadores después de .
        if (token.string.includes('.')) {
            const parts = token.string.split('.');
            const directive = parts[0];
            
            if (this.directives[directive] && this.directives[directive].modifiers) {
                this.directives[directive].modifiers.forEach(modifier => {
                    completions.push({
                        text: modifier,
                        displayText: modifier,
                        info: this.modifiers[modifier]?.description || '',
                        type: 'modifier'
                    });
                });
            }
        }

        return completions;
    }

    // ✅ Validación de sintaxis Alpine
    validateSyntax(code) {
        const errors = [];
        const warnings = [];

        // Validar directivas x-
        const directivePattern = /x-[\w-]+(?:\.[\w-]+)*/g;
        let match;

        while ((match = directivePattern.exec(code)) !== null) {
            const directive = match[0];
            const [baseName, ...modifiers] = directive.split('.');

            // Verificar si la directiva existe
            if (!this.directives[baseName]) {
                errors.push({
                    line: this._getLineNumber(code, match.index),
                    column: this._getColumnNumber(code, match.index),
                    message: `Unknown Alpine directive: ${baseName}`,
                    severity: 'error'
                });
            } else {
                // Verificar modificadores
                modifiers.forEach(mod => {
                    if (this.directives[baseName].modifiers && 
                        !this.directives[baseName].modifiers.includes(mod)) {
                        warnings.push({
                            line: this._getLineNumber(code, match.index),
                            column: this._getColumnNumber(code, match.index),
                            message: `Unknown modifier '${mod}' for directive '${baseName}'`,
                            severity: 'warning'
                        });
                    }
                });
            }
        }

        return { errors, warnings };
    }

    // ✅ Formatear código Alpine
    formatCode(code) {
        // Formateo básico de directivas Alpine
        return code
            .replace(/\s*x-data\s*=\s*"/g, ' x-data="')
            .replace(/\s*x-show\s*=\s*"/g, ' x-show="')
            .replace(/\s*x-if\s*=\s*"/g, ' x-if="')
            .replace(/\s*@click\s*=\s*"/g, ' @click="')
            .replace(/\s*@\w+\s*=\s*"/g, (match) => ` ${match.trim()}`)
            .replace(/\s+/g, ' ')
            .trim();
    }

    // ✅ Obtener información de hover
    getHoverInfo(position, code) {
        const word = this._getWordAtPosition(position, code);
        
        if (word.startsWith('x-')) {
            const [directive, ...modifiers] = word.split('.');
            const info = this.directives[directive];
            
            if (info) {
                return {
                    title: directive,
                    description: info.description,
                    example: info.example || '',
                    modifiers: info.modifiers || [],
                    docs: info.docs || ''
                };
            }
        }

        return null;
    }

    // ✅ Snippets de código Alpine
    getSnippets() {
        return [
            {
                trigger: 'x-data',
                content: 'x-data="{ ${1:property}: ${2:value} }"',
                description: 'Alpine data binding'
            },
            {
                trigger: 'x-show',
                content: 'x-show="${1:condition}"',
                description: 'Alpine conditional visibility'
            },
            {
                trigger: 'x-if',
                content: 'x-if="${1:condition}"',
                description: 'Alpine conditional rendering'
            },
            {
                trigger: '@click',
                content: '@click="${1:handler}"',
                description: 'Alpine click event'
            },
            {
                trigger: 'x-for',
                content: 'x-for="${1:item} in ${2:items}"',
                description: 'Alpine loop'
            }
        ];
    }

    // ✅ Métodos utilitarios
    _getLineNumber(text, index) {
        return text.substring(0, index).split('\n').length;
    }

    _getColumnNumber(text, index) {
        const lines = text.substring(0, index).split('\n');
        return lines[lines.length - 1].length + 1;
    }

    _getWordAtPosition(position, code) {
        const lines = code.split('\n');
        const line = lines[position.line] || '';
        const words = line.split(/\s+/);
        
        let currentPos = 0;
        for (const word of words) {
            if (currentPos <= position.ch && position.ch <= currentPos + word.length) {
                return word;
            }
            currentPos += word.length + 1;
        }
        
        return '';
    }
}

// ✅ Funciones para CodeMirror
export function createAlpineMode(CodeMirror) {
    CodeMirror.defineMode('alpine-html', function(config) {
        return CodeMirror.overlayMode(
            CodeMirror.getMode(config, 'text/html'),
            {
                token: function(stream) {
                    if (stream.match(/x-[\w-]+(?:\.[\w-]+)*/)) {
                        return 'alpine-directive';
                    }
                    if (stream.match(/@[\w-]+/)) {
                        return 'alpine-event';
                    }
                    stream.next();
                    return null;
                }
            }
        );
    });
}

export function registerAlpineHints(CodeMirror) {
    const alpineEditor = new AlpineEditor();
    
    CodeMirror.registerHelper('hint', 'alpine-html', function(cm) {
        const cursor = cm.getCursor();
        const token = cm.getTokenAt(cursor);
        
        const completions = alpineEditor.getCompletions({
            line: cursor.line,
            ch: cursor.ch,
            token: token
        });
        
        return {
            list: completions,
            from: CodeMirror.Pos(cursor.line, token.start),
            to: CodeMirror.Pos(cursor.line, token.end)
        };
    });
}