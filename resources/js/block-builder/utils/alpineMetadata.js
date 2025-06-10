// ===================================================================
// utils/alpineMetadata.js
// Responsabilidad: Definir TODA la metadata de Alpine.js
// ===================================================================

/**
 * Directivas principales de Alpine.js con metadata completa
 */
export const alpineDirectives = {
    // 🎯 CORE DIRECTIVES
    'x-data': {
        description: 'Define el ámbito reactivo del componente',
        syntax: 'object|function',
        example: 'x-data="{ count: 0, name: \'Alpine\' }"',
        category: 'core',
        expectsValue: true,
        valueType: 'javascript-object'
    },
    'x-init': {
        description: 'Ejecuta código cuando el componente se inicializa',
        syntax: 'expression',
        example: 'x-init="console.log(\'Componente iniciado\')"',
        category: 'lifecycle',
        expectsValue: true,
        valueType: 'javascript-expression'
    },
    'x-show': {
        description: 'Alternar visibilidad (display none/block)',
        syntax: 'expression',
        example: 'x-show="isVisible"',
        category: 'display',
        expectsValue: true,
        valueType: 'boolean-expression'
    },
    'x-if': {
        description: 'Renderizado condicional (añade/remueve del DOM)',
        syntax: 'expression', 
        example: 'x-if="user.isAdmin"',
        category: 'display',
        expectsValue: true,
        valueType: 'boolean-expression',
        needsTemplate: true
    },
    'x-for': {
        description: 'Renderizar lista de elementos',
        syntax: 'item in items',
        example: 'x-for="item in items"',
        category: 'loops',
        expectsValue: true,
        valueType: 'for-expression',
        needsTemplate: true
    },
    'x-text': {
        description: 'Establece el contenido de texto del elemento',
        syntax: 'expression',
        example: 'x-text="message"',
        category: 'content',
        expectsValue: true,
        valueType: 'any-expression'
    },
    'x-html': {
        description: 'Establece el contenido HTML del elemento',
        syntax: 'expression',
        example: 'x-html="htmlContent"',
        category: 'content',
        expectsValue: true,
        valueType: 'string-expression',
        warning: 'Cuidado con XSS - solo usar con contenido confiable'
    },
    'x-model': {
        description: 'Vinculación bidireccional de datos',
        syntax: 'property',
        example: 'x-model="email"',
        category: 'forms',
        expectsValue: true,
        valueType: 'property-reference'
    },
    'x-bind': {
        description: 'Vincula atributos dinámicamente',
        syntax: 'attribute="expression"',
        example: 'x-bind:class="isActive ? \'active\' : \'\'"',
        category: 'attributes',
        expectsValue: true,
        valueType: 'any-expression',
        shorthand: ':'
    },
    'x-on': {
        description: 'Escucha eventos del DOM',
        syntax: 'event="expression"',
        example: 'x-on:click="increment()"',
        category: 'events',
        expectsValue: true,
        valueType: 'javascript-expression',
        shorthand: '@'
    },
    'x-ref': {
        description: 'Referencia directa al elemento DOM',
        syntax: 'string',
        example: 'x-ref="button"',
        category: 'references',
        expectsValue: true,
        valueType: 'string'
    },
    'x-cloak': {
        description: 'Oculta elemento hasta que Alpine esté listo',
        syntax: 'none',
        example: 'x-cloak',
        category: 'utility',
        expectsValue: false
    },
    'x-ignore': {
        description: 'Ignora este elemento y sus hijos',
        syntax: 'none',
        example: 'x-ignore',
        category: 'utility',
        expectsValue: false
    },
    'x-effect': {
        description: 'Ejecuta código cuando cambian las dependencias',
        syntax: 'expression',
        example: 'x-effect="console.log(count)"',
        category: 'reactivity',
        expectsValue: true,
        valueType: 'javascript-expression'
    },
    'x-transition': {
        description: 'Aplica transiciones CSS',
        syntax: 'none|modifiers',
        example: 'x-transition.duration.500ms',
        category: 'animations',
        expectsValue: false,
        hasModifiers: true
    },
    'x-modelable': {
        description: 'Define prop que puede usar x-model externamente',
        syntax: 'property',
        example: 'x-modelable="value"',
        category: 'advanced',
        expectsValue: true,
        valueType: 'property-reference'
    },
    'x-teleport': {
        description: 'Mueve elemento a otro lugar del DOM',
        syntax: 'selector',
        example: 'x-teleport="body"',
        category: 'advanced',
        expectsValue: true,
        valueType: 'css-selector'
    },
    'x-id': {
        description: 'Genera IDs únicos para accesibilidad',
        syntax: 'array',
        example: 'x-id="[\'name\', \'email\']"',
        category: 'accessibility',
        expectsValue: true,
        valueType: 'array'
    }
};

