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

    if (training && training.id) {
      // Si ya tenemos los datos completos con relaciones, usarlos directamente
      if (training.training_exercises) {
        setTrainingData(training);
        setIsLoading(false);
      } else {
        // Si no, cargar desde el servidor
        loadTraining();
      }
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

  const handleBack = () => {
    router.push('/trainings');
  };

  return (
    <GymTrainingFormDetailed
      onBack={handleBack}
      initialData={trainingData}
      trainingId={trainingData.id}
    />
  );
}




