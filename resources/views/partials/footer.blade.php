{{-- resources/views/partials/footer.blade.php --}}
<footer class="bg-gray-900 text-white">
    <div class="max-w-7xl mx-auto px-4 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            {{-- Company Info --}}
            <div>
                <h3 class="text-lg font-semibold mb-4">{{ $website->name }}</h3>
                @if(isset($website->settings['footer_description']))
                    <p class="text-gray-300 mb-4">{{ $website->settings['footer_description'] }}</p>
                @endif
                
                {{-- Social Links --}}
                @if(isset($website->settings['social_links']))
                    <div class="flex space-x-4">
                        @foreach($website->settings['social_links'] as $social)
                            <a href="{{ $social['url'] }}" 
                               class="text-gray-300 hover:text-white transition-colors"
                               target="_blank" rel="noopener noreferrer">
                                <span class="sr-only">{{ $social['platform'] }}</span>
                                {{-- Aquí podrías agregar iconos SVG --}}
                                {{ $social['platform'] }}
                            </a>
                        @endforeach
                    </div>
                @endif
            </div>
            
            {{-- Quick Links --}}
            <div>
                <h3 class="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
                @if(isset($website->settings['footer_links']))
                    <ul class="space-y-2">
                        @foreach($website->settings['footer_links'] as $link)
                            <li>
                                <a href="{{ $link['url'] }}" 
                                   class="text-gray-300 hover:text-white transition-colors">
                                    {{ $link['label'] }}
                                </a>
                            </li>
                        @endforeach
                    </ul>
                @endif
            </div>
            
            {{-- Contact Info --}}
            <div>
                <h3 class="text-lg font-semibold mb-4">Contacto</h3>
                @if(isset($website->settings['contact_info']))
                    <div class="space-y-2 text-gray-300">
                        @if(isset($website->settings['contact_info']['email']))
                            <p>Email: {{ $website->settings['contact_info']['email'] }}</p>
                        @endif
                        @if(isset($website->settings['contact_info']['phone']))
                            <p>Teléfono: {{ $website->settings['contact_info']['phone'] }}</p>
                        @endif
                        @if(isset($website->settings['contact_info']['address']))
                            <p>Dirección: {{ $website->settings['contact_info']['address'] }}</p>
                        @endif
                    </div>
                @endif
            </div>
        </div>
        
        {{-- Copyright --}}
        <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; {{ date('Y') }} {{ $website->name }}. Todos los derechos reservados.</p>
        </div>
    </div>
</footer>