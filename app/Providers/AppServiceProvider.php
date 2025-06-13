<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\Renderers\LiquidRenderer;
use App\Services\Renderers\PageBuilderRenderer;
use App\Services\Renderers\PageRenderer;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LiquidRenderer::class);
        $this->app->singleton(PageBuilderRenderer::class);
        $this->app->singleton(PageRenderer::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
