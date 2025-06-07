{{-- resources/views/blocks/text.blade.php --}}
<div class="py-8 px-4 {{ $cssClasses ?? '' }}">
    <div class="max-w-3xl mx-auto">
        <p class="text-gray-700 leading-relaxed">
            {{ $config['content'] ?? 'Contenido de texto por defecto. Edita este texto para personalizarlo según tus necesidades.' }}
        </p>
    </div>
</div>
