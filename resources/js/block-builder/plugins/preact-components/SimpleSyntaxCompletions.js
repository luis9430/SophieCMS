// ===================================================================
// resources/js/block-builder/plugins/preact-components/SimpleSyntaxCompletions.js
// Autocompletado especializado para sintaxis simple Alpine-like
// ===================================================================

import { autocompletion } from '@codemirror/autocomplete';

// ===================================================================
// DEFINICIÓN DE COMPLETIONS
// ===================================================================

export const simpleSyntaxCompletions = [
    // ===================================================================
    // EVENTOS
    // ===================================================================
    {
        label: '@click',
        type: 'keyword',
        info: 'Click event handler',
        detail: 'onClick handler',
        snippet: '@click="${}"',
        section: 'Events'
    },
    {
        label: '@change',
        type: 'keyword',
        info: 'Change event handler',
        detail: 'onChange handler',
        snippet: '@change="${}"',
        section: 'Events'
    },
    {
        label: '@submit',
        type: 'keyword',
        info: 'Form submit handler',
        detail: 'onSubmit handler',
        snippet: '@submit="${}"',
        section: 'Events'
    },
    {
        label: '@input',
        type: 'keyword',
        info: 'Input event handler',
        detail: 'onInput handler',
        snippet: '@input="${}"',
        section: 'Events'
    },
    {
        label: '@focus',
        type: 'keyword',
        info: 'Focus event handler',
        detail: 'onFocus handler',
        snippet: '@focus="${}"',
        section: 'Events'
    },
    {
        label: '@blur',
        type: 'keyword',
        info: 'Blur event handler',
        detail: 'onBlur handler',
        snippet: '@blur="${}"',
        section: 'Events'
    },
    {
        label: '@keydown',
        type: 'keyword',
        info: 'Key down event handler',
        detail: 'onKeyDown handler',
        snippet: '@keydown="${}"',
        section: 'Events'
    },
    {
        label: '@keyup',
        type: 'keyword',
        info: 'Key up event handler',
        detail: 'onKeyUp handler',
        snippet: '@keyup="${}"',
        section: 'Events'
    },
    {
        label: '@mouseenter',
        type: 'keyword',
        info: 'Mouse enter event handler',
        detail: 'onMouseEnter handler',
        snippet: '@mouseenter="${}"',
        section: 'Events'
    },
    {
        label: '@mouseleave',
        type: 'keyword',
        info: 'Mouse leave event handler',
        detail: 'onMouseLeave handler',
        snippet: '@mouseleave="${}"',
        section: 'Events'
    },

    // ===================================================================
    // DIRECTIVAS DE ESTADO
    // ===================================================================
    {
        label: 'x-show',
        type: 'property',
        info: 'Conditionally show/hide element',
        detail: 'style={{display: condition ? \'block\' : \'none\'}}',
        snippet: 'x-show="${}"',
        section: 'State'
    },
    {
        label: 'x-text',
        type: 'property',
        info: 'Set text content dynamically',
        detail: 'Dynamic text content',
        snippet: 'x-text="${}"',
        section: 'State'
    },
    {
        label: 'x-if',
        type: 'property',
        info: 'Conditional rendering',
        detail: 'Renders element only if condition is true',
        snippet: 'x-if="${}"',
        section: 'State'
    },
    {
        label: 'x-model',
        type: 'property',
        info: 'Two-way data binding',
        detail: 'Binds input value to state variable',
        snippet: 'x-model="${}"',
        section: 'State'
    },

    // ===================================================================
    // DIRECTIVAS DE ESTILO
    // ===================================================================
    {
        label: ':class',
        type: 'property',
        info: 'Dynamic class binding',
        detail: 'className={expression}',
        snippet: ':class="${}"',
        section: 'Styling'
    },
    {
        label: ':style',
        type: 'property',
        info: 'Dynamic style binding',
        detail: 'style={{...}}',
        snippet: ':style="${}"',
        section: 'Styling'
    },

    // ===================================================================
    // SNIPPETS DE PATRONES COMUNES (SIN snippetCompletion)
    // ===================================================================
    {
        label: 'counter',
        type: 'snippet',
        detail: 'Simple counter component',
        info: 'Creates a button with click counter',
        section: 'Snippets',
        apply: `<div>
  <button @click="count = count + 1">
    Count: <span x-text="count"></span>
  </button>
</div>`
    },

    {
        label: 'toggle',
        type: 'snippet',
        detail: 'Toggle visibility component',
        info: 'Button that toggles element visibility',
        section: 'Snippets',
        apply: `<div>
  <button @click="isOpen = !isOpen">
    Toggle
  </button>
  <div x-show="isOpen">
    <p>Content is visible!</p>
  </div>
</div>`
    },

    {
        label: 'dropdown',
        type: 'snippet',
        detail: 'Dropdown menu component',
        info: 'Complete dropdown with options',
        section: 'Snippets',
        apply: `<div class="relative">
  <button @click="isOpen = !isOpen" class="px-4 py-2 bg-white border rounded">
    <span x-text="selected"></span>
  </button>
  
  <div x-show="isOpen" class="absolute mt-1 bg-white border rounded shadow-lg">
    <a @click="selected='Option 1', isOpen=false" class="block px-4 py-2 hover:bg-gray-100">
      Option 1
    </a>
    <a @click="selected='Option 2', isOpen=false" class="block px-4 py-2 hover:bg-gray-100">
      Option 2
    </a>
  </div>
</div>`
    },

    {
        label: 'form-input',
        type: 'snippet',
        detail: 'Form with input binding',
        info: 'Form with two-way data binding',
        section: 'Snippets',
        apply: `<form @submit="handleSubmit">
  <input x-model="name" placeholder="Enter name" class="border p-2 rounded" />
  <div x-show="name.length > 0">
    Hello, <span x-text="name"></span>!
  </div>
  <button type="submit" class="px-4 py-2 bg-blue-500 text-white rounded">
    Submit
  </button>
</form>`
    },

    {
        label: 'modal',
        type: 'snippet',
        detail: 'Modal dialog component',
        info: 'Complete modal with backdrop',
        section: 'Snippets',
        apply: `<div>
  <button @click="showModal = true" class="px-4 py-2 bg-blue-500 text-white rounded">
    Open Modal
  </button>
  
  <div x-show="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
      <h3 class="text-lg font-bold mb-4">Modal Title</h3>
      <p class="mb-4">Modal content goes here.</p>
      <div class="flex gap-2 justify-end">
        <button @click="showModal = false" class="px-4 py-2 bg-gray-500 text-white rounded">
          Cancel
        </button>
        <button @click="showModal = false" class="px-4 py-2 bg-blue-500 text-white rounded">
          Confirm
        </button>
      </div>
    </div>
  </div>
</div>`
    },

    {
        label: 'tabs',
        type: 'snippet',
        detail: 'Tab navigation component',
        info: 'Simple tab interface',
        section: 'Snippets',
        apply: `<div>
  <div class="flex border-b">
    <button @click="activeTab = 'tab1'" :class="activeTab === 'tab1' ? 'border-b-2 border-blue-500' : ''" class="px-4 py-2">
      Tab 1
    </button>
    <button @click="activeTab = 'tab2'" :class="activeTab === 'tab2' ? 'border-b-2 border-blue-500' : ''" class="px-4 py-2">
      Tab 2
    </button>
  </div>
  
  <div class="p-4">
    <div x-show="activeTab === 'tab1'">
      <h3>Tab 1 Content</h3>
      <p>Content for the first tab.</p>
    </div>
    <div x-show="activeTab === 'tab2'">
      <h3>Tab 2 Content</h3>
      <p>Content for the second tab.</p>
    </div>
  </div>
</div>`
    }
];

