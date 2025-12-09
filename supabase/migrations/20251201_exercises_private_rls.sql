-- Agregar columna created_by a la tabla exercises
ALTER TABLE public.exercises 
ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Asignar ejercicios existentes al usuario felipeleveke@gmail.com
UPDATE public.exercises 
SET created_by = (SELECT id FROM public.profiles WHERE email = 'felipeleveke@gmail.com')
WHERE created_by IS NULL;

-- Hacer la columna NOT NULL después de la migración de datos
ALTER TABLE public.exercises 
ALTER COLUMN created_by SET NOT NULL;

-- Eliminar políticas antiguas de exercises
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can create exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can delete exercises" ON public.exercises;

-- Crear nuevas políticas RLS (privadas por usuario)
-- Solo ver ejercicios propios
CREATE POLICY "Users can view own exercises"
  ON public.exercises FOR SELECT
  USING (auth.uid() = created_by);

-- Solo crear ejercicios asignados a sí mismo
CREATE POLICY "Users can create own exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Solo actualizar ejercicios propios
CREATE POLICY "Users can update own exercises"
  ON public.exercises FOR UPDATE
  USING (auth.uid() = created_by);

-- Solo eliminar ejercicios propios
CREATE POLICY "Users can delete own exercises"
  ON public.exercises FOR DELETE
  USING (auth.uid() = created_by);

-- Crear índice para mejorar rendimiento
CREATE INDEX idx_exercises_created_by ON public.exercises(created_by);










