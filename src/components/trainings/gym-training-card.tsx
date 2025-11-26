'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDate, formatTime, formatDateRelative } from '@/lib/utils';
import { Dumbbell, Clock, Tag, ChevronDown, ChevronUp, MoreVertical, Edit, Copy, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface ExerciseSet {
  id: string;
  set_number: number;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  rest_time?: number | null;
  rir?: number | null;
}

interface TrainingExercise {
  id: string;
  order_index: number;
  notes?: string | null;
  exercise?: {
    id: string;
    name: string;
    muscle_groups?: string[];
  };
  exercise_sets?: ExerciseSet[];
}

interface GymTrainingCardProps {
  training: {
    id: string;
    date: string;
    duration: number;
    notes?: string | null;
    tags?: string[] | null;
    training_exercises?: TrainingExercise[];
  };
  showDateHeader?: boolean;
}

export function GymTrainingCard({ training, showDateHeader = false }: GymTrainingCardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  
  const exerciseCount = training.training_exercises?.length || 0;
  const totalSets = training.training_exercises?.reduce(
    (sum, ex) => sum + (ex.exercise_sets?.length || 0),
    0
  ) || 0;

  const sortedExercises = training.training_exercises
    ? [...training.training_exercises].sort((a, b) => a.order_index - b.order_index)
    : [];

  const handleEdit = () => {
    router.push(`/trainings/${training.id}/edit`);
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const response = await fetch(`/api/trainings/${training.id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Error al duplicar el entrenamiento');
      }

      toast({
        title: 'Entrenamiento duplicado',
        description: 'El entrenamiento se ha duplicado exitosamente.',
      });

      // Disparar evento para refrescar la lista
      window.dispatchEvent(new Event('training-updated'));
      
      // Recargar la página para mostrar el nuevo entrenamiento
      setTimeout(() => router.refresh(), 500);
    } catch (error) {
      console.error('Error duplicating training:', error);
      toast({
        title: 'Error',
        description: 'No se pudo duplicar el entrenamiento',
        variant: 'destructive',
      });
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/trainings/${training.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el entrenamiento');
      }

      toast({
        title: 'Entrenamiento eliminado',
        description: 'El entrenamiento se ha eliminado exitosamente.',
      });

      // Disparar evento para refrescar la lista
      window.dispatchEvent(new Event('training-updated'));
      
      // Recargar la página para actualizar la lista
      setTimeout(() => router.refresh(), 500);
    } catch (error) {
      console.error('Error deleting training:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el entrenamiento',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-primary/10 text-primary">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">Entrenamiento de Gimnasio</h3>
              {showDateHeader && (
                <p className="text-sm text-muted-foreground">
                  {formatDateRelative(training.date)} a las {formatTime(training.date)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showDateHeader && (
              <div className="text-right">
                <p className="text-sm font-medium">{formatDateRelative(training.date)}</p>
                <p className="text-xs text-muted-foreground">{formatTime(training.date)}</p>
              </div>
            )}
            <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onSelect={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={handleDuplicate} disabled={isDuplicating}>
                    <Copy className="h-4 w-4 mr-2" />
                    {isDuplicating ? 'Duplicando...' : 'Duplicar'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onSelect={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{training.duration} min</span>
          </div>
          {exerciseCount > 0 && (
            <div className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4" />
              <span>
                {exerciseCount} ejercicio{exerciseCount !== 1 ? 's' : ''}
                {totalSets > 0 && ` • ${totalSets} series`}
              </span>
            </div>
          )}
        </div>

        {/* Ejercicios expandidos */}
        {isExpanded && sortedExercises.length > 0 && (
          <div className="space-y-3 pt-2 border-t">
            {sortedExercises.map((ex, index) => (
              <div key={ex.id || index} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{ex.order_index}
                  </span>
                  <span className="font-medium text-sm">{ex.exercise?.name || 'Ejercicio'}</span>
                  {ex.exercise?.muscle_groups && ex.exercise.muscle_groups.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {ex.exercise.muscle_groups[0]}
                    </Badge>
                  )}
                </div>
                {ex.exercise_sets && ex.exercise_sets.length > 0 && (
                  <div className="pl-4 space-y-1">
                    {ex.exercise_sets
                      .sort((a, b) => a.set_number - b.set_number)
                      .map((set) => (
                        <div
                          key={set.id}
                          className="text-xs text-muted-foreground flex items-center gap-2"
                        >
                          <span className="w-6">S{set.set_number}:</span>
                          {set.weight && <span>{set.weight}kg</span>}
                          {set.reps && <span>× {set.reps} reps</span>}
                          {set.rest_time && <span className="text-xs">({set.rest_time}s)</span>}
                          {set.rir !== null && set.rir !== undefined && <span className="text-xs">RIR: {set.rir}</span>}
                        </div>
                      ))}
                  </div>
                )}
                {ex.notes && (
                  <p className="text-xs text-muted-foreground italic pl-4">{ex.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Botón para expandir/colapsar */}
        {exerciseCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Ocultar detalles
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Ver ejercicios y series
              </>
            )}
          </Button>
        )}

        {training.tags && training.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {training.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {training.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">{training.notes}</p>
        )}
      </CardContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrenamiento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este entrenamiento
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

