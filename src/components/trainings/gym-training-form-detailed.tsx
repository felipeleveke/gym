'use client';

import { useState } from 'react';
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
import { ArrowLeft, Loader2, Plus, Clock } from 'lucide-react';
import { ExerciseSelector } from './exercise-selector';
import { ExerciseForm } from './exercise-form';

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
  notes?: string | null;
  set_type?: 'warmup' | 'approach' | 'working' | null;
}

interface TrainingExercise {
  exercise: Exercise;
  sets: ExerciseSet[];
  notes: string;
  start_time?: string | null;
  end_time?: string | null;
}

const gymTrainingSchema = z.object({
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type GymTrainingFormData = z.infer<typeof gymTrainingSchema>;

interface GymTrainingFormDetailedProps {
  onBack: () => void;
  initialData?: any;
  trainingId?: string;
}

export function GymTrainingFormDetailed({ onBack, initialData, trainingId }: GymTrainingFormDetailedProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  
  // Pre-poblar ejercicios si hay initialData
  const [exercises, setExercises] = useState<TrainingExercise[]>(() => {
    if (!initialData?.training_exercises || !Array.isArray(initialData.training_exercises)) {
      return [];
    }
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
  });
  
  // Pre-poblar tiempos del entrenamiento
  const [trainingStartTime, setTrainingStartTime] = useState<string | null>(initialData?.start_time || null);
  const [trainingEndTime, setTrainingEndTime] = useState<string | null>(initialData?.end_time || null);
  
  // Tiempo predeterminado de descanso para el countdown (en segundos)
  const [defaultRestTime, setDefaultRestTime] = useState<number>(60);

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

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    formState: { errors },
  } = useForm<GymTrainingFormData>({
    resolver: zodResolver(gymTrainingSchema),
    defaultValues: {
      notes: defaultNotes,
      tags: defaultTags,
    },
  });

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

  const handleUpdateExerciseSets = (index: number, sets: ExerciseSet[]) => {
    const newExercises = [...exercises];
    newExercises[index].sets = sets;
    setExercises(newExercises);
  };

  const handleUpdateExerciseNotes = (index: number, notes: string) => {
    const newExercises = [...exercises];
    newExercises[index].notes = notes;
    setExercises(newExercises);
  };

  const onSubmit = async (data: GymTrainingFormData) => {
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

    setIsSubmitting(true);
    try {
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
        const start = new Date(trainingStartTime).getTime();
        const end = new Date(trainingEndTime).getTime();
        const diffInMinutes = Math.round((end - start) / (1000 * 60));
        if (diffInMinutes > 0) {
          calculatedDuration = diffInMinutes;
        }
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
          notes: data.notes || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          exercises: exercisesWithValidSets.map((ex, index) => ({
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
      
      toast({
        title: isEditMode ? 'Entrenamiento actualizado' : 'Entrenamiento creado',
        description: `Tu entrenamiento con ${exercisesWithValidSets.length} ejercicio(s) ha sido ${isEditMode ? 'actualizado' : 'registrado'} exitosamente.`,
      });

      router.push('/trainings');
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{trainingId ? 'Editar Entrenamiento de Gimnasio' : 'Nuevo Entrenamiento de Gimnasio'}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Control de tiempo del entrenamiento */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="training-start-time">Hora de Inicio del Entrenamiento</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="training-start-time"
                      type="datetime-local"
                      value={toDateTimeLocal(trainingStartTime)}
                      onChange={(e) => handleTrainingStartTimeChange(e.target.value)}
                      disabled={isSubmitting}
                      className="flex-1"
                      required
                    />
                    <Button
                      type="button"
                      onClick={handleMarkTrainingStart}
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Ahora
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="training-end-time">Hora de Término del Entrenamiento</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="training-end-time"
                      type="datetime-local"
                      value={toDateTimeLocal(trainingEndTime)}
                      onChange={(e) => handleTrainingEndTimeChange(e.target.value)}
                      disabled={isSubmitting}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleMarkTrainingEnd}
                      variant="outline"
                      size="sm"
                      disabled={isSubmitting}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Ahora
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Tiempo Ejercicio</Label>
                      <div className="text-sm font-semibold text-primary">
                        {formatTime(totalExerciseTime)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tiempo Descanso</Label>
                      <div className="text-sm font-semibold text-muted-foreground">
                        {formatTime(totalRestTime)}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">% Tiempo Ejercicio</Label>
                      <span className="text-lg font-semibold text-primary">
                        {exercisePercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="default-rest-time" className="text-sm">
                    Tiempo Predeterminado de Descanso (segundos)
                  </Label>
                  <Input
                    id="default-rest-time"
                    type="number"
                    min="1"
                    max="600"
                    value={defaultRestTime}
                    onChange={(e) => setDefaultRestTime(parseInt(e.target.value) || 60)}
                    className="w-24 h-9"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Este tiempo se usará como predeterminado para el countdown de descanso. Puede ser sobrescrito en cada serie.
                </p>
              </div>
            </div>

            {/* Ejercicios */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Ejercicios</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowExerciseSelector(true)}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Ejercicio
                </Button>
              </div>

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
                        onUpdateSets={(sets) => handleUpdateExerciseSets(index, sets)}
                        onUpdateNotes={(notes) => handleUpdateExerciseNotes(index, notes)}
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
                        onTrainingComplete={() => {
                          // Marcar hora de término del entrenamiento
                          const now = new Date().toISOString();
                          setTrainingEndTime(now);
                          toast({
                            title: 'Entrenamiento completado',
                            description: `Hora de término: ${new Date(now).toLocaleTimeString()}`,
                          });
                        }}
                      />
                    </div>
                  ))}
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
              <Label htmlFor="notes">Notas Generales</Label>
              <Textarea
                id="notes"
                placeholder="Anota cualquier observación sobre tu entrenamiento..."
                rows={3}
                {...register('notes')}
                disabled={isSubmitting}
              />
            </div>

            {/* Botones */}
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || exercises.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {trainingId ? 'Actualizar Entrenamiento' : 'Crear Entrenamiento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

