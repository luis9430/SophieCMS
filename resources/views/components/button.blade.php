{{-- resources/views/components/page-builder/button.blade.php --}}
@props([
    'text' => 'Button',
    'url' => '#',
    'variant' => 'primary',
    'size' => 'md',
    'icon' => '',
    'fullWidth' => false
])

@php
$baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

$variantClasses = [
    'primary' => 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    'secondary' => 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    'outline' => 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white focus:ring-blue-500',
    'ghost' => 'text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
];

$sizeClasses = [
    'sm' => 'px-3 py-2 text-sm',
    'md' => 'px-4 py-3 text-base',
    'lg' => 'px-6 py-4 text-lg',
    'xl' => 'px-8 py-4 text-xl',
];

$classes = $baseClasses . ' ' . ($variantClasses[$variant] ?? $variantClasses['primary']) . ' ' . ($sizeClasses[$size] ?? $sizeClasses['md']);

if ($fullWidth) {
    $classes .= ' w-full';
}
@endphp

<a href="{{ $url }}" {{ $attributes->merge(['class' => $classes]) }}>
    @if($icon)
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            {{-- Aquí podrías cargar iconos dinámicamente --}}
        </svg>
    @endif
    
    {{ $text }}
    {{ $slot }}
</a>