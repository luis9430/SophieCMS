// resources/js/block-builder/monaco/CodeEditor.jsx
import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'preact/hooks';

const CodeEditor = ({ code, onCodeChange, language = 'html' }) => {
  const editorRef = useRef(null);
  
  const handleEditorChange = (value, event) => {
    onCodeChange(value);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configurar autocompletado para Tailwind y Alpine
    if (monaco && language === 'html' || language === 'blade') {
      // Autocompletado para Tailwind
      monaco.languages.registerCompletionItemProvider('html', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };
          
          // Clases de Tailwind comunes
          const tailwindClasses = [
            // Colores de fondo
            { label: 'bg-blue-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'bg-blue-500' },
            { label: 'bg-red-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'bg-red-500' },
            { label: 'bg-green-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'bg-green-500' },
            { label: 'bg-yellow-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'bg-yellow-500' },
            { label: 'bg-purple-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'bg-purple-500' },
            { label: 'bg-gray-100', kind: monaco.languages.CompletionItemKind.Value, insertText: 'bg-gray-100' },
            { label: 'bg-gray-200', kind: monaco.languages.CompletionItemKind.Value, insertText: 'bg-gray-200' },
            { label: 'bg-white', kind: monaco.languages.CompletionItemKind.Value, insertText: 'bg-white' },
            { label: 'bg-black', kind: monaco.languages.CompletionItemKind.Value, insertText: 'bg-black' },
            { label: 'bg-transparent', kind: monaco.languages.CompletionItemKind.Value, insertText: 'bg-transparent' },
            
            // Colores de texto
            { label: 'text-blue-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-blue-500' },
            { label: 'text-red-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-red-500' },
            { label: 'text-green-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-green-500' },
            { label: 'text-yellow-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-yellow-500' },
            { label: 'text-purple-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-purple-500' },
            { label: 'text-gray-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-gray-500' },
            { label: 'text-gray-700', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-gray-700' },
            { label: 'text-white', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-white' },
            { label: 'text-black', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-black' },
            
            // Tamaños de texto
            { label: 'text-xs', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-xs' },
            { label: 'text-sm', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-sm' },
            { label: 'text-base', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-base' },
            { label: 'text-lg', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-lg' },
            { label: 'text-xl', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-xl' },
            { label: 'text-2xl', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-2xl' },
            { label: 'text-3xl', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-3xl' },
            { label: 'text-4xl', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-4xl' },
            { label: 'text-5xl', kind: monaco.languages.CompletionItemKind.Value, insertText: 'text-5xl' },
            
            // Padding
            { label: 'p-0', kind: monaco.languages.CompletionItemKind.Value, insertText: 'p-0' },
            { label: 'p-1', kind: monaco.languages.CompletionItemKind.Value, insertText: 'p-1' },
            { label: 'p-2', kind: monaco.languages.CompletionItemKind.Value, insertText: 'p-2' },
            { label: 'p-3', kind: monaco.languages.CompletionItemKind.Value, insertText: 'p-3' },
            { label: 'p-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'p-4' },
            { label: 'p-5', kind: monaco.languages.CompletionItemKind.Value, insertText: 'p-5' },
            { label: 'p-6', kind: monaco.languages.CompletionItemKind.Value, insertText: 'p-6' },
            { label: 'p-8', kind: monaco.languages.CompletionItemKind.Value, insertText: 'p-8' },
            { label: 'p-10', kind: monaco.languages.CompletionItemKind.Value, insertText: 'p-10' },
            { label: 'p-12', kind: monaco.languages.CompletionItemKind.Value, insertText: 'p-12' },
            { label: 'px-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'px-4' },
            { label: 'py-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'py-4' },
            { label: 'pt-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'pt-4' },
            { label: 'pr-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'pr-4' },
            { label: 'pb-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'pb-4' },
            { label: 'pl-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'pl-4' },
            
            // Margin
            { label: 'm-0', kind: monaco.languages.CompletionItemKind.Value, insertText: 'm-0' },
            { label: 'm-1', kind: monaco.languages.CompletionItemKind.Value, insertText: 'm-1' },
            { label: 'm-2', kind: monaco.languages.CompletionItemKind.Value, insertText: 'm-2' },
            { label: 'm-3', kind: monaco.languages.CompletionItemKind.Value, insertText: 'm-3' },
            { label: 'm-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'm-4' },
            { label: 'm-5', kind: monaco.languages.CompletionItemKind.Value, insertText: 'm-5' },
            { label: 'm-6', kind: monaco.languages.CompletionItemKind.Value, insertText: 'm-6' },
            { label: 'm-8', kind: monaco.languages.CompletionItemKind.Value, insertText: 'm-8' },
            { label: 'm-10', kind: monaco.languages.CompletionItemKind.Value, insertText: 'm-10' },
            { label: 'm-12', kind: monaco.languages.CompletionItemKind.Value, insertText: 'm-12' },
            { label: 'mx-auto', kind: monaco.languages.CompletionItemKind.Value, insertText: 'mx-auto' },
            { label: 'my-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'my-4' },
            { label: 'mt-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'mt-4' },
            { label: 'mr-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'mr-4' },
            { label: 'mb-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'mb-4' },
            { label: 'ml-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'ml-4' },
            
            // Flexbox
            { label: 'flex', kind: monaco.languages.CompletionItemKind.Value, insertText: 'flex' },
            { label: 'inline-flex', kind: monaco.languages.CompletionItemKind.Value, insertText: 'inline-flex' },
            { label: 'flex-row', kind: monaco.languages.CompletionItemKind.Value, insertText: 'flex-row' },
            { label: 'flex-col', kind: monaco.languages.CompletionItemKind.Value, insertText: 'flex-col' },
            { label: 'justify-start', kind: monaco.languages.CompletionItemKind.Value, insertText: 'justify-start' },
            { label: 'justify-center', kind: monaco.languages.CompletionItemKind.Value, insertText: 'justify-center' },
            { label: 'justify-end', kind: monaco.languages.CompletionItemKind.Value, insertText: 'justify-end' },
            { label: 'justify-between', kind: monaco.languages.CompletionItemKind.Value, insertText: 'justify-between' },
            { label: 'justify-around', kind: monaco.languages.CompletionItemKind.Value, insertText: 'justify-around' },
            { label: 'items-start', kind: monaco.languages.CompletionItemKind.Value, insertText: 'items-start' },
            { label: 'items-center', kind: monaco.languages.CompletionItemKind.Value, insertText: 'items-center' },
            { label: 'items-end', kind: monaco.languages.CompletionItemKind.Value, insertText: 'items-end' },
            
            // Bordes
            { label: 'rounded', kind: monaco.languages.CompletionItemKind.Value, insertText: 'rounded' },
            { label: 'rounded-sm', kind: monaco.languages.CompletionItemKind.Value, insertText: 'rounded-sm' },
            { label: 'rounded-md', kind: monaco.languages.CompletionItemKind.Value, insertText: 'rounded-md' },
            { label: 'rounded-lg', kind: monaco.languages.CompletionItemKind.Value, insertText: 'rounded-lg' },
            { label: 'rounded-xl', kind: monaco.languages.CompletionItemKind.Value, insertText: 'rounded-xl' },
            { label: 'rounded-full', kind: monaco.languages.CompletionItemKind.Value, insertText: 'rounded-full' },
            { label: 'border', kind: monaco.languages.CompletionItemKind.Value, insertText: 'border' },
            { label: 'border-2', kind: monaco.languages.CompletionItemKind.Value, insertText: 'border-2' },
            { label: 'border-4', kind: monaco.languages.CompletionItemKind.Value, insertText: 'border-4' },
            { label: 'border-blue-500', kind: monaco.languages.CompletionItemKind.Value, insertText: 'border-blue-500' },
            
            // Sombras
            { label: 'shadow', kind: monaco.languages.CompletionItemKind.Value, insertText: 'shadow' },
            { label: 'shadow-sm', kind: monaco.languages.CompletionItemKind.Value, insertText: 'shadow-sm' },
            { label: 'shadow-md', kind: monaco.languages.CompletionItemKind.Value, insertText: 'shadow-md' },
            { label: 'shadow-lg', kind: monaco.languages.CompletionItemKind.Value, insertText: 'shadow-lg' },
            { label: 'shadow-xl', kind: monaco.languages.CompletionItemKind.Value, insertText: 'shadow-xl' },
            { label: 'shadow-2xl', kind: monaco.languages.CompletionItemKind.Value, insertText: 'shadow-2xl' },
            { label: 'shadow-none', kind: monaco.languages.CompletionItemKind.Value, insertText: 'shadow-none' },
            
            // Transiciones
            { label: 'transition', kind: monaco.languages.CompletionItemKind.Value, insertText: 'transition' },
            { label: 'transition-all', kind: monaco.languages.CompletionItemKind.Value, insertText: 'transition-all' },
            { label: 'duration-300', kind: monaco.languages.CompletionItemKind.Value, insertText: 'duration-300' },
            { label: 'ease-in-out', kind: monaco.languages.CompletionItemKind.Value, insertText: 'ease-in-out' },
            { label: 'hover:bg-blue-600', kind: monaco.languages.CompletionItemKind.Value, insertText: 'hover:bg-blue-600' },
            { label: 'hover:text-white', kind: monaco.languages.CompletionItemKind.Value, insertText: 'hover:text-white' },
            { label: 'hover:scale-105', kind: monaco.languages.CompletionItemKind.Value, insertText: 'hover:scale-105' },
          ];
          
          // Directivas Alpine
          const alpineDirectives = [
            { label: 'x-data', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-data="${1:{}}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-text', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-text="${1:property}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-html', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-html="${1:property}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-bind', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-bind:${1:attribute}="${2:expression}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-on', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-on:${1:event}="${2:handler}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-model', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-model="${1:property}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-show', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-show="${1:condition}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-if="${1:condition}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-for="${1:item} in ${2:items}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-transition', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-transition', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-init', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-init="${1:expression}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-ref', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-ref="${1:name}"', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            { label: 'x-cloak', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'x-cloak', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          ];
          
          return {
            suggestions: [...tailwindClasses, ...alpineDirectives].map(item => ({
              ...item,
              range
            }))
          };
        }
      });
      
      // Snippets para bloques comunes
      monaco.languages.registerCompletionItemProvider('html', {
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };
          
          return {
            suggestions: [
              {
                label: 'hero-section',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: [
                  '<section class="bg-gray-100 py-12 px-4 text-center" x-data="{ title: \'${1:Título Impactante}\', subtitle: \'${2:Subtítulo descriptivo}\' }">',
                  '    <h1 class="text-4xl font-bold mb-4" x-text="title"></h1>',
                  '    <p class="text-xl text-gray-600 mb-8" x-text="subtitle"></p>',
                  '    <a href="#" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition">${3:Comenzar Ahora}</a>',
                  '</section>'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range
              },
              {
                label: 'card',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: [
                  '<div class="bg-white rounded-lg shadow-md p-6 max-w-sm mx-auto">',
                  '    <h2 class="text-xl font-semibold mb-2">${1:Título de la Tarjeta}</h2>',
                  '    <p class="text-gray-600 mb-4">${2:Descripción de la tarjeta con detalles relevantes.}</p>',
                  '    <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">${3:Acción}</button>',
                  '</div>'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range
              },
              {
                label: 'feature-list',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: [
                  '<div class="py-8">',
                  '    <h2 class="text-2xl font-bold mb-6 text-center">${1:Características}</h2>',
                  '    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">',
                  '        <div class="p-4 border rounded-lg">',
                  '            <h3 class="text-lg font-semibold mb-2">${2:Característica 1}</h3>',
                  '            <p class="text-gray-600">${3:Descripción de la característica 1}</p>',
                  '        </div>',
                  '        <div class="p-4 border rounded-lg">',
                  '            <h3 class="text-lg font-semibold mb-2">${4:Característica 2}</h3>',
                  '            <p class="text-gray-600">${5:Descripción de la característica 2}</p>',
                  '        </div>',
                  '        <div class="p-4 border rounded-lg">',
                  '            <h3 class="text-lg font-semibold mb-2">${6:Característica 3}</h3>',
                  '            <p class="text-gray-600">${7:Descripción de la característica 3}</p>',
                  '        </div>',
                  '    </div>',
                  '</div>'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range
              },
              {
                label: 'alpine-counter',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: [
                  '<div x-data="{ count: 0 }" class="p-4 bg-white rounded-lg shadow">',
                  '    <h3 class="text-lg font-semibold mb-2">Contador Alpine.js</h3>',
                  '    <div class="flex items-center space-x-4">',
                  '        <button x-on:click="count--" class="bg-red-500 text-white px-3 py-1 rounded">-</button>',
                  '        <span x-text="count" class="text-xl font-bold"></span>',
                  '        <button x-on:click="count++" class="bg-green-500 text-white px-3 py-1 rounded">+</button>',
                  '    </div>',
                  '</div>'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range
              },
              {
                label: 'blade-hero',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: [
                  '<section class="{{ $cssClasses }}">',
                  '    <div class="relative z-10">',
                  '        <div>',
                  '            <h1 class="{{ $titleClasses }} mb-4">',
                  '                {{ $config[\'title\'] ?? \'Título por defecto\' }}',
                  '            </h1>',
                  '            ',
                  '            @if(!empty($config[\'subtitle\']))',
                  '                <p class="text-xl md:text-2xl mb-8 opacity-90">',
                  '                    {{ $config[\'subtitle\'] }}',
                  '                </p>',
                  '            @endif',
                  '            ',
                  '            @if($config[\'show_button\'] ?? true)',
                  '                <a href="{{ $config[\'button_url\'] ?? \'#\' }}"',
                  '                   class="inline-block bg-white text-blue-500 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">',
                  '                    {{ $config[\'button_text\'] ?? \'Botón de Acción\' }}',
                  '                </a>',
                  '            @endif',
                  '        </div>',
                  '    </div>',
                  '</section>'
                ].join('\n'),
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range
              }
            ]
          };
        }
      });
      
      // También registramos para blade si es necesario
      if (language === 'blade') {
        monaco.languages.registerCompletionItemProvider('blade', {
          provideCompletionItems: (model, position) => {
            const word = model.getWordUntilPosition(position);
            const range = {
              startLineNumber: position.lineNumber,
              endLineNumber: position.lineNumber,
              startColumn: word.startColumn,
              endColumn: word.endColumn
            };
            
            // Directivas Blade
            const bladeDirectives = [
              { label: '@if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@if(${1:condition})\n    ${2}\n@endif', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@foreach', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@foreach(${1:$items} as ${2:$item})\n    ${3}\n@endforeach', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@forelse', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@forelse(${1:$items} as ${2:$item})\n    ${3}\n@empty\n    ${4}\n@endforelse', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@while(${1:condition})\n    ${2}\n@endwhile', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@for(${1:$i} = 0; ${1:$i} < ${2:$count}; ${1:$i}++)\n    ${3}\n@endfor', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@switch', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@switch(${1:$value})\n    @case(${2:case1})\n        ${3}\n        @break\n    @case(${4:case2})\n        ${5}\n        @break\n    @default\n        ${6}\n@endswitch', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@isset', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@isset(${1:$variable})\n    ${2}\n@endisset', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@empty', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@empty(${1:$variable})\n    ${2}\n@endempty', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@auth', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@auth\n    ${1}\n@endauth', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@guest', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@guest\n    ${1}\n@endguest', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@section', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@section(\'${1:name}\')\n    ${2}\n@endsection', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@yield', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@yield(\'${1:name}\')', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@extends', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@extends(\'${1:layout}\')', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@include', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@include(\'${1:view}\')', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@component', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@component(\'${1:component}\')\n    ${2}\n@endcomponent', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@slot', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@slot(\'${1:name}\')\n    ${2}\n@endslot', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
              { label: '@props', kind: monaco.languages.CompletionItemKind.Keyword, insertText: '@props([\'${1:prop}\'])', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
            ];
            
            return {
              suggestions: [...bladeDirectives].map(item => ({
                ...item,
                range
              }))
            };
          }
        });
      }
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', height: '500px' }}>
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          selectOnLineNumbers: true,
          minimap: { enabled: false },
          fontSize: 14,
          padding: { top: 10 },
          wordWrap: 'on',
          suggestOnTriggerCharacters: true,
          snippetSuggestions: 'top'
        }}
      />
    </div>
  );
};

export default CodeEditor;
