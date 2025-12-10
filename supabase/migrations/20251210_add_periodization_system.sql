-- Migration: Add Routine Variants and Periodization System
-- This migration adds support for:
-- 1. Routine variants (A/B/C versions with different intensity levels)
-- 2. Detailed set configurations with target reps and RIR
-- 3. Training programs (macrocycles)
-- 4. Training blocks (mesocycles)
-- 5. Block phases (microcycles/weeks)

-- =====================================================
-- PHASE 1: Routine Variants and Set Configurations
-- =====================================================

-- Routine variants table (A/B/C versions of a routine)
CREATE TABLE public.routine_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE CASCADE NOT NULL,
  variant_name TEXT NOT NULL, -- e.g., "A", "B", "C" or "Heavy", "Medium", "Light"
  intensity_level INTEGER CHECK (intensity_level >= 1 AND intensity_level <= 10), -- 1-10 scale
  description TEXT,
  is_default BOOLEAN DEFAULT false, -- Mark one variant as default
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Variant exercises (exercises specific to each variant)
CREATE TABLE public.variant_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id UUID REFERENCES public.routine_variants(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Variant exercise sets (detailed set configuration with targets)
CREATE TABLE public.variant_exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_exercise_id UUID REFERENCES public.variant_exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  target_reps INTEGER, -- Target repetitions
  target_rir INTEGER CHECK (target_rir >= 0 AND target_rir <= 5), -- Target RIR (0-5)
  target_weight_percent DECIMAL(5,2), -- Percentage of 1RM (e.g., 80.00 = 80%)
  target_weight DECIMAL(6,2), -- Fixed target weight in kg (alternative to percent)
  set_type TEXT DEFAULT 'working' CHECK (set_type IN ('warmup', 'approach', 'working', 'backoff', 'bilbo')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- PHASE 2: Periodization (Macro/Meso/Microcycles)
-- =====================================================

-- Create enum for block types
CREATE TYPE block_type AS ENUM ('strength', 'hypertrophy', 'power', 'endurance', 'deload', 'peaking', 'transition');

-- Training programs (Macrocycle - the complete program)
CREATE TABLE public.training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT, -- Main objective (strength, hypertrophy, etc.)
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Training blocks (Mesocycle - themed blocks within a program)
CREATE TABLE public.training_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.training_programs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Strength Phase 1", "Hypertrophy Block"
  block_type block_type NOT NULL,
  order_index INTEGER NOT NULL,
  duration_weeks INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Block phases (Microcycle - each week within a mesocycle)
CREATE TABLE public.block_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID REFERENCES public.training_blocks(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL, -- Week number within the block
  variant_id UUID REFERENCES public.routine_variants(id) ON DELETE SET NULL,
  intensity_modifier DECIMAL(4,2) DEFAULT 1.00, -- Multiplier (e.g., 0.90 = 90% intensity)
  volume_modifier DECIMAL(4,2) DEFAULT 1.00, -- Multiplier for volume
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_routine_variants_routine_id ON public.routine_variants(routine_id);
CREATE INDEX idx_variant_exercises_variant_id ON public.variant_exercises(variant_id);
CREATE INDEX idx_variant_exercise_sets_variant_exercise_id ON public.variant_exercise_sets(variant_exercise_id);
CREATE INDEX idx_training_programs_user_id ON public.training_programs(user_id);
CREATE INDEX idx_training_programs_is_active ON public.training_programs(is_active);
CREATE INDEX idx_training_blocks_program_id ON public.training_blocks(program_id);
CREATE INDEX idx_block_phases_block_id ON public.block_phases(block_id);
CREATE INDEX idx_block_phases_variant_id ON public.block_phases(variant_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.routine_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_phases ENABLE ROW LEVEL SECURITY;

-- RLS for routine_variants
CREATE POLICY "Users can manage variants of own routines"
  ON public.routine_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_routines
      WHERE id = routine_id AND user_id = auth.uid()
    )
  );

-- RLS for variant_exercises
CREATE POLICY "Users can manage exercises in own variants"
  ON public.variant_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.routine_variants rv
      JOIN public.workout_routines wr ON rv.routine_id = wr.id
      WHERE rv.id = variant_id AND wr.user_id = auth.uid()
    )
  );

-- RLS for variant_exercise_sets
CREATE POLICY "Users can manage sets in own variants"
  ON public.variant_exercise_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.variant_exercises ve
      JOIN public.routine_variants rv ON ve.variant_id = rv.id
      JOIN public.workout_routines wr ON rv.routine_id = wr.id
      WHERE ve.id = variant_exercise_id AND wr.user_id = auth.uid()
    )
  );

-- RLS for training_programs
CREATE POLICY "Users can view own programs"
  ON public.training_programs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own programs"
  ON public.training_programs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own programs"
  ON public.training_programs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own programs"
  ON public.training_programs FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for training_blocks
CREATE POLICY "Users can manage blocks in own programs"
  ON public.training_blocks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.training_programs
      WHERE id = program_id AND user_id = auth.uid()
    )
  );

-- RLS for block_phases
CREATE POLICY "Users can manage phases in own blocks"
  ON public.block_phases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.training_blocks tb
      JOIN public.training_programs tp ON tb.program_id = tp.id
      WHERE tb.id = block_id AND tp.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS FOR updated_at
-- =====================================================

CREATE TRIGGER update_routine_variants_updated_at
  BEFORE UPDATE ON public.routine_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_programs_updated_at
  BEFORE UPDATE ON public.training_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_blocks_updated_at
  BEFORE UPDATE ON public.training_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- HELPER FUNCTION: Clone a routine variant
-- =====================================================

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
  INSERT INTO public.variant_exercises (variant_id, exercise_id, order_index, notes)
  SELECT new_variant_id, exercise_id, order_index, notes
  FROM public.variant_exercises
  WHERE variant_id = source_variant_id;
  
  -- Clone sets
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
  WHERE old_ve.variant_id = source_variant_id;
  
  RETURN new_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Clone a training program
-- =====================================================

CREATE OR REPLACE FUNCTION public.clone_training_program(
  source_program_id UUID,
  new_program_name TEXT
)
RETURNS UUID AS $$
DECLARE
  new_program_id UUID;
  source_program RECORD;
BEGIN
  -- Get source program
  SELECT * INTO source_program FROM public.training_programs WHERE id = source_program_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source program not found';
  END IF;
  
  -- Create new program
  INSERT INTO public.training_programs (user_id, name, description, goal, is_active)
  VALUES (
    source_program.user_id,
    new_program_name,
    source_program.description,
    source_program.goal,
    false
  )
  RETURNING id INTO new_program_id;
  
  -- Clone blocks
  WITH new_blocks AS (
    INSERT INTO public.training_blocks (program_id, name, block_type, order_index, duration_weeks, notes)
    SELECT new_program_id, name, block_type, order_index, duration_weeks, notes
    FROM public.training_blocks
    WHERE program_id = source_program_id
    RETURNING id, order_index
  )
  -- Clone phases
  INSERT INTO public.block_phases (block_id, week_number, variant_id, intensity_modifier, volume_modifier, notes)
  SELECT 
    nb.id, bp.week_number, bp.variant_id, bp.intensity_modifier, bp.volume_modifier, bp.notes
  FROM public.block_phases bp
  JOIN public.training_blocks ob ON bp.block_id = ob.id
  JOIN new_blocks nb ON nb.order_index = ob.order_index
  WHERE ob.program_id = source_program_id;
  
  RETURN new_program_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
