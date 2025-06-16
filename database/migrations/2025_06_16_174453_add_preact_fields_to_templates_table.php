<?php
// ===================================================================
// database/migrations/2024_06_16_000001_add_preact_fields_to_templates_table.php
// Migración para agregar campos de componentes Preact
// ===================================================================

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // ===================================================================
            // CAMPOS ESPECÍFICOS PARA COMPONENTES PREACT
            // ===================================================================
            
            // Configuración específica del componente Preact
            $table->json('preact_config')->nullable()->after('method_parameters')
                  ->comment('Configuración específica para componentes Preact (settings, theme, etc.)');
            
            // Props que acepta el componente
            $table->json('preact_props')->nullable()->after('preact_config')
                  ->comment('Definición de props que acepta el componente Preact');
            
            // Hooks utilizados en el componente
            $table->json('preact_hooks')->nullable()->after('preact_props')
                  ->comment('Lista de hooks de Preact utilizados (useState, useEffect, etc.)');
            
            // Dependencias externas del componente
            $table->json('preact_dependencies')->nullable()->after('preact_hooks')
                  ->comment('Dependencias externas requeridas por el componente');
            
            // Versión del componente (para versionado)
            $table->string('component_version', 20)->nullable()->after('preact_dependencies')
                  ->default('1.0.0')
                  ->comment('Versión del componente para control de cambios');
            
            // Tags para búsqueda y categorización
            $table->json('component_tags')->nullable()->after('component_version')
                  ->comment('Tags para búsqueda y categorización del componente');
        });

        // ===================================================================
        // ACTUALIZAR ENUM DE TIPOS PARA INCLUIR PREACT_COMPONENT
        // ===================================================================
        
        // Modificar la columna type para incluir el nuevo tipo
        DB::statement("ALTER TABLE templates MODIFY COLUMN type ENUM(
            'layout',
            'header', 
            'footer',
            'sidebar',
            'nav',
            'component',
            'partial',
            'alpine_method',
            'preact_component'
        ) NOT NULL");

        // ===================================================================
        // AGREGAR ÍNDICES PARA OPTIMIZACIÓN
        // ===================================================================
        
        Schema::table('templates', function (Blueprint $table) {
            // Índice compuesto para búsquedas comunes de componentes Preact
            $table->index(['type', 'category', 'is_active'], 'idx_templates_preact_search');
            
            // Índice para versionado de componentes
            $table->index(['type', 'component_version'], 'idx_templates_component_version');
            
            // Índice para ordenar por uso en componentes Preact
            $table->index(['type', 'usage_count'], 'idx_templates_type_usage');
            
            // Índice para búsquedas por tags (MySQL 5.7+)
            if (DB::connection()->getPdo()->getAttribute(PDO::ATTR_SERVER_VERSION) >= '5.7.0') {
                DB::statement('ALTER TABLE templates ADD INDEX idx_templates_component_tags ((CAST(component_tags AS CHAR(255) ARRAY)))');
            }
        });

        // ===================================================================
        // INSERTAR COMPONENTES DE EJEMPLO
        // ===================================================================
        $this->insertExampleComponents();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // Remover índices primero
            $table->dropIndex('idx_templates_preact_search');
            $table->dropIndex('idx_templates_component_version');
            $table->dropIndex('idx_templates_type_usage');
            
            // Intentar remover índice de tags si existe
            try {
                DB::statement('ALTER TABLE templates DROP INDEX idx_templates_component_tags');
            } catch (Exception $e) {
                // Índice no existe, continuar
            }
            
            // Remover columnas agregadas
            $table->dropColumn([
                'preact_config',
                'preact_props', 
                'preact_hooks',
                'preact_dependencies',
                'component_version',
                'component_tags'
            ]);
        });

        // Revertir ENUM a estado anterior
        DB::statement("ALTER TABLE templates MODIFY COLUMN type ENUM(
            'layout',
            'header', 
            'footer',
            'sidebar',
            'nav',
            'component',
            'partial',
            'alpine_method'
        ) NOT NULL");
    }

    /**
     * Insertar componentes de ejemplo
     */
    private function insertExampleComponents(): void
    {
        $examples = [
            [
                'name' => 'Hero Section Preact',
                'type' => 'preact_component',
                'category' => 'marketing',
                'description' => 'Sección hero moderna con animaciones y contadores dinámicos',
                'content' => $this->getHeroComponentExample(),
                'component_version' => '1.0.0',
                'component_tags' => json_encode(['hero', 'marketing', 'landing', 'animated']),
                'preact_props' => json_encode([
                    'title' => ['type' => 'string', 'required' => true, 'default' => 'Título Principal'],
                    'subtitle' => ['type' => 'string', 'required' => false, 'default' => 'Subtítulo descriptivo'],
                    'ctaText' => ['type' => 'string', 'required' => false, 'default' => 'Comenzar Ahora'],
                    'ctaUrl' => ['type' => 'string', 'required' => false, 'default' => '/signup'],
                    'backgroundImage' => ['type' => 'string', 'required' => false]
                ]),
                'preact_hooks' => json_encode(['useState', 'useEffect']),
                'preact_config' => json_encode([
                    'animations' => true,
                    'counters' => true,
                    'responsive' => true
                ]),
                'is_global' => true,
                'is_active' => true,
                'usage_count' => 0
            ],
            [
                'name' => 'Interactive Button',
                'type' => 'preact_component', 
                'category' => 'ui',
                'description' => 'Botón interactivo con múltiples variantes y contador de clicks',
                'content' => $this->getButtonComponentExample(),
                'component_version' => '1.0.0',
                'component_tags' => json_encode(['button', 'ui', 'interactive', 'clickable']),
                'preact_props' => json_encode([
                    'children' => ['type' => 'string', 'required' => false, 'default' => 'Click me'],
                    'variant' => ['type' => 'string', 'required' => false, 'default' => 'primary'],
                    'size' => ['type' => 'string', 'required' => false, 'default' => 'md'],
                    'disabled' => ['type' => 'boolean', 'required' => false, 'default' => false],
                    'onClick' => ['type' => 'function', 'required' => false]
                ]),
                'preact_hooks' => json_encode(['useState']),
                'preact_config' => json_encode([
                    'variants' => ['primary', 'secondary', 'success', 'danger'],
                    'sizes' => ['sm', 'md', 'lg'],
                    'animations' => true
                ]),
                'is_global' => true,
                'is_active' => true,
                'usage_count' => 0
            ],
            [
                'name' => 'Content Card',
                'type' => 'preact_component',
                'category' => 'ui', 
                'description' => 'Tarjeta de contenido flexible con efectos hover',
                'content' => $this->getCardComponentExample(),
                'component_version' => '1.0.0',
                'component_tags' => json_encode(['card', 'content', 'ui', 'hover']),
                'preact_props' => json_encode([
                    'title' => ['type' => 'string', 'required' => true],
                    'description' => ['type' => 'string', 'required' => false],
                    'image' => ['type' => 'string', 'required' => false],
                    'buttonText' => ['type' => 'string', 'required' => false, 'default' => 'Learn More'],
                    'buttonUrl' => ['type' => 'string', 'required' => false, 'default' => '#']
                ]),
                'preact_hooks' => json_encode(['useState']),
                'preact_config' => json_encode([
                    'hoverEffects' => true,
                    'responsive' => true
                ]),
                'is_global' => true,
                'is_active' => true,
                'usage_count' => 0
            ]
        ];

        foreach ($examples as $example) {
            DB::table('templates')->insert(array_merge($example, [
                'created_at' => now(),
                'updated_at' => now()
            ]));
        }
    }

    /**
     * Código de ejemplo para Hero Component
     */
    private function getHeroComponentExample(): string
    {
                    return "const HeroSection = ({ 
                title = 'Construye Sitios Web Increíbles',
                subtitle = 'Con nuestro page builder revolucionario',
                ctaText = 'Comenzar Ahora',
                ctaUrl = '/signup',
                backgroundImage = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920'
            }) => {
                const [isVisible, setIsVisible] = useState(false);
                const [stats, setStats] = useState({ users: 0, websites: 0, templates: 0 });

                useEffect(() => {
                    setIsVisible(true);
                    
                    // Animar contadores
                    const animateCounter = (key, target) => {
                        let current = 0;
                        const increment = target / 100;
                        const timer = setInterval(() => {
                            current += increment;
                            if (current >= target) {
                                current = target;
                                clearInterval(timer);
                            }
                            setStats(prev => ({ ...prev, [key]: Math.floor(current) }));
                        }, 30);
                    };

                    animateCounter('users', 10000);
                    animateCounter('websites', 5000);
                    animateCounter('templates', 500);
                }, []);

                return (
                    <section 
                        className='relative h-screen flex items-center justify-center bg-cover bg-center'
                        style={{ backgroundImage: `url(\${backgroundImage})` }}
                    >
                        <div className='absolute inset-0 bg-black opacity-70'></div>
                        
                        <div className={`relative z-10 text-center text-white max-w-4xl mx-auto px-4 transition-all duration-1000 \${
                            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                        }`}>
                            <h1 className='text-5xl md:text-7xl font-bold mb-6'>
                                {title}
                            </h1>
                            
                            <p className='text-xl md:text-2xl mb-8 opacity-90'>
                                {subtitle}
                            </p>
                            
                            <a
                                href={ctaUrl}
                                className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 inline-block mb-12'
                            >
                                {ctaText}
                            </a>
                            
                            <div className='grid grid-cols-3 gap-8 text-center'>
                                <div>
                                    <div className='text-3xl font-bold'>{stats.users.toLocaleString()}+</div>
                                    <div className='text-sm opacity-75'>Usuarios Activos</div>
                                </div>
                                <div>
                                    <div className='text-3xl font-bold'>{stats.websites.toLocaleString()}+</div>
                                    <div className='text-sm opacity-75'>Sitios Creados</div>
                                </div>
                                <div>
                                    <div className='text-3xl font-bold'>{stats.templates}+</div>
                                    <div className='text-sm opacity-75'>Templates</div>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            };";
    }

    /**
     * Código de ejemplo para Button Component
     */
    private function getButtonComponentExample(): string
    {
                return "const InteractiveButton = ({ 
            children = 'Click me',
            variant = 'primary',
            size = 'md',
            disabled = false,
            onClick = null
        }) => {
            const [isPressed, setIsPressed] = useState(false);
            const [clickCount, setClickCount] = useState(0);

            const handleClick = () => {
                setClickCount(prev => prev + 1);
                if (onClick) onClick();
            };

            const variants = {
                primary: 'bg-blue-600 hover:bg-blue-700 text-white',
                secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
                success: 'bg-green-600 hover:bg-green-700 text-white',
                danger: 'bg-red-600 hover:bg-red-700 text-white'
            };

            const sizes = {
                sm: 'px-3 py-1.5 text-sm',
                md: 'px-4 py-2',
                lg: 'px-6 py-3 text-lg'
            };

            return (
                <button
                    className={`
                        \${variants[variant]} \${sizes[size]}
                        rounded-lg font-medium transition-all duration-200
                        transform hover:scale-105 active:scale-95
                        disabled:opacity-50 disabled:cursor-not-allowed
                        \${isPressed ? 'scale-95' : ''}
                    `}
                    disabled={disabled}
                    onClick={handleClick}
                    onMouseDown={() => setIsPressed(true)}
                    onMouseUp={() => setIsPressed(false)}
                    onMouseLeave={() => setIsPressed(false)}
                >
                    {children} {clickCount > 0 && `(\${clickCount})`}
                </button>
            );
        };";
    }

    /**
     * Código de ejemplo para Card Component  
     */
    private function getCardComponentExample(): string
    {
                return "const ContentCard = ({
            title = 'Card Title',
            description = 'Card description goes here...',
            image = 'https://via.placeholder.com/400x200',
            buttonText = 'Learn More',
            buttonUrl = '#'
        }) => {
            const [isHovered, setIsHovered] = useState(false);
            
            return (
                <div 
                    className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 \${
                        isHovered ? 'shadow-xl transform scale-105' : ''
                    }`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <img src={image} alt={title} className='w-full h-48 object-cover' />
                    <div className='p-6'>
                        <h3 className='text-xl font-semibold mb-2'>{title}</h3>
                        <p className='text-gray-600 mb-4'>{description}</p>
                        <a
                            href={buttonUrl}
                            className='inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors'
                        >
                            {buttonText}
                        </a>
                    </div>
                </div>
            );
        };";
    }
};