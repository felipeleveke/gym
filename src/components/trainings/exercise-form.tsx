'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GripVertical, Trash2, Plus, X, Loader2, Info, ChevronDown, ChevronUp, History, Pencil } from 'lucide-react';
import { ExerciseHistoryModal } from './exercise-history-modal';
import { cn } from '@/lib/utils';
import { SetTimer } from './set-timer';
import { EditableMarkdown } from '@/components/ui/editable-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type SetType = 'warmup' | 'approach' | 'working' | 'bilbo';

interface ExerciseSet {
  id: string;
  set_number: number;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  rest_time?: number | null;
  rir?: number | null;
  rpe?: number | null;
  notes?: string | null;
  set_type?: SetType | null;
  theoretical_one_rm?: number | null;
  percentage_one_rm?: number | null;
  // Campos de temporización desde la rutina
  target_tut?: number | null; // Tiempo bajo tensión objetivo (cuenta regresiva al iniciar)
  target_rest?: number | null; // Descanso entre series objetivo
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
  isLastExercise: boolean;
  defaultRestTime?: number;
  restAfterExercise?: number | null;
  isGeneratingSummary?: boolean;
  globalActiveSetId?: string | null;
  globalRestingSetId?: string | null;
  onGlobalSetStart?: (setId: string) => void;
  onGlobalSetStop?: () => void;
  onGlobalSetRest?: (setId: string) => void;
  onGlobalSetComplete?: () => void;
  onUpdateSets: (sets: ExerciseSet[]) => void;
  onUpdateNotes: (notes: string) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onTrainingComplete?: () => void;
  onFirstExerciseStart?: () => void;
  onActiveSetExerciseTimeUpdate?: (seconds: number) => void;
  onTutStateUpdate?: (isTutMode: boolean, countdown: number) => void;
  onSetCompleteFromModal?: (setId: string) => void;
  setToCompleteFromModal?: string | null;
  previousMarks?: {
    lastWeight?: number | null;
    lastReps?: number | null;
    bestWeight?: number | null;
    bestReps?: number | null;
  };
  previousSetMarks?: Record<number, {
    lastWeight?: number | null;
    lastReps?: number | null;
    lastRir?: number | null;
    lastNotes?: string | null;
    bestWeight?: number | null;
  }>;
}

