'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronUp, ChevronDown, Calendar, Target, Dumbbell } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface VariantSet {
  id: string;
  set_number: number;
  target_reps?: number;
  target_rir?: number;
  target_weight?: number;
  target_weight_percent?: number;
  set_type: string;
  notes?: string;
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

interface PhaseRoutine {
  id?: string;
  routine_variant_id: string;
  scheduled_at: string;
  notes?: string;
  variantDetail?: RoutineVariantDetail;
}

interface BlockPhase {
  id?: string;
  week_number: number;
  routines: PhaseRoutine[];
}

interface TrainingBlock {
  id?: string;
  name: string;
  block_type: string;
  order_index: number;
  duration_weeks: number;
  phases: BlockPhase[];
}

interface ProgramPreviewPanelProps {
  programName: string;
  programGoal?: string;
  totalWeeks: number;
  blocks: TrainingBlock[];
  variantDetails: Map<string, RoutineVariantDetail>;
}

const BLOCK_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  strength: { bg: 'bg-red-500/20', text: 'text-red-600', border: 'border-red-500' },
  hypertrophy: { bg: 'bg-blue-500/20', text: 'text-blue-600', border: 'border-blue-500' },
  power: { bg: 'bg-yellow-500/20', text: 'text-yellow-600', border: 'border-yellow-500' },
  endurance: { bg: 'bg-green-500/20', text: 'text-green-600', border: 'border-green-500' },
  deload: { bg: 'bg-purple-500/20', text: 'text-purple-600', border: 'border-purple-500' },
  peaking: { bg: 'bg-orange-500/20', text: 'text-orange-600', border: 'border-orange-500' },
  transition: { bg: 'bg-gray-500/20', text: 'text-gray-600', border: 'border-gray-500' },
};

const SET_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  warmup: { label: 'Calentamiento', color: 'bg-orange-500/20 text-orange-600' },
  approach: { label: 'Aproximación', color: 'bg-blue-500/20 text-blue-600' },
  working: { label: 'Trabajo', color: 'bg-green-500/20 text-green-600' },
  backoff: { label: 'Backoff', color: 'bg-purple-500/20 text-purple-600' },
  bilbo: { label: 'Bilbo', color: 'bg-pink-500/20 text-pink-600' },
};