/**
 * Eventos comunes con shorthand @
 */
export const alpineEvents = {
    // 🖱️ MOUSE EVENTS
    '@click': {
        description: 'Click del mouse',
        example: '@click="handleClick()"',
        category: 'mouse'
    },
    '@dblclick': {
        description: 'Doble click',
        example: '@dblclick="handleDoubleClick()"',
        category: 'mouse'
    },
    '@mouseenter': {
        description: 'Mouse entra al elemento',
        example: '@mouseenter="isHovered = true"',
        category: 'mouse'
    },
    '@mouseleave': {
        description: 'Mouse sale del elemento',
        example: '@mouseleave="isHovered = false"',
        category: 'mouse'
    },
    '@mouseover': {
        description: 'Mouse sobre el elemento',
        example: '@mouseover="showTooltip = true"',
        category: 'mouse'
    },
    '@mousedown': {
        description: 'Botón del mouse presionado',
        example: '@mousedown="startDrag()"',
        category: 'mouse'
    },
    '@mouseup': {
        description: 'Botón del mouse liberado',
        example: '@mouseup="endDrag()"',
        category: 'mouse'
    },
    
    // ⌨️ KEYBOARD EVENTS
    '@keydown': {
        description: 'Tecla presionada',
        example: '@keydown.enter="submit()"',
        category: 'keyboard',
        modifiers: ['enter', 'space', 'tab', 'escape', 'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right']
    },
    '@keyup': {
        description: 'Tecla liberada',
        example: '@keyup.escape="closeModal()"',
        category: 'keyboard',
        modifiers: ['enter', 'space', 'tab', 'escape']
    },
    '@keypress': {
        description: 'Tecla presionada (deprecated)',
        example: '@keypress="handleKeyPress()"',
        category: 'keyboard',
        deprecated: true
    },
    
    // 📝 FORM EVENTS
    '@input': {
        description: 'Valor del input cambia',
        example: '@input="updateSearch($event.target.value)"',
        category: 'forms'
    },
    '@change': {
        description: 'Valor confirmado (blur en inputs)',
        example: '@change="validateField()"',
        category: 'forms'
    },
    '@submit': {
        description: 'Formulario enviado',
        example: '@submit.prevent="handleSubmit()"',
        category: 'forms',
        modifiers: ['prevent', 'stop']
    },
    '@focus': {
        description: 'Elemento recibe foco',
        example: '@focus="isFocused = true"',
        category: 'forms'
    },
    '@blur': {
        description: 'Elemento pierde foco',
        example: '@blur="validateField()"',
        category: 'forms'
    },
    '@select': {
        description: 'Texto seleccionado',
        example: '@select="handleTextSelection()"',
        category: 'forms'
    },
    
    // 🌐 WINDOW/DOCUMENT EVENTS
    '@resize': {
        description: 'Ventana redimensionada',
        example: '@resize.window="handleResize()"',
        category: 'window',
        modifiers: ['window', 'document']
    },
    '@scroll': {
        description: 'Scroll del elemento',
        example: '@scroll.window="handleScroll()"',
        category: 'window',
        modifiers: ['window', 'document']
    },
    '@load': {
        description: 'Recurso cargado',
        example: '@load.window="onPageLoad()"',
        category: 'window'
    },
    '@beforeunload': {
        description: 'Antes de cerrar ventana',
        example: '@beforeunload.window="confirmExit()"',
        category: 'window'
    },
    
    // 🎯 CUSTOM EVENTS
    '@custom-event': {
        description: 'Evento personalizado',
        example: '@custom-event="handleCustom()"',
        category: 'custom'
    }
};

/**
 * Variables mágicas de Alpine ($store, $el, etc.)
 */
export const alpineMagicProperties = {
    '$el': {
        description: 'Referencia al elemento DOM actual',
        example: '$el.classList.add(\'active\')',
        returnType: 'HTMLElement',
        category: 'dom'
    },
    '$refs': {
        description: 'Objeto con referencias x-ref',
        example: '$refs.button.focus()',
        returnType: 'object',
        category: 'dom'
    },
    '$store': {
        description: 'Acceso al store global',
        example: '$store.auth.user.name',
        returnType: 'object',
        category: 'state'
    },
    '$watch': {
        description: 'Observar cambios en datos',
        example: '$watch(\'count\', value => console.log(value))',
        returnType: 'function',
        category: 'reactivity'
    },
    '$dispatch': {
        description: 'Despachar eventos personalizados',
        example: '$dispatch(\'notify\', { message: \'Hello\' })',
        returnType: 'function',
        category: 'events'
    },
    '$nextTick': {
        description: 'Ejecutar en el siguiente tick del DOM',
        example: '$nextTick(() => $refs.input.focus())',
        returnType: 'function',
        category: 'lifecycle'
    },
    '$root': {
        description: 'Datos del componente raíz',
        example: '$root.globalCounter',
        returnType: 'object',
        category: 'state'
    },
    '$data': {
        description: 'Datos del componente actual',
        example: '$data.count',
        returnType: 'object',
        category: 'state'
    },
    '$id': {
        description: 'Generar ID único',
        example: '$id(\'dropdown\')',
        returnType: 'function',
        category: 'utility'
    }
};

