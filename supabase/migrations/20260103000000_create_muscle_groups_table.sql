-- Crear tabla de grupos musculares
CREATE TABLE IF NOT EXISTS public.muscle_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Muscle groups are viewable by everyone authenticated" 
ON public.muscle_groups FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can insert muscle groups" 
ON public.muscle_groups FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Insertar valores iniciales basados en COMMON_MUSCLE_GROUPS
INSERT INTO public.muscle_groups (name) VALUES
('pecho'),
('espalda'),
('hombros'),
('bíceps'),
('tríceps'),
('piernas'),
('glúteos'),
('cuádriceps'),
('isquiotibiales'),
('gemelos'),
('abdominales'),
('antebrazos'),
('trapecio'),
('deltoides'),
('pectorales'),
('dorsales'),
('lumbares'),
('cardio'),
('flexibilidad'),
('general')
ON CONFLICT (name) DO NOTHING;
