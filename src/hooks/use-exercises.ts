'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export type TrainingType = 'gym' | 'sport' | 'cardio' | 'flexibility' | 'other' | 'warmup' | 'circuit';

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_groups?: string[];
  muscle_groups_json?: Array<{
    name: string;
    type: 'primary' | 'secondary' | 'tertiary';
    percentage: number;
  }>;
  equipment?: string;
  instructions?: string;
  video_url?: string;
  training_type?: TrainingType;
}

export interface ExerciseStats {
  usageCount: number;
  lastUsed: string | null;
  recentTrainings?: Array<{
    id: string;
    created_at: string;
    training: {
      id: string;
      date: string;
      notes?: string;
    };
  }>;
}

export interface ExerciseWithStats extends Exercise {
  stats?: ExerciseStats;
}

export type SortOption = 'name' | 'usage' | 'recent';

interface UseExercisesOptions {
  search?: string;
  muscleGroup?: string;
  equipment?: string;
  sortBy?: SortOption;
}

export function useExercises(options: UseExercisesOptions = {}) {
  const [exercises, setExercises] = useState<ExerciseWithStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.search) {
        params.append('search', options.search);
      }
      if (options.muscleGroup) {
        params.append('muscleGroup', options.muscleGroup);
      }

      const response = await fetch(`/api/exercises?${params.toString()}`);
      if (!response.ok) throw new Error('Error al cargar ejercicios');

      const result = await response.json();
      let exercisesData: Exercise[] = result.data || [];

      // Parsear muscle_groups_json si viene como string
      exercisesData = exercisesData.map((ex: Exercise) => {
        if (ex.muscle_groups_json && typeof ex.muscle_groups_json === 'string') {
          try {
            ex.muscle_groups_json = JSON.parse(ex.muscle_groups_json);
          } catch (e) {
            console.error('Error parsing muscle_groups_json:', e);
          }
        }
        return ex;
      });

      // Obtener estadísticas si es necesario
      if (options.sortBy === 'usage' || options.sortBy === 'recent') {
        const statsResponse = await fetch('/api/exercises/stats');
        if (statsResponse.ok) {
          const statsResult = await statsResponse.json();
          const statsMap = statsResult.stats || {};

          exercisesData = exercisesData.map((ex) => ({
            ...ex,
            stats: {
              usageCount: statsMap[ex.id]?.usageCount || 0,
              lastUsed: statsMap[ex.id]?.lastUsed || null,
            },
          }));
        }
      }

      // Ordenar ejercicios
      if (options.sortBy === 'usage') {
        exercisesData.sort((a, b) => {
          const aCount = (a as ExerciseWithStats).stats?.usageCount || 0;
          const bCount = (b as ExerciseWithStats).stats?.usageCount || 0;
          return bCount - aCount;
        });
      } else if (options.sortBy === 'recent') {
        exercisesData.sort((a, b) => {
          const aDate = (a as ExerciseWithStats).stats?.lastUsed || '';
          const bDate = (b as ExerciseWithStats).stats?.lastUsed || '';
          return bDate.localeCompare(aDate);
        });
      } else {
        // Ordenar por nombre por defecto
        exercisesData.sort((a, b) => a.name.localeCompare(b.name));
      }

      setExercises(exercisesData as ExerciseWithStats[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los ejercicios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [options.search, options.muscleGroup, options.equipment, options.sortBy, toast]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  const createExercise = useCallback(async (exerciseData: {
    name: string;
    description?: string;
    muscle_groups?: string[];
    muscle_groups_json?: Array<{
      name: string;
      type: 'primary' | 'secondary' | 'tertiary';
      percentage: number;
    }>;
    equipment?: string;
    instructions?: string;
    video_url?: string;
    training_type?: TrainingType;
  }) => {
    try {
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear ejercicio');
      }

      toast({
        title: 'Éxito',
        description: 'Ejercicio creado correctamente',
      });

      // Recargar ejercicios
      await fetchExercises();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [fetchExercises, toast]);

  const updateExercise = useCallback(async (id: string, exerciseData: {
    name: string;
    description?: string;
    muscle_groups?: string[];
    muscle_groups_json?: Array<{
      name: string;
      type: 'primary' | 'secondary' | 'tertiary';
      percentage: number;
    }>;
    equipment?: string;
    instructions?: string;
    video_url?: string;
    training_type?: TrainingType;
  }) => {
    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar ejercicio');
      }

      toast({
        title: 'Éxito',
        description: 'Ejercicio actualizado correctamente',
      });

      // Recargar ejercicios
      await fetchExercises();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [fetchExercises, toast]);

  const deleteExercise = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/exercises/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al eliminar ejercicio');
      }

      toast({
        title: 'Éxito',
        description: 'Ejercicio eliminado correctamente',
      });

      // Recargar ejercicios
      await fetchExercises();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    }
  }, [fetchExercises, toast]);

  const fetchExerciseStats = useCallback(async (exerciseId: string): Promise<ExerciseStats | null> => {
    try {
      const response = await fetch(`/api/exercises/stats?exerciseId=${exerciseId}`);
      if (!response.ok) return null;

      const result = await response.json();
      return {
        usageCount: result.usageCount || 0,
        lastUsed: result.recentTrainings?.[0]?.created_at || null,
        recentTrainings: result.recentTrainings || [],
      };
    } catch (err) {
      console.error('Error fetching exercise stats:', err);
      return null;
    }
  }, []);

  return {
    exercises,
    loading,
    error,
    refetch: fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
    fetchExerciseStats,
  };
}

