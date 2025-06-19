{{-- resources/views/components/page-builder/card.blade.php --}}
@props([
    'title' => 'Card Title',
    'description' => 'Card description',
    'image' => '',
    'link' => '',
    'linkText' => 'Read More',
    'variant' => 'default'
])

<div {{ $attributes->merge(['class' => 'bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow']) }}>
    @if($image)
        <div class="aspect-w-16 aspect-h-9">
            <img src="{{ $image }}" alt="{{ $title }}" class="w-full h-48 object-cover">
        </div>
    @endif
    
    <div class="p-6">
        <h3 class="text-xl font-semibold text-gray-900 mb-3">
            {{ $title }}
        </h3>
        
        @if($description)
            <p class="text-gray-600 mb-4">
                {{ $description }}
            </p>
        @endif
        
        @if($link && $linkText)
            <a href="{{ $link }}" 
               class="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                {{ $linkText }} →
            </a>
        @endif
        
        {{ $slot }}
    </div>
</div>