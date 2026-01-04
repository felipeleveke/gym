'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { ExerciseSelector } from '@/components/trainings/exercise-selector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_groups?: string[];
}

interface VariantSet {
  id?: string;
  set_number: number;
  target_reps: number | null;
  target_rir: number | null;
  target_rpe: number | null; // Rate of Perceived Exertion (6-10)
  target_weight_percent: number | null;
  target_weight: number | null;
  target_tut: string | null; // Time Under Tension (ej: "3-1-2-0")
  rest_seconds: number | null; // Descanso después de esta serie
  theoretical_one_rm?: number | null; // Calculated 1RM (not stored in DB, computed on the fly)
  set_type: 'warmup' | 'approach' | 'working' | 'backoff' | 'bilbo';
  notes?: string;
}

interface VariantExercise {
  id?: string;
  exercise: Exercise;
  order_index: number;
  notes?: string;
  rest_after_exercise?: number | null; // Descanso después del ejercicio en segundos
  sets: VariantSet[];
}

interface RoutineVariant {
  id?: string;
  variant_name: string;
  intensity_level: number;
  description?: string;
  is_default: boolean;
  exercises: VariantExercise[];
}

interface VariantEditorProps {
  variant: RoutineVariant;
  onChange: (variant: RoutineVariant) => void;
  onDelete?: () => void;
  onClone?: () => void;
  isReadOnly?: boolean;
}

const SET_TYPES = [
  { value: 'warmup', label: 'Calentamiento', color: 'bg-yellow-500/20 text-yellow-600' },
  { value: 'approach', label: 'Aproximación', color: 'bg-blue-500/20 text-blue-600' },
  { value: 'working', label: 'Trabajo', color: 'bg-green-500/20 text-green-600' },
  { value: 'backoff', label: 'Backoff', color: 'bg-orange-500/20 text-orange-600' },
  { value: 'bilbo', label: 'Bilbo', color: 'bg-purple-500/20 text-purple-600' },
];

const INTENSITY_LEVELS = [
  { value: 1, label: 'Muy Baja', description: 'Recuperación/Descarga' },
  { value: 2, label: 'Baja', description: 'Descarga activa' },
  { value: 3, label: 'Baja-Media', description: 'Semana easy' },
  { value: 4, label: 'Media-Baja', description: 'Volumen bajo' },
  { value: 5, label: 'Media', description: 'Trabajo normal' },
  { value: 6, label: 'Media-Alta', description: 'Progresión estándar' },
  { value: 7, label: 'Alta', description: 'Trabajo intenso' },
  { value: 8, label: 'Muy Alta', description: 'Semana pesada' },
  { value: 9, label: 'Máxima', description: 'Cerca del máximo' },
  { value: 10, label: 'Peaking', description: 'Máximo rendimiento' },
];

