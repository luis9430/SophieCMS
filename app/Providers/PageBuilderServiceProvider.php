<?php
// app/Providers/PageBuilderServiceProvider.php
namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;
use App\View\Components\PageBuilder\Hero;
use App\View\Components\PageBuilder\Card;
use App\View\Components\PageBuilder\Button;
use App\View\Components\PageBuilder\Testimonial;
use App\View\Components\PageBuilder\ContactForm;
use App\View\Components\PageBuilder\Grid;
use App\View\Components\PageBuilder\Container;
use App\View\Components\PageBuilder\Modal;

class PageBuilderServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register()
    {
        // Registrar servicios del page builder
        $this->app->singleton('page-builder', function ($app) {
            return new \App\Services\PageBuilderService();
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot()
    {
        // Registrar componentes Blade
        $this->registerBladeComponents();
        
        // Registrar directivas Blade personalizadas
        $this->registerBladeDirectives();
        
        // Cargar vistas del page builder
        $this->loadViewsFrom(__DIR__.'/../../resources/views/page-builder', 'page-builder');
        
        // Publicar assets si es necesario
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__.'/../../public/page-builder' => public_path('page-builder'),
            ], 'page-builder-assets');
        }
    }

    /**
     * Registrar componentes Blade del page builder
     */
    private function registerBladeComponents()
    {
        Blade::component('page-builder.hero', Hero::class);
        Blade::component('page-builder.card', Card::class);
        Blade::component('page-builder.button', Button::class);
        Blade::component('page-builder.testimonial', Testimonial::class);
        Blade::component('page-builder.contact-form', ContactForm::class);
        Blade::component('page-builder.grid', Grid::class);
        Blade::component('page-builder.container', Container::class);
        Blade::component('page-builder.modal', Modal::class);
    }

    /**
     * Registrar directivas Blade personalizadas
     */
    private function registerBladeDirectives()
    {
        // Directiva para cargar estilos del page builder
        Blade::directive('pageBuilderStyles', function () {
            return '<?php echo app("page-builder")->getStyles(); ?>';
        });

        // Directiva para cargar scripts del page builder
        Blade::directive('pageBuilderScripts', function () {
            return '<?php echo app("page-builder")->getScripts(); ?>';
        });

        // Directiva para renderizar un componente por su ID
        Blade::directive('renderComponent', function ($componentId) {
            return "<?php echo app('page-builder')->renderComponent($componentId); ?>";
        });
    }
}