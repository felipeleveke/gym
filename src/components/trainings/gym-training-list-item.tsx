'use client';

import { useState } from 'react';
import { formatDateRelative, formatTime, cn } from '@/lib/utils';
import { Dumbbell, Clock, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MarkdownNotes } from '@/components/ui/markdown-notes';

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

        {/* Botón para expandir/colapsar */}
        {exerciseCount > 0 && (
          <div className="md:shrink-0">
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
          </div>
        )}
      </div>
    </div>
  );
}

