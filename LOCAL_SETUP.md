# 🚀 Configuración Local - Gym Training Tracker

## Estado Actual

✅ **Supabase Local**: Corriendo en puertos personalizados
✅ **Migraciones**: Aplicadas correctamente
✅ **Variables de Entorno**: Configuradas en `.env.local`
✅ **Aplicación Next.js**: Iniciando en modo desarrollo

## URLs Importantes

### Supabase Local
- **API URL**: `http://127.0.0.1:54331`
- **Studio URL**: `http://127.0.0.1:54333` (Interfaz web de administración)
- **Database URL**: `postgresql://postgres:postgres@127.0.0.1:54332/postgres`
- **Mailpit (Emails)**: `http://127.0.0.1:54334`

### Aplicación Next.js
- **App URL**: `http://localhost:3000`
- **Health Check**: `http://localhost:3000/health`

## Comandos Útiles

### Gestión de Supabase Local

```powershell
# Iniciar Supabase local
npm run supabase:local:start
# o
npx supabase start

# Detener Supabase local
npm run supabase:local:stop
# o
npx supabase stop

# Ver estado
npm run supabase:status
# o
npx supabase status

# Resetear base de datos (aplica todas las migraciones)
npm run supabase:local:reset
# o
npx supabase db reset

# Generar tipos TypeScript desde local
npm run supabase:local:types
# o
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Desarrollo

```powershell
# Iniciar aplicación en desarrollo
npm run dev

# Build de producción (local)
npm run build

# Ejecutar build de producción
npm run start

# Verificar tipos TypeScript
npm run type-check

# Linter
npm run lint
```

## Estructura de Puertos

Este proyecto usa puertos personalizados para evitar conflictos con otros proyectos:

| Servicio | Puerto |
|----------|--------|
| API | 54331 |
| Database | 54332 |
| Studio | 54333 |
| Inbucket (Email) | 54334 |
| Shadow DB | 54330 |
| Pooler | 54339 |
| Next.js App | 3000 |

## Variables de Entorno

El archivo `.env.local` contiene:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Próximos Pasos

1. ✅ Supabase local corriendo
2. ✅ Migraciones aplicadas
3. ✅ Variables de entorno configuradas
4. ✅ Aplicación iniciando

### Para probar la aplicación:

1. Abre tu navegador en `http://localhost:3000`
2. Serás redirigido a `/auth/login`
3. Crea una cuenta nueva
4. Verifica que puedas acceder al dashboard

### Para administrar la base de datos:

1. Abre Supabase Studio: `http://127.0.0.1:54333`
2. Puedes ver y editar tablas directamente
3. Ver usuarios en Authentication → Users
4. Ver emails de prueba en Mailpit: `http://127.0.0.1:54334`

## Solución de Problemas

### Error: "Cannot connect to Supabase"
- Verifica que Supabase local esté corriendo: `npx supabase status`
- Verifica que `.env.local` exista y tenga las credenciales correctas

### Error: "Port already in use"
- Verifica que no haya otro proyecto usando los mismos puertos
- Los puertos están configurados en `supabase/config.toml`

### Error: "Migration failed"
- Ejecuta `npm run supabase:local:reset` para resetear y aplicar todas las migraciones

### La aplicación no inicia
- Verifica que todas las dependencias estén instaladas: `npm install`
- Revisa los logs en la terminal para ver errores específicos

## Notas Importantes

- **pgvector**: La extensión está comentada en la migración para desarrollo local (no está disponible en Supabase local)
- **Puertos personalizados**: Este proyecto usa puertos diferentes para evitar conflictos
- **Base de datos aislada**: Cada proyecto Supabase local tiene su propia base de datos independiente



