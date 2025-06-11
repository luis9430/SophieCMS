// resources/js/block-builder/plugins/tailwind/editor.js

// Una lista de ejemplo de clases de Tailwind para autocompletar.
// En el futuro, esto podría generarse automáticamente a partir de tu tailwind.config.js
const tailwindClasses = [
    { label: "text-blue-500", type: "class", info: "Color de texto azul" },
    { label: "bg-gray-100", type: "class", info: "Fondo gris claro" },
    { label: "p-4", type: "class", info: "padding: 1rem" },
    { label: "m-4", type: "class", info: "margin: 1rem" },
    { label: "flex", type: "class", info: "display: flex" },
    { label: "justify-center", type: "class", info: "justify-content: center" },
    { label: "items-center", type: "class", info: "align-items: center" },
    { label: "rounded-lg", type: "class", info: "border-radius: 0.5rem" },
    { label: "shadow-md", type: "class", info: "box-shadow (medium)" },
    { label: "font-bold", type: "class", info: "font-weight: 700" },
];

/**
 * Provee sugerencias de autocompletado para clases de Tailwind.
 * @param {import('@codemirror/autocomplete').CompletionContext} context
 * @returns {import('@codemirror/autocomplete').CompletionResult | null}
 */
export function getTailwindCompletions(context) {
    // Revisa si el cursor está dentro de un atributo class="...".
    const nodeBefore = context.state.tree.resolveInner(context.pos, -1);
    if (nodeBefore.name !== 'AttributeValue' || 
        nodeBefore.parent?.firstChild?.name !== 'AttributeName' ||
        context.state.sliceDoc(nodeBefore.parent.firstChild.from, nodeBefore.parent.firstChild.to) !== 'class') {
        return null;
    }

    const textBefore = context.state.sliceDoc(nodeBefore.from, context.pos);
    const lastWord = textBefore.split(' ').pop();

    if (lastWord === '') return null; // No sugerir si hay un espacio justo antes del cursor
    
    // Filtra las clases que coinciden con lo que el usuario está escribiendo
    const options = tailwindClasses.filter(c => c.label.startsWith(lastWord));

    if (options.length === 0) {
        return null;
    }

    return {
        from: context.pos - lastWord.length,
        options: options,
        validFor: /^[\w-]*$/,
    };
}