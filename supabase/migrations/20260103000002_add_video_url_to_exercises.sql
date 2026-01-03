-- Agregar columna video_url a la tabla exercises
ALTER TABLE public.exercises 
ADD COLUMN video_url TEXT;

-- Comentario para documentar el propósito de la columna
COMMENT ON COLUMN public.exercises.video_url IS 'URL del video de guía para el ejercicio (YouTube, almacenamiento externo o local)';
