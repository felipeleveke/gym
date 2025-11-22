# 🚀 Guía de Despliegue en Vercel

## Configuración para Supabase Remoto

Este proyecto está configurado para trabajar **exclusivamente con Supabase remoto** (cloud). No requiere configuración local.

## Paso 1: Configurar Supabase Cloud

### 1.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) e inicia sesión
2. Crea un nuevo proyecto
3. Anota los siguientes datos:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: Clave pública (segura para usar en el cliente)
   - **Service Role Key**: Clave privada (solo para servidor)

### 1.2 Aplicar Migraciones

1. En tu proyecto de Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase/migrations/20240101000000_initial_schema.sql`
3. Copia todo el contenido y pégalo en el SQL Editor
4. Ejecuta la migración (botón "Run")
5. Verifica que todas las tablas se hayan creado correctamente

### 1.3 Verificar Configuración de Auth

1. Ve a **Authentication** → **URL Configuration**
2. Asegúrate de que:
   - **Site URL**: Tu URL de Vercel (o `http://localhost:3000` para desarrollo)
   - **Redirect URLs**: Agrega tu dominio de Vercel

## Paso 2: Preparar el Proyecto para Vercel

### 2.1 Verificar Archivos de Configuración

Los siguientes archivos ya están configurados:
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `next.config.js` - Configuración de Next.js
- ✅ `.gitignore` - Excluye archivos sensibles

### 2.2 Variables de Entorno Necesarias

Prepara estas variables para agregarlas en Vercel:

```env
# Supabase (OBLIGATORIO)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App URL
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app

# IA (Opcional)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Environment
NODE_ENV=production
```

## Paso 3: Desplegar en Vercel

### Opción A: Desde GitHub/GitLab (Recomendado)

1. **Sube tu código a GitHub/GitLab**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin tu-repositorio-url
   git push -u origin main
   ```

2. **Conecta con Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Inicia sesión con GitHub/GitLab
   - Haz clic en "Add New Project"
   - Selecciona tu repositorio
   - Vercel detectará automáticamente Next.js

3. **Configura Variables de Entorno**
   - En la configuración del proyecto, ve a **Settings** → **Environment Variables**
   - Agrega todas las variables de la sección 2.2
   - **IMPORTANTE**: Marca todas las variables para los 3 entornos (Production, Preview, Development)

4. **Despliega**
   - Haz clic en "Deploy"
   - Espera a que termine el build
   - Tu app estará disponible en `https://tu-app.vercel.app`

### Opción B: Desde CLI de Vercel

1. **Instala Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Inicia sesión**
   ```bash
   vercel login
   ```

3. **Despliega**
   ```bash
   vercel
   ```
   - Sigue las instrucciones
   - Cuando pregunte por variables de entorno, agrégalas o hazlo después en el dashboard

4. **Despliega a producción**
   ```bash
   vercel --prod
   ```

## Paso 4: Verificar Conexión con Supabase

### 4.1 Verificación Automática

Después del despliegue, visita:
- `https://tu-app.vercel.app/auth/login`

Deberías ver la página de login sin errores.

### 4.2 Verificación Manual

1. Intenta crear una cuenta
2. Verifica que recibas el email de confirmación (si está habilitado)
3. Intenta iniciar sesión
4. Verifica que puedas acceder al dashboard

### 4.3 Verificar en Supabase Dashboard

1. Ve a tu proyecto en Supabase
2. **Authentication** → **Users**: Deberías ver usuarios creados
3. **Table Editor**: Verifica que las tablas existan
4. **Logs**: Revisa si hay errores de conexión

## Paso 5: Configurar Dominio Personalizado (Opcional)

1. En Vercel, ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de DNS
4. **IMPORTANTE**: Actualiza la **Site URL** en Supabase con tu nuevo dominio

## 🔧 Solución de Problemas

### Error: "Invalid API key" o "Failed to fetch"

**Causa**: Variables de entorno incorrectas o no configuradas

**Solución**:
1. Verifica que las variables en Vercel sean correctas
2. Asegúrate de que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén configuradas
3. Reinicia el deployment después de agregar variables

### Error: "Redirect URL mismatch"

**Causa**: La URL de redirección no está en la lista de Supabase

**Solución**:
1. Ve a Supabase → **Authentication** → **URL Configuration**
2. Agrega tu URL de Vercel a **Redirect URLs**
3. Formato: `https://tu-app.vercel.app/**`

### Error: "Row Level Security policy violation"

**Causa**: Las políticas RLS no están aplicadas correctamente

**Solución**:
1. Verifica que la migración SQL se ejecutó completamente
2. Revisa las políticas en Supabase → **Authentication** → **Policies**
3. Asegúrate de que el usuario esté autenticado

### Build falla en Vercel

**Causa**: Dependencias o configuración incorrecta

**Solución**:
1. Verifica los logs de build en Vercel
2. Asegúrate de que `package.json` tenga todas las dependencias
3. Verifica que Node.js version sea compatible (18+)

## ✅ Checklist Pre-Despliegue

- [ ] Código subido a GitHub/GitLab
- [ ] Proyecto creado en Supabase Cloud
- [ ] Migración SQL ejecutada en Supabase
- [ ] Variables de entorno preparadas
- [ ] Site URL configurada en Supabase
- [ ] Redirect URLs configuradas en Supabase
- [ ] Proyecto conectado en Vercel
- [ ] Variables de entorno agregadas en Vercel
- [ ] Build exitoso en Vercel
- [ ] Conexión verificada después del despliegue

## 📝 Notas Importantes

1. **Nunca commitees** archivos `.env.local` o `.env` al repositorio
2. **Siempre usa** variables de entorno en Vercel para secretos
3. **Verifica** que las variables `NEXT_PUBLIC_*` estén disponibles en el cliente
4. **Actualiza** las URLs de Supabase cuando cambies de dominio
5. **Revisa** los logs de Vercel y Supabase si hay problemas

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación estará desplegada y funcionando con Supabase remoto.

