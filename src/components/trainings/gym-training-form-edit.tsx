'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GymTrainingFormDetailed } from './gym-training-form-detailed';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface GymTrainingFormEditProps {
  training: any;
}

export function GymTrainingFormEdit({ training }: GymTrainingFormEditProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [trainingData, setTrainingData] = useState<any>(null);

  useEffect(() => {
    // Cargar datos del entrenamiento desde el servidor
    async function loadTraining() {
      try {
        const response = await fetch(`/api/trainings/${training.id}`);
        if (!response.ok) {
          throw new Error('Error al cargar el entrenamiento');
        }
        const result = await response.json();
        setTrainingData(result.data);
      } catch (error) {
        console.error('Error loading training:', error);
        router.push('/trainings');
      } finally {
        setIsLoading(false);
      }
    }

    if (training) {
      setTrainingData(training);
      setIsLoading(false);
    } else {
      loadTraining();
    }
  }, [training, router]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!trainingData) {
    return null;
  }

  // Crear un componente wrapper que modifique el comportamiento del formulario
  return <GymTrainingFormEditWrapper training={trainingData} />;
}

function GymTrainingFormEditWrapper({ training }: { training: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  
  // Convertir los datos del entrenamiento al formato del formulario
  const [exercises, setExercises] = useState(() => {
    if (!training.training_exercises || !Array.isArray(training.training_exercises)) {
      return [];
    }

    return training.training_exercises
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
          })),
        notes: te.notes || '',
        start_time: te.start_time,
        end_time: te.end_time,
      }));
  });

  const [trainingStartTime, setTrainingStartTime] = useState<string | null>(training.start_time || null);
  const [trainingEndTime, setTrainingEndTime] = useState<string | null>(training.end_time || null);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
        : training.tags || [];

      const trainingDate = trainingStartTime 
        ? new Date(trainingStartTime).toISOString()
        : new Date(formData.date + 'T00:00:00').toISOString();

      const response = await fetch(`/api/trainings/${training.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'gym',
          date: trainingDate,
          duration: formData.duration,
          start_time: trainingStartTime,
          end_time: trainingEndTime,
          notes: formData.notes || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
          exercises: exercises.map((ex, index) => ({
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
        throw new Error(error.error || 'Error al actualizar el entrenamiento');
      }

      router.push('/trainings');
    } catch (error) {
      console.error('Error updating training:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Usar el componente GymTrainingFormDetailed pero con datos precargados
  // Por ahora, redirigir a una página que muestre un mensaje de que la edición está en desarrollo
  // o crear una versión simplificada del formulario
  return (
    <div className="p-4 md:p-6">
      <p>La edición de entrenamientos está en desarrollo. Por ahora, puedes duplicar el entrenamiento y editarlo.</p>
    </div>
  );
}

