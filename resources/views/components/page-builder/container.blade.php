
{{-- resources/views/components/page-builder/container.blade.php --}}
@props([
    'maxWidth' => '7xl',
    'padding' => '8'
])

<div {{ $attributes->merge(['class' => 'max-w-' . $maxWidth . ' mx-auto px-4 py-' . $padding]) }}>
    {{ $slot }}
</div>