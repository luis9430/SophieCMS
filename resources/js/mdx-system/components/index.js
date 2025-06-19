// ===================================================================
// resources/js/components/index.js
// Exportación centralizada de todos los componentes
// ===================================================================

// ===================================================================
// resources/js/components/index.js
// Exportación centralizada de todos los componentes
// ===================================================================

// UI Components
import Button from './ui/Button';
import Card from './ui/Card';
import Alert from './ui/Alert';
import Hero from './ui/Hero';

export { Button, Card, Alert, Hero };

// Exportaciones de conveniencia
export const UIComponents = {
  Button,
  Card,
  Alert,
  Hero,
};

// ===================================================================
// CONFIGURACIÓN PARA MDX SYSTEM
// ===================================================================

// Componentes disponibles para el sistema MDX
export const MDXComponents = {
  // UI Básicos
  Button,
  Card,
  Alert,
  Hero,
  
  // Variantes de conveniencia
  'Alert.Info': Alert.Info,
  'Alert.Success': Alert.Success,
  'Alert.Warning': Alert.Warning,
  'Alert.Error': Alert.Error,
};

// ===================================================================
// METADATA SIMPLE
// ===================================================================

export const ComponentMetadata = {
  Button: {
    name: 'Button',
    category: 'ui',
    description: 'Botón simple con variantes',
    example: '<Button variant="primary">Click me</Button>'
  },
  
  Card: {
    name: 'Card',
    category: 'ui',
    description: 'Card para contenido',
    example: '<Card title="My Card">Content here</Card>'
  },
  
  Alert: {
    name: 'Alert',
    category: 'ui',
    description: 'Alertas informativas',
    example: '<Alert type="info" title="Info">Message here</Alert>'
  },
  
  Hero: {
    name: 'Hero',
    category: 'layout',
    description: 'Sección hero',
    example: '<Hero title="Welcome" primaryButton="Get Started" />'
  }
};

// ===================================================================
// EXPORTACIÓN POR DEFECTO
// ===================================================================

export default {
  components: MDXComponents,
  metadata: ComponentMetadata
};