// ===================================================================
// FUNCIÓN DE AUTOCOMPLETADO
// ===================================================================

export function createSimpleSyntaxCompletionSource() {
    return (context) => {
        const word = context.matchBefore(/[@:x-]\w*/);
        if (!word) {
            // Si no hay palabra específica, mostrar snippets al escribir
            const beforeCursor = context.state.doc.sliceString(
                Math.max(0, context.pos - 10), 
                context.pos
            );
            
            // Mostrar snippets si estamos en una nueva línea o después de >
            if (beforeCursor.match(/(\n|>)\s*$/)) {
                return {
                    from: context.pos,
                    options: simpleSyntaxCompletions.filter(comp => comp.type === 'snippet')
                };
            }
            
            return null;
        }

        const options = simpleSyntaxCompletions.filter(completion => 
            completion.label.toLowerCase().includes(word.text.toLowerCase())
        );

        if (options.length === 0) return null;

        // Agrupar por sección para mejor organización
        const groupedOptions = groupCompletionsBySection(options);

        return {
            from: word.from,
            options: groupedOptions,
            // Configuración adicional
            validFor: /^[@:x-]\w*$/
        };
    };
}

// ===================================================================
// UTILIDADES
// ===================================================================

function groupCompletionsBySection(completions) {
    const sections = ['Events', 'State', 'Styling', 'Snippets'];
    const grouped = [];
    
    sections.forEach(section => {
        const sectionCompletions = completions.filter(comp => comp.section === section);
        if (sectionCompletions.length > 0) {
            // Agregar separador de sección si no es la primera
            if (grouped.length > 0) {
                grouped.push({
                    label: `— ${section} —`,
                    type: 'text',
                    apply: () => {},
                    detail: ''
                });
            }
            grouped.push(...sectionCompletions);
        }
    });
    
    return grouped;
}

// ===================================================================
// EXTENSIÓN PARA CODEMIRROR
// ===================================================================

export function createSimpleSyntaxExtension() {
    return [
        // Autocompletado
        createSimpleSyntaxCompletionSource(),
        
        // Key bindings específicos
        // Puedes agregar atajos de teclado aquí si los necesitas
    ];
}

// ===================================================================
// FUNCIÓN DE INTEGRACIÓN
// ===================================================================

export function integrateSimpleSyntaxWithCodeMirror(editorExtensions = []) {
    return [
        ...editorExtensions,
        createSimpleSyntaxExtension()
    ];
}