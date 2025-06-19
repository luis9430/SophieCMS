
{{-- resources/views/components/page-builder/grid.blade.php --}}
@props([
    'columns' => 3,
    'gap' => '6',
    'responsive' => 'true'
])

@php
$gridClasses = 'grid gap-' . $gap;

if ($responsive === 'true') {
    $gridClasses .= ' grid-cols-1';
    if ($columns >= 2) $gridClasses .= ' md:grid-cols-2';
    if ($columns >= 3) $gridClasses .= ' lg:grid-cols-' . $columns;
    if ($columns >= 4) $gridClasses .= ' xl:grid-cols-' . $columns;
} else {
    $gridClasses .= ' grid-cols-' . $columns;
}
@endphp

<div {{ $attributes->merge(['class' => $gridClasses]) }}>
    {{ $slot }}
</div>
