'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatDate, formatTime, formatDateRelative } from '@/lib/utils';
import { Dumbbell, Clock, Tag, ChevronDown, ChevronUp, BookOpen, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MarkdownNotes } from '@/components/ui/markdown-notes';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    duration?: number | null;
    notes?: string | null;
    tags?: string[] | null;
    training_exercises?: TrainingExercise[];
  };
  showDateHeader?: boolean;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
}

export function GymTrainingCard({ 
  training, 
  showDateHeader = false,
  isSelected = false,
  onSelectChange
}: GymTrainingCardProps) {
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
      const response = await fetch('/api/routines/from-training', {
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
    <Card className={cn(
      "hover:shadow-md transition-shadow",
      isSelected && "ring-2 ring-primary"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {onSelectChange && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                className="shrink-0"
              />
            )}
            <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
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
          {!showDateHeader && (
            <div className="text-right">
              <p className="text-sm font-medium">{formatDateRelative(training.date)}</p>
              <p className="text-xs text-muted-foreground">{formatTime(training.date)}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {training.duration && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{training.duration} min</span>
            </div>
          )}
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
                  <div className="pl-4">
                    <MarkdownNotes content={ex.notes} className="text-xs" />
                  </div>
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
          <div className="line-clamp-3">
            <MarkdownNotes content={training.notes} />
          </div>
        )}

        {/* Botón para establecer como rutina */}
        {exerciseCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRoutineDialog(true)}
            className="w-full"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Establecer como rutina
          </Button>
        )}
      </CardContent>

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
              <Label htmlFor="routine-name">Nombre de la rutina *</Label>
              <Input
                id="routine-name"
                placeholder="Ej: Rutina de piernas"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                disabled={isCreatingRoutine}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routine-description">Descripción (opcional)</Label>
              <Textarea
                id="routine-description"
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
    </Card>
  );
}

