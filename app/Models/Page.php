<?php 
// ===================================================================
// app/Models/Page.php
// ===================================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class Page extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'content',
        'rendered_content',
        'last_rendered_at',
        'layout_id',
        'template_assignments',
        'page_variables',
        'status',
    ];

    protected $casts = [
        'content' => 'array',
        'template_assignments' => 'array',
        'page_variables' => 'array',
        'last_rendered_at' => 'datetime',
    ];

    // ===================================================================
    // RELATIONSHIPS
    // ===================================================================

    /**
     * Layout template de la página
     */
    public function layout(): BelongsTo
    {
        return $this->belongsTo(Template::class, 'layout_id');
    }

    // ===================================================================
    // SCOPES
    // ===================================================================

    /**
     * Solo páginas publicadas
     */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    /**
     * Solo páginas borrador
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', 'draft');
    }

    /**
     * Páginas por slug
     */
    public function scopeBySlug(Builder $query, string $slug): Builder
    {
        return $query->where('slug', $slug);
    }

    // ===================================================================
    // ACCESSORS & MUTATORS
    // ===================================================================

    /**
     * Obtener el estado formateado
     */
    public function getStatusNameAttribute(): string
    {
        return match($this->status) {
            'draft' => 'Borrador',
            'published' => 'Publicado',
            'archived' => 'Archivado',
            default => ucfirst($this->status)
        };
    }

    /**
     * Verificar si la página necesita regeneración
     */
    public function getNeedsRegenerationAttribute(): bool
    {
        if (!$this->last_rendered_at) {
            return true;
        }

        // Regenerar si la página se modificó después del último renderizado
        if ($this->updated_at > $this->last_rendered_at) {
            return true;
        }

        // Regenerar si el layout se modificó después del último renderizado
        if ($this->layout && $this->layout->updated_at > $this->last_rendered_at) {
            return true;
        }

        return false;
    }

    /**
     * Obtener templates asignados como objetos
     */
    public function getAssignedTemplatesAttribute(): array
    {
        if (!$this->template_assignments) {
            return [];
        }

        $templates = [];
        foreach ($this->template_assignments as $type => $templateId) {
            if ($templateId) {
                $templates[$type] = Template::find($templateId);
            }
        }

        return $templates;
    }

    /**
     * Obtener todas las variables disponibles para la página
     */
    public function getAllVariablesAttribute(): array
    {
        return array_merge(
            $this->page_variables ?? [],
            [
                'page' => [
                    'title' => $this->title,
                    'slug' => $this->slug,
                    'status' => $this->status,
                    'created_at' => $this->created_at,
                    'updated_at' => $this->updated_at,
                ]
            ]
        );
    }

    // ===================================================================
    // METHODS
    // ===================================================================

    /**
     * Asignar un template a un tipo específico
     */
    public function assignTemplate(string $type, int $templateId): void
    {
        $assignments = $this->template_assignments ?? [];
        $assignments[$type] = $templateId;
        $this->template_assignments = $assignments;
        $this->save();
    }

    /**
     * Remover asignación de template
     */
    public function removeTemplateAssignment(string $type): void
    {
        $assignments = $this->template_assignments ?? [];
        unset($assignments[$type]);
        $this->template_assignments = $assignments;
        $this->save();
    }

    /**
     * Obtener template asignado por tipo
     */
    public function getAssignedTemplate(string $type): ?Template
    {
        $templateId = $this->template_assignments[$type] ?? null;
        return $templateId ? Template::find($templateId) : null;
    }

    /**
     * Marcar página como regenerada
     */
    public function markAsRendered(string $renderedContent): void
    {
        $this->update([
            'rendered_content' => $renderedContent,
            'last_rendered_at' => Carbon::now(),
        ]);
    }

    /**
     * Limpiar cache de renderizado
     */
    public function clearRenderCache(): void
    {
        $this->update([
            'rendered_content' => null,
            'last_rendered_at' => null,
        ]);
    }

    /**
     * Obtener URL completa de la página
     */
    public function getUrl(): string
    {
        return url("/{$this->slug}");
    }

    /**
     * Verificar si la página está publicada
     */
    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    /**
     * Publicar página
     */
    public function publish(): void
    {
        $this->update(['status' => 'published']);
    }

    /**
     * Convertir a borrador
     */
    public function makeDraft(): void
    {
        $this->update(['status' => 'draft']);
    }

    // ===================================================================
    // CONSTANTS
    // ===================================================================

    const STATUSES = [
        'draft' => 'Borrador',
        'published' => 'Publicado',
        'archived' => 'Archivado'
    ];
}