export function ProgramPreviewPanel({
  programName,
  programGoal,
  totalWeeks,
  blocks,
  variantDetails,
}: ProgramPreviewPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getTotalRoutines = () => {
    return blocks.reduce((total, block) => {
      return total + block.phases.reduce((phaseTotal, phase) => {
        return phaseTotal + phase.routines.filter(r => r.routine_variant_id && r.scheduled_at).length;
      }, 0);
    }, 0);
  };

  const getBlockColor = (blockType: string) => {
    return BLOCK_TYPE_COLORS[blockType] || BLOCK_TYPE_COLORS.transition;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const totalRoutines = getTotalRoutines();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:left-auto md:right-4 md:max-w-2xl md:left-1/2 md:-translate-x-1/2">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className="border-t-2 shadow-lg">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base md:text-lg truncate">
                    {programName || 'Programa sin nombre'}
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-1 text-xs md:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                      {totalWeeks} semana{totalWeeks !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3 md:h-4 md:w-4" />
                      {blocks.length} bloque{blocks.length !== 1 ? 's' : ''}
                    </span>
                    {totalRoutines > 0 && (
                      <span className="flex items-center gap-1">
                        <Dumbbell className="h-3 w-3 md:h-4 md:w-4" />
                        {totalRoutines} rutina{totalRoutines !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="max-h-[50vh] overflow-y-auto pb-4">
              {programGoal && (
                <div className="mb-4 p-2 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Objetivo:</strong> {programGoal}
                  </p>
                </div>
              )}

              {/* Timeline de bloques */}
              {blocks.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2">Timeline</h3>
                  <div className="flex gap-1 overflow-x-auto pb-2">
                    {blocks.map((block, index) => {
                      const color = getBlockColor(block.block_type);
                      return (
                        <div
                          key={block.id || `block-${index}`}
                          className={`flex-shrink-0 px-2 py-1 rounded border ${color.bg} ${color.border} ${color.text}`}
                          style={{ minWidth: `${(block.duration_weeks / totalWeeks) * 100}%` }}
                        >
                          <div className="text-xs font-medium truncate">{block.name}</div>
                          <div className="text-[10px] opacity-75">{block.duration_weeks} sem</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator className="my-4" />

              {/* Detalle por semana */}
              {blocks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No hay bloques definidos aún
                </div>
              ) : (
                <div className="space-y-4">
                  {blocks.map((block, blockIndex) => (
                    <div key={block.id || `block-${blockIndex}`} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`${getBlockColor(block.block_type).text} ${getBlockColor(block.block_type).border}`}
                        >
                          Bloque {blockIndex + 1}
                        </Badge>
                        <span className="text-sm font-semibold">{block.name}</span>
                      </div>

                      {block.phases.map((phase, phaseIndex) => {
                        const routinesWithDetails = phase.routines
                          .filter(r => r.routine_variant_id && r.scheduled_at)
                          .map(routine => ({
                            ...routine,
                            variantDetail: variantDetails.get(routine.routine_variant_id),
                          }))
                          .filter(r => r.variantDetail);

                        if (routinesWithDetails.length === 0) return null;

                        return (
                          <Collapsible key={phase.id || `phase-${phaseIndex}`} className="border rounded-md">
                            <CollapsibleTrigger asChild>
                              <div className="w-full p-2 hover:bg-muted/50 transition-colors cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    Semana {phase.week_number}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {routinesWithDetails.length} rutina{routinesWithDetails.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="px-2 pb-2 space-y-3">
                                {routinesWithDetails.map((routine, routineIndex) => {
                                  const variant = routine.variantDetail;
                                  if (!variant) return null;

                                  return (
                                    <div
                                      key={routineIndex}
                                      className="border rounded-md p-3 bg-muted/30"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="font-semibold text-sm truncate">
                                            {variant.workout_routine?.name || 'Rutina'}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {variant.variant_name}
                                          </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                                          {formatDate(routine.scheduled_at)}
                                        </div>
                                      </div>

                                      {variant.variant_exercises && variant.variant_exercises.length > 0 ? (
                                        <div className="mt-2 space-y-2">
                                          {variant.variant_exercises
                                            .sort((a, b) => a.order_index - b.order_index)
                                            .map((exercise) => (
                                              <div
                                                key={exercise.id}
                                                className="bg-background rounded p-2 border"
                                              >
                                                <div className="flex items-start gap-2 mb-1">
                                                  <span className="text-xs font-mono bg-muted px-1 py-0.5 rounded flex-shrink-0">
                                                    #{exercise.order_index}
                                                  </span>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="text-xs font-medium truncate">
                                                      {exercise.exercise.name}
                                                    </div>
                                                    {exercise.exercise.muscle_groups &&
                                                      exercise.exercise.muscle_groups.length > 0 && (
                                                        <div className="flex gap-1 mt-1 flex-wrap">
                                                          {exercise.exercise.muscle_groups.map((mg) => (
                                                            <Badge
                                                              key={mg}
                                                              variant="outline"
                                                              className="text-[10px] h-4 px-1"
                                                            >
                                                              {mg}
                                                            </Badge>
                                                          ))}
                                                        </div>
                                                      )}
                                                  </div>
                                                </div>

                                                {exercise.variant_exercise_sets &&
                                                  exercise.variant_exercise_sets.length > 0 && (
                                                    <div className="mt-2 overflow-x-auto">
                                                      <table className="w-full text-[10px]">
                                                        <thead>
                                                          <tr className="text-muted-foreground text-left border-b">
                                                            <th className="py-1 pr-2">Serie</th>
                                                            <th className="py-1 pr-2">Tipo</th>
                                                            <th className="py-1 pr-2">Reps</th>
                                                            <th className="py-1 pr-2">Peso</th>
                                                            <th className="py-1">RIR</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {exercise.variant_exercise_sets
                                                            .sort((a, b) => a.set_number - b.set_number)
                                                            .map((set) => {
                                                              const typeInfo =
                                                                SET_TYPE_LABELS[set.set_type] || {
                                                                  label: set.set_type,
                                                                  color: 'bg-gray-500/20 text-gray-600',
                                                                };
                                                              return (
                                                                <tr key={set.id} className="border-t">
                                                                  <td className="py-1 pr-2 font-mono">
                                                                    {set.set_number}
                                                                  </td>
                                                                  <td className="py-1 pr-2">
                                                                    <Badge
                                                                      className={`${typeInfo.color} text-[10px] border-0 px-1 py-0`}
                                                                    >
                                                                      {typeInfo.label}
                                                                    </Badge>
                                                                  </td>
                                                                  <td className="py-1 pr-2">
                                                                    {set.target_reps
                                                                      ? `${set.target_reps}`
                                                                      : '-'}
                                                                  </td>
                                                                  <td className="py-1 pr-2">
                                                                    {set.target_weight
                                                                      ? `${set.target_weight}kg`
                                                                      : set.target_weight_percent
                                                                      ? `${set.target_weight_percent}%`
                                                                      : '-'}
                                                                  </td>
                                                                  <td className="py-1">
                                                                    {set.target_rir !== null &&
                                                                    set.target_rir !== undefined
                                                                      ? set.target_rir
                                                                      : '-'}
                                                                  </td>
                                                                </tr>
                                                              );
                                                            })}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  )}
                                              </div>
                                            ))}
                                        </div>
                                      ) : (
                                        <div className="text-xs text-muted-foreground italic mt-2">
                                          Sin ejercicios definidos
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

