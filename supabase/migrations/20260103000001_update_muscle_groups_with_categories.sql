-- Actualizar tabla de grupos musculares con categorías
ALTER TABLE public.muscle_groups 
ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('Tren Superior', 'Tren Inferior', 'Zona Media'));

-- Limpiar datos anteriores para evitar conflictos si es necesario
DELETE FROM public.muscle_groups;

-- Insertar los nuevos grupos musculares con sus categorías
INSERT INTO public.muscle_groups (name, category) VALUES
-- Tren Superior
('Pecho (Pectorales)', 'Tren Superior'),
('Espalda', 'Tren Superior'),
('Hombros (Deltoides)', 'Tren Superior'),
('Bíceps', 'Tren Superior'),
('Tríceps', 'Tren Superior'),
('Antebrazos', 'Tren Superior'),
-- Tren Inferior
('Cuádriceps', 'Tren Inferior'),
('Isquiotibiales', 'Tren Inferior'),
('Glúteos', 'Tren Inferior'),
('Aductores', 'Tren Inferior'),
('Abductores', 'Tren Inferior'),
('Pantorrillas', 'Tren Inferior'),
-- Zona Media
('Abdominales', 'Zona Media'),
('Lumbar / Espalda baja', 'Zona Media');

-- Hacer la columna category obligatoria después de poblarla
ALTER TABLE public.muscle_groups ALTER COLUMN category SET NOT NULL;
