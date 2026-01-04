-- Migration: Add timing fields to routine_exercises table
-- This adds fields for TUT (Time Under Tension), rest between sets, and rest after exercise
-- These fields enable detailed workout planning with automated timers

-- Add new timing columns to routine_exercises
ALTER TABLE public.routine_exercises
ADD COLUMN IF NOT EXISTS default_tut INTEGER,
ADD COLUMN IF NOT EXISTS rest_between_sets INTEGER,
ADD COLUMN IF NOT EXISTS rest_after_exercise INTEGER,
ADD COLUMN IF NOT EXISTS default_rir INTEGER CHECK (default_rir >= 0 AND default_rir <= 10),
ADD COLUMN IF NOT EXISTS default_rpe INTEGER CHECK (default_rpe >= 1 AND default_rpe <= 10);

-- Add timing fields to variant_exercises
ALTER TABLE public.variant_exercises
ADD COLUMN IF NOT EXISTS rest_after_exercise INTEGER;

-- Add timing fields to variant_exercise_sets
ALTER TABLE public.variant_exercise_sets
ADD COLUMN IF NOT EXISTS target_tut INTEGER,
ADD COLUMN IF NOT EXISTS rest_seconds INTEGER,
ADD COLUMN IF NOT EXISTS target_rpe INTEGER CHECK (target_rpe >= 1 AND target_rpe <= 10);

-- Add comments for documentation
COMMENT ON COLUMN public.routine_exercises.default_tut IS 'Time Under Tension in seconds - countdown when starting a set';
COMMENT ON COLUMN public.routine_exercises.rest_between_sets IS 'Rest time between sets in seconds';
COMMENT ON COLUMN public.routine_exercises.rest_after_exercise IS 'Rest time after completing all sets of this exercise in seconds';
COMMENT ON COLUMN public.routine_exercises.default_rir IS 'Reps In Reserve target (0-10)';
COMMENT ON COLUMN public.routine_exercises.default_rpe IS 'Rate of Perceived Exertion target (1-10)';
COMMENT ON COLUMN public.variant_exercises.rest_after_exercise IS 'Rest time after completing all sets of this exercise in seconds';
COMMENT ON COLUMN public.variant_exercise_sets.target_tut IS 'Time Under Tension in seconds';
COMMENT ON COLUMN public.variant_exercise_sets.rest_seconds IS 'Rest time after this set in seconds';
COMMENT ON COLUMN public.variant_exercise_sets.target_rpe IS 'Rate of Perceived Exertion target (1-10)';
-- Update cloning functions to include new fields
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
    (target_program_id IS NULL),
    target_program_id,
    source_routine_id
  )
  RETURNING id INTO new_routine_id;

  -- Clone routine exercises
  INSERT INTO public.routine_exercises (
    routine_id, exercise_id, order_index, default_sets, default_reps, default_weight, notes,
    default_tut, rest_between_sets, rest_after_exercise, default_rir, default_rpe
  )
  SELECT
    new_routine_id, exercise_id, order_index, default_sets, default_reps, default_weight, notes,
    default_tut, rest_between_sets, rest_after_exercise, default_rir, default_rpe
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
      variant_id, exercise_id, order_index, notes, rest_after_exercise
    )
    SELECT
      new_variant_id, exercise_id, order_index, notes, rest_after_exercise
    FROM public.variant_exercises
    WHERE variant_id = variant.id;

    -- Clone variant exercise sets
    INSERT INTO public.variant_exercise_sets (
      variant_exercise_id, set_number, target_reps, target_rir, target_rpe,
      target_weight_percent, target_weight, target_tut, rest_seconds, set_type, notes
    )
    SELECT
      new_ve.id, ves.set_number, ves.target_reps, ves.target_rir, ves.target_rpe,
      ves.target_weight_percent, ves.target_weight, ves.target_tut, ves.rest_seconds, ves.set_type, ves.notes
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

CREATE OR REPLACE FUNCTION public.clone_routine_variant(
  source_variant_id UUID,
  new_variant_name TEXT,
  new_intensity_level INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_variant_id UUID;
  source_variant RECORD;
BEGIN
  -- Get source variant
  SELECT * INTO source_variant FROM public.routine_variants WHERE id = source_variant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source variant not found';
  END IF;
  
  -- Create new variant
  INSERT INTO public.routine_variants (routine_id, variant_name, intensity_level, description, is_default)
  VALUES (
    source_variant.routine_id,
    new_variant_name,
    COALESCE(new_intensity_level, source_variant.intensity_level),
    source_variant.description,
    false
  )
  RETURNING id INTO new_variant_id;
  
  -- Clone exercises
  INSERT INTO public.variant_exercises (variant_id, exercise_id, order_index, notes, rest_after_exercise)
  SELECT new_variant_id, exercise_id, order_index, notes, rest_after_exercise
  FROM public.variant_exercises
  WHERE variant_id = source_variant_id;
  
  -- Clone sets
  INSERT INTO public.variant_exercise_sets (
    variant_exercise_id, set_number, target_reps, target_rir, target_rpe,
    target_weight_percent, target_weight, target_tut, rest_seconds, set_type, notes
  )
  SELECT 
    new_ve.id, ves.set_number, ves.target_reps, ves.target_rir, ves.target_rpe,
    ves.target_weight_percent, ves.target_weight, ves.target_tut, ves.rest_seconds, ves.set_type, ves.notes
  FROM public.variant_exercise_sets ves
  JOIN public.variant_exercises old_ve ON ves.variant_exercise_id = old_ve.id
  JOIN public.variant_exercises new_ve ON new_ve.variant_id = new_variant_id 
    AND new_ve.exercise_id = old_ve.exercise_id 
    AND new_ve.order_index = old_ve.order_index
  WHERE old_ve.variant_id = source_variant_id;
  
  RETURN new_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
