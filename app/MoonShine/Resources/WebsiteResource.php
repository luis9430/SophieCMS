<?php

declare(strict_types=1);

namespace App\MoonShine\Resources;

use Illuminate\Database\Eloquent\Model;
use App\Models\Website; // Asegúrate que este es el namespace correcto de tu modelo
use MoonShine\Laravel\Resources\ModelResource;
use MoonShine\Contracts\UI\ComponentContract;
use MoonShine\Decorations\Block; // Puedes usar Block o Fieldset para agrupar
use MoonShine\UI\Fields\Fieldset;
use MoonShine\UI\Components\Layout\Box;
use MoonShine\UI\Components\Layout\Column;
use MoonShine\UI\Components\Layout\Grid;
use MoonShine\UI\Components\Layout\Flex;
use MoonShine\UI\Fields\ID;
use MoonShine\UI\Fields\Text;
use MoonShine\UI\Fields\Select;
use MoonShine\Laravel\Fields\Slug;
use MoonShine\UI\Fields\Hidden;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * @extends ModelResource<Website>
 */
class WebsiteResource extends ModelResource
{
    protected string $model = Website::class;
    protected string $title = 'Constructor de Sitios Web'; // Título para el menú y la página
    protected string $column = 'title'; // Columna a mostrar en relaciones

    /**
     * @return list<MoonShine\Fields\Field|MoonShine\Components\Layout\LayoutComponent>
     */
    public function indexFields(): array
    {
        return [
            ID::make()->sortable(),
            Text::make('Título', 'name')->sortable(),
            Slug::make('Slug')->when(true, fn($field) => $field->sortable()),
            Select::make('Estado', 'status')
                ->options([
                    'draft' => 'Borrador',
                    'published' => 'Publicado',
                ])
                ->badge(fn(string $value): string => $value === 'published' ? 'green' : 'gray'),
        ];
    }

    /**
     * @return list<MoonShine\Fields\Field|MoonShine\Components\Layout\LayoutComponent|MoonShine\Decorations\Decoration>
     */
    public function formFields(): array
    {
        return [
            // Usamos Grid para un layout de dos columnas
            Grid::make([
                     Column::make([
                    Fieldset::make('Diseño de Página (Constructor)', [
                        // Usando Box con customView como lo sugieres
                        Box::make('Área del Constructor') // Etiqueta para el Box
                            ->customView('components.my-custom-block') // Ruta a tu vista personalizada

                    ]),
                ])->columnSpan(9), // 
                Column::make([
                    Fieldset::make('Información Principal', [
                        // ID::make()->hideOnForm() o Hidden::make('ID','id') no es usualmente necesario para el ID primario
                        // MoonShine lo maneja automáticamente (no editable, no en creación)
                        Text::make('Título', 'name')
                            ->required(),
                            // ->reactive() // Úsalo si el slug depende de él en tiempo real en el form
                            // ->showWhen(fn() => empty(request('slug'))) // Condición para mostrarlo

                        Slug::make('Slug') // El segundo argumento es el nombre del campo en BD, por defecto es 'slug'
                            ->from('title') // Genera el slug a partir del campo 'title'
                            ->separator('-')
                            ->unique() // Intenta generar un slug único añadiendo sufijos si es necesario
                            ->hint('Se genera desde el título si se deja vacío. Debe ser único.'),

                        Select::make('Estado', 'status')
                            ->options([
                                'draft' => 'Borrador',
                                'published' => 'Publicado',
                            ])
                            ->default('draft')
                            ->required(),

                        Select::make('Idioma', 'language')
                            ->options([
                                'es' => 'Español',
                                'en' => 'Inglés',
                                // Añade más idiomas si es necesario
                            ])
                            ->default('es')
                            ->required(),

                        Text::make('Nombre de Plantilla (Opcional)', 'template_name'),
                        // Campo oculto para el JSON del constructor.
                        // Tu JS deberá actualizar el valor de este input.

                        // En tu formFields(), reemplaza el Hidden actual por:
                        Hidden::make('structure')
                            ->setAttribute('id', 'website-structure-field')
                            ->setAttribute('data-builder', 'true'), // Para identificarlo en JS

                    ]),
                ])->columnSpan(3), // Esta columna ocupa 6 de 12 unidades de la rejilla
             
            ]),
        ];
    }

    /**
     * @param Website $item
     * @return array<string, string[]|string>
     */
    protected function rules(mixed $item): array
    {
            dd(request()->all()); // <--- APLÍCALO AQUÍ PRIMERO

        $itemId = $item->exists ? $item->getKey() : null;

        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('websites', 'slug')->ignore($itemId)], // Asegúrate que 'websites' es el nombre de tu tabla
            'status' => ['required', Rule::in(['draft', 'published'])],
            'language' => ['required', 'string', 'max:10'],
            'template_name' => ['nullable', 'string', 'max:100'],
            'structure' => ['nullable', 'json'], // Validar que sea JSON
        ];
    }

    

    // Si necesitas realizar alguna acción después de guardar (por ejemplo, procesar el JSON)
    // protected function afterSave(Model $item): void
    // {
    //     // Lógica después de guardar
    // }
}
