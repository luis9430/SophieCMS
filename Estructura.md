# 🏗️ Estructura de Archivos Completa - Sistema de Plugins

## 📁 Estructura General

```
resources/js/block-builder/
├── 📁 core/                           # Sistema principal de plugins
│   ├── PluginManager.js               # ✅ Gestor central de plugins
│   ├── PluginSystemInit.js            # ✅ Inicializador del sistema
│   └── TemplateEngine.js              # 🔄 Motor de templates (Fase 3)
│
├── 📁 security/                       # Validación y seguridad
│   ├── TemplateValidator.js           # ✅ Validador de templates
│   └── Sanitizer.js                   # 🔄 Sanitizador avanzado (Fase 6)
│
├── 📁 plugins/                        # Plugins modulares
│   ├── 📁 alpine/                     # Plugin Alpine.js
│   │   ├── index.js                   # ✅ Plugin principal
│   │   ├── metadata.js                # 🔄 Directivas Alpine (Fase 5)
│   │   ├── editor.js                  # 🔄 Extensiones CodeMirror (Fase 5)
│   │   ├── preview.js                 # 🔄 Lógica de preview (Fase 4)
│   │   └── 📁 templates/              # Templates editables
│   │       ├── base.html              # 🔄 Template base (Fase 3)
│   │       ├── scripts.js             # 🔄 Scripts Alpine (Fase 3)
│   │       └── debug.html             # 🔄 Panel debug (Fase 3)
│   │
│   ├── 📁 variables/                  # Plugin Variables (Fase 2)
│   │   ├── index.js                   # 🔄 Plugin principal
│   │   ├── providers.js               # 🔄 Proveedores de variables
│   │   ├── editor.js                  # 🔄 Autocompletado variables
│   │   └── processor.js               # 🔄 Procesador unificado
│   │
│   ├── 📁 gsap/                       # Plugin GSAP (Futuro)
│   │   ├── index.js                   # Plugin principal
│   │   ├── animations.js              # Animaciones predefinidas
│   │   ├── editor.js                  # Autocompletado GSAP
│   │   └── 📁 templates/
│   │       └── animations.html
│   │
│   └── 📁 liquid/                     # Plugin Liquid.js (Futuro)
│       ├── index.js                   # Plugin principal
│       ├── filters.js                 # Filtros Liquid
│       ├── editor.js                  # Sintaxis Liquid
│       └── 📁 templates/
│           └── liquid-base.html
│
├── 📁 hooks/                          # Hooks existentes (Legacy)
│   ├── useVariables.js                # ✅ Mantener durante migración
│   ├── useApi.js                      # ✅ No necesita migración
│   └── useAlpinePreview.js            # ✅ Migrar en Fase 4
│
├── 📁 utils/                          # Utilidades existentes (Legacy)
│   ├── variableProcessor.js           # ✅ Migrar a plugin en Fase 2
│   ├── variableCompletionHelpers.js   # ✅ Migrar a plugin en Fase 2
│   ├── alpineEditorHelpers.js         # ✅ Migrar a plugin en Fase 5
│   └── alpineMetadata.js              # ✅ Migrar a plugin en Fase 5
│
├── 📁 services/                       # Servicios externos
│   └── api.js                         # ✅ No necesita cambios
│
├── 📁 codemirror/                     # Editor CodeMirror
│   └── CodeMirrorEditor.jsx           # ✅ Integración con plugins
│
└── 📁 components/                     # Componentes principales
    ├── PageBuilder.jsx                # ✅ Integración con plugins
    └── VariablesPanel.jsx             # 🔄 Separar como componente (Fase 6)
```

## 🔄 Estados de Migración

- ✅ **Completado**: Archivo creado y funcional
- 🔄 **Pendiente**: Por crear en próximas fases
- 🏗️ **En proceso**: Parcialmente migrado
- ❌ **Deprecado**: Será removido al final

---

## 📋 Fase 1: Fundación (✅ COMPLETADO)

### Archivos Creados:
1. `core/PluginManager.js` - Sistema base de plugins
2. `core/LegacyBridge.js` - Compatibilidad durante migración
3. `core/PluginSystemInit.js` - Inicializador completo
4. `security/TemplateValidator.js` - Validación de seguridad
5. `plugins/alpine/index.js` - Plugin Alpine básico
6. Integración en `PageBuilder.jsx` y `CodeMirrorEditor.jsx`

### Resultado:
- ✅ Sistema actual funciona igual
- ✅ Infraestructura de plugins lista
- ✅ Alpine plugin básico funcional
- ✅ Validación de seguridad integrada

---

## 📋 Fase 2: Plugin Variables (🔄 PRÓXIMO)

### Archivos a Crear:

#### `plugins/variables/index.js`
```javascript
// Plugin de variables para reemplazar utils/variableProcessor.js
const VariablesPlugin = createPlugin({
    name: 'variables',
    version: '1.0.0',
    // ... lógica del plugin
});
```

#### `plugins/variables/providers.js`
```javascript
// Proveedores dinámicos de variables
export class VariableProvider {
    constructor(name, getVariables) {
        this.name = name;
        this.getVariables = getVariables;
    }
}

export const SystemProvider = new VariableProvider('system', () => ({
    'app.name': 'Page Builder',
    'current.date': new Date().toLocaleDateString()
}));
```

#### `plugins/variables/editor.js`
```javascript
// Autocompletado específico para variables
export const getVariableCompletions = (context) => {
    // Migrar lógica de variableCompletionHelpers.js
};
```

### Resultado Esperado:
- Variables funcionan como plugin
- Sistema más flexible y extensible
- Compatibilidad total con código existente
- Nuevos proveedores de variables

---

