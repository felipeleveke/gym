'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GymTrainingFormEdit } from './gym-training-form-edit';
import { SportTrainingFormEdit } from './sport-training-form-edit';
import { CardioTrainingFormEdit } from './cardio-training-form-edit';
import { FlexibilityTrainingFormEdit } from './flexibility-training-form-edit';
import { OtherTrainingFormEdit } from './other-training-form-edit';

interface EditTrainingClientProps {
  trainingId: string;
}

export function EditTrainingClient({ trainingId }: EditTrainingClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState<any>(null);

  useEffect(() => {
    async function loadTraining() {
      try {
        const response = await fetch(`/api/trainings/${trainingId}`);
        if (!response.ok) {
          throw new Error('Error al cargar el entrenamiento');
        }
        const result = await response.json();
        setTraining(result.data);
      } catch (error) {
        console.error('Error loading training:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el entrenamiento',
          variant: 'destructive',
        });
        router.push('/trainings');
      } finally {
        setLoading(false);
      }
    }

    loadTraining();
  }, [trainingId, router, toast]);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!training) {
    return null;
  }

  // Determinar qué componente de edición usar según el tipo de entrenamiento
  const trainingType = training.training_type;

  if (trainingType === 'gym') {
    return (
      <div className="p-4 md:p-6">
        <GymTrainingFormEdit training={training} />
      </div>
    );
  }

  if (trainingType === 'sport') {
    // Para sport trainings, usar SportTrainingFormEdit
    return (
      <div className="p-4 md:p-6">
        <SportTrainingFormEdit training={training} />
      </div>
    );
  }

  // Si hay un campo training_type específico (cardio, flexibility, other)
  // aunque técnicamente se guardan como 'sport', podemos usar los componentes específicos
  // Por ahora, todos los sport trainings usan SportTrainingFormEdit
  // Si en el futuro se necesita distinguir entre cardio/flexibility/other,
  // se puede agregar lógica adicional aquí

  // Fallback: mostrar mensaje de error si el tipo no es reconocido
  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Tipo de entrenamiento no reconocido: {trainingType}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}




