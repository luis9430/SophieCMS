
{{-- resources/views/components/page-builder/image-text.blade.php --}}
@props([
    'image' => '',
    'imageAlt' => '',
    'heading' => '',
    'content' => '',
    'buttonText' => '',
    'buttonUrl' => '',
    'layout' => 'image-left', // image-left, image-right, image-top
    'imageRatio' => '16/9'
])

@php
$layoutClasses = [
    'image-left' => 'lg:flex-row',
    'image-right' => 'lg:flex-row-reverse',
    'image-top' => 'flex-col',
];

$flexDirection = $layoutClasses[$layout] ?? $layoutClasses['image-left'];
@endphp

<div {{ $attributes->merge(['class' => 'flex flex-col ' . $flexDirection . ' items-center gap-8']) }}>
    @if($image)
        <div class="flex-1">
            <img src="{{ $image }}" 
                 alt="{{ $imageAlt ?: $heading }}"
                 class="w-full h-auto rounded-lg shadow-lg object-cover"
                 style="aspect-ratio: {{ $imageRatio }};">
        </div>
    @endif
    
    <div class="flex-1">
        @if($heading)
            <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $heading }}</h2>
        @endif
        
        @if($content)
            <div class="text-gray-700 mb-6 prose max-w-none">
                {!! nl2br(e($content)) !!}
            </div>
        @endif
        
        @if($buttonText && $buttonUrl)
            <a href="{{ $buttonUrl }}" 
               class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                {{ $buttonText }}
            </a>
        @endif
        
        {{ $slot }}
    </div>
</div>