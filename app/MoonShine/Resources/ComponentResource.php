<?php 
declare(strict_types=1);
namespace App\MoonShine\Resources;

use App\Models\Component;
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

#[Icon('puzzle-piece')]
#[Group('Page Builder')]
class ComponentResource extends ModelResource
{
    protected string $model = Component::class;
    protected string $title = 'Componentes';
    protected string $column = 'name';

    public function indexFields(): array
    {
        return [
            ID::make()->sortable(),
            
            Text::make('Nombre', 'name')
                ->sortable(), // ← CORREGIDO
                
            Text::make('Identificador', 'identifier')
                ->sortable(), // ← CORREGIDO
                
            Select::make('Categoría', 'category')
                ->options([
                    'layout' => 'Layout',
                    'content' => 'Contenido', 
                    'interactive' => 'Interactivo',
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
                
            Text::make('Identificador', 'identifier')
                ->required()
                ->placeholder('hero, card, button, etc.'),
                
            Select::make('Categoría', 'category')
                ->options([
                    'layout' => 'Layout',
                    'content' => 'Contenido',
                    'interactive' => 'Interactivo',
                ])
                ->required(),
                
            Textarea::make('Descripción', 'description'),
            
            Textarea::make('Template Blade', 'blade_template')
                ->required()
                ->placeholder('Contenido del template Blade'),
                
Textarea::make('Configuración por defecto (JSON)', 'default_config')
    ->placeholder('{"title": "Valor ejemplo", "subtitle": "Otro valor"}')
    ->hint('Configuración en formato JSON. Cada componente usa diferentes propiedades.')
    ->nullable(),       
            Image::make('Imagen Preview', 'preview_image'),
            
            Switcher::make('Activo', 'is_active')
                ->default(true),
        ];
    }

    // Agregar método search para habilitar búsqueda
    protected function search(): array
    {
        return [
            'name',
            'identifier',
            'description'
        ];
    }
}