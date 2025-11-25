'use client';

import { useEffect, useState } from 'react';
import { TrainingsList } from './trainings-list';
import { useToast } from '@/hooks/use-toast';

interface Training {
  id: string;
  date: string;
  training_type: 'gym' | 'sport';
  [key: string]: any;
}

export function TrainingsListClient() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchTrainings() {
      try {
        const response = await fetch('/api/trainings');
        
        if (!response.ok) {
          throw new Error('Error al cargar los entrenamientos');
        }

        const result = await response.json();
        setTrainings(result.data || []);
      } catch (error) {
        console.error('Error fetching trainings:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los entrenamientos',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchTrainings();
  }, [toast]);

  return <TrainingsList trainings={trainings} loading={loading} />;
}


