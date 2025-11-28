-- Script SQL para agregar la columna muscle_groups_json manualmente
-- Ejecuta esto en el SQL Editor de Supabase Dashboard

-- Agregar nueva columna JSONB
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS muscle_groups_json JSONB DEFAULT '[]'::JSONB;

-- Crear índice GIN para búsquedas eficientes en JSONB
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups_json ON public.exercises USING GIN(muscle_groups_json);

-- Migrar datos existentes (opcional - convierte muscle_groups a muscle_groups_json)
DO $$
DECLARE
  exercise_record RECORD;
  muscle_group_name TEXT;
  json_data JSONB;
BEGIN
  FOR exercise_record IN SELECT id, muscle_groups FROM public.exercises WHERE muscle_groups IS NOT NULL
  LOOP
    json_data := '[]'::JSONB;
    
    IF exercise_record.muscle_groups IS NOT NULL THEN
      FOR muscle_group_name IN SELECT unnest(exercise_record.muscle_groups)
      LOOP
        json_data := json_data || jsonb_build_object(
          'name', muscle_group_name,
          'type', 'primary',
          'percentage', 100
        );
      END LOOP;
    END IF;
    
    UPDATE public.exercises
    SET muscle_groups_json = json_data
    WHERE id = exercise_record.id;
  END LOOP;
END $$;










