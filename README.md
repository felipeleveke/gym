# 🏋️ Gym Training Tracker

Sistema completo de seguimiento de entrenamientos para gimnasio y deportes al aire libre. Diseñado con enfoque **API First** y **Mobile First** para ofrecer una experiencia óptima en todos los dispositivos.

## 📋 Características Principales

### 🎯 Funcionalidades Core

- **Registro de Entrenamientos de Gimnasio**
  - Ejercicios con series, repeticiones, peso y RPE
  - Seguimiento de tiempo de descanso
  - Notas personalizadas por ejercicio y entrenamiento
  - Catálogo extenso de ejercicios

- **Registro de Entrenamientos Deportivos**
  - Running, ciclismo, natación, fútbol y más
  - Métricas: distancia, velocidad, frecuencia cardíaca
  - Condiciones: terreno, clima, temperatura
  - Elevación y datos de rendimiento

- **Rutinas de Entrenamiento**
  - Creación y gestión de rutinas personalizadas
  - Rutinas predefinidas con ejercicios
  - Programación de frecuencia semanal
  - Activación/desactivación de rutinas

- **Estadísticas y Progreso**
  - Dashboard con métricas clave
  - Gráficos de progreso en fuerza y resistencia
  - Historial completo de entrenamientos
  - Análisis de ejercicios favoritos

- **Sistema de Usuarios**
  - Perfiles de atleta, entrenador y administrador
  - Relaciones entrenador-cliente
  - Gestión de múltiples usuarios

- **Integración con IA**
  - Sugerencias de rutinas personalizadas (Claude)
  - Análisis de progreso inteligente
  - Descripciones de ejercicios (OpenAI)
  - Variaciones de ejercicios

- **PWA (Progressive Web App)**
  - Funcionalidad offline
  - Instalable en dispositivos móviles
  - Sincronización automática cuando hay conexión

- **App Móvil Nativa**
  - Apps nativas para Android e iOS
  - Acceso a cámara para fotos de progreso
  - GPS para rastrear entrenamientos al aire libre
  - Notificaciones push (en desarrollo)
  - Distribución en Google Play Store y App Store

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 15.5 (App Router)
- **UI Library**: React 19
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS v4
- **Componentes**: Shadcn/UI (Radix UI)
- **Gráficos**: Recharts

### Backend
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **Vector Search**: pgvector (para futuras funcionalidades de IA)

### IA
- **Claude**: Anthropic SDK (sugerencias y análisis)
- **OpenAI**: GPT-4 (descripciones y variaciones)

### Deployment
- **Plataforma**: Vercel
- **Edge Middleware**: Para autenticación y optimización

### Mobile (Apps Nativas)
- **Framework**: Capacitor (Ionic)
- **Plataformas**: Android e iOS
- **Plugins Nativos**: Cámara, Geolocalización, Notificaciones Push
- **Distribución**: Google Play Store y App Store

## 📱 Desarrollo Móvil

La aplicación está configurada para funcionar como app móvil nativa usando Capacitor, permitiendo acceso a funcionalidades nativas del dispositivo.

### Funcionalidades Nativas Implementadas

- **Cámara**: Tomar fotos de progreso físico desde el perfil de usuario
- **Geolocalización**: Obtener ubicación GPS para entrenamientos al aire libre
- **Notificaciones Push**: Sistema de notificaciones para recordatorios (configuración pendiente)

### Requisitos para Desarrollo Móvil

#### Android
- Android Studio instalado
- Android SDK configurado
- Dispositivo Android o emulador

#### iOS (solo en macOS)
- Xcode instalado
- CocoaPods instalado (`sudo gem install cocoapods`)
- Dispositivo iOS o simulador

### Comandos de Desarrollo Móvil

```bash
# Sincronizar cambios con plataformas nativas
npm run capacitor:sync

# Abrir proyecto Android en Android Studio
npm run android:dev

# Abrir proyecto iOS en Xcode
npm run ios:dev

# Build para Android
npm run android:build

# Build para iOS
npm run ios:build
```

### Configuración para Desarrollo

1. **Desarrollo Local**: 
   - Descomentar `server.url` en `capacitor.config.ts` para usar el servidor local
   - Ejecutar `npm run dev` en una terminal
   - Ejecutar `npm run android:dev` o `npm run ios:dev` en otra terminal