## 📋 Fase 3: Templates Editables (🔄 FUTURO)

### Archivos a Crear:

#### `core/TemplateEngine.js`
```javascript
// Motor para templates editables y seguros
export class TemplateEngine {
    async loadTemplate(pluginName, templateName) {
        // Cargar template desde archivo/storage
    }
    
    async saveTemplate(pluginName, templateName, content) {
        // Validar y guardar template
    }
}
```

#### `plugins/alpine/templates/base.html`
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{TITLE}}</title>
    {{STYLES}}
</head>
<body>
    {{CONTENT}}
    {{SCRIPTS}}
</body>
</html>
```

### Resultado Esperado:
- HTML separado del JavaScript
- Templates editables por usuario
- Sistema de placeholders seguro
- Validación automática de templates

---

## 📋 Fase 4: Preview como Plugin (🔄 FUTURO)

### Archivos a Migrar:

#### `plugins/alpine/preview.js`
```javascript
// Migrar hooks/useAlpinePreview.js aquí
export class AlpinePreview {
    constructor(templateEngine) {
        this.templateEngine = templateEngine;
    }
    
    async generatePreviewHTML(code) {
        const template = await this.templateEngine.loadTemplate('alpine', 'base');
        return this.processTemplate(template, code);
    }
}
```

### Resultado Esperado:
- useAlpinePreview.js convertido en plugin
- HTML hardcodeado eliminado
- Preview más limpio y mantenible
- Hot-reloading de templates

---

## 📋 Fase 5: Editor como Plugin (🔄 FUTURO)

### Archivos a Migrar:

#### `plugins/alpine/editor.js`
```javascript
// Migrar utils/alpineEditorHelpers.js aquí
export class AlpineEditor {
    getCompletions(context) {
        // Lógica de autocompletado Alpine
    }
    
    validateSyntax(code) {
        // Validación específica de Alpine
    }
}
```

#### `plugins/alpine/metadata.js`
```javascript
// Migrar utils/alpineMetadata.js aquí
export const alpineDirectives = {
    // Metadata de directivas Alpine
};
```

### Resultado Esperado:
- CodeMirror completamente modular
- Extensiones por plugin
- Fácil añadir soporte para nuevas librerías

---

## 📋 Fase 6: Limpieza Final (🔄 FUTURO)

### Archivos a Remover:
- `hooks/useAlpinePreview.js` ❌
- `utils/variableProcessor.js` ❌
- `utils/variableCompletionHelpers.js` ❌
- `utils/alpineEditorHelpers.js` ❌
- `utils/alpineMetadata.js` ❌

### Archivos a Optimizar:
- `core/LegacyBridge.js` - Simplificar
- `PageBuilder.jsx` - Limpiar código legacy
- `CodeMirrorEditor.jsx` - Remover fallbacks

### Resultado Esperado:
- Código legacy eliminado
- Sistema 100% basado en plugins
- Rendimiento optimizado
- Arquitectura limpia y mantenible

---

## 🚀 Cómo Implementar

### 1. Instalar Fase 1 (✅ Listo)
```bash
# Los archivos ya están creados, solo necesitas:
# 1. Copiar los archivos a tu proyecto
# 2. Ajustar las rutas de importación
# 3. Probar que todo funciona igual
```

### 2. Probar el Sistema
```javascript
// En la consola del navegador:
await window.initializePluginSystem();
console.log(window.pluginManager.list());
console.log(window.legacyBridge.getMigrationInfo());
```

### 3. Migrar a Fase 2
```bash
# Crear plugin de variables
# Migrar lógica paso a paso
# Mantener compatibilidad total
```

## 🔧 Configuración Recomendada

### Desarrollo
```javascript
await initializePluginSystem({
    securityLevel: 'medium',
    enableHotReload: true,
    autoRegister: true,
    validateOnLoad: true
});
```

### Producción
```javascript
await initializePluginSystem({
    securityLevel: 'high',
    enableHotReload: false,
    autoRegister: true,
    validateOnLoad: true
});
```

## 📊 Beneficios del Sistema

### Inmediatos (Fase 1)
- ✅ **Compatibilidad**: Todo funciona igual
- ✅ **Seguridad**: Validación automática
- ✅ **Debugging**: Mejor información de errores
- ✅ **Escalabilidad**: Base para futuras mejoras

### A Mediano Plazo (Fases 2-3)
- 🔄 **Modularidad**: Cada funcionalidad en su plugin
- 🔄 **Flexibilidad**: Fácil añadir/quitar funcionalidades
- 🔄 **Templates**: HTML editable y seguro
- 🔄 **Performance**: Carga bajo demanda

### A Largo Plazo (Fases 4-6)
- 🚀 **Mantenibilidad**: Código limpio y organizado
- 🚀 **Extensibilidad**: Soporte para cualquier librería
- 🚀 **Hot Reload**: Desarrollo más rápido
- 🚀 **Escalabilidad**: Sistema robusto para crecer

## ⚠️ Consideraciones Importantes

1. **Migración Gradual**: Nunca romper funcionalidad existente
2. **Testing**: Validar cada fase antes de continuar
3. **Performance**: Monitorear impacto en rendimiento
4. **Compatibilidad**: Mantener APIs existentes
5. **Documentación**: Documentar cada cambio importante

## 🎯 Próximos Pasos

1. **Implementar Fase 1** - Copiar archivos y probar
2. **Validar Funcionamiento** - Asegurar que todo funciona igual
3. **Crear Fase 2** - Plugin de variables
4. **Planificar Fase 3** - Templates editables
5. **Continuar Gradualmente** - Una fase a la vez

¿Quieres que comencemos con la implementación de alguna fase específica?