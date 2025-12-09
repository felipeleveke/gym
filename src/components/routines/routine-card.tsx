'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Trash2, Dumbbell } from 'lucide-react';
import { formatDateRelative } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

interface RoutineCardProps {
  routine: {
    id: string;
    name: string;
    description?: string | null;
    type: 'gym' | 'sport' | 'cardio' | 'flexibility' | 'other';
    duration?: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    routine_exercises?: RoutineExercise[];
  };
  onUse: () => void;
  onDelete: () => void;
}

export function RoutineCard({ routine, onUse, onDelete }: RoutineCardProps) {
  const exerciseCount = routine.routine_exercises?.length || 0;
  const sortedExercises = routine.routine_exercises
    ? [...routine.routine_exercises].sort((a, b) => a.order_index - b.order_index)
    : [];

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{routine.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Creada {formatDateRelative(routine.created_at)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {routine.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {routine.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {routine.duration && (
            <div className="flex items-center gap-1">
              <span>{routine.duration} min</span>
            </div>
          )}
          {exerciseCount > 0 && (
            <div className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4" />
              <span>
                {exerciseCount} ejercicio{exerciseCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {sortedExercises.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Ejercicios:</p>
            <div className="space-y-1">
              {sortedExercises.slice(0, 3).map((ex, index) => (
                <div key={ex.id || index} className="text-xs text-muted-foreground">
                  <span className="font-medium">#{ex.order_index}</span> {ex.exercise?.name || 'Ejercicio'}
                  {ex.default_weight && (
                    <span className="ml-2 text-primary font-medium">
                      ({ex.default_weight}kg)
                    </span>
                  )}
                </div>
              ))}
              {sortedExercises.length > 3 && (
                <p className="text-xs text-muted-foreground italic">
                  +{sortedExercises.length - 3} ejercicio{sortedExercises.length - 3 !== 1 ? 's' : ''} más
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            onClick={onUse}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            Usar rutina
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar rutina?</AlertDialogTitle>
                <AlertDialogDescription>
                  Estás a punto de eliminar la rutina <strong>&quot;{routine.name}&quot;</strong>. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}










