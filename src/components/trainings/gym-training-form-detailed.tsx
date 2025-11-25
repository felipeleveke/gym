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
import { Timer } from './timer';

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
}

interface TrainingExercise {
  exercise: Exercise;
  sets: ExerciseSet[];
  notes: string;
  start_time?: string | null;
  end_time?: string | null;
}

const gymTrainingSchema = z.object({
  date: z.string().min(1, 'La fecha es requerida'),
  duration: z.coerce.number().min(1, 'La duración debe ser mayor a 0').max(600, 'La duración no puede ser mayor a 600 minutos'),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type GymTrainingFormData = z.infer<typeof gymTrainingSchema>;

interface GymTrainingFormDetailedProps {
  onBack: () => void;
}

export function GymTrainingFormDetailed({ onBack }: GymTrainingFormDetailedProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [exercises, setExercises] = useState<TrainingExercise[]>([]);
  const [trainingStartTime, setTrainingStartTime] = useState<string | null>(null);
  const [trainingEndTime, setTrainingEndTime] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GymTrainingFormData>({
    resolver: zodResolver(gymTrainingSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      duration: 60,
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

  const handleMarkExerciseStart = (index: number) => {
    const now = new Date().toISOString();
    const newExercises = [...exercises];
    newExercises[index].start_time = now;
    setExercises(newExercises);
    toast({
      title: 'Ejercicio iniciado',
      description: `${exercises[index].exercise.name} iniciado a las ${new Date(now).toLocaleTimeString()}`,
    });
  };

  const handleMarkExerciseEnd = (index: number) => {
    const now = new Date().toISOString();
    const newExercises = [...exercises];
    newExercises[index].end_time = now;
    setExercises(newExercises);
    toast({
      title: 'Ejercicio terminado',
      description: `${exercises[index].exercise.name} terminado a las ${new Date(now).toLocaleTimeString()}`,
    });
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

      // Combinar fecha con hora de inicio si existe, sino usar fecha actual
      const trainingDate = trainingStartTime 
        ? new Date(trainingStartTime).toISOString()
        : new Date(data.date + 'T00:00:00').toISOString();

      // Crear el entrenamiento con ejercicios y series
      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'gym',
          date: trainingDate,
          duration: data.duration,
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
            })),
            start_time: ex.start_time || null,
            end_time: ex.end_time || null,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el entrenamiento');
      }

      const result = await response.json();
      
      toast({
        title: 'Entrenamiento creado',
        description: `Tu entrenamiento con ${exercisesWithValidSets.length} ejercicio(s) ha sido registrado exitosamente.`,
      });

      router.push('/trainings');
    } catch (error) {
      console.error('Error creating gym training:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear el entrenamiento',
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
            <CardTitle>Nuevo Entrenamiento de Gimnasio</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date', {
                    setValueAs: (value) => {
                      // Mantener solo la fecha, sin hora
                      return value;
                    },
                  })}
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  disabled={isSubmitting}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración (minutos)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="600"
                  {...register('duration')}
                  disabled={isSubmitting}
                />
                {errors.duration && (
                  <p className="text-sm text-destructive">{errors.duration.message}</p>
                )}
              </div>
            </div>

            {/* Control de tiempo del entrenamiento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Hora de Inicio del Entrenamiento</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={trainingStartTime ? new Date(trainingStartTime).toLocaleTimeString() : 'No registrada'}
                    disabled
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleMarkTrainingStart}
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting || !!trainingStartTime}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Marcar Inicio
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hora de Término del Entrenamiento</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={trainingEndTime ? new Date(trainingEndTime).toLocaleTimeString() : 'No registrada'}
                    disabled
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleMarkTrainingEnd}
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting || !!trainingEndTime}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Marcar Término
                  </Button>
                </div>
              </div>
            </div>

            {/* Cronómetro */}
            <Timer />

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
                      />
                      {/* Control de tiempo del ejercicio */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 border rounded-md bg-muted/30">
                        <div className="space-y-1">
                          <Label className="text-xs">Hora de Inicio</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={trainingExercise.start_time ? new Date(trainingExercise.start_time).toLocaleTimeString() : 'No registrada'}
                              disabled
                              className="flex-1 h-8 text-xs"
                            />
                            <Button
                              type="button"
                              onClick={() => handleMarkExerciseStart(index)}
                              variant="outline"
                              size="sm"
                              disabled={isSubmitting || !!trainingExercise.start_time}
                              className="h-8"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Inicio
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Hora de Término</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="text"
                              value={trainingExercise.end_time ? new Date(trainingExercise.end_time).toLocaleTimeString() : 'No registrada'}
                              disabled
                              className="flex-1 h-8 text-xs"
                            />
                            <Button
                              type="button"
                              onClick={() => handleMarkExerciseEnd(index)}
                              variant="outline"
                              size="sm"
                              disabled={isSubmitting || !!trainingExercise.end_time}
                              className="h-8"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Término
                            </Button>
                          </div>
                        </div>
                      </div>
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
                Crear Entrenamiento
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}

