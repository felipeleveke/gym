'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { useTrainingDraft, TrainingDraft } from '@/hooks/use-training-draft';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { ContinueTrainingDialog } from './continue-training-dialog';
import { ArrowLeft, Loader2, Plus, Clock, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseSelector } from './exercise-selector';
import { ExerciseForm } from './exercise-form';
import { EditableMarkdown } from '@/components/ui/editable-markdown';
import { ActiveExerciseModal } from './active-exercise-modal';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { apiFetch } from '@/lib/api';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_groups?: string[];
  equipment?: string;
}

interface ExerciseSet {
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
  // Campos de temporización desde la rutina
  target_tut?: number | null; // Tiempo bajo tensión objetivo (cuenta regresiva al iniciar)
  target_rest?: number | null; // Descanso entre series objetivo
}

interface TrainingExercise {
  exercise: Exercise;
  sets: ExerciseSet[];
  notes: string;
  start_time?: string | null;
  end_time?: string | null;
  // Campos de temporización desde la rutina
  rest_after_exercise?: number | null; // Descanso después del ejercicio
}

const gymTrainingSchema = z.object({
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type GymTrainingFormData = z.infer<typeof gymTrainingSchema>;

interface GymTrainingFormDetailedProps {
  onBack: () => void;
  initialData?: {
    training_exercises?: any[];
    start_time?: string | null;
    end_time?: string | null;
    notes?: string;
    tags?: string[] | string;
  };
  trainingId?: string;
  routineId?: string;
  variantId?: string;       // For loading from a specific variant
  phaseRoutineId?: string;  // For linking to program schedule
}

export function GymTrainingFormDetailed({ onBack, initialData, trainingId, routineId, variantId, phaseRoutineId }: GymTrainingFormDetailedProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [loadingRoutine, setLoadingRoutine] = useState(!!routineId || !!variantId);
  
  // Hook para auto-guardado del borrador
  const { draft, hasDraft, isLoading: isLoadingDraft, autoSave, clearDraft } = useTrainingDraft('gym');
  const [showContinueDialog, setShowContinueDialog] = useState(false);
  const [draftProcessed, setDraftProcessed] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [routineHistory, setRoutineHistory] = useState<Record<string, {
    lastWeight?: number | null;
    lastReps?: number | null;
    bestWeight?: number | null;
    bestReps?: number | null;
  }>>({});
  const [routineSetHistory, setRoutineSetHistory] = useState<Record<string, Record<number, {
    lastWeight?: number | null;
    lastReps?: number | null;
    lastRir?: number | null;
    lastNotes?: string | null;
    bestWeight?: number | null;
  }>>>({});
  
  // Pre-poblar ejercicios si hay initialData o routineId
  const [exercises, setExercises] = useState<TrainingExercise[]>(() => {
    if (initialData?.training_exercises && Array.isArray(initialData.training_exercises)) {
      return initialData.training_exercises
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((te: any) => ({
          exercise: te.exercise || {
            id: te.exercise_id,
            name: 'Ejercicio desconocido',
          },
          sets: (te.exercise_sets || [])
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((set: any) => ({
              id: set.id,
              set_number: set.set_number,
              weight: set.weight,
              reps: set.reps,
              duration: set.duration,
              rest_time: set.rest_time,
              rir: set.rir,
              notes: set.notes,
              set_type: set.set_type || 'working',
            })),
          notes: te.notes || '',
          start_time: te.start_time,
          end_time: te.end_time,
        }));
    }
    return [];
  });

  // Efecto para mostrar diálogo de continuar entrenamiento si hay borrador
  useEffect(() => {
    // Solo mostrar diálogo si:
    // - No estamos en modo edición (trainingId)
    // - No hay datos iniciales
    // - No hay rutina precargada
    // - Hay un borrador guardado
    // - El borrador no ha sido procesado aún
    if (
      !isLoadingDraft &&
      !draftProcessed &&
      !trainingId &&
      !initialData &&
      !routineId &&
      !variantId &&
      hasDraft &&
      draft
    ) {
      setShowContinueDialog(true);
    } else if (!isLoadingDraft && !draftProcessed) {
      setDraftProcessed(true);
    }
  }, [isLoadingDraft, draftProcessed, trainingId, initialData, routineId, variantId, hasDraft, draft]);

  // Función para restaurar el borrador
  const handleContinueDraft = useCallback(() => {
    if (!draft) return;
    
    // Restaurar ejercicios
    setExercises(draft.exercises);
    
    // Restaurar tiempos
    setTrainingStartTime(draft.startTime);
    setTrainingEndTime(draft.endTime);
    
    // Restaurar tiempo de descanso predeterminado
    setDefaultRestTime(draft.defaultRestTime);
    
    // Cerrar diálogo y marcar como procesado
    setShowContinueDialog(false);
    setDraftProcessed(true);
    
    toast({
      title: 'Entrenamiento restaurado',
      description: 'Se ha cargado tu entrenamiento guardado. Puedes continuar donde lo dejaste.',
    });
  }, [draft, toast]);

  // Función para empezar nuevo entrenamiento
  const handleStartNew = useCallback(() => {
    clearDraft();
    setShowContinueDialog(false);
    setDraftProcessed(true);
  }, [clearDraft]);

  // Cargar rutina si hay routineId (solo si NO hay variantId, porque loadVariant lo manejará)
  useEffect(() => {
    if (!routineId || variantId) return; // Si hay variantId, dejar que loadVariant lo maneje

    const loadRoutine = async () => {
      try {
        // Cargar la rutina y el historial en paralelo
        const [routineResponse, historyResponse] = await Promise.all([
          fetch(`/api/routines/${routineId}`),
          fetch(`/api/routines/${routineId}/history`),
        ]);

        if (!routineResponse.ok) {
          throw new Error('Error al cargar la rutina');
        }
        const routineData = await routineResponse.json();
        const routine = routineData.data;

        // Procesar historial si está disponible
        let exerciseStats: Record<string, {
          lastWeight?: number | null;
          lastReps?: number | null;
          bestWeight?: number | null;
          bestReps?: number | null;
        }> = {};
        let exerciseSetStats: Record<string, Record<number, {
          lastWeight?: number | null;
          lastReps?: number | null;
          lastRir?: number | null;
          lastNotes?: string | null;
          bestWeight?: number | null;
        }>> = {};
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          exerciseStats = historyData.data.exerciseStats || {};
          exerciseSetStats = historyData.data.exerciseSetStats || {};
          setRoutineHistory(exerciseStats);
          setRoutineSetHistory(exerciseSetStats);
        }

        // Pre-poblar ejercicios desde la rutina
        if (routine.routine_exercises && Array.isArray(routine.routine_exercises)) {
          const routineExercises: TrainingExercise[] = routine.routine_exercises
            .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
            .map((re: {
              exercise_id: string;
              order_index: number;
              default_sets?: number;
              default_reps?: number;
              default_weight?: number;
              default_rir?: number;
              default_rpe?: number;
              default_tut?: number;
              rest_between_sets?: number;
              rest_after_exercise?: number;
              notes?: string;
              exercise?: Exercise;
            }) => {
              const exerciseId = re.exercise_id;
              const history = exerciseStats[exerciseId] || {};
              const setHistory = exerciseSetStats[exerciseId] || {};
              
              const numSets = re.default_sets || 1;
              const sets = Array.from({ length: numSets }, (_, i) => {
                const setNumber = i + 1;
                const setData = setHistory[setNumber] || {};
                // Usar el peso del historial de esa serie específica, o el default_weight, o el lastWeight general
                const setWeight = setData.lastWeight || re.default_weight || history.lastWeight || null;
                
                return {
                  id: `temp-${Date.now()}-${re.order_index}-${i}`,
                  set_number: setNumber,
                  weight: setWeight,
                  reps: re.default_reps || null,
                  rir: re.default_rir ?? null,
                  rpe: re.default_rpe ?? null,
                  set_type: 'working' as const,
                  // Campos de temporización desde la rutina
                  target_tut: re.default_tut != null ? re.default_tut : null,
                  target_rest: re.rest_between_sets != null ? re.rest_between_sets : null,
                };
              });
              
              return {
                exercise: re.exercise || {
                  id: re.exercise_id,
                  name: 'Ejercicio desconocido',
                },
                sets,
                notes: re.notes || '',
                start_time: null,
                end_time: null,
                // Descanso después del ejercicio
                rest_after_exercise: re.rest_after_exercise || null,
              };
            });
          
          setExercises(routineExercises);
        }

        toast({
          title: 'Rutina cargada',
          description: `Se han cargado ${routine.routine_exercises?.length || 0} ejercicios de la rutina "${routine.name}".`,
        });
      } catch (error) {
        console.error('Error cargando rutina:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la rutina',
          variant: 'destructive',
        });
      } finally {
        setLoadingRoutine(false);
      }
    };

    loadRoutine();
  }, [routineId, toast]);

  // Cargar variante si hay variantId (desde programa)
  useEffect(() => {
    if (!variantId || !routineId) return;

    const loadVariant = async () => {
      try {
        const response = await fetch(`/api/routines/${routineId}/variants`);
        if (!response.ok) throw new Error('Error al cargar variantes');
        
        const { data: variants } = await response.json();
        const variant = variants.find((v: any) => v.id === variantId);
        
        if (!variant) {
          throw new Error('Variante no encontrada');
        }

        let exercisesToLoad = variant.variant_exercises || [];
        
        // Si la variante no tiene ejercicios, cargar los ejercicios simples de la rutina base
        if (exercisesToLoad.length === 0) {
          const routineResponse = await fetch(`/api/routines/${routineId}`);
          if (routineResponse.ok) {
            const { data: routineData } = await routineResponse.json();
            if (routineData?.routine_exercises && routineData.routine_exercises.length > 0) {
              // Convertir routine_exercises al formato de variant_exercises
              exercisesToLoad = routineData.routine_exercises.map((re: any) => {
                // Crear sets a partir de los valores por defecto
                const sets = [];
                const numSets = re.default_sets || 3; // Default 3 sets si no está definido
                
                for (let i = 1; i <= numSets; i++) {
                  sets.push({
                    id: `${re.id}-set-${i}`,
                    set_number: i,
                    target_reps: re.default_reps || null,
                    target_rir: re.default_rir !== null && re.default_rir !== undefined ? re.default_rir : null,
                    target_rpe: re.default_rpe || null,
                    target_weight: re.default_weight || null,
                    target_tut: re.default_tut || null,
                    rest_seconds: re.rest_between_sets || null,
                    set_type: 'working',
                  });
                }

                return {
                  id: re.id,
                  order_index: re.order_index,
                  exercise_id: re.exercise_id,
                  exercise: re.exercise,
                  notes: re.notes,
                  rest_after_exercise: re.rest_after_exercise,
                  variant_exercise_sets: sets,
                };
              });
            }
          }
        }

        // Pre-poblar ejercicios desde la variante o rutina base
        if (exercisesToLoad && Array.isArray(exercisesToLoad) && exercisesToLoad.length > 0) {
          const variantExercises: TrainingExercise[] = exercisesToLoad
            .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
            .map((ve: {
              order_index: number;
              exercise_id: string;
              exercise?: Exercise;
              variant_exercise_sets?: any[];
              notes?: string;
              rest_after_exercise?: number;
            }) => {
              const sets = (ve.variant_exercise_sets || [])
                .sort((a: { set_number: number }, b: { set_number: number }) => a.set_number - b.set_number)
                .map((set: {
                  set_number: number;
                  target_weight?: number;
                  target_reps?: number;
                  target_rir?: number;
                  target_rpe?: number;
                  set_type?: string;
                  notes?: string;
                  target_tut?: number;
                  rest_seconds?: number;
                }) => ({
                  id: `temp-${Date.now()}-${ve.order_index}-${set.set_number}`,
                  set_number: set.set_number,
                  weight: set.target_weight || null,
                  reps: set.target_reps || null,
                  rir: set.target_rir !== undefined ? set.target_rir : null,
                  rpe: set.target_rpe !== undefined ? set.target_rpe : null,
                  set_type: set.set_type || 'working',
                  notes: set.notes || null,
                  // Campos de temporización desde la variante
                  target_tut: set.target_tut != null ? set.target_tut : null,
                  target_rest: set.rest_seconds != null ? set.rest_seconds : null,
                }));

              return {
                exercise: ve.exercise || {
                  id: ve.exercise_id,
                  name: 'Ejercicio desconocido',
                },
                sets: sets.length > 0 ? sets : [{
                  id: `temp-${Date.now()}-${ve.order_index}-1`,
                  set_number: 1,
                  weight: null,
                  reps: null,
                  set_type: 'working' as const,
                }],
                notes: ve.notes || '',
                start_time: null,
                end_time: null,
                // Descanso después del ejercicio
                rest_after_exercise: ve.rest_after_exercise || null,
              };
            });

          setExercises(variantExercises);
        }

        toast({
          title: 'Rutina cargada',
          description: `Se han cargado ${exercisesToLoad?.length || 0} ejercicios desde el programa.`,
        });
      } catch (error) {
        console.error('Error cargando variante:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar la variante',
          variant: 'destructive',
        });
      } finally {
        setLoadingRoutine(false);
      }
    };

    loadVariant();
  }, [variantId, routineId, toast]);
  
  // Pre-poblar tiempos del entrenamiento
  const [trainingStartTime, setTrainingStartTime] = useState<string | null>(initialData?.start_time || null);
  const [trainingEndTime, setTrainingEndTime] = useState<string | null>(initialData?.end_time || null);
  
  // Tiempo predeterminado de descanso para el countdown (en segundos)
  const [defaultRestTime, setDefaultRestTime] = useState<number>(60);
  
  // Estado global para coordinar qué serie está activamente ejercitándose
  const [globalActiveSetId, setGlobalActiveSetId] = useState<string | null>(null);
  // Estado global para coordinar qué serie está en descanso
  const [globalRestingSetId, setGlobalRestingSetId] = useState<string | null>(null);
  // Estado para rastrear el tiempo de ejercicio de la serie activa
  const [activeSetExerciseTime, setActiveSetExerciseTime] = useState<number>(0);
  // Estado para rastrear qué series deben completarse desde el modal
  const [setToCompleteFromModal, setSetToCompleteFromModal] = useState<string | null>(null);
  // Estados para TUT en el modal
  const [isModalTutMode, setIsModalTutMode] = useState<boolean>(false);
  const [modalTutCountdown, setModalTutCountdown] = useState<number>(0);
  
  // Estados para indicadores de carga de resúmenes
  const [generatingExerciseSummaries, setGeneratingExerciseSummaries] = useState<Set<number>>(new Set());
  const [generatingTrainingSummary, setGeneratingTrainingSummary] = useState(false);
  
  // Callback para cuando se inicia una serie globalmente
  const handleGlobalSetStart = (setId: string) => {
    setGlobalActiveSetId(setId);
    setGlobalRestingSetId(null); // Limpiar descanso cuando se inicia ejercicio
  };
  
  // Callback para cuando se detiene una serie globalmente
  const handleGlobalSetStop = () => {
    setGlobalActiveSetId(null);
    setActiveSetExerciseTime(0);
  };
  
  // Callback para cuando una serie entra en descanso
  const handleGlobalSetRest = (setId: string) => {
    setGlobalActiveSetId(null);
    setGlobalRestingSetId(setId);
  };
  
  // Callback para cuando se completa una serie (termina descanso)
  const handleGlobalSetComplete = () => {
    setGlobalActiveSetId(null);
    setGlobalRestingSetId(null);
  };
  
  // Callback para actualizar el tiempo de ejercicio de la serie activa
  const handleActiveSetExerciseTimeUpdate = (seconds: number) => {
    if (globalActiveSetId) {
      setActiveSetExerciseTime(seconds);
    }
  };

  // Encontrar el ejercicio y serie activos
  const activeExerciseData = useMemo(() => {
    if (!globalActiveSetId) return null;
    
    for (const exercise of exercises) {
      const activeSet = exercise.sets.find(set => set.id === globalActiveSetId);
      if (activeSet) {
        return {
          exercise: exercise.exercise,
          set: activeSet,
        };
      }
    }
    return null;
  }, [exercises, globalActiveSetId]);

  // Función para actualizar un set específico
  const handleUpdateActiveSet = (setId: string, field: keyof ExerciseSet, value: string | number | null) => {
    const updatedExercises = exercises.map(ex => {
      const updatedSets = ex.sets.map(set => {
        if (set.id !== setId) return set;
        
        const updatedSet = { ...set, [field]: value === '' ? null : value };
        
        // Calculate 1RM and % if weight or reps change
        if (field === 'weight' || field === 'reps') {
          const weight = field === 'weight' ? (value === '' ? null : Number(value)) : set.weight;
          const reps = field === 'reps' ? (value === '' ? null : Number(value)) : set.reps;

          if (weight && reps && reps > 0) {
            // Formula: (Weight x Reps x 0.03) + Weight
            const oneRm = (weight * reps * 0.03) + weight;
            // Percentage: Weight / 1RM
            const percentage = (weight / oneRm) * 100;
            
            updatedSet.theoretical_one_rm = parseFloat(oneRm.toFixed(2));
            updatedSet.percentage_one_rm = parseFloat(percentage.toFixed(2));
          } else {
            updatedSet.theoretical_one_rm = null;
            updatedSet.percentage_one_rm = null;
          }
        }
        
        return updatedSet;
      });
      return { ...ex, sets: updatedSets };
    });
    setExercises(updatedExercises);
  };

  // Función para detener el ejercicio activo
  const handleStopActiveExercise = () => {
    if (!globalActiveSetId) return;
    
    // Encontrar el ejercicio que contiene la serie activa
    for (let i = 0; i < exercises.length; i++) {
      const exercise = exercises[i];
      const setIndex = exercise.sets.findIndex(set => set.id === globalActiveSetId);
      if (setIndex !== -1) {
        // Actualizar el tiempo de ejercicio
        handleUpdateActiveSet(globalActiveSetId, 'duration', activeSetExerciseTime);
        
        // NO marcar la serie como completada inmediatamente
        // Solo iniciar el descanso. La serie se completará automáticamente
        // cuando se inicie la siguiente serie o cuando el usuario la complete manualmente
        handleGlobalSetRest(globalActiveSetId);
        
        // Resetear el tiempo de ejercicio activo
        setActiveSetExerciseTime(0);
        break;
      }
    }
  };

  // Función para marcar una serie como completada desde el modal
  const handleSetCompleteFromModal = (setId: string) => {
    // Esta función será llamada desde ExerciseForm cuando se complete una serie
    // Limpiar el estado después de procesar
    if (setToCompleteFromModal === setId) {
      setSetToCompleteFromModal(null);
    }
  };

  // Calcular duración automáticamente cuando hay start_time y end_time
  const calculatedDuration = trainingStartTime && trainingEndTime
    ? Math.round((new Date(trainingEndTime).getTime() - new Date(trainingStartTime).getTime()) / (1000 * 60))
    : null;

  // Calcular totales de tiempo de ejercicio y descanso
  const totalExerciseTime = exercises.reduce((total, ex) => {
    return total + (ex.sets.reduce((setTotal, set) => {
      return setTotal + (set.duration || 0);
    }, 0));
  }, 0);

  const totalRestTime = exercises.reduce((total, ex) => {
    return total + (ex.sets.reduce((setTotal, set) => {
      return setTotal + (set.rest_time || 0);
    }, 0));
  }, 0);

  // Calcular porcentaje de tiempo de ejercicio sobre descanso
  const exercisePercentage = totalRestTime > 0 
    ? Math.round((totalExerciseTime / (totalExerciseTime + totalRestTime)) * 100)
    : totalExerciseTime > 0 ? 100 : 0;

  // Calcular volumen total del entrenamiento
  const totalVolume = exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((setTotal, set) => {
      const weight = set.weight || 0;
      const reps = set.reps || 0;
      return setTotal + (weight * reps);
    }, 0);
  }, 0);

  // Calcular densidad relativa (% tiempo trabajando sobre duración total)
  const totalDurationSeconds = calculatedDuration ? calculatedDuration * 60 : (totalExerciseTime + totalRestTime);
  const relativeDensity = totalDurationSeconds > 0
    ? Math.round((totalExerciseTime / totalDurationSeconds) * 100)
    : 0;

  // Calcular densidad absoluta (kg/min)
  const absoluteDensity = calculatedDuration && calculatedDuration > 0
    ? totalVolume / calculatedDuration
    : 0;

  // Calcular métricas por ejercicio
  const exerciseMetrics = exercises.map(ex => {
    const exerciseVolume = ex.sets.reduce((total, set) => {
      const weight = set.weight || 0;
      const reps = set.reps || 0;
      return total + (weight * reps);
    }, 0);
    
    const exerciseWorkingTime = ex.sets.reduce((total, set) => total + (set.duration || 0), 0);
    const exerciseRestTime = ex.sets.reduce((total, set) => total + (set.rest_time || 0), 0);
    const exerciseTotalTime = exerciseWorkingTime + exerciseRestTime;
    
    const exerciseRelativeDensity = exerciseTotalTime > 0
      ? Math.round((exerciseWorkingTime / exerciseTotalTime) * 100)
      : 0;
    
    const exerciseDurationMinutes = exerciseTotalTime / 60;
    const exerciseAbsoluteDensity = exerciseDurationMinutes > 0
      ? exerciseVolume / exerciseDurationMinutes
      : 0;

    return {
      exerciseId: ex.exercise.id,
      exerciseName: ex.exercise.name,
      volume: exerciseVolume,
      relativeDensity: exerciseRelativeDensity,
      absoluteDensity: exerciseAbsoluteDensity,
    };
  });

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  };

  const handleFirstExerciseStart = () => {
    // Establecer automáticamente la hora de inicio si no está establecida
    if (!trainingStartTime) {
      const now = new Date().toISOString();
      setTrainingStartTime(now);
      toast({
        title: 'Inicio automático',
        description: `Hora de inicio establecida: ${new Date(now).toLocaleTimeString()}`,
      });
    }
  };

  // Pre-poblar valores del formulario
  const defaultNotes = initialData?.notes || '';
  const defaultTags = initialData?.tags 
    ? (Array.isArray(initialData.tags) ? initialData.tags.join(', ') : initialData.tags)
    : '';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GymTrainingFormData>({
    resolver: zodResolver(gymTrainingSchema),
    defaultValues: {
      notes: defaultNotes,
      tags: defaultTags,
    },
  });

  const trainingNotes = watch('notes');
  const trainingTags = watch('tags');

  // Efecto para restaurar notas y tags del borrador después de que el form esté listo
  useEffect(() => {
    if (draft && showContinueDialog === false && draftProcessed && !trainingId && !initialData) {
      // Si el borrador tiene notas/tags y aún no los hemos restaurado
      if (draft.notes && !trainingNotes) {
        setValue('notes', draft.notes);
      }
      if (draft.tags && !trainingTags) {
        setValue('tags', draft.tags);
      }
    }
  }, [draft, showContinueDialog, draftProcessed, trainingId, initialData, trainingNotes, trainingTags, setValue]);

  // Efecto para auto-guardar el borrador cuando hay cambios
  useEffect(() => {
    // No guardar si:
    // - Estamos en modo edición
    // - El formulario ya se guardó
    // - Estamos cargando
    // - El diálogo de continuar está abierto
    // - No se ha procesado el borrador inicial
    if (trainingId || isSaved || isLoadingDraft || showContinueDialog || !draftProcessed) {
      return;
    }

    // Solo guardar si hay al menos un ejercicio o se ha iniciado el entrenamiento
    if (exercises.length === 0 && !trainingStartTime) {
      return;
    }

    const draftData = {
      exercises,
      startTime: trainingStartTime,
      endTime: trainingEndTime,
      notes: trainingNotes || '',
      tags: trainingTags || '',
      defaultRestTime,
      routineId: routineId || null,
      variantId: variantId || null,
      phaseRoutineId: phaseRoutineId || null,
      trainingId: null,
    };

    autoSave(draftData);
    setLastAutoSave(new Date());
  }, [
    exercises,
    trainingStartTime,
    trainingEndTime,
    trainingNotes,
    trainingTags,
    defaultRestTime,
    trainingId,
    isSaved,
    isLoadingDraft,
    showContinueDialog,
    draftProcessed,
    routineId,
    variantId,
    phaseRoutineId,
    autoSave,
  ]);

  // Guardar estado inicial para comparar cambios
  const initialStateRef = useRef({
    exercises: initialData?.training_exercises || [],
    startTime: initialData?.start_time || null,
    endTime: initialData?.end_time || null,
    notes: defaultNotes,
    tags: defaultTags,
  });

  // Detectar si hay cambios sin guardar
  const hasUnsavedChanges = useMemo(() => {
    // Si ya se guardó exitosamente, no hay cambios sin guardar
    if (isSaved) return false;
    
    // Comparar ejercicios
    const initialExercises = initialStateRef.current.exercises;
    const currentExercises = exercises;
    
    if (initialExercises.length !== currentExercises.length) {
      return true;
    }

    // Comparar cada ejercicio y sus series
    for (let i = 0; i < currentExercises.length; i++) {
      const current = currentExercises[i];
      const initial = initialExercises[i];
      
      if (!initial) return true;
      
      // Comparar ejercicio
      if (current.exercise.id !== initial.exercise?.id || 
          current.exercise.id !== initial.exercise_id) {
        return true;
      }
      
      // Comparar notas del ejercicio
      if (current.notes !== (initial.notes || '')) {
        return true;
      }
      
      // Comparar series
      const initialSets = initial.exercise_sets || [];
      if (current.sets.length !== initialSets.length) {
        return true;
      }
      
      for (let j = 0; j < current.sets.length; j++) {
        const currentSet = current.sets[j];
        const initialSet = initialSets[j];
        
        if (!initialSet) return true;
        
        if (currentSet.weight !== initialSet.weight ||
            currentSet.reps !== initialSet.reps ||
            currentSet.duration !== initialSet.duration ||
            currentSet.rest_time !== initialSet.rest_time ||
            currentSet.rir !== initialSet.rir ||
            currentSet.set_type !== (initialSet.set_type || 'working') ||
            currentSet.notes !== (initialSet.notes || null)) {
          return true;
        }
      }
    }

    // Comparar tiempos
    if (trainingStartTime !== initialStateRef.current.startTime ||
        trainingEndTime !== initialStateRef.current.endTime) {
      return true;
    }

    // Comparar notas y tags
    if (trainingNotes !== initialStateRef.current.notes ||
        trainingTags !== initialStateRef.current.tags) {
      return true;
    }

    return false;
  }, [exercises, trainingStartTime, trainingEndTime, trainingNotes, trainingTags, isSaved]);

  // Hook para manejar cambios sin guardar
  const {
    showDialog,
    confirmLeave,
    cancelLeave,
    handleNavigation,
  } = useUnsavedChanges({
    hasUnsavedChanges,
    message: '¿Estás seguro de que quieres salir? Tienes cambios sin guardar que se perderán.',
  });

  // Wrapper para onBack que verifica cambios
  const handleBack = () => {
    if (hasUnsavedChanges) {
      handleNavigation('/trainings');
    } else {
      onBack();
    }
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: TrainingExercise = {
      exercise,
      sets: [
        {
          id: `temp-${Date.now()}`,
          set_number: 1,
          weight: null,
          reps: null,
          set_type: 'working',
        },
      ],
      notes: '',
      start_time: null,
      end_time: null,
    };
    setExercises([...exercises, newExercise]);
  };

  const handleMarkTrainingStart = () => {
    const now = new Date().toISOString();
    setTrainingStartTime(now);
    toast({
      title: 'Inicio registrado',
      description: `Hora de inicio: ${new Date(now).toLocaleTimeString()}`,
    });
  };

  const handleMarkTrainingEnd = () => {
    const now = new Date().toISOString();
    setTrainingEndTime(now);
    toast({
      title: 'Término registrado',
      description: `Hora de término: ${new Date(now).toLocaleTimeString()}`,
    });
  };


  const handleTrainingStartTimeChange = (value: string) => {
    if (value) {
      // Convertir datetime-local a ISO string
      // datetime-local viene en formato YYYY-MM-DDTHH:mm (hora local sin zona horaria)
      // new Date() interpreta esto como hora local, y toISOString() la convierte a UTC
      // Esto está bien porque ambas fechas se convertirán de la misma manera
      const date = new Date(value);
      setTrainingStartTime(date.toISOString());
    } else {
      setTrainingStartTime(null);
    }
  };

  const handleTrainingEndTimeChange = (value: string) => {
    if (value) {
      // Convertir datetime-local a ISO string
      const date = new Date(value);
      setTrainingEndTime(date.toISOString());
    } else {
      setTrainingEndTime(null);
    }
  };


  // Función helper para convertir ISO string a datetime-local format
  const toDateTimeLocal = (isoString: string | null | undefined): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Ajustar por zona horaria local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newExercises.length) {
      [newExercises[index], newExercises[targetIndex]] = [
        newExercises[targetIndex],
        newExercises[index],
      ];
      setExercises(newExercises);
    }
  };

  const handleUpdateExerciseSets = async (index: number, sets: ExerciseSet[]) => {
    const newExercises = [...exercises];
    newExercises[index].sets = sets;
    setExercises(newExercises);
    // Los resúmenes se generarán solo al presionar Guardar/Actualizar
  };

  const handleUpdateExerciseNotes = (index: number, notes: string) => {
    const newExercises = [...exercises];
    newExercises[index].notes = notes;
    setExercises(newExercises);
  };

  // Función para generar resumen del entrenamiento cuando se actualiza
  const generateTrainingSummary = async () => {
    const exerciseNotes = exercises
      .filter(ex => ex.notes && ex.notes.trim().length > 0)
      .map(ex => ({
        exerciseName: ex.exercise.name,
        notes: ex.notes
      }));

    if (exerciseNotes.length === 0) {
      return;
    }

    setGeneratingTrainingSummary(true);
    try {
      const response = await apiFetch('/api/ai/summarize-training-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exerciseNotes })
      });

      if (response.ok) {
        const { summary } = await response.json();
        if (summary && summary.trim().length > 0) {
          // Actualizar las notas generales del entrenamiento usando setValue de react-hook-form
          setValue('notes', summary);
        }
      } else {
        // Manejar errores de la API
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('Error generando resumen del entrenamiento:', errorData.error);
        if (errorData.error?.includes('ANTHROPIC_API_KEY')) {
          toast({
            title: 'Configuración requerida',
            description: 'La API key de Anthropic no está configurada. Los resúmenes automáticos no están disponibles.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error generando resumen de notas del entrenamiento:', error);
      // Solo mostrar toast si no es un error de red (Failed to fetch)
      if (error?.message && !error.message.includes('Failed to fetch')) {
        toast({
          title: 'Error',
          description: 'No se pudo generar el resumen automático del entrenamiento.',
          variant: 'destructive',
        });
      }
    } finally {
      setGeneratingTrainingSummary(false);
    }
  };

  // Función para generar todos los resúmenes antes de guardar
  const generateAllSummaries = async (): Promise<{ updatedExercises: TrainingExercise[], trainingSummary: string | null }> => {
    // Crear una copia de los ejercicios para actualizar
    const updatedExercises = [...exercises];
    let trainingSummary: string | null = null;

    // Generar resúmenes para cada ejercicio que tenga notas en las series
    const summaryPromises = updatedExercises.map(async (exercise, index) => {
      const setNotes = exercise.sets
        .map(set => ({
          setNumber: set.set_number,
          notes: set.notes,
          setType: set.set_type || 'working'
        }))
        .filter(set => set.notes && set.notes.trim().length > 0);

      if (setNotes.length === 0) {
        return null;
      }

      setGeneratingExerciseSummaries(prev => new Set(prev).add(index));
      try {
        const response = await apiFetch('/api/ai/summarize-exercise-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseName: exercise.exercise.name,
            setNotes
          })
        });

        if (response.ok) {
          const { summary } = await response.json();
          if (summary && summary.trim().length > 0) {
            // Actualizar el ejercicio en la copia local
            updatedExercises[index] = {
              ...updatedExercises[index],
              notes: summary
            };
            return summary;
          }
        }
      } catch (error) {
        console.error(`Error generando resumen para ejercicio ${index}:`, error);
        // No mostrar error al usuario, solo continuar
      } finally {
        setGeneratingExerciseSummaries(prev => {
          const updated = new Set(prev);
          updated.delete(index);
          return updated;
        });
      }
      return null;
    });

    // Esperar a que todos los resúmenes de ejercicios se generen
    await Promise.all(summaryPromises);

    // Actualizar el estado con los ejercicios actualizados
    setExercises(updatedExercises);

    // Luego generar el resumen del entrenamiento
    const exerciseNotes = updatedExercises
      .filter(ex => ex.notes && ex.notes.trim().length > 0)
      .map(ex => ({
        exerciseName: ex.exercise.name,
        notes: ex.notes
      }));

    if (exerciseNotes.length > 0) {
      setGeneratingTrainingSummary(true);
      try {
        const response = await apiFetch('/api/ai/summarize-training-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exerciseNotes })
        });

        if (response.ok) {
          const { summary } = await response.json();
          if (summary && summary.trim().length > 0) {
            trainingSummary = summary;
            setValue('notes', summary);
          }
        }
      } catch (error) {
        console.error('Error generando resumen del entrenamiento:', error);
        // No mostrar error al usuario, solo continuar
      } finally {
        setGeneratingTrainingSummary(false);
      }
    }

    return { updatedExercises, trainingSummary };
  };

  const onSubmit = async (data: GymTrainingFormData) => {
    // Prevenir múltiples envíos
    if (isSubmitting || isSaved) {
      return;
    }

    // Validar que haya al menos un ejercicio con al menos una serie
    if (exercises.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes agregar al menos un ejercicio',
        variant: 'destructive',
      });
      return;
    }

    const exercisesWithValidSets = exercises.filter((ex) => ex.sets.length > 0);
    if (exercisesWithValidSets.length === 0) {
      toast({
        title: 'Error',
        description: 'Cada ejercicio debe tener al menos una serie',
        variant: 'destructive',
      });
      return;
    }

    // Marcar hora de término si no está marcada
    if (!trainingEndTime) {
      const now = new Date().toISOString();
      setTrainingEndTime(now);
    }

    setIsSubmitting(true);
    try {
      // Generar todos los resúmenes antes de guardar
      const { updatedExercises } = await generateAllSummaries();
      
      // Usar los ejercicios actualizados con los resúmenes generados
      const finalExercises = updatedExercises;

      const tagsArray = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      // Usar la fecha de inicio si existe, sino usar fecha actual
      if (!trainingStartTime) {
        toast({
          title: 'Error',
          description: 'Debes especificar la hora de inicio del entrenamiento',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      const trainingDate = new Date(trainingStartTime).toISOString();

      // Calcular duración automáticamente si hay start_time y end_time
      let calculatedDuration: number | null = null;
      if (trainingStartTime && trainingEndTime) {
        const start = new Date(trainingStartTime);
        const end = new Date(trainingEndTime);
        
        // Validar que la hora de término sea posterior a la de inicio
        if (end <= start) {
          toast({
            title: 'Error',
            description: 'La hora de término debe ser posterior a la hora de inicio',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        
        const diffInMs = end.getTime() - start.getTime();
        const diffInMinutes = Math.round(diffInMs / (1000 * 60));
        
        // Validar que la diferencia sea al menos 1 minuto
        if (diffInMinutes <= 0) {
          toast({
            title: 'Error',
            description: 'La hora de término debe ser al menos 1 minuto posterior a la hora de inicio',
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        
        calculatedDuration = diffInMinutes;
      }

      const isEditMode = !!trainingId;
      const url = isEditMode ? `/api/trainings/${trainingId}` : '/api/trainings';
      const method = isEditMode ? 'PUT' : 'POST';

      // Crear o actualizar el entrenamiento con ejercicios y series
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'gym',
          date: trainingDate,
          duration: calculatedDuration,
          start_time: trainingStartTime,
          end_time: trainingEndTime,
          routine_id: routineId || null, // Guardar referencia a la rutina si existe
          phase_routine_id: phaseRoutineId || null, // Vincular con rutina programada
          notes: watch('notes') || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          exercises: finalExercises.filter((ex) => ex.sets.length > 0).map((ex, index) => ({
            exercise_id: ex.exercise.id,
            order_index: index + 1,
            notes: ex.notes || null,
            sets: ex.sets.map((set, setIndex) => ({
              set_number: setIndex + 1,
              weight: set.weight,
              reps: set.reps,
              duration: set.duration,
              rest_time: set.rest_time,
              rir: set.rir,
              rpe: set.rpe,
              notes: set.notes || null,
              set_type: set.set_type || 'working',
            })),
            start_time: null,
            end_time: null,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error al ${isEditMode ? 'actualizar' : 'crear'} el entrenamiento`);
      }

      const result = await response.json();
      
      // Actualizar el estado inicial con los datos guardados para evitar el diálogo de confirmación
      initialStateRef.current = {
        exercises: finalExercises.map((ex, index) => ({
          exercise: ex.exercise,
          exercise_id: ex.exercise.id,
          order_index: index + 1,
          notes: ex.notes || null,
          exercise_sets: ex.sets.map((set, setIndex) => ({
            id: set.id,
            set_number: setIndex + 1,
            weight: set.weight,
            reps: set.reps,
            duration: set.duration,
            rest_time: set.rest_time,
            rir: set.rir,
            notes: set.notes || null,
            set_type: set.set_type || 'working',
          })),
        })),
        startTime: trainingStartTime,
        endTime: trainingEndTime,
        notes: watch('notes') || '',
        tags: trainingTags || '',
      };
      
      // Marcar como guardado antes de redirigir
      setIsSaved(true);
      
      // Limpiar el borrador guardado ya que se guardó exitosamente
      clearDraft();
      
      toast({
        title: isEditMode ? 'Entrenamiento actualizado' : 'Entrenamiento creado',
        description: `Tu entrenamiento con ${finalExercises.filter((ex) => ex.sets.length > 0).length} ejercicio(s) ha sido ${isEditMode ? 'actualizado' : 'registrado'} exitosamente.`,
      });

      // Redirigir después de un breve delay para asegurar que el estado se actualice
      setTimeout(() => {
        router.push('/trainings');
      }, 100);
    } catch (error) {
      console.error(`Error ${trainingId ? 'updating' : 'creating'} gym training:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `No se pudo ${trainingId ? 'actualizar' : 'crear'} el entrenamiento`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {showExerciseSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ExerciseSelector
            onSelect={handleAddExercise}
            onClose={() => setShowExerciseSelector(false)}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>{trainingId ? 'Editar Entrenamiento de Gimnasio' : 'Nuevo Entrenamiento de Gimnasio'}</CardTitle>
            </div>
            {/* Indicador de auto-guardado */}
            {!trainingId && lastAutoSave && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Save className="h-3 w-3" />
                <span className="hidden sm:inline">Guardado automáticamente</span>
                <span className="sm:hidden">Auto</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Control de tiempo del entrenamiento */}
            <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="training-start-time" className="text-sm">Hora de Inicio</Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <DateTimePicker
                      id="training-start-time"
                      value={toDateTimeLocal(trainingStartTime)}
                      onChange={handleTrainingStartTimeChange}
                      disabled={isSubmitting}
                      className="flex-1 text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleMarkTrainingStart}
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Ahora</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training-end-time" className="text-sm">Hora de Término</Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <DateTimePicker
                      id="training-end-time"
                      value={toDateTimeLocal(trainingEndTime)}
                      onChange={handleTrainingEndTimeChange}
                      disabled={isSubmitting}
                      className="flex-1 text-sm"
                    />
                    <Button
                      type="button"
                      onClick={handleMarkTrainingEnd}
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      <span className="text-xs sm:text-sm">Ahora</span>
                    </Button>
                  </div>
                </div>
              </div>
              {calculatedDuration !== null && calculatedDuration > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Duración Calculada</Label>
                    <span className="text-lg font-semibold text-primary">
                      {calculatedDuration} {calculatedDuration === 1 ? 'minuto' : 'minutos'}
                    </span>
                  </div>
                </div>
              )}
              {(totalExerciseTime > 0 || totalRestTime > 0) && (
                <div className="pt-2 border-t space-y-2">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Tiempo Ejercicio</Label>
                      <div className="text-xs sm:text-sm font-semibold text-primary">
                        {formatTime(totalExerciseTime)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tiempo Descanso</Label>
                      <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
                        {formatTime(totalRestTime)}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">% Tiempo Ejercicio</Label>
                      <span className="text-base sm:text-lg font-semibold text-primary">
                        {exercisePercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {totalVolume > 0 && (
                <div className="pt-2 border-t space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Volumen Total</Label>
                      <div className="text-sm sm:text-base font-semibold text-primary">
                        {formatVolume(totalVolume)}
                      </div>
                    </div>
                    {calculatedDuration && calculatedDuration > 0 && (
                      <>
                        <div>
                          <Label className="text-xs text-muted-foreground">Densidad Relativa</Label>
                          <div className="text-sm sm:text-base font-semibold text-primary">
                            {relativeDensity}%
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Densidad Absoluta</Label>
                          <div className="text-sm sm:text-base font-semibold text-primary">
                            {Math.round(absoluteDensity)} kg/min
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <Label htmlFor="default-rest-time" className="text-xs sm:text-sm">
                    Tiempo Predeterminado de Descanso (seg)
                  </Label>
                  <Input
                    id="default-rest-time"
                    type="number"
                    min="1"
                    max="600"
                    value={defaultRestTime}
                    onChange={(e) => setDefaultRestTime(parseInt(e.target.value) || 60)}
                    className="w-full sm:w-24 h-8 sm:h-9 text-sm"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Predeterminado para el countdown. Puede sobrescribirse en cada serie.
                </p>
              </div>
            </div>

            {/* Ejercicios */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Ejercicios</Label>

              {exercises.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No hay ejercicios agregados
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowExerciseSelector(true)}
                    disabled={isSubmitting}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primer Ejercicio
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {exercises.map((trainingExercise, index) => (
                    <div key={`${trainingExercise.exercise.id}-${index}`} className="space-y-2">
                      <ExerciseForm
                        exercise={trainingExercise.exercise}
                        exerciseIndex={index}
                        sets={trainingExercise.sets}
                        notes={trainingExercise.notes}
                        isLastExercise={index === exercises.length - 1}
                        defaultRestTime={defaultRestTime}
                        restAfterExercise={trainingExercise.rest_after_exercise}
                        isGeneratingSummary={generatingExerciseSummaries.has(index)}
                        globalActiveSetId={globalActiveSetId}
                        globalRestingSetId={globalRestingSetId}
                        onGlobalSetStart={handleGlobalSetStart}
                        onGlobalSetStop={handleGlobalSetStop}
                        onGlobalSetRest={handleGlobalSetRest}
                        onGlobalSetComplete={handleGlobalSetComplete}
                        onUpdateSets={(sets) => handleUpdateExerciseSets(index, sets)}
                        onUpdateNotes={(notes) => handleUpdateExerciseNotes(index, notes)}
                        onActiveSetExerciseTimeUpdate={handleActiveSetExerciseTimeUpdate}
                        onTutStateUpdate={(isTutMode, countdown) => {
                          setIsModalTutMode(isTutMode);
                          setModalTutCountdown(countdown);
                        }}
                        onSetCompleteFromModal={handleSetCompleteFromModal}
                        setToCompleteFromModal={setToCompleteFromModal}
                        onRemove={() => handleRemoveExercise(index)}
                        onMoveUp={index > 0 ? () => handleMoveExercise(index, 'up') : undefined}
                        onMoveDown={
                          index < exercises.length - 1
                            ? () => handleMoveExercise(index, 'down')
                            : undefined
                        }
                        canMoveUp={index > 0}
                        canMoveDown={index < exercises.length - 1}
                        onFirstExerciseStart={index === 0 ? handleFirstExerciseStart : undefined}
                        previousMarks={routineId ? routineHistory[trainingExercise.exercise.id] : undefined}
                        previousSetMarks={routineId ? routineSetHistory[trainingExercise.exercise.id] : undefined}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setShowExerciseSelector(true)}
                    disabled={isSubmitting}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Ejercicio
                  </Button>
                </div>
              )}
            </div>

            {/* Etiquetas y notas generales */}
            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
              <Input
                id="tags"
                type="text"
                placeholder="piernas, fuerza, pesas"
                {...register('tags')}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="notes">Notas Generales</Label>
                {generatingTrainingSummary && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Generando resumen...</span>
                  </div>
                )}
              </div>
              <EditableMarkdown
                content={watch('notes') || ''}
                onChange={(value) => setValue('notes', value)}
                placeholder={generatingTrainingSummary ? "Generando resumen automático..." : "Anota cualquier observación sobre tu entrenamiento..."}
                disabled={isSubmitting || generatingTrainingSummary}
                isGenerating={generatingTrainingSummary}
                rows={3}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting || isSaved || loadingRoutine}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || isSaved || loadingRoutine || exercises.length === 0 || generatingExerciseSummaries.size > 0 || generatingTrainingSummary}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loadingRoutine ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando rutina...
                  </>
                ) : isSubmitting ? (
                  trainingId ? 'Actualizando...' : 'Guardando...'
                ) : (
                  trainingId ? 'Actualizar Entrenamiento' : 'Crear Entrenamiento'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para cambios sin guardar */}
      <UnsavedChangesDialog
        open={showDialog}
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />

      {/* Modal de ejercicio activo */}
      <ActiveExerciseModal
        open={!!globalActiveSetId && !!activeExerciseData}
        exercise={activeExerciseData?.exercise || null}
        set={activeExerciseData?.set || null}
        exerciseSeconds={activeSetExerciseTime}
        isTutMode={isModalTutMode}
        tutCountdown={modalTutCountdown}
        onUpdateSet={handleUpdateActiveSet}
        onStop={handleStopActiveExercise}
      />

      {/* Diálogo para continuar entrenamiento guardado */}
      <ContinueTrainingDialog
        open={showContinueDialog}
        draft={draft}
        onContinue={handleContinueDraft}
        onStartNew={handleStartNew}
      />
    </>
  );
}

