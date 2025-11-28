-- Add INSERT policy for exercises table
-- Allow authenticated users to create exercises

DROP POLICY IF EXISTS "Authenticated users can create exercises" ON public.exercises;

CREATE POLICY "Authenticated users can create exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');