export function VariantEditor({
  variant,
  onChange,
  onDelete,
  onClone,
  isReadOnly = false,
}: VariantEditorProps) {
  const { toast } = useToast();
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  const updateVariant = (updates: Partial<RoutineVariant>) => {
    onChange({ ...variant, ...updates });
  };

  const handleAddExercise = (exercise: Exercise) => {
    const newExercise: VariantExercise = {
      exercise,
      order_index: variant.exercises.length,
      rest_after_exercise: 120,
          sets: [
        {
          set_number: 1,
          target_reps: 10,
          target_rir: 2,
          target_rpe: null,
          target_weight_percent: null, // Will be calculated when weight is entered
          target_weight: null,
          target_tut: null,
          rest_seconds: 90,
          set_type: 'working',
        },
      ],
    };
    updateVariant({ exercises: [...variant.exercises, newExercise] });
    setShowExerciseSelector(false);
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = variant.exercises.filter((_, i) => i !== index);
    newExercises.forEach((ex, i) => (ex.order_index = i));
    updateVariant({ exercises: newExercises });
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...variant.exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newExercises.length) {
      [newExercises[index], newExercises[targetIndex]] = [
        newExercises[targetIndex],
        newExercises[index],
      ];
      newExercises.forEach((ex, i) => (ex.order_index = i));
      updateVariant({ exercises: newExercises });
    }
  };

  const handleUpdateExercise = (index: number, updates: Partial<VariantExercise>) => {
    const newExercises = [...variant.exercises];
    newExercises[index] = { ...newExercises[index], ...updates };
    updateVariant({ exercises: newExercises });
  };

  const handleAddSet = (exerciseIndex: number) => {
    const exercise = variant.exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet: VariantSet = {
      set_number: exercise.sets.length + 1,
      target_reps: lastSet?.target_reps || 10,
      target_rir: lastSet?.target_rir || 2,
      target_rpe: lastSet?.target_rpe || null,
      target_weight_percent: null, // Will be calculated when weight and reps are both present
      target_weight: lastSet?.target_weight || null,
      target_tut: lastSet?.target_tut || null,
      rest_seconds: lastSet?.rest_seconds || 90,
      set_type: lastSet?.set_type || 'working',
    };
    // If the new set has both weight and reps, calculate %RM immediately
    if (newSet.target_weight && newSet.target_weight > 0 && newSet.target_reps && newSet.target_reps > 0) {
      const oneRm = (newSet.target_weight * newSet.target_reps * 0.03) + newSet.target_weight;
      const percentage = (newSet.target_weight / oneRm) * 100;
      newSet.target_weight_percent = parseFloat(percentage.toFixed(2));
    }
    handleUpdateExercise(exerciseIndex, { sets: [...exercise.sets, newSet] });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = variant.exercises[exerciseIndex];
    const newSets = exercise.sets.filter((_, i) => i !== setIndex);
    newSets.forEach((set, i) => (set.set_number = i + 1));
    handleUpdateExercise(exerciseIndex, { sets: newSets });
  };

  const handleUpdateSet = (
    exerciseIndex: number,
    setIndex: number,
    updates: Partial<VariantSet>
  ) => {
    const exercise = variant.exercises[exerciseIndex];
    const currentSet = exercise.sets[setIndex];
    
    // Get the values that will be used (updated values or current values)
    const reps = updates.target_reps !== undefined ? updates.target_reps : currentSet.target_reps;
    const weight = updates.target_weight !== undefined ? updates.target_weight : currentSet.target_weight;
    
    // Auto-calc %RM and 1RM when reps or weight change (same logic as exercise-form.tsx)
    if (updates.target_reps !== undefined || updates.target_weight !== undefined) {
      // Only calculate if we have BOTH weight and reps (same as training screen)
      if (weight && weight > 0 && reps && reps > 0) {
        // Formula: (Weight x Reps x 0.03) + Weight
        const oneRm = (weight * reps * 0.03) + weight;
        // Percentage: Weight / 1RM * 100
        const percentage = (weight / oneRm) * 100;
        
        // Use same precision as exercise-form.tsx (2 decimal places)
        updates.target_weight_percent = parseFloat(percentage.toFixed(2));
        updates.theoretical_one_rm = parseFloat(oneRm.toFixed(2));
      } else {
        // Clear percentage and 1RM if missing weight or reps
        updates.target_weight_percent = null;
        updates.theoretical_one_rm = null;
      }
    }

    const newSets = [...exercise.sets];
    newSets[setIndex] = { ...newSets[setIndex], ...updates };
    handleUpdateExercise(exerciseIndex, { sets: newSets });
  };

  const getSetTypeInfo = (type: string) => {
    return SET_TYPES.find((t) => t.value === type) || SET_TYPES[2];
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={variant.variant_name}
                onChange={(e) => updateVariant({ variant_name: e.target.value })}
                placeholder="Nombre de la variante (ej: A, B, C)"
                className="font-semibold text-lg max-w-[200px]"
                disabled={isReadOnly}
              />
              {variant.is_default && (
                <Badge variant="secondary">Por Defecto</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Intensidad:</Label>
                <Select
                  value={variant.intensity_level.toString()}
                  onValueChange={(v) => updateVariant({ intensity_level: parseInt(v) })}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENSITY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value.toString()}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{level.value}</span>
                          <span className="text-muted-foreground">- {level.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                value={variant.description || ''}
                onChange={(e) => updateVariant({ description: e.target.value })}
                placeholder="Descripción (opcional)"
                className="flex-1 min-w-[200px]"
                disabled={isReadOnly}
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onClone && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClone}
                title="Duplicar variante"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="text-destructive hover:bg-destructive/10"
                title="Eliminar variante"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {variant.exercises.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
            <p>No hay ejercicios en esta variante.</p>
            {!isReadOnly && (
              <Button
                type="button"
                variant="link"
                onClick={() => setShowExerciseSelector(true)}
              >
                Agregar ejercicio
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {variant.exercises.map((exercise, exIndex) => (
              <div
                key={exercise.id || `ex-${exIndex}`}
                className="border rounded-lg p-4 bg-muted/20"
              >
                <div className="flex items-start gap-3 mb-4">
                  {!isReadOnly && (
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={exIndex === 0}
                        onClick={() => handleMoveExercise(exIndex, 'up')}
                        className="h-6 w-6"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-center text-muted-foreground font-mono">
                        {exIndex + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={exIndex === variant.exercises.length - 1}
                        onClick={() => handleMoveExercise(exIndex, 'down')}
                        className="h-6 w-6"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{exercise.exercise.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {exercise.exercise.muscle_groups?.join(', ')}
                        </p>
                      </div>
                      {!isReadOnly && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <Label className="text-xs text-muted-foreground whitespace-nowrap">Descanso post-ejercicio:</Label>
                            <Input
                              type="number"
                              min="0"
                              step="5"
                              value={exercise.rest_after_exercise || ''}
                              onChange={(e) =>
                                handleUpdateExercise(exIndex, {
                                  rest_after_exercise: e.target.value ? parseInt(e.target.value) : null,
                                })
                              }
                              className="h-8 w-20 text-center"
                              placeholder="120"
                            />
                            <span className="text-xs text-muted-foreground">seg</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveExercise(exIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Sets table */}
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground border-b">
                            <th className="text-left py-2 px-1 w-12">#</th>
                            <th className="text-left py-2 px-1">Tipo</th>
                            <th className="text-center py-2 px-1">Peso (kg)</th>
                            <th className="text-center py-2 px-1">Reps</th>
                            <th className="text-center py-2 px-1">RIR</th>
                            <th className="text-center py-2 px-1">% 1RM</th>
                            <th className="text-center py-2 px-1">1RM</th>
                            <th className="text-center py-2 px-1">RPE</th>
                            <th className="text-center py-2 px-1">TUT</th>
                            <th className="text-center py-2 px-1">Descanso</th>
                            {!isReadOnly && <th className="w-10"></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {exercise.sets.map((set, setIndex) => {
                            const setTypeInfo = getSetTypeInfo(set.set_type);
                            return (
                              <tr key={set.id || `set-${setIndex}`} className="border-b last:border-0">
                                <td className="py-2 px-1 font-mono text-muted-foreground">
                                  {set.set_number}
                                </td>
                                <td className="py-2 px-1">
                                  {isReadOnly ? (
                                    <Badge className={setTypeInfo.color}>
                                      {setTypeInfo.label}
                                    </Badge>
                                  ) : (
                                    <Select
                                      value={set.set_type}
                                      onValueChange={(v) =>
                                        handleUpdateSet(exIndex, setIndex, {
                                          set_type: v as any,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-8 w-[130px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SET_TYPES.map((type) => (
                                          <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </td>
                                <td className="py-2 px-1 text-center">
                                  {isReadOnly ? (
                                    set.target_weight || '-'
                                  ) : (
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.5"
                                      value={set.target_weight || ''}
                                      onChange={(e) =>
                                        handleUpdateSet(exIndex, setIndex, {
                                          target_weight: e.target.value
                                            ? parseFloat(e.target.value)
                                            : null,
                                        })
                                      }
                                      className="h-8 w-20 text-center"
                                      placeholder="-"
                                    />
                                  )}
                                </td>
                                <td className="py-2 px-1 text-center">
                                  {isReadOnly ? (
                                    set.target_reps || '-'
                                  ) : (
                                    <Input
                                      type="number"
                                      min="1"
                                      value={set.target_reps || ''}
                                      onChange={(e) =>
                                        handleUpdateSet(exIndex, setIndex, {
                                          target_reps: e.target.value
                                            ? parseInt(e.target.value)
                                            : null,
                                        })
                                      }
                                      className="h-8 w-16 text-center"
                                      placeholder="-"
                                    />
                                  )}
                                </td>
                                <td className="py-2 px-1 text-center">
                                  {isReadOnly ? (
                                    set.target_rir !== null ? set.target_rir : '-'
                                  ) : (
                                    <Select
                                      value={set.target_rir?.toString() || ''}
                                      onValueChange={(v) =>
                                        handleUpdateSet(exIndex, setIndex, {
                                          target_rir: v ? parseInt(v) : null,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-8 w-16">
                                        <SelectValue placeholder="-" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[0, 1, 2, 3, 4, 5].map((rir) => (
                                          <SelectItem key={rir} value={rir.toString()}>
                                            {rir}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </td>
                                <td className="py-2 px-1 text-center">
                                  {isReadOnly ? (
                                    set.target_weight_percent
                                      ? `${parseFloat(set.target_weight_percent.toString()).toFixed(2)}%`
                                      : '-'
                                  ) : (
                                    <Input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={set.target_weight_percent !== null && set.target_weight_percent !== undefined 
                                        ? parseFloat(set.target_weight_percent.toString()).toFixed(2) 
                                        : ''}
                                      readOnly
                                      disabled
                                      className="h-8 w-20 text-center bg-muted"
                                      placeholder="Auto"
                                    />
                                  )}
                                </td>
                                <td className="py-2 px-1 text-center">
                                  {(() => {
                                    // Calculate 1RM if we have weight and reps
                                    let oneRm = set.theoretical_one_rm;
                                    if (!oneRm && set.target_weight && set.target_weight > 0 && set.target_reps && set.target_reps > 0) {
                                      oneRm = (set.target_weight * set.target_reps * 0.03) + set.target_weight;
                                    }
                                    return oneRm ? (
                                      <span className="text-sm font-mono text-muted-foreground">
                                        {Math.round(oneRm)}kg
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    );
                                  })()}
                                </td>
                                {/* RPE */}
                                <td className="py-2 px-1 text-center">
                                  {isReadOnly ? (
                                    set.target_rpe !== null ? set.target_rpe : '-'
                                  ) : (
                                    <Select
                                      value={set.target_rpe?.toString() || ''}
                                      onValueChange={(v) =>
                                        handleUpdateSet(exIndex, setIndex, {
                                          target_rpe: v ? parseFloat(v) : null,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="h-8 w-16">
                                        <SelectValue placeholder="-" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((rpe) => (
                                          <SelectItem key={rpe} value={rpe.toString()}>
                                            {rpe}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </td>
                                {/* TUT */}
                                <td className="py-2 px-1 text-center">
                                  {isReadOnly ? (
                                    set.target_tut || '-'
                                  ) : (
                                    <Input
                                      value={set.target_tut || ''}
                                      onChange={(e) =>
                                        handleUpdateSet(exIndex, setIndex, {
                                          target_tut: e.target.value || null,
                                        })
                                      }
                                      className="h-8 w-24 text-center"
                                      placeholder="3-1-2-0"
                                    />
                                  )}
                                </td>
                                {/* Descanso */}
                                <td className="py-2 px-1 text-center">
                                  {isReadOnly ? (
                                    set.rest_seconds !== null ? `${set.rest_seconds}s` : '-'
                                  ) : (
                                    <Input
                                      type="number"
                                      min="0"
                                      step="5"
                                      value={set.rest_seconds || ''}
                                      onChange={(e) =>
                                        handleUpdateSet(exIndex, setIndex, {
                                          rest_seconds: e.target.value ? parseInt(e.target.value) : null,
                                        })
                                      }
                                      className="h-8 w-16 text-center"
                                      placeholder="90"
                                    />
                                  )}
                                </td>
                                {!isReadOnly && (
                                  <td className="py-2 px-1">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                      onClick={() => handleRemoveSet(exIndex, setIndex)}
                                      disabled={exercise.sets.length === 1}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSet(exIndex)}
                        className="mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar serie
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isReadOnly && variant.exercises.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowExerciseSelector(true)}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Ejercicio
          </Button>
        )}
      </CardContent>

      {showExerciseSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <ExerciseSelector
            onSelect={handleAddExercise}
            onClose={() => setShowExerciseSelector(false)}
          />
        </div>
      )}
    </Card>
  );
}