/**
 * Modificadores disponibles para eventos y directivas
 */
export const alpineModifiers = {
    // Event Modifiers
    'prevent': {
        description: 'Previene el comportamiento por defecto',
        applies: ['events'],
        example: '@submit.prevent="handleSubmit()"'
    },
    'stop': {
        description: 'Detiene la propagación del evento',
        applies: ['events'],
        example: '@click.stop="doSomething()"'
    },
    'outside': {
        description: 'Ejecuta cuando se hace click fuera',
        applies: ['@click'],
        example: '@click.outside="closeDropdown()"'
    },
    'window': {
        description: 'Escucha el evento en window',
        applies: ['events'],
        example: '@resize.window="handleResize()"'
    },
    'document': {
        description: 'Escucha el evento en document',
        applies: ['events'],
        example: '@click.document="handleDocumentClick()"'
    },
    'once': {
        description: 'Ejecuta solo una vez',
        applies: ['events'],
        example: '@click.once="initialize()"'
    },
    'passive': {
        description: 'Añade evento como passive',
        applies: ['events'],
        example: '@scroll.passive="handleScroll()"'
    },
    'capture': {
        description: 'Usa capture phase',
        applies: ['events'],
        example: '@click.capture="handleClick()"'
    },
    
    // Key Modifiers
    'enter': { description: 'Tecla Enter', applies: ['@keydown', '@keyup'] },
    'tab': { description: 'Tecla Tab', applies: ['@keydown', '@keyup'] },
    'space': { description: 'Tecla Espacio', applies: ['@keydown', '@keyup'] },
    'escape': { description: 'Tecla Escape', applies: ['@keydown', '@keyup'] },
    'arrow-up': { description: 'Flecha arriba', applies: ['@keydown', '@keyup'] },
    'arrow-down': { description: 'Flecha abajo', applies: ['@keydown', '@keyup'] },
    'arrow-left': { description: 'Flecha izquierda', applies: ['@keydown', '@keyup'] },
    'arrow-right': { description: 'Flecha derecha', applies: ['@keydown', '@keyup'] },
    
    // Transition Modifiers
    'duration': {
        description: 'Duración de la transición',
        applies: ['x-transition'],
        example: 'x-transition.duration.500ms'
    },
    'opacity': {
        description: 'Transición de opacidad',
        applies: ['x-transition'],
        example: 'x-transition.opacity'
    },
    'scale': {
        description: 'Transición de escala',
        applies: ['x-transition'],
        example: 'x-transition.scale'
    }
};

/**
 * Snippets de código Alpine comunes
 */
