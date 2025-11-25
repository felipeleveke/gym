# 🔗 Guía de Conexión con Supabase CLI

## Paso 1: Instalar Supabase CLI

### Windows (PowerShell)
```powershell
# Opción 1: Con npm (recomendado)
npm install -g supabase

# Opción 2: Con Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Verificar instalación
```bash
supabase --version
```

## Paso 2: Iniciar Sesión en Supabase

```bash
supabase login
```

Esto abrirá tu navegador para autenticarte. Una vez autenticado, vuelve a la terminal.

## Paso 3: Vincular tu Proyecto Local con Supabase Remoto

### Opción A: Si ya tienes un proyecto en Supabase Cloud

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Ve a **Settings** → **General**
3. Copia el **Reference ID** del proyecto (algo como `abcdefghijklmnop`)

4. En tu terminal, ejecuta:
```bash
supabase link --project-ref tu-reference-id
```

Te pedirá:
- **Database Password**: La contraseña que configuraste al crear el proyecto
- **Git branch**: Presiona Enter para usar `main` (o el nombre de tu rama)

### Opción B: Si quieres crear un nuevo proyecto desde CLI

```bash
supabase projects create nombre-del-proyecto --org-id tu-org-id --region us-east-1 --db-password tu-password-segura
```

Luego vincula:
```bash
supabase link --project-ref reference-id-del-proyecto-creado
```

## Paso 4: Verificar la Conexión

```bash
supabase status
```

Deberías ver información sobre tu proyecto remoto vinculado.

## Paso 5: Hacer Push de las Migraciones

### Ver migraciones pendientes
```bash
supabase db diff
```

### Hacer push de todas las migraciones
```bash
supabase db push
```

Esto aplicará todas las migraciones en `supabase/migrations/` a tu base de datos remota.

### Hacer push de una migración específica
```bash
supabase migration up
```

## Paso 6: Verificar que las Migraciones se Aplicaron

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **SQL Editor**
3. Ejecuta:
```sql
SELECT * FROM pg_tables WHERE schemaname = 'public';
```

Deberías ver todas las tablas creadas por la migración.

## Comandos Útiles

### Ver estado de la base de datos
```bash
supabase db remote commit
```

### Generar tipos TypeScript desde remoto
```bash
supabase gen types typescript --linked > src/types/supabase.ts
```

### Ver diferencias entre local y remoto
```bash
supabase db diff
```

### Resetear base de datos remota (¡CUIDADO!)
```bash
supabase db reset --linked
```

### Desvincular proyecto
```bash
supabase unlink
```

## Solución de Problemas

### Error: "Project not found"
- Verifica que el Reference ID sea correcto
- Asegúrate de estar autenticado: `supabase login`

### Error: "Database password incorrect"
- Ve a Supabase Dashboard → Settings → Database
- Puedes resetear la contraseña si es necesario

### Error: "Migration already applied"
- Esto es normal si la migración ya existe en remoto
- Puedes verificar con `supabase migration list`

### Error de permisos
- Asegúrate de tener permisos de administrador en el proyecto
- Verifica que estés en el equipo correcto de Supabase

## Flujo de Trabajo Recomendado

1. **Desarrollo local** (opcional):
   ```bash
   supabase start  # Solo si trabajas localmente
   ```

2. **Hacer cambios**:
   - Edita las migraciones o crea nuevas en `supabase/migrations/`

3. **Aplicar a remoto**:
   ```bash
   supabase db push
   ```

4. **Generar tipos**:
   ```bash
   supabase gen types typescript --linked > src/types/supabase.ts
   ```

5. **Verificar**:
   - Revisa en Supabase Dashboard que los cambios se aplicaron

## ⚠️ Importante

- **Nunca** hagas `db reset` en producción sin backup
- Siempre verifica las migraciones antes de hacer push
- Usa `db diff` para ver qué cambios se aplicarán
- Mantén un backup de tu base de datos antes de cambios importantes



