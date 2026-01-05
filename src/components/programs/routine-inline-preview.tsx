'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

interface VariantSet {
  id: string;
  set_number: number;
  target_reps?: number;
  target_rir?: number;
  target_weight?: number;
  target_weight_percent?: number;
  set_type: string;
}

interface VariantExercise {
  id: string;
  order_index: number;
  notes?: string;
  exercise: {
    id: string;
    name: string;
    muscle_groups?: string[];
  };
  variant_exercise_sets: VariantSet[];
}

interface RoutineVariantDetail {
  id: string;
  variant_name: string;
  intensity_level: number;
  workout_routine?: {
    id: string;
    name: string;
  };
  variant_exercises?: VariantExercise[];
}

interface RoutineInlinePreviewProps {
  variantId: string;
  variantDetails: Map<string, RoutineVariantDetail>;
  isLoading?: boolean;
}

const SET_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  warmup: { label: 'Cal', color: 'bg-orange-500/20 text-orange-600' },
  approach: { label: 'Apr', color: 'bg-blue-500/20 text-blue-600' },
  working: { label: 'Trab', color: 'bg-green-500/20 text-green-600' },
  backoff: { label: 'Back', color: 'bg-purple-500/20 text-purple-600' },
  bilbo: { label: 'Bilbo', color: 'bg-pink-500/20 text-pink-600' },
};

export function RoutineInlinePreview({
  variantId,
  variantDetails,
  isLoading = false,
}: RoutineInlinePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const variant = variantDetails.get(variantId);

  if (!variantId) {
    return null;
  }

  if (isLoading || !variant) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Cargando detalles...</span>
      </div>
    );
  }

  const exercises = variant.variant_exercises || [];

  if (exercises.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic py-1">
        Sin ejercicios definidos
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          {isOpen ? (
            <ChevronDown className="h-3 w-3 mr-1" />
          ) : (
            <ChevronRight className="h-3 w-3 mr-1" />
          )}
          {exercises.length} ejercicio{exercises.length !== 1 ? 's' : ''}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-3 border-l-2 border-primary/20 pl-3">
          {exercises
            .sort((a, b) => a.order_index - b.order_index)
            .map((exercise, index) => (
              <div key={exercise.id} className="text-xs bg-muted/30 rounded p-2">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-muted-foreground w-5 flex-shrink-0 font-semibold">
                    {index + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{exercise.exercise.name}</div>
                    {exercise.exercise.muscle_groups && exercise.exercise.muscle_groups.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {exercise.exercise.muscle_groups.slice(0, 3).map((mg) => (
                          <Badge
                            key={mg}
                            variant="outline"
                            className="text-[9px] h-4 px-1 py-0"
                          >
                            {mg}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {exercise.notes && (
                      <div className="mt-1 text-[10px] text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 rounded px-1.5 py-0.5 border border-yellow-500/20">
                        📝 {exercise.notes}
                      </div>
                    )}
                    {exercise.variant_exercise_sets && exercise.variant_exercise_sets.length > 0 ? (
                      <div className="mt-1.5 space-y-0.5">
                        <div className="text-[10px] text-muted-foreground font-medium mb-1">
                          Series:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {exercise.variant_exercise_sets
                            .sort((a, b) => a.set_number - b.set_number)
                            .map((set) => {
                              const typeInfo = SET_TYPE_LABELS[set.set_type] || {
                                label: set.set_type?.slice(0, 3) || '?',
                                color: 'bg-gray-500/20 text-gray-600',
                              };
                              const weight = set.target_weight
                                ? `${set.target_weight}kg`
                                : set.target_weight_percent
                                ? `${set.target_weight_percent}%`
                                : '';
                              const reps = set.target_reps ? `${set.target_reps}` : '-';
                              const rir = set.target_rir !== null && set.target_rir !== undefined
                                ? `@${set.target_rir}`
                                : '';
                              
                              return (
                                <span
                                  key={set.id}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] ${typeInfo.color} border border-current/20`}
                                  title={`Serie ${set.set_number}: ${typeInfo.label}`}
                                >
                                  <span className="font-semibold text-[9px] opacity-60">
                                    {set.set_number}
                                  </span>
                                  <span className="font-medium">{reps}r</span>
                                  {weight && (
                                    <>
                                      <span className="opacity-50">×</span>
                                      <span className="font-medium">{weight}</span>
                                    </>
                                  )}
                                  {rir && <span className="opacity-75 font-medium">{rir}</span>}
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 text-[10px] text-muted-foreground italic">
                        Sin series definidas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

