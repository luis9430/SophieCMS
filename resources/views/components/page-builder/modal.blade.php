{{-- resources/views/components/page-builder/modal.blade.php --}}
@props([
    'id' => 'modal',
    'title' => 'Modal Title',
    'triggerText' => 'Open Modal',
    'size' => 'md'
])

@php
$sizeClasses = [
    'sm' => 'max-w-md',
    'md' => 'max-w-lg',
    'lg' => 'max-w-2xl',
    'xl' => 'max-w-4xl',
];
$modalSize = $sizeClasses[$size] ?? $sizeClasses['md'];
@endphp

<div x-data="{ open: false }">
    {{-- Trigger Button --}}
    <button @click="open = true" 
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
        {{ $triggerText }}
    </button>
    
    {{-- Modal --}}
    <div x-show="open" 
         x-transition:enter="ease-out duration-300"
         x-transition:enter-start="opacity-0"
         x-transition:enter-end="opacity-100"
         x-transition:leave="ease-in duration-200"
         x-transition:leave-start="opacity-100"
         x-transition:leave-end="opacity-0"
         class="fixed inset-0 z-50 overflow-y-auto"
         style="display: none;">
        
        {{-- Backdrop --}}
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div @click="open = false" 
                 class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"></div>
            
            {{-- Modal Content --}}
            <div class="inline-block w-full {{ $modalSize }} p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
                {{-- Header --}}
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">
                        {{ $title }}
                    </h3>
                    <button @click="open = false" 
                            class="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                {{-- Content --}}
                <div class="text-gray-600">
                    {{ $slot ?: 'Modal content goes here...' }}
                </div>
                
                {{-- Footer --}}
                <div class="flex justify-end mt-6 space-x-3">
                    <button @click="open = false" 
                            class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>