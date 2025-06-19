// ===================================================================
// resources/js/components/ui/Button.jsx
// Botón simple con Tailwind puro
// ===================================================================

// Función helper para clases
const cx = (...classes) => classes.filter(Boolean).join(' ');

const Button = ({ 
  children,
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  // Definir variantes con Tailwind
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    outline: 'bg-transparent hover:bg-gray-50 text-gray-700 border-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700'
  };

  // Definir tamaños
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const classes = cx(
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
    'border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variants[variant],
    sizes[size],
    className
  );

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;