2. **Producción**:
   - Las API routes estarán en Vercel
   - La app móvil llamará directamente a las APIs de producción
   - Configurar `NEXT_PUBLIC_API_URL` en las variables de entorno

### Estructura de Archivos Móviles

```
gym/
├── android/              # Proyecto Android nativo
│   └── app/
│       └── src/main/
│           ├── AndroidManifest.xml
│           └── assets/
├── ios/                  # Proyecto iOS nativo
│   └── App/
│       └── App/
│           └── Info.plist
├── dist/                 # Archivos estáticos para Capacitor
│   └── index.html
└── capacitor.config.ts   # Configuración de Capacitor
```

### Notas Importantes

- Las API routes de Next.js siguen funcionando normalmente desde Vercel
- En desarrollo, la app móvil puede conectarse al servidor local
- En producción, las APIs se llaman directamente a la URL de Vercel
- Los hooks nativos (`use-camera`, `use-geolocation`, `use-push-notifications`) solo funcionan en plataformas nativas

## 📁 Estructura del Proyecto

```
gym/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── trainings/    # Endpoints de entrenamientos
│   │   │   └── ai/           # Endpoints de IA
│   │   ├── auth/             # Páginas de autenticación
│   │   ├── dashboard/        # Dashboard principal
│   │   └── layout.tsx        # Layout raíz
│   ├── components/           # Componentes React
│   │   ├── ui/               # Componentes de UI base
│   │   └── providers.tsx     # Providers de contexto
│   ├── lib/                  # Utilidades y servicios
│   │   ├── supabase/         # Clientes de Supabase
│   │   ├── ai/               # Integraciones de IA
│   │   └── utils.ts          # Utilidades generales
│   ├── types/                # Tipos TypeScript
│   └── middleware.ts         # Next.js middleware
├── supabase/
│   ├── migrations/           # Migraciones de base de datos
│   └── config.toml           # Configuración de Supabase
├── public/                    # Archivos estáticos
│   ├── manifest.json         # PWA manifest
│   └── sw.js                 # Service Worker
└── package.json
```

## 🗄️ Esquema de Base de Datos

### Tablas Principales

- **profiles**: Perfiles de usuario (extiende auth.users)
- **exercises**: Catálogo de ejercicios
- **workout_routines**: Rutinas de entrenamiento
- **routine_exercises**: Ejercicios en rutinas
- **gym_trainings**: Entrenamientos de gimnasio
- **training_exercises**: Ejercicios en entrenamientos
- **exercise_sets**: Series de ejercicios
- **sport_trainings**: Entrenamientos deportivos
- **trainer_clients**: Relaciones entrenador-cliente

### Seguridad

- **Row Level Security (RLS)** habilitado en todas las tablas
- Políticas de acceso basadas en usuario autenticado
- Los entrenadores pueden ver datos de sus clientes
- Los usuarios solo pueden gestionar sus propios datos

## 🚀 Configuración y Despliegue

### Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- Cuentas de API para Anthropic y OpenAI (opcional)

### Instalación Local

1. **Clonar el repositorio**
```bash
git clone <repo-url>
cd gym
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Crea un archivo `.env.local` con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

ANTHROPIC_API_KEY=tu_anthropic_key
OPENAI_API_KEY=tu_openai_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Configurar Supabase Local (Opcional)**

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar Supabase local
supabase init

# Iniciar servicios locales
supabase start

# Aplicar migraciones
supabase db reset
```

5. **Ejecutar en desarrollo**

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Despliegue en Vercel

1. **Conectar repositorio a Vercel**
   - Importa el proyecto desde GitHub/GitLab
   - Vercel detectará automáticamente Next.js

2. **Configurar variables de entorno**
   - En el dashboard de Vercel, agrega todas las variables de `.env.local`
   - Especialmente importantes: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Desplegar**
   - Vercel desplegará automáticamente en cada push a la rama principal
   - O puedes hacerlo manualmente desde el dashboard

4. **Configurar Supabase en producción**
   - Asegúrate de que las políticas RLS estén configuradas correctamente
   - Verifica que las migraciones estén aplicadas en producción

## 📱 Uso de la Aplicación

