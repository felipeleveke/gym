-- Add phase_routines table to support multiple scheduled routines per week
-- This allows unlimited routines per phase (week) with specific date/time scheduling

CREATE TABLE IF NOT EXISTS public.phase_routines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phase_id UUID NOT NULL REFERENCES public.block_phases(id) ON DELETE CASCADE,
    routine_variant_id UUID NOT NULL REFERENCES public.routine_variants(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phase_routines_phase_id ON public.phase_routines(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_routines_scheduled_at ON public.phase_routines(scheduled_at);

-- Enable RLS
ALTER TABLE public.phase_routines ENABLE ROW LEVEL SECURITY;

-- RLS policies: Access through the parent program's user_id
CREATE POLICY "Users can view their phase_routines"
    ON public.phase_routines FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.block_phases bp
            JOIN public.training_blocks tb ON bp.block_id = tb.id
            JOIN public.training_programs tp ON tb.program_id = tp.id
            WHERE bp.id = phase_routines.phase_id
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their phase_routines"
    ON public.phase_routines FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.block_phases bp
            JOIN public.training_blocks tb ON bp.block_id = tb.id
            JOIN public.training_programs tp ON tb.program_id = tp.id
            WHERE bp.id = phase_routines.phase_id
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their phase_routines"
    ON public.phase_routines FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.block_phases bp
            JOIN public.training_blocks tb ON bp.block_id = tb.id
            JOIN public.training_programs tp ON tb.program_id = tp.id
            WHERE bp.id = phase_routines.phase_id
            AND tp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their phase_routines"
    ON public.phase_routines FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.block_phases bp
            JOIN public.training_blocks tb ON bp.block_id = tb.id
            JOIN public.training_programs tp ON tb.program_id = tp.id
            WHERE bp.id = phase_routines.phase_id
            AND tp.user_id = auth.uid()
        )
    );
