'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Play, Trash2, Dumbbell, Pencil } from 'lucide-react';
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

interface VariantExerciseSet {
  id: string;
  set_number: number;
  target_reps?: number | null;
  target_weight?: number | null;
  set_type: string;
}

interface VariantExercise {
  id: string;
  order_index: number;
  notes?: string | null;
  exercise?: {
    id: string;
    name: string;
    muscle_groups?: string[];
  };
  variant_exercise_sets?: VariantExerciseSet[];
}

interface RoutineVariant {
  id: string;
  variant_name: string;
  intensity_level: number;
  is_default: boolean;
  variant_exercises?: VariantExercise[];
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
    routine_variants?: RoutineVariant[];
  };
  onUse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RoutineCard({ routine, onUse, onEdit, onDelete }: RoutineCardProps) {
  // Check if this routine uses advanced variants
  const hasVariants = routine.routine_variants && routine.routine_variants.length > 0;
  const hasBasicExercises = routine.routine_exercises && routine.routine_exercises.length > 0;
  
  // Get exercise count - from basic exercises or from variants
  const basicExerciseCount = routine.routine_exercises?.length || 0;
  const variantExerciseCount = hasVariants 
    ? routine.routine_variants!.reduce((acc, v) => 
        Math.max(acc, v.variant_exercises?.length || 0), 0)
    : 0;
  const exerciseCount = basicExerciseCount || variantExerciseCount;
  
  // Get sorted exercises - basic or from default variant
  const sortedExercises = routine.routine_exercises
    ? [...routine.routine_exercises].sort((a, b) => a.order_index - b.order_index)
    : [];
  
  // Get variant exercises (from default variant or first variant)
  const defaultVariant = hasVariants 
    ? routine.routine_variants!.find(v => v.is_default) || routine.routine_variants![0]
    : null;
  const sortedVariantExercises = defaultVariant?.variant_exercises
    ? [...defaultVariant.variant_exercises].sort((a, b) => a.order_index - b.order_index)
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

        {/* Basic exercises */}
        {sortedExercises.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Ejercicios:</p>
            <div className="space-y-2">
              {sortedExercises.slice(0, 5).map((ex, index) => (
                <div key={ex.id || index} className="flex flex-col gap-0.5">
                  <div className="text-sm text-foreground">
                    <span className="text-muted-foreground">#{ex.order_index}</span>{' '}
                    <span className="font-medium">{ex.exercise?.name || 'Ejercicio'}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {ex.default_sets && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {ex.default_sets} series
                      </Badge>
                    )}
                    {ex.default_reps && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {ex.default_reps} reps
                      </Badge>
                    )}
                    {ex.default_weight && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 text-primary border-primary/30">
                        {ex.default_weight} kg
                      </Badge>
                    )}
                  </div>
                  {ex.notes && (
                    <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-1">
                      {ex.notes}
                    </p>
                  )}
                </div>
              ))}
              {sortedExercises.length > 5 && (
                <p className="text-xs text-muted-foreground italic pt-1">
                  +{sortedExercises.length - 5} ejercicio{sortedExercises.length - 5 !== 1 ? 's' : ''} más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Variant exercises (when no basic exercises) */}
        {!hasBasicExercises && sortedVariantExercises.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                Ejercicios {defaultVariant && `(${defaultVariant.variant_name})`}:
              </p>
              {hasVariants && routine.routine_variants!.length > 1 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {routine.routine_variants!.length} variantes
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              {sortedVariantExercises.slice(0, 5).map((ex, index) => {
                // Calculate totals from sets
                const sets = ex.variant_exercise_sets || [];
                const totalSets = sets.length;
                const avgReps = sets.length > 0 
                  ? Math.round(sets.reduce((acc, s) => acc + (s.target_reps || 0), 0) / sets.length)
                  : null;
                const maxWeight = sets.length > 0
                  ? Math.max(...sets.map(s => s.target_weight || 0))
                  : null;
                
                return (
                  <div key={ex.id || index} className="flex flex-col gap-0.5">
                    <div className="text-sm text-foreground">
                      <span className="text-muted-foreground">#{ex.order_index + 1}</span>{' '}
                      <span className="font-medium">{ex.exercise?.name || 'Ejercicio'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {totalSets > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {totalSets} series
                        </Badge>
                      )}
                      {avgReps && avgReps > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          ~{avgReps} reps
                        </Badge>
                      )}
                      {maxWeight && maxWeight > 0 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 text-primary border-primary/30">
                          {maxWeight} kg
                        </Badge>
                      )}
                    </div>
                    {ex.notes && (
                      <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-1">
                        {ex.notes}
                      </p>
                    )}
                  </div>
                );
              })}
              {sortedVariantExercises.length > 5 && (
                <p className="text-xs text-muted-foreground italic pt-1">
                  +{sortedVariantExercises.length - 5} ejercicio{sortedVariantExercises.length - 5 !== 1 ? 's' : ''} más
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
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="shrink-0"
            title="Editar rutina"
          >
            <Pencil className="h-4 w-4" />
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
















