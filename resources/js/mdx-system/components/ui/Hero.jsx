// ===================================================================
// resources/js/components/ui/Hero.jsx
// Hero simple y limpio con Tailwind puro
// ===================================================================

const cx = (...classes) => classes.filter(Boolean).join(' ');
import Button from './Button';

const Hero = ({
  title = 'Amazing Hero Title',
  subtitle = null,
  description = null,
  primaryButton = null,
  secondaryButton = null,
  theme = 'gradient',
  size = 'md',
  className = '',
  children = null,
  ...props
}) => {

  // Temas disponibles
  const themes = {
    gradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    dark: 'bg-gray-900',
    light: 'bg-gray-100 text-gray-900'
  };

  // Tamaños
  const sizes = {
    sm: 'py-12',
    md: 'py-20',
    lg: 'py-32'
  };

  // Determinar si el fondo es oscuro
  const isDark = !['light'].includes(theme);
  const textColor = isDark ? 'text-white' : 'text-gray-900';

  const classes = cx(
    'px-6 text-center',
    themes[theme],
    sizes[size],
    textColor,
    className
  );

  return (
    <section className={classes} {...props}>
      <div className="max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          {title}
        </h1>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="text-xl md:text-2xl mb-6 opacity-90">
            {subtitle}
          </p>
        )}

        {/* Description */}
        {description && (
          <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">
            {description}
          </p>
        )}

        {/* Buttons */}
        {(primaryButton || secondaryButton) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            {primaryButton && (
              typeof primaryButton === 'string' ? (
                <Button 
                  size="lg"
                  className={isDark ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-blue-600 text-white hover:bg-blue-700'}
                >
                  {primaryButton}
                </Button>
              ) : (
                primaryButton
              )
            )}

            {secondaryButton && (
              typeof secondaryButton === 'string' ? (
                <Button 
                  variant="outline" 
                  size="lg"
                  className={isDark ? 'border-white text-white hover:bg-white hover:text-gray-900' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}
                >
                  {secondaryButton}
                </Button>
              ) : (
                secondaryButton
              )
            )}
          </div>
        )}

        {/* Custom children */}
        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;