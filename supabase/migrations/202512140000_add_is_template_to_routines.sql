ALTER TABLE public.workout_routines ADD COLUMN is_template BOOLEAN DEFAULT true;
CREATE INDEX idx_workout_routines_is_template ON public.workout_routines(is_template);

