'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RoutineCard } from './routine-card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface RoutineExercise {
  id: string;
  order_index: number;
  default_weight?: number | null;
  default_sets?: number | null;
  default_reps?: number | null;
  notes?: string | null;
  exercise?: {
    id: string;
    name: string;
    muscle_groups?: string[];
  };
}

interface Routine {
  id: string;
  name: string;
  description?: string | null;
  type: 'gym' | 'sport' | 'cardio' | 'flexibility' | 'other';
  duration?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  routine_exercises?: RoutineExercise[];
}

export function RoutinesListClient() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRoutines = useCallback(async () => {
    try {
      const response = await fetch(`/api/routines?_=${Date.now()}`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar las rutinas');
      }

      const result = await response.json();
      setRoutines(result.data || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las rutinas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const handleUseRoutine = (routineId: string) => {
    router.push(`/trainings/new?routineId=${routineId}`);
  };

  const handleEditRoutine = (routineId: string) => {
    router.push(`/routines/${routineId}/edit`);
  };

  const handleDeleteRoutine = async (routineId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta rutina?')) {
      return;
    }

    try {
      const response = await fetch(`/api/routines/${routineId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar la rutina');
      }

      toast({
        title: 'Rutina eliminada',
        description: 'La rutina ha sido eliminada exitosamente.',
      });

      fetchRoutines();
    } catch (error) {
      console.error('Error eliminando rutina:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar la rutina',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (routines.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No tienes rutinas guardadas aún.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Puedes crear una rutina desde un entrenamiento guardado usando el botón &quot;Establecer como rutina&quot;.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            onUse={() => handleUseRoutine(routine.id)}
            onEdit={() => handleEditRoutine(routine.id)}
            onDelete={() => handleDeleteRoutine(routine.id)}
          />
        ))}
      </div>
    </div>
  );
}










