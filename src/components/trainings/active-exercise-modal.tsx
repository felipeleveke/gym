'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  set_type?: 'warmup' | 'approach' | 'working' | 'bilbo' | null;
  theoretical_one_rm?: number | null;
  percentage_one_rm?: number | null;
}

interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_groups?: string[];
  equipment?: string;
}

interface ActiveExerciseModalProps {
  open: boolean;
  exercise: Exercise | null;
  set: ExerciseSet | null;
  exerciseSeconds: number;
  onUpdateSet: (setId: string, field: keyof ExerciseSet, value: any) => void;
  onStop: () => void;
}

export function ActiveExerciseModal({
  open,
  exercise,
  set,
  exerciseSeconds,
  onUpdateSet,
  onStop,
}: ActiveExerciseModalProps) {
  const [localReps, setLocalReps] = useState<string>('');
  const [localRir, setLocalRir] = useState<string>('');
  const [localNotes, setLocalNotes] = useState<string>('');

  // Sincronizar con los valores del set cuando cambia (solo cuando cambia el set.id para evitar loops)
  useEffect(() => {
    if (set) {
      setLocalReps(set.reps?.toString() || '');
      setLocalRir(set.rir?.toString() || '');
      setLocalNotes(set.notes || '');
    }
  }, [set?.id]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canStop = () => {
    const repsNum = parseInt(localReps);
    const rirNum = localRir !== '' ? parseInt(localRir) : null;
    return repsNum > 0 && rirNum !== null && rirNum !== undefined;
  };

  const handleStop = () => {
    if (!set) return;
    
    // Los valores ya están actualizados en tiempo real, solo detener el ejercicio
    onStop();
  };

  if (!exercise || !set) {
    return null;
  }

  return (
    <Dialog open={open} modal={true}>
      <DialogContent 
        className={cn(
          "max-w-[98vw] max-h-[98vh] w-[98vw] h-[98vh]",
          "flex flex-col gap-6 p-6 sm:p-8",
          "border-0 bg-background rounded-lg",
          "!translate-x-[-50%] !translate-y-[-50%] !left-[50%] !top-[50%]",
          "!fixed overflow-hidden"
        )}
        style={{
          maxWidth: '98vw',
          maxHeight: '98vh',
          width: '98vw',
          height: '98vh',
        }}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center justify-center flex-1 gap-8 sm:gap-12 overflow-y-auto overflow-x-hidden min-h-0 w-full">
          {/* Nombre del ejercicio */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {exercise.name}
            </h2>
            {set.weight && (
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground">
                {set.weight} kg
                {set.theoretical_one_rm && set.percentage_one_rm && (
                  <span className="text-base sm:text-lg md:text-xl ml-2 opacity-80">
                    ({Math.round(set.percentage_one_rm)}% del 1RM: {Math.round(set.theoretical_one_rm)}kg)
                  </span>
                )}
              </p>
            )}
            {set.set_number && (
              <p className="text-sm sm:text-base text-muted-foreground">
                Serie #{set.set_number}
              </p>
            )}
          </div>

          {/* Cronómetro grande */}
          <div className="text-center space-y-2">
            <Label className="text-sm sm:text-base text-muted-foreground">
              Tiempo de ejercicio
            </Label>
            <div className="text-6xl sm:text-7xl md:text-8xl font-mono font-bold text-primary">
              {formatTime(exerciseSeconds)}
            </div>
          </div>

          {/* Campos de entrada */}
          <div className="w-full max-w-md space-y-6">
            {/* Reps */}
            <div className="space-y-2">
              <Label htmlFor="modal-reps" className="text-base sm:text-lg font-semibold">
                Repeticiones *
              </Label>
              <Input
                id="modal-reps"
                type="number"
                min="0"
                placeholder="Ingresa las repeticiones"
                value={localReps}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalReps(value);
                  // Actualizar en tiempo real
                  if (set) {
                    const repsNum = value ? parseInt(value) : null;
                    onUpdateSet(set.id, 'reps', repsNum);
                  }
                }}
                className="h-12 sm:h-14 text-lg sm:text-xl text-center"
                autoFocus
              />
            </div>

            {/* RIR */}
            <div className="space-y-2">
              <Label htmlFor="modal-rir" className="text-base sm:text-lg font-semibold">
                RIR (Reps In Reserve) *
              </Label>
              <Input
                id="modal-rir"
                type="number"
                min="0"
                max="10"
                placeholder="0-10"
                value={localRir}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalRir(value);
                  // Actualizar en tiempo real
                  if (set) {
                    const rirNum = value !== '' ? parseInt(value) : null;
                    onUpdateSet(set.id, 'rir', rirNum);
                  }
                }}
                className="h-12 sm:h-14 text-lg sm:text-xl text-center"
              />
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="modal-notes" className="text-base sm:text-lg font-semibold">
                Notas (opcional)
              </Label>
              <Textarea
                id="modal-notes"
                placeholder="Anota cualquier observación..."
                value={localNotes}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocalNotes(value);
                  // Actualizar en tiempo real
                  if (set) {
                    onUpdateSet(set.id, 'notes', value.trim() || null);
                  }
                }}
                className="min-h-[100px] sm:min-h-[120px] text-base sm:text-lg resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Botón para detener */}
          <div className="w-full max-w-md">
            <Button
              onClick={handleStop}
              disabled={!canStop()}
              size="lg"
              className="w-full h-14 sm:h-16 text-lg sm:text-xl font-semibold"
            >
              Detener Ejercicio
            </Button>
            {!canStop() && (
              <p className="text-sm text-muted-foreground text-center mt-2">
                Ingresa repeticiones y RIR para detener el ejercicio
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

