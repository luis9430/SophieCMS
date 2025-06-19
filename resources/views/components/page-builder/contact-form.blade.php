{{-- resources/views/components/page-builder/contact-form.blade.php --}}
@props([
    'title' => 'Contact Us',
    'description' => 'Get in touch with us',
    'fields' => ['name', 'email', 'message'],
    'action' => '/contact',
    'submitText' => 'Send Message'
])

<div {{ $attributes->merge(['class' => 'bg-white p-8 rounded-lg shadow-lg']) }}>
    @if($title)
        <h3 class="text-2xl font-semibold text-gray-900 mb-2">{{ $title }}</h3>
    @endif
    
    @if($description)
        <p class="text-gray-600 mb-6">{{ $description }}</p>
    @endif
    
    <form action="{{ $action }}" method="POST" class="space-y-6">
        @csrf
        
        @if(in_array('name', $fields))
            <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                </label>
                <input type="text" 
                       id="name" 
                       name="name" 
                       required
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
        @endif
        
        @if(in_array('email', $fields))
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                </label>
                <input type="email" 
                       id="email" 
                       name="email" 
                       required
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
        @endif
        
        @if(in_array('phone', $fields))
            <div>
                <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                </label>
                <input type="tel" 
                       id="phone" 
                       name="phone"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
        @endif
        
        @if(in_array('subject', $fields))
            <div>
                <label for="subject" class="block text-sm font-medium text-gray-700 mb-2">
                    Asunto
                </label>
                <input type="text" 
                       id="subject" 
                       name="subject"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
        @endif
        
        @if(in_array('message', $fields))
            <div>
                <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                </label>
                <textarea id="message" 
                          name="message" 
                          rows="4" 
                          required
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
            </div>
        @endif
        
        <div>
            <button type="submit" 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                {{ $submitText }}
            </button>
        </div>
    </form>
</div>