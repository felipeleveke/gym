-- Add columns to support program-specific routines
ALTER TABLE public.workout_routines 
ADD COLUMN program_id UUID REFERENCES public.training_programs(id) ON DELETE CASCADE,
ADD COLUMN origin_routine_id UUID REFERENCES public.workout_routines(id) ON DELETE SET NULL;

CREATE INDEX idx_workout_routines_program_id ON public.workout_routines(program_id);

-- Function to clone a workout routine
CREATE OR REPLACE FUNCTION public.clone_workout_routine(
  source_routine_id UUID,
  target_program_id UUID DEFAULT NULL,
  new_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_routine_id UUID;
  source_routine RECORD;
  variant RECORD;
  new_variant_id UUID;
BEGIN
  -- Get source routine
  SELECT * INTO source_routine FROM public.workout_routines WHERE id = source_routine_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source routine not found';
  END IF;

  -- Create new routine
  INSERT INTO public.workout_routines (
    user_id, name, description, type, duration, frequency, is_active, 
    is_template, program_id, origin_routine_id
  )
  VALUES (
    source_routine.user_id,
    COALESCE(new_name, source_routine.name),
    source_routine.description,
    source_routine.type,
    source_routine.duration,
    source_routine.frequency,
    source_routine.is_active,
    (target_program_id IS NULL), -- If program_id is provided, it's not a template
    target_program_id,
    source_routine_id
  )
  RETURNING id INTO new_routine_id;

  -- Clone routine exercises (legacy support)
  INSERT INTO public.routine_exercises (
    routine_id, exercise_id, order_index, default_sets, default_reps, default_weight, notes
  )
  SELECT
    new_routine_id, exercise_id, order_index, default_sets, default_reps, default_weight, notes
  FROM public.routine_exercises
  WHERE routine_id = source_routine_id;

  -- Clone routine variants
  FOR variant IN SELECT * FROM public.routine_variants WHERE routine_id = source_routine_id LOOP
    -- Create new variant
    INSERT INTO public.routine_variants (
      routine_id, variant_name, intensity_level, description, is_default
    )
    VALUES (
      new_routine_id,
      variant.variant_name,
      variant.intensity_level,
      variant.description,
      variant.is_default
    )
    RETURNING id INTO new_variant_id;

    -- Clone variant exercises
    INSERT INTO public.variant_exercises (
      variant_id, exercise_id, order_index, notes
    )
    SELECT
      new_variant_id, exercise_id, order_index, notes
    FROM public.variant_exercises
    WHERE variant_id = variant.id;

    -- Clone variant exercise sets
    INSERT INTO public.variant_exercise_sets (
      variant_exercise_id, set_number, target_reps, target_rir,
      target_weight_percent, target_weight, set_type, notes
    )
    SELECT
      new_ve.id, ves.set_number, ves.target_reps, ves.target_rir,
      ves.target_weight_percent, ves.target_weight, ves.set_type, ves.notes
    FROM public.variant_exercise_sets ves
    JOIN public.variant_exercises old_ve ON ves.variant_exercise_id = old_ve.id
    JOIN public.variant_exercises new_ve ON new_ve.variant_id = new_variant_id
      AND new_ve.exercise_id = old_ve.exercise_id
      AND new_ve.order_index = old_ve.order_index
    WHERE old_ve.variant_id = variant.id;

  END LOOP;

  RETURN new_routine_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create a program-specific variant
CREATE OR REPLACE FUNCTION public.get_or_create_program_routine_variant(
  source_variant_id UUID,
  target_program_id UUID
)
RETURNS UUID AS $$
DECLARE
  source_variant RECORD;
  source_routine_id UUID;
  existing_routine_id UUID;
  new_routine_id UUID;
  target_variant_id UUID;
BEGIN
  -- Get source variant info
  SELECT * INTO source_variant FROM public.routine_variants WHERE id = source_variant_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Variant not found'; END IF;
  
  source_routine_id := source_variant.routine_id;

  -- Check if we already have a clone of this routine for this program
  SELECT id INTO existing_routine_id
  FROM public.workout_routines
  WHERE program_id = target_program_id
    AND origin_routine_id = source_routine_id
  LIMIT 1;

  IF existing_routine_id IS NOT NULL THEN
    -- Use existing routine, find matching variant
    SELECT id INTO target_variant_id
    FROM public.routine_variants
    WHERE routine_id = existing_routine_id
      AND variant_name = source_variant.variant_name
      AND (intensity_level IS NOT DISTINCT FROM source_variant.intensity_level)
    LIMIT 1;
    
    -- If variant missing (shouldn't happen if cloned correctly), we might need to handle it
    -- For now, assume it exists.
    IF target_variant_id IS NULL THEN
        RAISE EXCEPTION 'Matching variant not found in existing program routine';
    END IF;
    
    RETURN target_variant_id;
  ELSE
    -- Clone the routine for this program
    new_routine_id := public.clone_workout_routine(source_routine_id, target_program_id, NULL);
    
    -- Find matching variant in new routine
    SELECT id INTO target_variant_id
    FROM public.routine_variants
    WHERE routine_id = new_routine_id
      AND variant_name = source_variant.variant_name
      AND (intensity_level IS NOT DISTINCT FROM source_variant.intensity_level)
    LIMIT 1;
    
    RETURN target_variant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

