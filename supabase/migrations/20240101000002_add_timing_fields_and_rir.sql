-- Agregar campos de tiempo al entrenamiento
ALTER TABLE public.gym_trainings 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Agregar campos de tiempo a los ejercicios del entrenamiento
ALTER TABLE public.training_exercises 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Renombrar rpe a rir en exercise_sets
ALTER TABLE public.exercise_sets 
RENAME COLUMN rpe TO rir;

-- Actualizar el constraint CHECK para rir (Reps In Reserve)
ALTER TABLE public.exercise_sets 
DROP CONSTRAINT IF EXISTS exercise_sets_rpe_check;

ALTER TABLE public.exercise_sets 
ADD CONSTRAINT exercise_sets_rir_check CHECK (rir >= 0 AND rir <= 10);

-- Crear índices para mejorar las consultas de tiempo
CREATE INDEX IF NOT EXISTS idx_gym_trainings_start_time ON public.gym_trainings(start_time);
CREATE INDEX IF NOT EXISTS idx_gym_trainings_end_time ON public.gym_trainings(end_time);
CREATE INDEX IF NOT EXISTS idx_training_exercises_start_time ON public.training_exercises(start_time);
CREATE INDEX IF NOT EXISTS idx_training_exercises_end_time ON public.training_exercises(end_time);













