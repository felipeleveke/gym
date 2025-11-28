-- Enable necessary extensions
-- uuid-ossp ya no es necesario, usamos gen_random_uuid() nativo de PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- pgvector extension (comentado para desarrollo local, descomentar en producción si es necesario)
-- CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Create enum types
CREATE TYPE user_role AS ENUM ('athlete', 'trainer', 'admin');
CREATE TYPE training_type AS ENUM ('gym', 'sport', 'cardio', 'flexibility', 'other');
CREATE TYPE sport_type AS ENUM ('running', 'cycling', 'swimming', 'football', 'basketball', 'tennis', 'other');

-- Users table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'athlete' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Exercises catalog (catálogo de ejercicios)
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  muscle_groups TEXT[] NOT NULL,
  equipment TEXT,
  instructions TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Workout routines (rutinas de entrenamiento)
CREATE TABLE public.workout_routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type training_type NOT NULL,
  duration INTEGER, -- en minutos
  frequency TEXT, -- días por semana
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Routine exercises (ejercicios en rutinas)
CREATE TABLE public.routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  default_sets INTEGER,
  default_reps INTEGER,
  default_weight DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Gym trainings (entrenamientos de gimnasio)
CREATE TABLE public.gym_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  routine_id UUID REFERENCES public.workout_routines(id) ON DELETE SET NULL,
  date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  duration INTEGER NOT NULL, -- en minutos
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Training exercises (ejercicios en un entrenamiento)
CREATE TABLE public.training_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES public.gym_trainings(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Exercise sets (series de ejercicios)
CREATE TABLE public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_exercise_id UUID REFERENCES public.training_exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight DECIMAL(5,2), -- en kg
  duration INTEGER, -- en segundos
  rest_time INTEGER, -- en segundos
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10), -- Rate of Perceived Exertion
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Sport trainings (entrenamientos deportivos)
CREATE TABLE public.sport_trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  sport_type sport_type NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  duration INTEGER NOT NULL, -- en minutos
  distance DECIMAL(6,2), -- en km
  avg_speed DECIMAL(5,2), -- en km/h
  max_speed DECIMAL(5,2), -- en km/h
  avg_heart_rate INTEGER, -- bpm
  max_heart_rate INTEGER, -- bpm
  elevation INTEGER, -- en metros
  terrain TEXT,
  weather TEXT,
  temperature DECIMAL(4,1), -- en celsius
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trainer-client relationships (relaciones entrenador-cliente)
CREATE TABLE public.trainer_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(trainer_id, client_id)
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_exercises_muscle_groups ON public.exercises USING GIN(muscle_groups);
CREATE INDEX idx_workout_routines_user_id ON public.workout_routines(user_id);
CREATE INDEX idx_workout_routines_type ON public.workout_routines(type);
CREATE INDEX idx_gym_trainings_user_id ON public.gym_trainings(user_id);
CREATE INDEX idx_gym_trainings_date ON public.gym_trainings(date DESC);
CREATE INDEX idx_training_exercises_training_id ON public.training_exercises(training_id);
CREATE INDEX idx_exercise_sets_training_exercise_id ON public.exercise_sets(training_exercise_id);
CREATE INDEX idx_sport_trainings_user_id ON public.sport_trainings(user_id);
CREATE INDEX idx_sport_trainings_date ON public.sport_trainings(date DESC);
CREATE INDEX idx_sport_trainings_sport_type ON public.sport_trainings(sport_type);
CREATE INDEX idx_trainer_clients_trainer_id ON public.trainer_clients(trainer_id);
CREATE INDEX idx_trainer_clients_client_id ON public.trainer_clients(client_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sport_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainer_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Trainers can view their clients"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.trainer_clients
      WHERE trainer_id = auth.uid() AND client_id = id
    )
  );

-- RLS Policies for exercises (public read, authenticated users can create)
CREATE POLICY "Anyone can view exercises"
  ON public.exercises FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create exercises"
  ON public.exercises FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- RLS Policies for workout_routines
CREATE POLICY "Users can view own routines"
  ON public.workout_routines FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own routines"
  ON public.workout_routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routines"
  ON public.workout_routines FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routines"
  ON public.workout_routines FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view client routines"
  ON public.workout_routines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients
      WHERE trainer_id = auth.uid() AND client_id = user_id
    )
  );

-- RLS Policies for routine_exercises
CREATE POLICY "Users can manage exercises in own routines"
  ON public.routine_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_routines
      WHERE id = routine_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for gym_trainings
CREATE POLICY "Users can view own trainings"
  ON public.gym_trainings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trainings"
  ON public.gym_trainings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trainings"
  ON public.gym_trainings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trainings"
  ON public.gym_trainings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view client trainings"
  ON public.gym_trainings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients
      WHERE trainer_id = auth.uid() AND client_id = user_id
    )
  );

-- RLS Policies for training_exercises
CREATE POLICY "Users can manage exercises in own trainings"
  ON public.training_exercises FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.gym_trainings
      WHERE id = training_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for exercise_sets
CREATE POLICY "Users can manage sets in own trainings"
  ON public.exercise_sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.training_exercises te
      JOIN public.gym_trainings gt ON te.training_id = gt.id
      WHERE te.id = training_exercise_id AND gt.user_id = auth.uid()
    )
  );

-- RLS Policies for sport_trainings
CREATE POLICY "Users can view own sport trainings"
  ON public.sport_trainings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sport trainings"
  ON public.sport_trainings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sport trainings"
  ON public.sport_trainings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sport trainings"
  ON public.sport_trainings FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view client sport trainings"
  ON public.sport_trainings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trainer_clients
      WHERE trainer_id = auth.uid() AND client_id = user_id
    )
  );

-- RLS Policies for trainer_clients
CREATE POLICY "Trainers can view own client relationships"
  ON public.trainer_clients FOR SELECT
  USING (auth.uid() = trainer_id OR auth.uid() = client_id);

CREATE POLICY "Trainers can create client relationships"
  ON public.trainer_clients FOR INSERT
  WITH CHECK (auth.uid() = trainer_id);

CREATE POLICY "Trainers can update own client relationships"
  ON public.trainer_clients FOR UPDATE
  USING (auth.uid() = trainer_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_routines_updated_at
  BEFORE UPDATE ON public.workout_routines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gym_trainings_updated_at
  BEFORE UPDATE ON public.gym_trainings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sport_trainings_updated_at
  BEFORE UPDATE ON public.sport_trainings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