export function ExerciseForm({
  exercise,
  exerciseIndex,
  sets,
  notes,
  isLastExercise,
  defaultRestTime = 60,
  restAfterExercise,
  isGeneratingSummary = false,
  globalActiveSetId,
  globalRestingSetId,
  onGlobalSetStart,
  onGlobalSetStop,
  onGlobalSetRest,
  onGlobalSetComplete,
  onUpdateSets,
  onUpdateNotes,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onTrainingComplete,
  onFirstExerciseStart,
  onActiveSetExerciseTimeUpdate,
  onTutStateUpdate,
  onSetCompleteFromModal,
  setToCompleteFromModal,
  previousMarks,
  previousSetMarks,
}: ExerciseFormProps) {
  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [restingSetId, setRestingSetId] = useState<string | null>(null);
  const [completedSetIds, setCompletedSetIds] = useState<Set<string>>(new Set());
  const [collapsedSetIds, setCollapsedSetIds] = useState<Set<string>>(new Set());
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [exerciseCollapsed, setExerciseCollapsed] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Expandir notas automáticamente si tienen contenido o se está generando resumen
  useEffect(() => {
    if ((notes && notes.trim().length > 0) || isGeneratingSummary) {
      setNotesExpanded(true);
    }
  }, [notes, isGeneratingSummary]);

  // Efecto para completar serie cuando se solicita desde el modal
  useEffect(() => {
    if (setToCompleteFromModal && !completedSetIds.has(setToCompleteFromModal)) {
      handleSetComplete(setToCompleteFromModal);
      onSetCompleteFromModal?.(setToCompleteFromModal);
    }
  }, [setToCompleteFromModal, completedSetIds]);

  // Sincronizar restingSetId local con globalRestingSetId
  useEffect(() => {
    if (globalRestingSetId) {
      // Verificar si alguna serie de este ejercicio está en descanso
      const setInRest = sets.find(set => set.id === globalRestingSetId);
      if (setInRest) {
        // Si la serie está en descanso globalmente, actualizar estado local
        setRestingSetId(globalRestingSetId);
        // Asegurarse de que no esté marcada como activa
        if (activeSetId === globalRestingSetId) {
          setActiveSetId(null);
        }
      }
    } else {
      // Si no hay serie en descanso globalmente, limpiar estado local
      // pero solo si no está completada (para no interferir con series completadas)
      if (restingSetId) {
        const restingSet = sets.find(set => set.id === restingSetId);
        if (restingSet && !completedSetIds.has(restingSetId)) {
          // Solo limpiar si la serie no está completada
          // El descanso puede continuar aunque globalRestingSetId sea null
          // si el usuario quiere seguir descansando
        }
      }
    }
  }, [globalRestingSetId, sets, activeSetId, restingSetId, completedSetIds]);

  const addSet = () => {
    const newSet: ExerciseSet = {
      id: `temp-${Date.now()}-${sets.length}`,
      set_number: sets.length + 1,
      weight: null,
      reps: null,
      set_type: 'working',
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
    const updatedSets = sets.map((s) => {
      if (s.id !== setId) return s;

      const updatedSet = { ...s, [field]: value === '' ? null : value };
      
      // Calculate 1RM and % if weight or reps change
      if (field === 'weight' || field === 'reps') {
        const weight = field === 'weight' ? (value === '' ? null : Number(value)) : s.weight;
        const reps = field === 'reps' ? (value === '' ? null : Number(value)) : s.reps;

        if (weight && reps && reps > 0) {
          // Formula: (Weight x Reps x 0.03) + Weight
          const oneRm = (weight * reps * 0.03) + weight;
          // Percentage: Weight / 1RM
          // Which simplifies to 1 / (1 + 0.03 * reps)
          const percentage = (weight / oneRm) * 100;
          
          updatedSet.theoretical_one_rm = parseFloat(oneRm.toFixed(2));
          updatedSet.percentage_one_rm = parseFloat(percentage.toFixed(2));
        } else {
          updatedSet.theoretical_one_rm = null;
          updatedSet.percentage_one_rm = null;
        }
      }
      
      return updatedSet;
    });
    onUpdateSets(updatedSets);
  };

  const handleSetStart = (setId: string) => {
    // Notificar al componente padre que se inicia una serie globalmente
    onGlobalSetStart?.(setId);
    
    // Si es el primer ejercicio y la primera serie, establecer hora de inicio
    if (exerciseIndex === 0 && sets[0]?.id === setId && !activeSetId) {
      onFirstExerciseStart?.();
    }
    // Detener descanso de la serie anterior si existe
    if (restingSetId && restingSetId !== setId) {
      // Marcar la serie anterior como completada para detener su cronómetro
      setCompletedSetIds((prev) => new Set(prev).add(restingSetId));
      setRestingSetId(null);
    }
    setActiveSetId(setId);
  };

  const handleSetRest = (setId: string) => {
    // La serie entra en descanso
    setActiveSetId(null);
    setRestingSetId(setId);
    // Notificar al componente padre que la serie entra en descanso
    onGlobalSetRest?.(setId);
  };

  const handleSetComplete = (setId: string) => {
    setCompletedSetIds((prev) => new Set(prev).add(setId));
    setCollapsedSetIds((prev) => new Set(prev).add(setId));
    setActiveSetId(null);
    setRestingSetId(null);
    // Notificar al componente padre que se completa la serie
    onGlobalSetComplete?.();
    // Ya no marcamos el entrenamiento como completado aquí, se marca al guardar
  };

  // Función para manejar cuando se completa una serie desde el modal
  const handleSetCompleteFromModal = (setId: string) => {
    handleSetComplete(setId);
  };

  // Función para alternar el estado colapsado de una serie
  const toggleSetCollapsed = (setId: string) => {
    setCollapsedSetIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(setId)) {
        newSet.delete(setId);
      } else {
        newSet.add(setId);
      }
      return newSet;
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
            <div className="flex flex-col gap-0.5 sm:gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 sm:h-6 sm:w-6 cursor-move"
                disabled={!canMoveUp}
                onClick={onMoveUp}
              >
                <GripVertical className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 sm:h-6 sm:w-6 cursor-move"
                disabled={!canMoveDown}
                onClick={onMoveDown}
              >
                <GripVertical className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-semibold text-sm sm:text-base truncate">{exercise.name}</h3>
                <Badge variant="secondary" className="text-[10px] sm:text-xs shrink-0">
                  #{exerciseIndex + 1}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistoryModal(true)}
                  className="h-6 px-1.5 text-xs text-muted-foreground hover:text-primary shrink-0"
                  title="Ver historial"
                >
                  <History className="h-3.5 w-3.5" />
                </Button>
                {previousMarks && (previousMarks.lastWeight || previousMarks.bestWeight) && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {previousMarks.lastWeight && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        Último: {previousMarks.lastWeight}kg{previousMarks.lastReps ? ` × ${previousMarks.lastReps}` : ''}
                      </Badge>
                    )}
                    {previousMarks.bestWeight && previousMarks.bestWeight !== previousMarks.lastWeight && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                        Mejor: {previousMarks.bestWeight}kg{previousMarks.bestReps ? ` × ${previousMarks.bestReps}` : ''}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                  {exercise.muscle_groups.join(', ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setExerciseCollapsed(!exerciseCollapsed)} 
              className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
            >
              {exerciseCollapsed ? (
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 sm:h-9 sm:w-9 shrink-0">
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {exerciseCollapsed ? (
        <CardContent className="py-3">
          <div className="text-sm text-muted-foreground">
            {sets.length > 0 ? (
              <div className="space-y-1">
                <p className="font-medium">{sets.length} {sets.length === 1 ? 'serie' : 'series'}</p>
                {sets.some(s => s.weight || s.reps) && (
                  <p className="text-xs">
                    {sets.filter(s => s.weight || s.reps).map((s, idx) => 
                      `${s.weight || '-'}kg × ${s.reps || '-'}`
                    ).join(', ')}
                  </p>
                )}
              </div>
            ) : (
              <p>Sin series agregadas</p>
            )}
          </div>
        </CardContent>
      ) : (
      <CardContent className="space-y-4">
        {/* Series */}
        <div className="space-y-2">
          <Label className="text-sm sm:text-base">Series</Label>

          {sets.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay series. Agrega al menos una serie.
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={addSet}
                className="h-7 sm:h-8 text-xs sm:text-sm w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <Plus className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Agregar Serie</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sets.map((set, index) => {
                const setHistory = previousSetMarks?.[set.set_number];
                const hasHistory = setHistory && (
                  setHistory.lastWeight !== null || 
                  setHistory.lastReps !== null || 
                  setHistory.lastRir !== null
                );
                const isCollapsed = collapsedSetIds.has(set.id);
                
                return (
                <TooltipProvider key={set.id}>
                  {isCollapsed ? (
                    // Versión colapsada - solo muestra resumen
                    <div className="p-2 border rounded-md bg-muted/30">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-medium text-muted-foreground shrink-0">
                            Serie #{set.set_number}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {set.weight ? `${set.weight}kg` : '-'} × {set.reps || '-'} @ RIR {set.rir ?? '-'}
                            {set.duration && ` (${Math.floor(set.duration / 60)}:${String(set.duration % 60).padStart(2, '0')})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7"
                            onClick={() => toggleSetCollapsed(set.id)}
                            title="Editar serie"
                          >
                            <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                          <Badge variant="outline" className="text-xs shrink-0">
                            Completado
                          </Badge>
                        </div>
                      </div>
                      {set.notes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {set.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    // Versión expandida - muestra todos los campos
                  <div
                    className="space-y-2 p-2 border rounded-md"
                  >
                    {/* Primera fila: Campos principales - Mobile first: apilados, Desktop: grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-12 gap-2 items-end">
                      {/* Número de serie con tooltip de historial */}
                      <div className="col-span-2 sm:col-span-1 md:col-span-1 flex items-center justify-start sm:justify-center gap-1">
                        {hasHistory ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                  #{set.set_number}
                                </span>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1 text-xs">
                                <p className="font-semibold">Historial previo:</p>
                                {setHistory.lastWeight !== null && (
                                  <p>Peso: {setHistory.lastWeight} kg</p>
                                )}
                                {setHistory.lastReps !== null && (
                                  <p>Reps: {setHistory.lastReps}</p>
                                )}
                                {setHistory.lastRir !== null && (
                                  <p>RIR: {setHistory.lastRir}</p>
                                )}
                                {setHistory.lastNotes && (
                                  <p className="mt-1 pt-1 border-t">Notas: {setHistory.lastNotes}</p>
                                )}
                                {setHistory.bestWeight !== null && setHistory.bestWeight !== setHistory.lastWeight && (
                                  <p className="mt-1 pt-1 border-t text-primary">Mejor peso: {setHistory.bestWeight} kg</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                            #{set.set_number}
                          </span>
                        )}
                        {completedSetIds.has(set.id) && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 sm:h-7 sm:w-7"
                            onClick={() => toggleSetCollapsed(set.id)}
                            title="Colapsar serie"
                          >
                            <ChevronUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        )}
                      </div>
                    
                    {/* Tipo de serie */}
                    <div className="col-span-2 sm:col-span-1 md:col-span-1">
                      <Label htmlFor={`set-type-${set.id}`} className="text-xs">
                        Tipo
                      </Label>
                      <Select
                        value={set.set_type || 'working'}
                        onValueChange={(value: SetType) => updateSet(set.id, 'set_type', value)}
                      >
                        <SelectTrigger id={`set-type-${set.id}`} className="h-8 sm:h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="warmup">Calentamiento</SelectItem>
                          <SelectItem value="approach">Aproximación</SelectItem>
                          <SelectItem value="working">Efectiva</SelectItem>
                          <SelectItem value="bilbo">Bilbo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Peso */}
                    <div className="col-span-1 sm:col-span-1 md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor={`weight-${set.id}`} className="text-xs">
                          Peso (kg)
                        </Label>
                        {(set.theoretical_one_rm || set.percentage_one_rm) && (
                          <div className="flex gap-1">
                            {set.percentage_one_rm && (
                              <Badge variant="secondary" className="text-[9px] h-3.5 px-1 font-normal bg-muted text-muted-foreground hover:bg-muted">
                                {Math.round(set.percentage_one_rm)}%
                              </Badge>
                            )}
                            {set.theoretical_one_rm && (
                              <Badge variant="secondary" className="text-[9px] h-3.5 px-1 font-normal bg-muted text-muted-foreground hover:bg-muted">
                                1RM: {Math.round(set.theoretical_one_rm)}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
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
                        className="h-8 sm:h-9 text-sm"
                      />
                    </div>
                    
                    {/* Reps */}
                    <div className="col-span-1 sm:col-span-1 md:col-span-2">
                      <Label htmlFor={`reps-${set.id}`} className="text-xs mb-1 block">
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
                        className="h-8 sm:h-9 text-sm"
                      />
                    </div>
                    
                    {/* RIR */}
                    <div className="col-span-1 sm:col-span-1 md:col-span-1">
                      <Label htmlFor={`rir-${set.id}`} className="text-xs">
                        RIR
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
                        className="h-8 sm:h-9 text-xs px-1"
                      />
                    </div>

                    {/* RPE */}
                    <div className="col-span-1 sm:col-span-1 md:col-span-1">
                      <Label htmlFor={`rpe-${set.id}`} className="text-xs">
                        RPE
                      </Label>
                      <Input
                        id={`rpe-${set.id}`}
                        type="number"
                        min="1"
                        max="10"
                        placeholder="1"
                        value={set.rpe ?? ''}
                        onChange={(e) =>
                          updateSet(
                            set.id,
                            'rpe',
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        className="h-8 sm:h-9 text-xs px-1"
                      />
                    </div>
                    
                    {/* Timer - Ocupa más espacio en móvil */}
                    <div className="col-span-2 sm:col-span-2 md:col-span-3">
                      <SetTimer
                        setId={set.id}
                        isLastSet={isLastExercise && index === sets.length - 1}
                        isCompleted={completedSetIds.has(set.id)}
                        activeSetId={globalActiveSetId}
                        restingSetId={globalRestingSetId}
                        defaultRestTime={defaultRestTime}
                        targetTut={set.target_tut}
                        targetRest={index === sets.length - 1 ? (restAfterExercise ?? set.target_rest) : set.target_rest}
                        weight={set.weight}
                        reps={set.reps}
                        rir={set.rir}
                        canStart={
                          index === 0 
                            ? true 
                            : completedSetIds.has(sets[index - 1].id) || globalRestingSetId === sets[index - 1].id
                        }
                        onExerciseTimeUpdate={(seconds) => {
                          updateSet(set.id, 'duration', seconds);
                          // Si esta serie está activa globalmente, notificar al componente principal
                          if (globalActiveSetId === set.id && onActiveSetExerciseTimeUpdate) {
                            onActiveSetExerciseTimeUpdate(seconds);
                          }
                        }}
                        onRestTimeUpdate={(seconds) => {
                          updateSet(set.id, 'rest_time', seconds);
                        }}
                        onTutStateUpdate={(isTutMode, countdown) => {
                          // Si esta serie está activa globalmente, notificar al componente principal
                          if (globalActiveSetId === set.id && onTutStateUpdate) {
                            onTutStateUpdate(isTutMode, countdown);
                          }
                        }}
                        onStart={() => handleSetStart(set.id)}
                        onRest={() => handleSetRest(set.id)}
                        onComplete={() => handleSetComplete(set.id)}
                      />
                    </div>
                    
                    {/* Botón eliminar */}
                    <div className="col-span-1 sm:col-span-1 md:col-span-1 flex justify-end sm:justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSet(set.id)}
                        className="h-8 w-8 sm:h-9 sm:w-9"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Notas de la serie - Más pequeñas y compactas */}
                  <div className="pt-1">
                    <Textarea
                      id={`set-notes-${set.id}`}
                      placeholder="Notas..."
                      value={set.notes || ''}
                      onChange={(e) =>
                        updateSet(set.id, 'notes', e.target.value || null)
                      }
                      className="min-h-[28px] sm:min-h-[32px] h-auto text-xs sm:text-sm resize-none overflow-y-auto"
                      rows={1}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                      }}
                    />
                  </div>
                  </div>
                  )}
                </TooltipProvider>
              );
              })}
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={addSet}
                className="h-7 sm:h-8 text-xs sm:text-sm w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              >
                <Plus className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Agregar Serie</span>
                <span className="sm:hidden">Agregar</span>
              </Button>
            </div>
          )}
        </div>

        {/* Notas del ejercicio */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setNotesExpanded(!notesExpanded)}
            className="flex items-center gap-2 w-full text-left hover:opacity-80 transition-opacity"
          >
            {notesExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor={`exercise-notes-${exercise.id}`} className="text-sm sm:text-base cursor-pointer">
              Notas del ejercicio
            </Label>
            {isGeneratingSummary && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Generando resumen...</span>
              </div>
            )}
          </button>
          {notesExpanded && (
            <EditableMarkdown
              content={notes || ''}
              onChange={onUpdateNotes}
              placeholder={isGeneratingSummary ? "Generando resumen automático..." : "Notas sobre este ejercicio..."}
              disabled={isGeneratingSummary}
              isGenerating={isGeneratingSummary}
              rows={2}
            />
          )}
        </div>
      </CardContent>
      )}

      {/* Modal de historial del ejercicio */}
      <ExerciseHistoryModal
        open={showHistoryModal}
        onOpenChange={setShowHistoryModal}
        exerciseId={exercise.id}
        exerciseName={exercise.name}
      />
    </Card>
  );
}

