-- Cambiar muscle_groups de TEXT[] a JSONB para almacenar tipo y porcentaje
-- Primero, crear una función para migrar datos existentes
CREATE OR REPLACE FUNCTION migrate_muscle_groups_to_jsonb()
RETURNS void AS $$
DECLARE
  exercise_record RECORD;
  muscle_group_name TEXT;
  json_data JSONB;
BEGIN
  -- Iterar sobre todos los ejercicios
  FOR exercise_record IN SELECT id, muscle_groups FROM public.exercises WHERE muscle_groups IS NOT NULL
  LOOP
    json_data := '[]'::JSONB;
    
    -- Convertir cada grupo muscular a objeto JSON con tipo primario y 100%
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
    
    -- Actualizar el ejercicio con la nueva estructura
    UPDATE public.exercises
    SET muscle_groups_json = json_data
    WHERE id = exercise_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Agregar nueva columna JSONB
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS muscle_groups_json JSONB DEFAULT '[]'::JSONB;

-- Migrar datos existentes
SELECT migrate_muscle_groups_to_jsonb();

-- Eliminar función temporal
DROP FUNCTION IF EXISTS migrate_muscle_groups_to_jsonb();

-- Crear índice GIN para búsquedas eficientes en JSONB
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups_json ON public.exercises USING GIN(muscle_groups_json);

-- Nota: La columna muscle_groups (TEXT[]) se mantiene por compatibilidad temporal
-- Se puede eliminar después de verificar que todo funciona correctamente

