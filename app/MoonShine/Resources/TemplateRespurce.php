<?php 
declare(strict_types=1);

namespace App\MoonShine\Resources;

use App\Models\Template;
use MoonShine\Laravel\Resources\ModelResource;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Text;
use MoonShine\UI\Fields\Select;
use MoonShine\UI\Fields\Textarea;
use MoonShine\UI\Fields\Image;
use MoonShine\UI\Fields\Switcher;
use MoonShine\UI\Fields\Json;
use MoonShine\MenuManager\Attributes\Group;
use MoonShine\Support\Attributes\Icon;

#[Icon('document-duplicate')]
#[Group('Page Builder')]
class TemplateResource extends ModelResource
{
    protected string $model = Template::class;
    protected string $title = 'Templates';
    protected string $column = 'name';

    public function indexFields(): array
    {
        return [
            ID::make()->sortable(),
            
            Text::make('Nombre', 'name')
                ->sortable()
                ->searchable(),
                
            Select::make('Categoría', 'category')
                ->options([
                    'landing' => 'Landing Page',
                    'blog' => 'Blog',
                    'ecommerce' => 'E-commerce',
                    'portfolio' => 'Portfolio',
                ])
                ->badge(),
                
            Switcher::make('Activo', 'is_active'),
            
            Image::make('Preview', 'preview_image'),
        ];
    }

    public function formFields(): array
    {
        return [
            Text::make('Nombre', 'name')
                ->required(),
                
            Textarea::make('Descripción', 'description'),
            
            Select::make('Categoría', 'category')
                ->options([
                    'landing' => 'Landing Page',
                    'blog' => 'Blog', 
                    'ecommerce' => 'E-commerce',
                    'portfolio' => 'Portfolio',
                ]),
                
            Textarea::make('Contenido Blade', 'content')
                ->required()
                ->placeholder('Template Blade completo'),
                
            Json::make('Metadata', 'metadata'),
            
            Image::make('Imagen Preview', 'preview_image'),
            
            Switcher::make('Activo', 'is_active')
                ->default(true),
        ];
    }
}