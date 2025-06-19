{{-- resources/views/components/page-builder/text-block.blade.php --}}
@props([
    'heading' => '',
    'subheading' => '',
    'content' => '',
    'alignment' => 'left',
    'size' => 'md'
])

@php
$alignmentClasses = [
    'left' => 'text-left',
    'center' => 'text-center',
    'right' => 'text-right',
];

$sizeClasses = [
    'sm' => 'text-sm',
    'md' => 'text-base',
    'lg' => 'text-lg',
    'xl' => 'text-xl',
];

$textAlign = $alignmentClasses[$alignment] ?? $alignmentClasses['left'];
$textSize = $sizeClasses[$size] ?? $sizeClasses['md'];
@endphp

<div {{ $attributes->merge(['class' => $textAlign]) }}>
    @if($heading)
        <h2 class="text-3xl font-bold text-gray-900 mb-4">{{ $heading }}</h2>
    @endif
    
    @if($subheading)
        <h3 class="text-xl text-gray-600 mb-6">{{ $subheading }}</h3>
    @endif
    
    @if($content)
        <div class="{{ $textSize }} text-gray-700 prose max-w-none">
            {!! nl2br(e($content)) !!}
        </div>
    @endif
    
    {{ $slot }}
</div>