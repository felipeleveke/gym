-- Corregir política RLS para permitir la creación de ejercicios
-- El problema es que la política debe verificar que auth.uid() coincida con created_by

-- Eliminar la política problemática
DROP POLICY IF EXISTS "Users can create own exercises" ON public.exercises;

-- Crear nueva política que verifica correctamente la autenticación
-- Esta política permite insertar ejercicios cuando:
-- 1. El usuario está autenticado (auth.uid() IS NOT NULL)
-- 2. El created_by que se está insertando coincide con auth.uid()
CREATE POLICY "Users can create own exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = created_by
  );

