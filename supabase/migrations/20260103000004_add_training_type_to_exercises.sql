-- Agregar columna training_type a exercises
-- Este campo permite categorizar ejercicios por tipo de entrenamiento

-- Agregar la columna con el mismo enum que se usa en routines
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS training_type TEXT 
CHECK (training_type IN ('gym', 'sport', 'cardio', 'flexibility', 'other'));

-- Comentario para documentar la columna
COMMENT ON COLUMN exercises.training_type IS 'Tipo de entrenamiento: gym, sport, cardio, flexibility, other';

-- Por defecto, asignar 'gym' a los ejercicios existentes que no tengan tipo
UPDATE exercises SET training_type = 'gym' WHERE training_type IS NULL;
