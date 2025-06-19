// ===================================================================
// resources/js/components/ui/Card.jsx
// Card simple con Tailwind puro
// ===================================================================

const cx = (...classes) => classes.filter(Boolean).join(' ');

const Card = ({
  children,
  title = null,
  description = null,
  className = '',
  onClick = null,
  ...props
}) => {
  
  const classes = cx(
    'bg-white rounded-lg border border-gray-200 p-6 shadow-sm',
    'hover:shadow-md transition-shadow duration-200',
    onClick && 'cursor-pointer',
    className
  );

  return (
    <div 
      className={classes}
      onClick={onClick}
      {...props}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <div className="text-gray-600 mb-4 text-sm">
          {description}
        </div>
      )}
      
      <div>
        {children}
      </div>
    </div>
  );
};

export default Card;