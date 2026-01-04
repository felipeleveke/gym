-- Crear tabla de tipos de entrenamiento
-- Esta migración mueve los tipos de entrenamiento de un ENUM hardcodeado a una tabla dinámica

-- 1. Crear la tabla training_types
CREATE TABLE public.training_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  value TEXT NOT NULL UNIQUE, -- Valor interno (ej: 'gym', 'cardio', 'warmup')
  label TEXT NOT NULL, -- Etiqueta visible (ej: 'Gimnasio / Pesas', 'Cardio')
  description TEXT, -- Descripción opcional
  icon TEXT, -- Nombre del icono de lucide-react (ej: 'Dumbbell', 'Heart')
  display_order INTEGER NOT NULL DEFAULT 0, -- Orden de aparición en la UI
  is_active BOOLEAN NOT NULL DEFAULT true, -- Si el tipo está activo/visible
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Insertar los tipos de entrenamiento existentes más los nuevos
INSERT INTO public.training_types (value, label, description, icon, display_order) VALUES
  ('gym', 'Gimnasio / Pesas', 'Entrenamiento con pesas y máquinas', 'Dumbbell', 1),
  ('cardio', 'Cardio', 'Ejercicios cardiovasculares', 'Heart', 2),
  ('sport', 'Deporte', 'Running, ciclismo, natación, etc.', 'Trophy', 3),
  ('flexibility', 'Flexibilidad', 'Yoga, estiramientos, pilates', 'Sparkles', 4),
  ('warmup', 'Calentamiento', 'Ejercicios de calentamiento y activación', 'Flame', 5),
  ('circuit', 'Circuito Intermitente', 'Entrenamiento en circuito de alta intensidad', 'Zap', 6),
  ('other', 'Otro', 'Otro tipo de entrenamiento', 'HelpCircle', 7);

-- 3. Crear índice para búsquedas
CREATE INDEX idx_training_types_value ON public.training_types(value);
CREATE INDEX idx_training_types_display_order ON public.training_types(display_order);

-- 4. Habilitar RLS
ALTER TABLE public.training_types ENABLE ROW LEVEL SECURITY;

-- 5. Política de lectura pública (cualquiera puede ver los tipos)
CREATE POLICY "Anyone can view training types"
  ON public.training_types FOR SELECT
  USING (true);

-- 6. Solo admins pueden modificar (por ahora no implementamos INSERT/UPDATE/DELETE políticas)

-- 7. Agregar trigger para updated_at
CREATE TRIGGER update_training_types_updated_at
  BEFORE UPDATE ON public.training_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Modificar la columna training_type en exercises para aceptar los nuevos valores
-- Primero eliminamos el CHECK constraint existente si existe
DO $$
BEGIN
  -- Intentar eliminar el constraint existente
  ALTER TABLE public.exercises DROP CONSTRAINT IF EXISTS exercises_training_type_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- 9. Agregar nuevo CHECK constraint con la lista completa de tipos
ALTER TABLE public.exercises
ADD CONSTRAINT exercises_training_type_check 
CHECK (training_type IN ('gym', 'sport', 'cardio', 'flexibility', 'other', 'warmup', 'circuit'));

-- 10. Comentarios para documentación
COMMENT ON TABLE public.training_types IS 'Tipos de entrenamiento disponibles en la aplicación';
COMMENT ON COLUMN public.training_types.value IS 'Valor interno único usado en el código';
COMMENT ON COLUMN public.training_types.label IS 'Etiqueta visible para el usuario';
COMMENT ON COLUMN public.training_types.icon IS 'Nombre del icono de lucide-react';
COMMENT ON COLUMN public.training_types.display_order IS 'Orden de aparición en selectores';
