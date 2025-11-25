'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseSet {
  id: string;
  set_number: number;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  rest_time?: number | null;
  rir?: number | null;
  notes?: string | null;
}

interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_groups?: string[];
  equipment?: string;
}

interface ExerciseFormProps {
  exercise: Exercise;
  exerciseIndex: number;
  sets: ExerciseSet[];
  notes?: string;
  onUpdateSets: (sets: ExerciseSet[]) => void;
  onUpdateNotes: (notes: string) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function ExerciseForm({
  exercise,
  exerciseIndex,
  sets,
  notes,
  onUpdateSets,
  onUpdateNotes,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: ExerciseFormProps) {
  const addSet = () => {
    const newSet: ExerciseSet = {
      id: `temp-${Date.now()}-${sets.length}`,
      set_number: sets.length + 1,
      weight: null,
      reps: null,
    };
    onUpdateSets([...sets, newSet]);
  };

  const removeSet = (setId: string) => {
    const updatedSets = sets
      .filter((s) => s.id !== setId)
      .map((s, index) => ({ ...s, set_number: index + 1 }));
    onUpdateSets(updatedSets);
  };

  const updateSet = (setId: string, field: keyof ExerciseSet, value: any) => {
    const updatedSets = sets.map((s) =>
      s.id === setId ? { ...s, [field]: value === '' ? null : value } : s
    );
    onUpdateSets(updatedSets);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-move"
                disabled={!canMoveUp}
                onClick={onMoveUp}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-move"
                disabled={!canMoveDown}
                onClick={onMoveDown}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{exercise.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  #{exerciseIndex + 1}
                </Badge>
              </div>
              {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {exercise.muscle_groups.join(', ')}
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Series */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Series</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSet}
              className="h-8"
            >
              <Plus className="h-3 w-3 mr-1" />
              Agregar Serie
            </Button>
          </div>

          {sets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay series. Agrega al menos una serie.
            </p>
          ) : (
            <div className="space-y-2">
              {sets.map((set, index) => (
                <div
                  key={set.id}
                  className="grid grid-cols-12 gap-2 items-end p-2 border rounded-md"
                >
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {set.set_number}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor={`weight-${set.id}`} className="text-xs">
                      Peso (kg)
                    </Label>
                    <Input
                      id={`weight-${set.id}`}
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="0"
                      value={set.weight ?? ''}
                      onChange={(e) =>
                        updateSet(
                          set.id,
                          'weight',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label htmlFor={`reps-${set.id}`} className="text-xs">
                      Reps
                    </Label>
                    <Input
                      id={`reps-${set.id}`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={set.reps ?? ''}
                      onChange={(e) =>
                        updateSet(
                          set.id,
                          'reps',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`rest-${set.id}`} className="text-xs">
                      Descanso (s)
                    </Label>
                    <Input
                      id={`rest-${set.id}`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={set.rest_time ?? ''}
                      onChange={(e) =>
                        updateSet(
                          set.id,
                          'rest_time',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor={`rir-${set.id}`} className="text-xs">
                      RIR (0-10)
                    </Label>
                    <Input
                      id={`rir-${set.id}`}
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      value={set.rir ?? ''}
                      onChange={(e) =>
                        updateSet(
                          set.id,
                          'rir',
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSet(set.id)}
                      className="h-9 w-9"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notas del ejercicio */}
        <div className="space-y-2">
          <Label htmlFor={`exercise-notes-${exercise.id}`}>Notas del ejercicio</Label>
          <Textarea
            id={`exercise-notes-${exercise.id}`}
            placeholder="Notas sobre este ejercicio..."
            rows={2}
            value={notes || ''}
            onChange={(e) => onUpdateNotes(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

