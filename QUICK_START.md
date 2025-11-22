# ⚡ Inicio Rápido - Despliegue en Vercel

## 🎯 Pasos Rápidos para Desplegar

### 1️⃣ Configurar Supabase Remoto (5 minutos)

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que termine de inicializar (2-3 minutos)
4. Ve a **Settings** → **API** y copia:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key
   - **service_role** key (secret)

5. Ve a **SQL Editor** y ejecuta el contenido completo de:
   ```
   supabase/migrations/20240101000000_initial_schema.sql
   ```

6. Ve a **Authentication** → **URL Configuration**:
   - **Site URL**: `https://tu-app.vercel.app` (o `http://localhost:3000` para desarrollo)
   - **Redirect URLs**: Agrega `https://tu-app.vercel.app/**`

### 2️⃣ Preparar Variables de Entorno

Prepara estas variables para Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
NODE_ENV=production
```

### 3️⃣ Desplegar en Vercel

#### Opción A: Desde el Dashboard (Más Fácil)

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en **"Add New Project"**
3. Conecta tu repositorio de GitHub/GitLab
4. Vercel detectará Next.js automáticamente
5. En **Environment Variables**, agrega todas las variables del paso 2
6. Haz clic en **"Deploy"**
7. Espera 2-3 minutos
8. ¡Listo! Tu app estará en `https://tu-app.vercel.app`

#### Opción B: Desde CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Iniciar sesión
vercel login

# Desplegar
vercel

# Desplegar a producción
vercel --prod
```

### 4️⃣ Verificar Conexión

Después del despliegue:

1. Visita: `https://tu-app.vercel.app/health`
2. Deberías ver el estado de la conexión con Supabase
3. Si todo está bien, verás ✅ en todas las verificaciones

### 5️⃣ Probar la Aplicación

1. Ve a `https://tu-app.vercel.app`
2. Serás redirigido a `/auth/login`
3. Crea una cuenta nueva
4. Verifica que puedas acceder al dashboard

## ✅ Checklist de Verificación

- [ ] Proyecto creado en Supabase Cloud
- [ ] Migración SQL ejecutada en Supabase
- [ ] Site URL configurada en Supabase
- [ ] Redirect URLs configuradas en Supabase
- [ ] Variables de entorno agregadas en Vercel
- [ ] Deployment exitoso en Vercel
- [ ] Página `/health` muestra conexión exitosa
- [ ] Puedes crear cuenta y acceder al dashboard

## 🔧 Solución Rápida de Problemas

### ❌ Error: "Invalid API key"
**Solución**: Verifica que las variables en Vercel sean correctas y reinicia el deployment

### ❌ Error: "Redirect URL mismatch"
**Solución**: Agrega tu URL de Vercel en Supabase → Authentication → Redirect URLs

### ❌ Error: "Row Level Security policy violation"
**Solución**: Verifica que la migración SQL se ejecutó completamente

### ❌ Build falla en Vercel
**Solución**: Revisa los logs de build y verifica que todas las dependencias estén en `package.json`

## 📞 Comandos Útiles

```bash
# Verificar variables de entorno localmente
npm run verify:env

# Verificar conexión con Supabase
npm run verify:connection

# Build local para probar
npm run build
```

## 🎉 ¡Listo!

Tu aplicación está desplegada y funcionando con Supabase remoto.

**Próximos pasos:**
- Personaliza el diseño
- Agrega ejercicios al catálogo
- Implementa formularios de entrenamiento
- Configura las APIs de IA (opcional)

