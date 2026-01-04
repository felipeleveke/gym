'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TrainingType {
  id: string;
  value: string;
  label: string;
  description: string | null;
  icon: string | null;
  display_order: number;
}

// Tipos de entrenamiento de fallback en caso de que la API falle
const FALLBACK_TRAINING_TYPES: TrainingType[] = [
  { id: '1', value: 'gym', label: 'Gimnasio / Pesas', description: 'Entrenamiento con pesas y máquinas', icon: 'Dumbbell', display_order: 1 },
  { id: '2', value: 'cardio', label: 'Cardio', description: 'Ejercicios cardiovasculares', icon: 'Heart', display_order: 2 },
  { id: '3', value: 'sport', label: 'Deporte', description: 'Running, ciclismo, natación, etc.', icon: 'Trophy', display_order: 3 },
  { id: '4', value: 'flexibility', label: 'Flexibilidad', description: 'Yoga, estiramientos, pilates', icon: 'Sparkles', display_order: 4 },
  { id: '5', value: 'warmup', label: 'Calentamiento', description: 'Ejercicios de calentamiento y activación', icon: 'Flame', display_order: 5 },
  { id: '6', value: 'circuit', label: 'Circuito Intermitente', description: 'Entrenamiento en circuito de alta intensidad', icon: 'Zap', display_order: 6 },
  { id: '7', value: 'other', label: 'Otro', description: 'Otro tipo de entrenamiento', icon: 'HelpCircle', display_order: 7 },
];

// Cache global para evitar múltiples llamadas a la API
let trainingTypesCache: TrainingType[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function useTrainingTypes() {
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>(trainingTypesCache || FALLBACK_TRAINING_TYPES);
  const [isLoading, setIsLoading] = useState(!trainingTypesCache);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainingTypes = useCallback(async (forceRefresh = false) => {
    // Usar cache si está disponible y no ha expirado
    const now = Date.now();
    if (!forceRefresh && trainingTypesCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setTrainingTypes(trainingTypesCache);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/training-types');
      
      if (!response.ok) {
        throw new Error('Error al cargar tipos de entrenamiento');
      }

      const { data } = await response.json();
      
      if (data && data.length > 0) {
        trainingTypesCache = data;
        cacheTimestamp = now;
        setTrainingTypes(data);
      } else {
        // Si no hay datos, usar fallback
        setTrainingTypes(FALLBACK_TRAINING_TYPES);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching training types:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      // Usar fallback en caso de error
      setTrainingTypes(FALLBACK_TRAINING_TYPES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainingTypes();
  }, [fetchTrainingTypes]);

  // Función auxiliar para obtener un tipo por su valor
  const getTypeByValue = useCallback((value: string) => {
    return trainingTypes.find(t => t.value === value) || null;
  }, [trainingTypes]);

  // Función auxiliar para obtener la etiqueta de un tipo
  const getLabelByValue = useCallback((value: string) => {
    return getTypeByValue(value)?.label || value;
  }, [getTypeByValue]);

  return {
    trainingTypes,
    isLoading,
    error,
    refresh: () => fetchTrainingTypes(true),
    getTypeByValue,
    getLabelByValue,
  };
}

// Tipo para compatibilidad con código existente
export type TrainingTypeValue = 'gym' | 'sport' | 'cardio' | 'flexibility' | 'other' | 'warmup' | 'circuit';
