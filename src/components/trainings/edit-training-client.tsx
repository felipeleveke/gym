'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  return (
    <div className="p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/trainings')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>
              Editar Entrenamiento - {training.training_type === 'gym' ? 'Gimnasio' : 'Deportivo'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              La funcionalidad de edición completa está en desarrollo. Por ahora, puedes:
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/trainings')}
              >
                Volver a Entrenamientos
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/trainings/${trainingId}/duplicate`, {
                      method: 'POST',
                    });
                    if (!response.ok) throw new Error('Error al duplicar');
                    toast({
                      title: 'Entrenamiento duplicado',
                      description: 'Puedes editar el entrenamiento duplicado.',
                    });
                    router.push('/trainings');
                  } catch (error) {
                    toast({
                      title: 'Error',
                      description: 'No se pudo duplicar el entrenamiento',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                Duplicar y Editar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

