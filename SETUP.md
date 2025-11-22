# 🚀 Guía de Configuración Inicial

## Pasos para poner en marcha el proyecto

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Supabase

#### Opción A: Supabase Cloud (Recomendado para producción)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia la URL y la Anon Key desde Settings → API
4. En el SQL Editor, ejecuta el contenido de `supabase/migrations/20240101000000_initial_schema.sql`

#### Opción B: Supabase Local (Para desarrollo)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar (si no está inicializado)
supabase init

# Iniciar servicios locales
supabase start

# Aplicar migraciones
supabase db reset
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Opcional: Para funcionalidades de IA
ANTHROPIC_API_KEY=tu_anthropic_key
OPENAI_API_KEY=tu_openai_key

NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Generar Tipos de TypeScript (Opcional)

Si usas Supabase local:

```bash
npm run db:generate
```

Esto generará `src/types/supabase.ts` con los tipos de la base de datos.

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 6. Crear tu Primera Cuenta

1. Ve a `http://localhost:3000`
2. Serás redirigido a `/auth/login`
3. Haz clic en "Crear Cuenta"
4. Completa el formulario
5. Revisa tu email para confirmar (si tienes confirmaciones habilitadas)

## ✅ Verificación

Una vez configurado, deberías poder:

- ✅ Ver la página de login
- ✅ Crear una cuenta
- ✅ Acceder al dashboard
- ✅ Ver la estructura de base de datos en Supabase Studio

## 🔧 Solución de Problemas

### Error: "NEXT_PUBLIC_SUPABASE_URL is not defined"

- Verifica que el archivo `.env.local` existe
- Asegúrate de que las variables empiezan con `NEXT_PUBLIC_` para las que se usan en el cliente
- Reinicia el servidor de desarrollo después de cambiar `.env.local`

### Error de conexión a Supabase

- Verifica que la URL y las keys sean correctas
- Si usas Supabase local, asegúrate de que `supabase start` esté ejecutándose
- Verifica que no haya problemas de firewall

### Error en migraciones

- Si usas Supabase Cloud, ejecuta el SQL manualmente en el SQL Editor
- Si usas Supabase local, ejecuta `supabase db reset` para empezar de cero

## 📝 Próximos Pasos

1. **Personalizar el diseño**: Modifica los colores en `src/app/globals.css`
2. **Agregar ejercicios**: Crea un seed script o agrega ejercicios manualmente en Supabase
3. **Implementar formularios**: Completa los formularios de creación de entrenamientos
4. **Agregar gráficos**: Implementa visualizaciones con Recharts en el dashboard
5. **Configurar IA**: Agrega las API keys para habilitar funcionalidades de IA

## 🚀 Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Agrega todas las variables de entorno en el dashboard de Vercel
3. Vercel detectará Next.js automáticamente
4. Despliega y verifica que todo funcione

¡Listo para empezar! 🎉

