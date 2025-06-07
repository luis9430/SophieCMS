{{-- resources/views/blocks/hero.blade.php --}}
<section class="bg-gray-100 py-12 px-4 text-center {{ $cssClasses ?? '' }}" x-data="{ title: '{{ $config['title'] ?? 'Título Impactante' }}', subtitle: '{{ $config['subtitle'] ?? 'Subtítulo descriptivo' }}' }">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl md:text-5xl font-bold mb-4 text-gray-800" x-text="title">
            {{ $config['title'] ?? 'Título Impactante' }}
        </h1>
        
        <p class="text-xl text-gray-600 mb-8" x-text="subtitle">
            {{ $config['subtitle'] ?? 'Subtítulo que describe tu propuesta de valor' }}
        </p>
        
        <a href="{{ $config['buttonUrl'] ?? '#' }}" 
           class="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors">
            {{ $config['buttonText'] ?? 'Comenzar Ahora' }}
        </a>
    </div>
</section>
