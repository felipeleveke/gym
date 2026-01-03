-- Add 1RM calculation fields to exercise_sets
ALTER TABLE public.exercise_sets 
ADD COLUMN theoretical_one_rm DECIMAL(6,2),
ADD COLUMN percentage_one_rm DECIMAL(5,2);



