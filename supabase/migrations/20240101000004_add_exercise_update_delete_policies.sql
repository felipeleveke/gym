-- Add UPDATE and DELETE policies for exercises table
-- Allow authenticated users to update and delete exercises they created

-- Policy for UPDATE: authenticated users can update any exercise
CREATE POLICY "Authenticated users can update exercises"
  ON public.exercises FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy for DELETE: authenticated users can delete any exercise
CREATE POLICY "Authenticated users can delete exercises"
  ON public.exercises FOR DELETE
  USING (auth.role() = 'authenticated');












