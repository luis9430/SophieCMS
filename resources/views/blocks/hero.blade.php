{{-- resources/views/blocks/hero.blade.php --}}
<section class="{{ $cssClasses }}">
    <div class="relative z-10">
        <div>
            <h1 class="{{ $titleClasses }} mb-4">
                {{ $config['title'] ?? 'Título por defecto' }}
            </h1>
            
            @if(!empty($config['subtitle']))
                <p class="text-xl md:text-2xl mb-8 opacity-90">
                    {{ $config['subtitle'] }}
                </p>
            @endif
            
            @if($config['show_button'] ?? true)
                <a href="{{ $config['button_url'] ?? '#' }}"
                   class="inline-block bg-white text-blue-500 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors">
                    {{ $config['button_text'] ?? 'Botón de Acción' }}
                </a>
            @endif
        </div>
    </div>
</section>