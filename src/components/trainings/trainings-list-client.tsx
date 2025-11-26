'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TrainingsList } from './trainings-list';
import { useToast } from '@/hooks/use-toast';

interface Training {
  id: string;
  date: string;
  training_type: 'gym' | 'sport';
  [key: string]: any;
}

export function TrainingsListClient() {
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrainings = useCallback(async () => {
    try {
      const response = await fetch(`/api/trainings?_=${Date.now()}`, {
        cache: 'no-store',
      });
      
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
  }, [toast]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  // Escuchar eventos de actualización desde las tarjetas
  useEffect(() => {
    const handleRefresh = () => {
      fetchTrainings();
    };

    window.addEventListener('training-updated', handleRefresh);
    return () => window.removeEventListener('training-updated', handleRefresh);
  }, [fetchTrainings]);

  return <TrainingsList trainings={trainings} loading={loading} />;
}




