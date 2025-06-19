{{-- resources/views/partials/navigation.blade.php --}}
<nav class="bg-white shadow-lg" x-data="{ mobileMenuOpen: false }">
    <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between items-center py-4">
            {{-- Logo --}}
            <div class="flex items-center">
                @if(isset($website->settings['logo']) && $website->settings['logo'])
                    <img src="{{ $website->settings['logo'] }}" 
                         alt="{{ $website->name }}" 
                         class="h-8 w-auto">
                @else
                    <span class="text-xl font-bold text-gray-900">{{ $website->name }}</span>
                @endif
            </div>
            
            {{-- Desktop Navigation --}}
            <div class="hidden md:flex space-x-8">
                @if(isset($website->settings['navigation_items']))
                    @foreach($website->settings['navigation_items'] as $item)
                        <a href="{{ $item['url'] }}" 
                           class="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                            {{ $item['label'] }}
                        </a>
                    @endforeach
                @endif
            </div>
            
            {{-- Mobile menu button --}}
            <div class="md:hidden">
                <button @click="mobileMenuOpen = !mobileMenuOpen" 
                        class="text-gray-700 hover:text-blue-600">
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>
        </div>
        
        {{-- Mobile Navigation --}}
        <div x-show="mobileMenuOpen" 
             x-transition:enter="ease-out duration-200"
             x-transition:enter-start="opacity-0 scale-95"
             x-transition:enter-end="opacity-100 scale-100"
             x-transition:leave="ease-in duration-150"
             x-transition:leave-start="opacity-100 scale-100"
             x-transition:leave-end="opacity-0 scale-95"
             class="md:hidden py-4 border-t border-gray-200">
            @if(isset($website->settings['navigation_items']))
                @foreach($website->settings['navigation_items'] as $item)
                    <a href="{{ $item['url'] }}" 
                       class="block py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors">
                        {{ $item['label'] }}
                    </a>
                @endforeach
            @endif
        </div>
    </div>
</nav>