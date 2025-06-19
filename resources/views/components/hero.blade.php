{{-- resources/views/components/page-builder/hero.blade.php --}}
@props([
    'title' => 'Hero Title',
    'subtitle' => 'Hero Subtitle', 
    'image' => '',
    'buttonText' => 'Get Started',
    'buttonUrl' => '#',
    'alignment' => 'center',
    'theme' => 'default'
])

<section {{ $attributes->merge(['class' => 'relative py-16 lg:py-24']) }}>
    @if($image)
        <div class="absolute inset-0 z-0">
            <img src="{{ $image }}" alt="{{ $title }}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
    @endif
    
    <div class="relative z-10 container mx-auto px-4">
        <div class="text-{{ $alignment }} {{ $image ? 'text-white' : 'text-gray-900' }}">
            <h1 class="text-4xl lg:text-6xl font-bold mb-6">
                {{ $title }}
            </h1>
            
            @if($subtitle)
                <p class="text-xl lg:text-2xl mb-8 {{ $image ? 'text-gray-200' : 'text-gray-600' }}">
                    {{ $subtitle }}
                </p>
            @endif
            
            @if($buttonText && $buttonUrl)
                <a href="{{ $buttonUrl }}" 
                   class="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                    {{ $buttonText }}
                </a>
            @endif
        </div>
    </div>
</section>