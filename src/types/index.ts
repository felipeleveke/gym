// Tipos de entrenamiento
export type TrainingType = 'gym' | 'sport' | 'cardio' | 'flexibility' | 'other';

// Tipo de ejercicio en gimnasio
export interface GymExercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment?: string;
  instructions?: string;
}

// Serie de ejercicio
export interface ExerciseSet {
  id: string;
  reps?: number;
  weight?: number; // en kg
  duration?: number; // en segundos
  restTime?: number; // en segundos
  rir?: number; // Reps In Reserve (0-10)
  notes?: string;
}

// Ejercicio en entrenamiento
export interface TrainingExercise {
  id: string;
  exerciseId: string;
  exercise: GymExercise;
  sets: ExerciseSet[];
  order: number;
  notes?: string;
}

// Entrenamiento de gimnasio
export interface GymTraining {
  id: string;
  userId: string;
  date: Date;
  duration: number; // en minutos
  exercises: TrainingExercise[];
  notes?: string;
  tags?: string[];
}

// Entrenamiento deportivo
export interface SportTraining {
  id: string;
  userId: string;
  sportType: string; // running, cycling, swimming, etc.
  date: Date;
  duration: number; // en minutos
  distance?: number; // en km
  avgSpeed?: number; // en km/h
  maxSpeed?: number; // en km/h
  avgHeartRate?: number; // bpm
  maxHeartRate?: number; // bpm
  elevation?: number; // en metros
  terrain?: string; // asfalto, trail, pista, etc.
  weather?: string;
  temperature?: number; // en celsius
  notes?: string;
  tags?: string[];
}

// Rutina de entrenamiento
export interface WorkoutRoutine {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: TrainingType;
  exercises?: TrainingExercise[]; // Para rutinas de gimnasio
  duration?: number;
  frequency?: string; // días por semana
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Usuario
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: 'athlete' | 'trainer' | 'admin';
  createdAt: Date;
}

// Estadísticas
export interface TrainingStats {
  totalTrainings: number;
  totalDuration: number; // en minutos
  thisWeek: {
    trainings: number;
    duration: number;
  };
  thisMonth: {
    trainings: number;
    duration: number;
  };
  favoriteExercises: Array<{
    exerciseId: string;
    name: string;
    count: number;
  }>;
}