export const alpineSnippets = {
    'component': {
        label: 'Componente básico Alpine',
        description: 'Componente Alpine con datos reactivos',
        template: `<div x-data="{ \${1:name}: \${2:value} }">
    \${3:<!-- Contenido del componente -->}
</div>`,
        category: 'components'
    },
    'counter': {
        label: 'Contador simple',
        description: 'Contador con botones de incremento/decremento',
        template: `<div x-data="{ count: 0 }">
    <button @click="count--">-</button>
    <span x-text="count"></span>
    <button @click="count++">+</button>
</div>`,
        category: 'examples'
    },
    'toggle': {
        label: 'Toggle/Switch',
        description: 'Botón que alterna visibilidad',
        template: `<div x-data="{ open: false }">
    <button @click="open = !open">Toggle</button>
    <div x-show="open" x-transition>
        \${1:Contenido a mostrar/ocultar}
    </div>
</div>`,
        category: 'examples'
    },
    'modal': {
        label: 'Modal básico',
        description: 'Modal que se abre/cierra',
        template: `<div x-data="{ modalOpen: false }">
    <button @click="modalOpen = true">Abrir Modal</button>
    
    <div x-show="modalOpen" 
         x-transition.opacity
         @click.outside="modalOpen = false"
         class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div class="bg-white p-6 rounded-lg">
            <h2>\${1:Título del Modal}</h2>
            <p>\${2:Contenido del modal}</p>
            <button @click="modalOpen = false">Cerrar</button>
        </div>
    </div>
</div>`,
        category: 'examples'
    },
    'form': {
        label: 'Formulario reactivo',
        description: 'Formulario con validación básica',
        template: `<form x-data="{ 
    email: '', 
    message: '',
    errors: {},
    submit() {
        // Lógica de envío
        console.log({ email: this.email, message: this.message });
    }
}" @submit.prevent="submit()">
    <input type="email" x-model="email" placeholder="Email">
    <textarea x-model="message" placeholder="Mensaje"></textarea>
    <button type="submit">Enviar</button>
</form>`,
        category: 'examples'
    },
    'dropdown': {
        label: 'Dropdown menu',
        description: 'Menú desplegable',
        template: `<div x-data="{ dropdownOpen: false }" class="relative">
    <button @click="dropdownOpen = !dropdownOpen">
        \${1:Menú} ▼
    </button>
    
    <div x-show="dropdownOpen" 
         x-transition
         @click.outside="dropdownOpen = false"
         class="absolute top-full left-0 bg-white border rounded shadow-lg">
        <a href="#" class="block px-4 py-2">Opción 1</a>
        <a href="#" class="block px-4 py-2">Opción 2</a>
        <a href="#" class="block px-4 py-2">Opción 3</a>
    </div>
</div>`,
        category: 'examples'
    },
    'tabs': {
        label: 'Sistema de tabs',
        description: 'Pestañas navegables',
        template: `<div x-data="{ activeTab: 'tab1' }">
    <div class="flex border-b">
        <button @click="activeTab = 'tab1'" 
                :class="{ 'border-b-2 border-blue-500': activeTab === 'tab1' }">
            Tab 1
        </button>
        <button @click="activeTab = 'tab2'"
                :class="{ 'border-b-2 border-blue-500': activeTab === 'tab2' }">
            Tab 2
        </button>
    </div>
    
    <div x-show="activeTab === 'tab1'" x-transition>
        \${1:Contenido Tab 1}
    </div>
    <div x-show="activeTab === 'tab2'" x-transition>
        \${2:Contenido Tab 2}
    </div>
</div>`,
        category: 'examples'
    },
    'accordion': {
        label: 'Acordeón',
        description: 'Secciones expandibles',
        template: `<div x-data="{ openSection: null }">
    <div class="border rounded">
        <button @click="openSection = openSection === 1 ? null : 1"
                class="w-full text-left p-4 border-b">
            \${1:Sección 1} <span x-text="openSection === 1 ? '-' : '+'"></span>
        </button>
        <div x-show="openSection === 1" x-transition class="p-4">
            \${2:Contenido de la sección 1}
        </div>
    </div>
    
    <div class="border rounded mt-2">
        <button @click="openSection = openSection === 2 ? null : 2"
                class="w-full text-left p-4 border-b">
            \${3:Sección 2} <span x-text="openSection === 2 ? '-' : '+'"></span>
        </button>
        <div x-show="openSection === 2" x-transition class="p-4">
            \${4:Contenido de la sección 2}
        </div>
    </div>
</div>`,
        category: 'examples'
    }
};

/**
 * Obtener todas las directivas (incluyendo eventos)
 */
export const getAllAlpineDirectives = () => {
    return {
        ...alpineDirectives,
        ...alpineEvents
    };
};

/**
 * Obtener directivas por categoría
 */
export const getDirectivesByCategory = (category) => {
    const allDirectives = getAllAlpineDirectives();
    return Object.entries(allDirectives)
        .filter(([, directive]) => directive.category === category)
        .reduce((acc, [name, directive]) => {
            acc[name] = directive;
            return acc;
        }, {});
};

/**
 * Verificar si una directiva existe
 */
export const isValidAlpineDirective = (directiveName) => {
    const allDirectives = getAllAlpineDirectives();
    
    // Verificar directiva exacta
    if (allDirectives[directiveName]) {
        return true;
    }
    
    // Verificar patrones como x-bind:class, x-on:click
    if (directiveName.includes(':')) {
        const [prefix] = directiveName.split(':');
        return allDirectives[prefix] !== undefined;
    }
    
    // Verificar @eventos con modificadores como @click.prevent
    if (directiveName.startsWith('@') && directiveName.includes('.')) {
        const baseEvent = directiveName.split('.')[0];
        return allDirectives[baseEvent] !== undefined;
    }
    
    return false;
};

/**
 * Obtener información de una directiva
 */
export const getDirectiveInfo = (directiveName) => {
    const allDirectives = getAllAlpineDirectives();
    
    // Directiva exacta
    if (allDirectives[directiveName]) {
        return allDirectives[directiveName];
    }
    
    // Para x-bind:class, devolver info de x-bind
    if (directiveName.includes(':')) {
        const [prefix] = directiveName.split(':');
        return allDirectives[prefix];
    }
    
    // Para @click.prevent, devolver info de @click
    if (directiveName.startsWith('@') && directiveName.includes('.')) {
        const baseEvent = directiveName.split('.')[0];
        return allDirectives[baseEvent];
    }
    
    return null;
};