### Primeros Pasos

1. **Crear cuenta**: Regístrate con tu email
2. **Completar perfil**: Agrega tu nombre y configura tu rol
3. **Explorar ejercicios**: Navega por el catálogo de ejercicios
4. **Crear rutina**: Diseña tu primera rutina de entrenamiento
5. **Registrar entrenamiento**: Comienza a registrar tus sesiones

### Registro de Entrenamientos

#### Entrenamiento de Gimnasio
1. Selecciona "Nuevo Entrenamiento" → "Gimnasio"
2. Agrega ejercicios desde el catálogo
3. Para cada ejercicio, registra:
   - Series y repeticiones
   - Peso utilizado
   - Tiempo de descanso
   - RPE (opcional)
   - Notas personales
4. Guarda el entrenamiento

#### Entrenamiento Deportivo
1. Selecciona "Nuevo Entrenamiento" → "Deporte"
2. Elige el tipo de deporte
3. Completa las métricas:
   - Distancia y duración
   - Velocidad promedio/máxima
   - Frecuencia cardíaca
   - Condiciones ambientales
4. Guarda el entrenamiento

### Uso de IA

- **Sugerencias de Rutina**: Describe tus objetivos y obtén rutinas personalizadas
- **Análisis de Progreso**: Revisa insights automáticos sobre tu evolución
- **Descripciones de Ejercicios**: Obtén instrucciones detalladas de cualquier ejercicio

## 🔧 Scripts Disponibles

### Desarrollo Web
```bash
npm run dev          # Desarrollo local
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
npm run type-check   # Verificación de tipos
```

### Base de Datos
```bash
npm run db:generate  # Generar tipos de Supabase
npm run db:reset     # Resetear base de datos local
npm run db:migrate   # Aplicar migraciones
```

### Mobile (Capacitor)
```bash
npm run capacitor:sync    # Sincronizar cambios con plataformas nativas
npm run capacitor:copy   # Copiar assets web a plataformas nativas
npm run capacitor:update # Actualizar dependencias nativas
npm run android:dev     # Build y abrir Android Studio
npm run android:build   # Build para Android
npm run ios:dev         # Build y abrir Xcode
npm run ios:build       # Build para iOS
```

## 🔐 Seguridad

- Autenticación mediante Supabase Auth
- Row Level Security (RLS) en todas las tablas
- Validación de datos en cliente y servidor
- Variables de entorno para secretos
- HTTPS obligatorio en producción

## 📊 API Endpoints

### Entrenamientos

- `GET /api/trainings?type=gym|sport` - Listar entrenamientos
- `POST /api/trainings` - Crear entrenamiento
- `GET /api/trainings/[id]` - Obtener entrenamiento específico
- `PUT /api/trainings/[id]` - Actualizar entrenamiento
- `DELETE /api/trainings/[id]` - Eliminar entrenamiento

### IA

- `POST /api/ai/workout-suggestion` - Generar sugerencia de rutina
- `POST /api/ai/analyze-progress` - Analizar progreso

## 🎨 Diseño Mobile First

La aplicación está diseñada con enfoque mobile-first:
- Diseño responsive que se adapta a todos los tamaños de pantalla
- Componentes optimizados para touch
- Navegación intuitiva en móviles
- PWA instalable para acceso rápido

## 🚧 Próximas Funcionalidades

- [x] App móvil nativa (Android e iOS) con Capacitor
- [x] Integración de cámara para fotos de progreso
- [x] Integración de GPS para entrenamientos al aire libre
- [ ] Notificaciones push para recordatorios (infraestructura lista)
- [ ] Compartir entrenamientos en redes sociales
- [ ] Integración con wearables (Apple Watch, Garmin)
- [ ] Modo oscuro mejorado
- [ ] Exportación de datos (PDF, CSV)
- [ ] Búsqueda avanzada de ejercicios
- [ ] Planes de entrenamiento predefinidos
- [ ] Comunidad y desafíos

## 📝 Licencia

Este proyecto es privado y de uso personal.

## 🤝 Contribuciones

Este es un proyecto personal. Si tienes sugerencias o encuentras bugs, por favor abre un issue.

---

**Desarrollado con ❤️ usando Next.js, Supabase y IA**

