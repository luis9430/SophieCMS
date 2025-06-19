{{-- resources/views/components/page-builder/section.blade.php --}}
@props([
    'background' => 'white',
    'padding' => 'py-16',
    'id' => ''
])

@php
$backgroundClasses = [
    'white' => 'bg-white',
    'gray' => 'bg-gray-50',
    'dark' => 'bg-gray-900 text-white',
    'primary' => 'bg-blue-600 text-white',
    'gradient' => 'bg-gradient-to-r from-blue-600 to-purple-600 text-white',
];

$bgClass = $backgroundClasses[$background] ?? $backgroundClasses['white'];
@endphp

<section {{ $attributes->merge(['class' => $bgClass . ' ' . $padding]) }} 
         @if($id) id="{{ $id }}" @endif>
    {{ $slot }}
</section>