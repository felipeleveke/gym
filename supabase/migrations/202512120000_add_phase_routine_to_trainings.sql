-- Add phase_routine_id to gym_trainings to link sessions to scheduled program routines
ALTER TABLE public.gym_trainings 
ADD COLUMN IF NOT EXISTS phase_routine_id UUID REFERENCES public.phase_routines(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_gym_trainings_phase_routine_id ON public.gym_trainings(phase_routine_id);
