'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Interfaz para el borrador del entrenamiento
export interface TrainingDraft {
  // Identificador único del borrador
  draftId: string;
  // Tipo de entrenamiento
  type: 'gym' | 'sport' | 'cardio' | 'flexibility' | 'other';
  // Datos del entrenamiento
  exercises: Array<{
    exercise: {
      id: string;
      name: string;
      description?: string;
      muscle_groups?: string[];
      equipment?: string;
    };
    sets: Array<{
      id: string;
      set_number: number;
      weight?: number | null;
      reps?: number | null;
      duration?: number | null;
      rest_time?: number | null;
      rir?: number | null;
      rpe?: number | null;
      notes?: string | null;
      set_type?: 'warmup' | 'approach' | 'working' | 'bilbo' | null;
      theoretical_one_rm?: number | null;
      percentage_one_rm?: number | null;
      target_tut?: number | null;
      target_rest?: number | null;
    }>;
    notes: string;
    start_time?: string | null;
    end_time?: string | null;
    rest_after_exercise?: number | null;
  }>;
  // Tiempos del entrenamiento
  startTime: string | null;
  endTime: string | null;
  // Notas y tags
  notes: string;
  tags: string;
  // Configuración
  defaultRestTime: number;
  // Metadatos
  routineId?: string | null;
  variantId?: string | null;
  phaseRoutineId?: string | null;
  // Timestamp de última actualización
  lastUpdated: number;
  // ID del entrenamiento si está en modo edición
  trainingId?: string | null;
}

const STORAGE_KEY = 'gym-training-draft';
const AUTOSAVE_DELAY = 1000; // 1 segundo de debounce

export function useTrainingDraft(trainingType: 'gym' = 'gym') {
  const [draft, setDraft] = useState<TrainingDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDraft, setHasDraft] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generar un ID único para el borrador
  const generateDraftId = useCallback(() => {
    return `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Cargar borrador desde localStorage
  const loadDraft = useCallback(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}-${trainingType}`);
      if (stored) {
        const parsed: TrainingDraft = JSON.parse(stored);
        // Verificar que el borrador sea reciente (menos de 24 horas)
        const hoursSinceUpdate = (Date.now() - parsed.lastUpdated) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 24) {
          setDraft(parsed);
          setHasDraft(true);
          return parsed;
        } else {
          // Borrador antiguo, eliminarlo
          localStorage.removeItem(`${STORAGE_KEY}-${trainingType}`);
        }
      }
    } catch (error) {
      console.error('Error cargando borrador de entrenamiento:', error);
      localStorage.removeItem(`${STORAGE_KEY}-${trainingType}`);
    }
    setHasDraft(false);
    return null;
  }, [trainingType]);

  // Guardar borrador en localStorage
  const saveDraft = useCallback((draftData: Omit<TrainingDraft, 'lastUpdated' | 'draftId' | 'type'>) => {
    try {
      const draftToSave: TrainingDraft = {
        ...draftData,
        draftId: draft?.draftId || generateDraftId(),
        type: trainingType,
        lastUpdated: Date.now(),
      };
      localStorage.setItem(`${STORAGE_KEY}-${trainingType}`, JSON.stringify(draftToSave));
      setDraft(draftToSave);
      setHasDraft(true);
    } catch (error) {
      console.error('Error guardando borrador de entrenamiento:', error);
    }
  }, [draft?.draftId, generateDraftId, trainingType]);

  // Auto-guardar con debounce
  const autoSave = useCallback((draftData: Omit<TrainingDraft, 'lastUpdated' | 'draftId' | 'type'>) => {
    // Cancelar guardado pendiente
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Programar nuevo guardado
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(draftData);
    }, AUTOSAVE_DELAY);
  }, [saveDraft]);

  // Limpiar borrador
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`${STORAGE_KEY}-${trainingType}`);
      setDraft(null);
      setHasDraft(false);
    } catch (error) {
      console.error('Error eliminando borrador de entrenamiento:', error);
    }
  }, [trainingType]);

  // Cargar borrador al montar
  useEffect(() => {
    loadDraft();
    setIsLoading(false);

    // Limpiar timeout al desmontar
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loadDraft]);

  return {
    draft,
    hasDraft,
    isLoading,
    saveDraft,
    autoSave,
    clearDraft,
    loadDraft,
  };
}

