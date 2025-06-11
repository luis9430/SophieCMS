// plugins/alpine/metadata.js - Metadatos de Alpine.js

export const alpineDirectives = {
    'x-data': {
        description: 'Define el scope de datos del componente Alpine',
        example: 'x-data="{ count: 0, message: \'Hello\' }"',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/data'
    },
    
    'x-show': {
        description: 'Muestra/oculta elemento basado en expresión',
        example: 'x-show="isVisible"',
        modifiers: ['transition'],
        docs: 'https://alpinejs.dev/directives/show'
    },
    
    'x-if': {
        description: 'Renderiza elemento condicionalmente',
        example: 'x-if="user.isLoggedIn"',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/if'
    },
    
    'x-for': {
        description: 'Itera sobre arrays u objetos',
        example: 'x-for="item in items"',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/for'
    },
    
    'x-text': {
        description: 'Establece el contenido de texto del elemento',
        example: 'x-text="message"',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/text'
    },
    
    'x-html': {
        description: 'Establece el contenido HTML del elemento',
        example: 'x-html="htmlContent"',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/html'
    },
    
    'x-bind': {
        description: 'Vincula atributos a expresiones',
        example: 'x-bind:class="{ active: isActive }"',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/bind'
    },
    
    'x-on': {
        description: 'Escucha eventos',
        example: 'x-on:click="handleClick"',
        modifiers: ['prevent', 'stop', 'outside', 'window', 'document', 'once', 'debounce', 'throttle'],
        docs: 'https://alpinejs.dev/directives/on'
    },
    
    'x-model': {
        description: 'Vinculación bidireccional de datos',
        example: 'x-model="username"',
        modifiers: ['lazy', 'number', 'debounce', 'throttle'],
        docs: 'https://alpinejs.dev/directives/model'
    },
    
    'x-init': {
        description: 'Ejecuta código cuando se inicializa el componente',
        example: 'x-init="console.log(\'Component initialized\')"',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/init'
    },
    
    'x-effect': {
        description: 'Ejecuta código cuando cambian las dependencias',
        example: 'x-effect="console.log(count)"',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/effect'
    },
    
    'x-ref': {
        description: 'Referencia al elemento DOM',
        example: 'x-ref="button"',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/ref'
    },
    
    'x-cloak': {
        description: 'Oculta elemento hasta que Alpine se inicialice',
        example: 'x-cloak',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/cloak'
    },
    
    'x-ignore': {
        description: 'Ignora el elemento y sus hijos',
        example: 'x-ignore',
        modifiers: [],
        docs: 'https://alpinejs.dev/directives/ignore'
    },
    
    'x-transition': {
        description: 'Aplica transiciones CSS',
        example: 'x-transition',
        modifiers: ['enter', 'enter-start', 'enter-end', 'leave', 'leave-start', 'leave-end'],
        docs: 'https://alpinejs.dev/directives/transition'
    }
};

export const alpineModifiers = {
    // Event modifiers
    'prevent': {
        description: 'Previene el comportamiento por defecto del evento',
        example: '@click.prevent'
    },
    'stop': {
        description: 'Detiene la propagación del evento',
        example: '@click.stop'
    },
    'outside': {
        description: 'Escucha clicks fuera del elemento',
        example: '@click.outside'
    },
    'window': {
        description: 'Escucha eventos en la ventana',
        example: '@resize.window'
    },
    'document': {
        description: 'Escucha eventos en el documento',
        example: '@keydown.document'
    },
    'once': {
        description: 'Ejecuta el handler solo una vez',
        example: '@click.once'
    },
    'debounce': {
        description: 'Debounce del evento (250ms por defecto)',
        example: '@input.debounce'
    },
    'throttle': {
        description: 'Throttle del evento (250ms por defecto)',
        example: '@scroll.throttle'
    },
    
    // Model modifiers
    'lazy': {
        description: 'Sincroniza en evento change en lugar de input',
        example: 'x-model.lazy'
    },
    'number': {
        description: 'Convierte automáticamente el valor a número',
        example: 'x-model.number'
    },
    
    // Transition modifiers
    'enter': {
        description: 'Clases aplicadas durante toda la fase de entrada',
        example: 'x-transition:enter'
    },
    'enter-start': {
        description: 'Clases aplicadas antes de que comience la entrada',
        example: 'x-transition:enter-start'
    },
    'enter-end': {
        description: 'Clases aplicadas después de que termine la entrada',
        example: 'x-transition:enter-end'
    },
    'leave': {
        description: 'Clases aplicadas durante toda la fase de salida',
        example: 'x-transition:leave'
    },
    'leave-start': {
        description: 'Clases aplicadas antes de que comience la salida',
        example: 'x-transition:leave-start'
    },
    'leave-end': {
        description: 'Clases aplicadas después de que termine la salida',
        example: 'x-transition:leave-end'
    }
};

// ✅ Magic properties de Alpine
export const alpineMagics = {
    '$el': {
        description: 'Referencia al elemento DOM actual',
        example: '$el.classList.add("active")'
    },
    '$refs': {
        description: 'Objeto con referencias a elementos con x-ref',
        example: '$refs.button.click()'
    },
    '$store': {
        description: 'Acceso al store global de Alpine',
        example: '$store.user.name'
    },
    '$watch': {
        description: 'Observa cambios en una propiedad',
        example: '$watch("count", value => console.log(value))'
    },
    '$dispatch': {
        description: 'Despacha un evento personalizado',
        example: '$dispatch("custom-event", { data: "value" })'
    },
    '$nextTick': {
        description: 'Ejecuta callback después del siguiente tick de DOM',
        example: '$nextTick(() => { /* código */ })'
    },
    '$root': {
        description: 'Referencia al elemento raíz del componente',
        example: '$root.getAttribute("data-id")'
    },
    '$data': {
        description: 'Objeto con todos los datos del componente',
        example: 'Object.keys($data)'
    },
    '$id': {
        description: 'Genera un ID único para el componente',
        example: '$id("button")'
    }
};

// ✅ Patrones comunes de Alpine
export const alpinePatterns = [
    {
        name: 'Toggle básico',
        code: 'x-data="{ open: false }" x-show="open" @click="open = !open"'
    },
    {
        name: 'Contador',
        code: 'x-data="{ count: 0 }" x-text="count" @click="count++"'
    },
    {
        name: 'Input con validación',
        code: 'x-data="{ email: \'\', isValid: false }" x-model="email" x-effect="isValid = email.includes(\'@\')"'
    },
    {
        name: 'Lista dinámica',
        code: 'x-data="{ items: [\'Item 1\', \'Item 2\'] }" x-for="item in items" x-text="item"'
    },
    {
        name: 'Modal',
        code: 'x-data="{ modalOpen: false }" x-show="modalOpen" @click.outside="modalOpen = false"'
    }
];

export default {
    alpineDirectives,
    alpineModifiers,
    alpineMagics,
    alpinePatterns
};