# 📋 Plan de Implementación: Sidebar de Navegación

## 🎯 Objetivo
Implementar un sidebar moderno y responsive usando el componente Sidebar de shadcn/ui que proporcione acceso rápido a las secciones principales de la aplicación.

## 📦 Accesos Importantes Identificados

Basado en la estructura actual del proyecto, el sidebar incluirá:

1. **Dashboard** (`/dashboard`) - Página principal con estadísticas
2. **Entrenamientos** (`/trainings`) - Lista de todos los entrenamientos
3. **Nuevo Entrenamiento** (`/trainings/new`) - Crear nuevo entrenamiento
4. **Perfil/Configuración** (futuro) - Configuración del usuario
5. **Cerrar Sesión** - Logout del usuario

## 🔧 Pasos de Implementación

### Fase 1: Instalación y Configuración Base

#### 1.1 Instalar el componente Sidebar de shadcn/ui
```bash
npx shadcn@latest add sidebar
```

#### 1.2 Agregar variables CSS del Sidebar
- Agregar las variables CSS necesarias en `src/app/globals.css`
- Incluir soporte para modo claro y oscuro
- Variables específicas para el sidebar (separadas del tema principal)

### Fase 2: Crear Componente AppSidebar

#### 2.1 Crear `src/components/app-sidebar.tsx`
- Estructura básica con `Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`
- Menú de navegación con iconos usando `lucide-react`
- Grupos de menú organizados lógicamente
- Integración con Next.js Link para navegación
- Estado activo basado en la ruta actual

#### 2.2 Elementos del Sidebar:
- **Header**: Logo/Nombre de la app
- **Content**: 
  - Grupo "Principal" con Dashboard y Entrenamientos
  - Grupo "Acciones" con Nuevo Entrenamiento
- **Footer**: 
  - Información del usuario (opcional)
  - Botón de Cerrar Sesión

### Fase 3: Integración en el Layout

#### 3.1 Modificar `src/app/layout.tsx`
- Envolver la aplicación con `SidebarProvider`
- Agregar el componente `AppSidebar`
- Configurar el estado persistente del sidebar (cookies)

#### 3.2 Crear Layout para páginas autenticadas
- Opción A: Modificar el layout raíz para incluir sidebar solo cuando el usuario está autenticado
- Opción B: Crear un layout wrapper para páginas protegidas
- Agregar `SidebarTrigger` para abrir/cerrar el sidebar
- Ajustar el contenido principal para que se adapte al sidebar

### Fase 4: Funcionalidad de Logout

#### 4.1 Crear componente de logout en el sidebar
- Botón en el footer del sidebar
- Usar el hook `useAuth` existente o crear acción de servidor
- Confirmación antes de cerrar sesión (opcional)
- Redirección a `/auth/login` después del logout

### Fase 5: Responsive y Mobile-First

#### 5.1 Comportamiento en móviles
- Sidebar colapsado por defecto en móviles
- Overlay cuando está abierto en móviles
- Botón de toggle siempre visible
- Transiciones suaves

#### 5.2 Comportamiento en desktop
- Sidebar expandido por defecto (o según preferencia guardada)
- Modo iconos cuando está colapsado
- Persistencia del estado en cookies

### Fase 6: Mejoras y Personalización

#### 6.1 Indicador de ruta activa
- Resaltar el elemento del menú correspondiente a la ruta actual
- Usar `usePathname` de Next.js para detectar la ruta

#### 6.2 Iconos apropiados
- Dashboard: `LayoutDashboard` o `Home`
- Entrenamientos: `Dumbbell` o `Activity`
- Nuevo Entrenamiento: `Plus` o `PlusCircle`
- Configuración: `Settings`
- Cerrar Sesión: `LogOut`

#### 6.3 Badges y notificaciones (futuro)
- Contador de entrenamientos pendientes
- Notificaciones

## 📁 Estructura de Archivos a Crear/Modificar

```
src/
├── components/
│   ├── app-sidebar.tsx          [NUEVO] - Componente principal del sidebar
│   └── ui/
│       └── sidebar.tsx           [NUEVO] - Componente base de shadcn/ui
├── app/
│   ├── layout.tsx                [MODIFICAR] - Agregar SidebarProvider
│   └── globals.css               [MODIFICAR] - Agregar variables CSS del sidebar
```

## 🎨 Consideraciones de Diseño

1. **Mobile First**: El sidebar debe funcionar perfectamente en móviles
2. **Tema**: Compatible con modo claro y oscuro existente
3. **Accesibilidad**: Navegación por teclado, ARIA labels
4. **Performance**: Componente ligero, sin re-renders innecesarios

## 🔄 Flujo de Usuario

1. Usuario autenticado accede a cualquier página protegida
2. Ve el sidebar (expandido en desktop, colapsado en mobile)
3. Puede navegar haciendo clic en los elementos del menú
4. Puede colapsar/expandir el sidebar con el trigger
5. Puede cerrar sesión desde el footer del sidebar

## ✅ Checklist de Implementación

- [ ] Instalar componente sidebar de shadcn/ui
- [ ] Agregar variables CSS del sidebar
- [ ] Crear componente AppSidebar con estructura básica
- [ ] Agregar menú de navegación con iconos
- [ ] Integrar SidebarProvider en layout
- [ ] Agregar SidebarTrigger
- [ ] Implementar funcionalidad de logout
- [ ] Configurar estado activo de rutas
- [ ] Ajustar responsive para móviles
- [ ] Probar persistencia del estado del sidebar
- [ ] Verificar accesibilidad
- [ ] Probar en diferentes tamaños de pantalla

## 🚀 Orden de Ejecución Recomendado

1. **Paso 1**: Instalar sidebar y agregar CSS
2. **Paso 2**: Crear AppSidebar básico con estructura
3. **Paso 3**: Integrar en layout con SidebarProvider
4. **Paso 4**: Agregar navegación y rutas
5. **Paso 5**: Implementar logout
6. **Paso 6**: Ajustar responsive y estados activos
7. **Paso 7**: Pruebas y refinamiento

## 📝 Notas Adicionales

- El sidebar debe respetar las rutas protegidas (solo visible cuando el usuario está autenticado)
- Considerar usar Server Components cuando sea posible para mejor performance
- El estado del sidebar (abierto/cerrado) se puede persistir en cookies según la documentación de shadcn/ui
- Mantener consistencia con el diseño existente de la aplicación



