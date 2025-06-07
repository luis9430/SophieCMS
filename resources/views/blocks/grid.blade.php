{{-- resources/views/blocks/grid.blade.php --}}
<div class="py-8 px-4 {{ $cssClasses ?? '' }}">
    <div class="grid grid-cols-1 md:grid-cols-{{ $config['columns'] ?? 2 }} gap-{{ $config['gap'] ?? 6 }}">
        @foreach($config['columns'] ?? [] as $column)
            <div class="bg-white p-4 rounded shadow">
                {{-- Contenido de la columna --}}
                @foreach($column['children'] ?? [] as $child)
                    @include('blocks.' . $child['type'], ['config' => $child['config'] ?? [], 'styles' => $child['styles'] ?? []])
                @endforeach
                
                @if(empty($column['children']))
                    <div class="text-center text-gray-400 py-8">
                        Columna vacía
                    </div>
                @endif
            </div>
        @endforeach
        
        @if(empty($config['columns']))
            @for($i = 0; $i < ($config['columns'] ?? 2); $i++)
                <div class="bg-white p-4 rounded shadow">
                    <div class="text-center text-gray-400 py-8">
                        Columna {{ $i + 1 }}
                    </div>
                </div>
            @endfor
        @endif
    </div>
</div>
