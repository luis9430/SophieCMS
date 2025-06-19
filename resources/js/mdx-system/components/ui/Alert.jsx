// ===================================================================
// resources/js/components/ui/Alert.jsx
// Alert simple con Tailwind puro
// ===================================================================

const cx = (...classes) => classes.filter(Boolean).join(' ');

const Alert = ({
  children,
  title = null,
  type = 'info',
  className = '',
  ...props
}) => {
  
  // Tipos de alerta
  const types = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };

  const icons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  const classes = cx(
    'rounded-lg border-l-4 p-4 flex gap-3',
    types[type],
    className
  );

  return (
    <div className={classes} {...props}>
      <span className="text-lg">{icons[type]}</span>
      <div>
        {title && (
          <div className="font-semibold mb-1">{title}</div>
        )}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
};

// Componentes de conveniencia
Alert.Info = (props) => <Alert {...props} type="info" />;
Alert.Success = (props) => <Alert {...props} type="success" />;
Alert.Warning = (props) => <Alert {...props} type="warning" />;
Alert.Error = (props) => <Alert {...props} type="error" />;

export default Alert;