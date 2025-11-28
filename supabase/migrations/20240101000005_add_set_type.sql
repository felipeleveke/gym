-- Agregar campo set_type a exercise_sets
-- Tipo de serie: 'warmup' (calentamiento), 'approach' (aproximación), 'working' (efectiva), 'bilbo' (bilbo)
CREATE TYPE set_type_enum AS ENUM ('warmup', 'approach', 'working', 'bilbo');

ALTER TABLE public.exercise_sets 
ADD COLUMN IF NOT EXISTS set_type set_type_enum DEFAULT 'working';

-- Crear índice para mejorar las consultas por tipo de serie
CREATE INDEX IF NOT EXISTS idx_exercise_sets_set_type ON public.exercise_sets(set_type);

