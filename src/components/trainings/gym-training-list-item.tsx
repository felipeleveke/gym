'use client';

import { useState } from 'react';
import { formatDateRelative, formatTime, cn } from '@/lib/utils';
import { Dumbbell, Clock, Tag, ChevronDown, ChevronUp, BookOpen, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MarkdownNotes } from '@/components/ui/markdown-notes';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

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

interface GymTrainingListItemProps {
  training: {
    id: string;
    date: string;
    duration?: number | null;
    notes?: string | null;
    tags?: string[] | null;
    training_exercises?: TrainingExercise[];
  };
  isLast?: boolean;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
}

export function GymTrainingListItem({ 
  training, 
  isLast = false,
  isSelected = false,
  onSelectChange
}: GymTrainingListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRoutineDialog, setShowRoutineDialog] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [routineDescription, setRoutineDescription] = useState('');
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const { toast } = useToast();
  
  const exerciseCount = training.training_exercises?.length || 0;
  const totalSets = training.training_exercises?.reduce(
    (sum, ex) => sum + (ex.exercise_sets?.length || 0),
    0
  ) || 0;

  const sortedExercises = training.training_exercises
    ? [...training.training_exercises].sort((a, b) => a.order_index - b.order_index)
    : [];

  const handleCheckboxChange = (checked: boolean) => {
    onSelectChange?.(checked);
  };

  const handleCreateRoutine = async () => {
    if (!routineName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre de la rutina es requerido',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingRoutine(true);
    try {
      const response = await apiFetch('/api/routines/from-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainingId: training.id,
          name: routineName.trim(),
          description: routineDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la rutina');
      }

      toast({
        title: 'Rutina creada',
        description: `La rutina "${routineName.trim()}" ha sido creada exitosamente.`,
      });

      setShowRoutineDialog(false);
      setRoutineName('');
      setRoutineDescription('');
    } catch (error) {
      console.error('Error creando rutina:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear la rutina',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingRoutine(false);
    }
  };

  return (
    <div className={cn(
      "py-4 hover:bg-accent/50 transition-colors",
      !isLast && "border-b border-border",
      isSelected && "bg-accent/30"
    )}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        {/* Información principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-2">
            {onSelectChange && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 mt-0.5"
              />
            )}
            <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
              <Dumbbell className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-base">Entrenamiento de Gimnasio</h3>
                <div className="text-sm text-muted-foreground">
                  {formatDateRelative(training.date)} a las {formatTime(training.date)}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1 flex-wrap">
                {training.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{training.duration} min</span>
                  </div>
                )}
                {exerciseCount > 0 && (
                  <div className="flex items-center gap-1">
                    <Dumbbell className="h-3.5 w-3.5" />
                    <span>
                      {exerciseCount} ejercicio{exerciseCount !== 1 ? 's' : ''}
                      {totalSets > 0 && ` • ${totalSets} series`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          {training.tags && training.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-8 mt-2">
              {training.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Notas */}
          {training.notes && (
            <div className="mt-2 ml-8 line-clamp-3">
              <MarkdownNotes content={training.notes} />
            </div>
          )}

          {/* Ejercicios expandidos */}
          {isExpanded && sortedExercises.length > 0 && (
            <div className="mt-3 ml-8 space-y-3 pt-3 border-t">
              {sortedExercises.map((ex, index) => (
                <div key={ex.id || index} className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
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
                            {set.rir !== null && set.rir !== undefined && (
                              <span className="text-xs">RIR: {set.rir}</span>
                            )}
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
        </div>

        {/* Botones de acción */}
        {exerciseCount > 0 && (
          <div className="md:shrink-0 flex flex-col sm:flex-row gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full md:w-auto"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Ocultar detalles
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Ver detalles
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoutineDialog(true)}
              className="w-full md:w-auto"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Establecer como rutina
            </Button>
          </div>
        )}
      </div>

      {/* Diálogo para crear rutina */}
      <Dialog open={showRoutineDialog} onOpenChange={setShowRoutineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear rutina desde entrenamiento</DialogTitle>
            <DialogDescription>
              Crea una rutina reutilizable basada en este entrenamiento. Los ejercicios y pesos se guardarán como plantilla.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="routine-name-list">Nombre de la rutina *</Label>
              <Input
                id="routine-name-list"
                placeholder="Ej: Rutina de piernas"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                disabled={isCreatingRoutine}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routine-description-list">Descripción (opcional)</Label>
              <Textarea
                id="routine-description-list"
                placeholder="Descripción de la rutina..."
                value={routineDescription}
                onChange={(e) => setRoutineDescription(e.target.value)}
                disabled={isCreatingRoutine}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRoutineDialog(false);
                setRoutineName('');
                setRoutineDescription('');
              }}
              disabled={isCreatingRoutine}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateRoutine}
              disabled={isCreatingRoutine || !routineName.trim()}
            >
              {isCreatingRoutine && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear rutina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

