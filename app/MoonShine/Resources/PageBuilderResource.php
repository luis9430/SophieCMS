<?php
declare(strict_types=1);

namespace App\MoonShine\Resources;

use App\Models\Page;
use App\Models\Website;
use App\Models\Template;
use MoonShine\Laravel\Resources\ModelResource;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Text;
use MoonShine\UI\Fields\Select;
use MoonShine\UI\Fields\Textarea;
use MoonShine\UI\Fields\Hidden;
use MoonShine\Laravel\Fields\Slug;
use MoonShine\Laravel\Fields\Relationships\BelongsTo;
use MoonShine\UI\Components\Layout\Box;
use MoonShine\UI\Components\Layout\Column;
use MoonShine\UI\Components\Layout\Grid;
use MoonShine\UI\Components\ActionButton;
use MoonShine\UI\Components\Link;
use MoonShine\MenuManager\Attributes\Group;
use MoonShine\Support\Attributes\Icon;

#[Icon('document-text')]
#[Group('Page Builder')]
class PageBuilderResource extends ModelResource
{
    protected string $model = Page::class;
    protected string $title = 'Page Builder';
    protected string $column = 'title';

    public function indexFields(): array
    {
        return [
            ID::make()->sortable(),
            
            Text::make('Título', 'title')
                ->sortable(),
                
            Slug::make('Slug', 'slug')
                ->from('title')
                ->sortable(),
                
            BelongsTo::make('Website', 'website', resource: WebsiteResource::class),
                
            BelongsTo::make('Template', 'template', resource: TemplateResource::class)
                ->nullable(),
                
            Select::make('Estado', 'status')
                ->options([
                    'draft' => 'Borrador',
                    'published' => 'Publicado',
                ])
                ->badge(fn(string $value): string => $value === 'published' ? 'green' : 'gray'),
                
            // Quitar el ActionButton problemático por ahora
        ];
    }
    public function formFields(): array
    {
        return [
            Grid::make([
                Column::make([
                    Box::make('Información Básica', [
                        Hidden::make('id'),
                        
                        Text::make('Título', 'title')
                            ->required()
                            ->placeholder('Ingresa el título de la página'),
                            
                        Slug::make('Slug', 'slug')
                            ->from('title')
                            ->required(),
                            
                        BelongsTo::make('Website', 'website_id', resource: WebsiteResource::class)
                            ->required(),
                            
                        BelongsTo::make('Template', 'template_id', resource: TemplateResource::class)
                            ->nullable()
                            ->placeholder('Selecciona un template base (opcional)'),
                    ])
                ])->columnSpan(8),
                
                Column::make([
                    Box::make('Configuración', [
                        Select::make('Estado', 'status')
                            ->options([
                                'draft' => 'Borrador',
                                'published' => 'Publicado',
                            ])
                            ->default('draft'),
                    ]),
                    
                    Box::make('SEO', [
                        Text::make('Meta Título', 'meta_title')
                            ->placeholder('Título para SEO'),
                            
                        Textarea::make('Meta Descripción', 'meta_description')
                            ->placeholder('Descripción para SEO'),
                    ])
                ])->columnSpan(4),
            ]),
            
            // Campo oculto para almacenar el contenido JSON del page builder
            Hidden::make('content'),
        ];
    }

    public function detailFields(): array
    {
        return [
            ID::make(),
            Text::make('Título', 'title'),
            Slug::make('Slug', 'slug'),
            BelongsTo::make('Website', 'website', resource: WebsiteResource::class),
            BelongsTo::make('Template', 'template', resource: TemplateResource::class),
            Select::make('Estado', 'status'),
            Text::make('Meta Título', 'meta_title'),
            Textarea::make('Meta Descripción', 'meta_description'),
            
            // Enlace para ver la página en vivo
            Link::make('Ver página')
                ->href(fn($item) => route('page.show', $item->slug))
                ->icon('eye')
                ->blank(),
                
            // Enlace para editar con el page builder
            Link::make('Editar con Page Builder')
                ->href(fn($item) => route('page-builder.edit', $item->id))
                ->icon('pencil')
                ->primary(),
        ];
    }

    public function getActiveActions(): array
    {
        return ['create', 'view', 'update', 'delete'];
    }
    
    // Customizar botones de acción
    public function buttons(): array
    {
        return [
            ActionButton::make('Page Builder')
                ->method('redirectToBuilder')
                ->icon('cursor-arrow-rays'),
        ];
    }
    
    public function redirectToBuilder()
    {
        return redirect()->route('page-builder.index');
    }
}