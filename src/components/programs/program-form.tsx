'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  ArrowLeft,
  Calendar,
  Target
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DatePicker, DateTimePicker } from '@/components/ui/date-time-picker';

interface RoutineVariant {
  id: string;
  variant_name: string;
  intensity_level: number;
  workout_routine?: {
    id: string;
    name: string;
  };
}

interface PhaseRoutine {
  id?: string;
  routine_variant_id: string;
  scheduled_at: string; // ISO datetime string
  notes?: string;
}

interface BlockPhase {
  id?: string;
  week_number: number;
  variant_id: string | null; // Deprecated, kept for backward compat
  intensity_modifier: number;
  volume_modifier: number;
  notes?: string;
  routines: PhaseRoutine[]; // New: array of scheduled routines
}

interface TrainingBlock {
  id?: string;
  name: string;
  block_type: string;
  order_index: number;
  duration_weeks: number;
  notes?: string;
  phases: BlockPhase[];

}

const BLOCK_TYPES = [
  { value: 'strength', label: 'Fuerza', description: 'Enfocado en aumentar la fuerza máxima' },
  { value: 'hypertrophy', label: 'Hipertrofia', description: 'Enfocado en el crecimiento muscular' },
  { value: 'power', label: 'Potencia', description: 'Enfocado en la explosividad' },
  { value: 'endurance', label: 'Resistencia', description: 'Enfocado en la resistencia muscular' },
  { value: 'deload', label: 'Descarga', description: 'Semana de recuperación activa' },
  { value: 'peaking', label: 'Peaking', description: 'Preparación para máximos' },
  { value: 'transition', label: 'Transición', description: 'Período entre ciclos' },
];

const programSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  goal: z.string().optional(),
  start_date: z.string().optional(),
});

type ProgramFormData = z.infer<typeof programSchema>;

interface ProgramFormProps {
  programId?: string;
}

export function ProgramForm({ programId }: ProgramFormProps = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<TrainingBlock[]>([]);
  const [availableVariants, setAvailableVariants] = useState<RoutineVariant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [loadingProgram, setLoadingProgram] = useState(!!programId);
  const [programDataLoaded, setProgramDataLoaded] = useState(false);
  const mappingDoneRef = useRef(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: '',
      description: '',
      goal: '',
      start_date: '',
    },
  });

  // Fetch program data if editing
  useEffect(() => {
    const fetchProgram = async () => {
      if (!programId) {
        mappingDoneRef.current = false;
        return;
      }

      // Reset mapping flag when programId changes
      mappingDoneRef.current = false;
      setProgramDataLoaded(false);

      try {
        const response = await fetch(`/api/programs/${programId}`);
        if (!response.ok) throw new Error('Error fetching program');
        
        const result = await response.json();
        const program = result.data;

          // Set form values
          if (program) {
            // Reset form with program data
            const formData = {
              name: program.name || '',
              description: program.description || '',
              goal: program.goal || '',
              start_date: program.start_date ? program.start_date.split('T')[0] : '',
            };
            
            reset(formData);

          // Convert program blocks to form blocks
          // We'll map the routines after variants are loaded
          const formBlocks: TrainingBlock[] = (program.training_blocks || [])
            .sort((a: any, b: any) => a.order_index - b.order_index)
            .map((block: any) => ({
              id: block.id,
              name: block.name,
              block_type: block.block_type,
              order_index: block.order_index,
              duration_weeks: block.duration_weeks,
              notes: block.notes || '',
              phases: (block.block_phases || [])
                .sort((a: any, b: any) => a.week_number - b.week_number)
                .map((phase: any) => ({
                  id: phase.id,
                  week_number: phase.week_number,
                  variant_id: phase.variant_id || null,
                  intensity_modifier: phase.intensity_modifier || 1.0,
                  volume_modifier: phase.volume_modifier || 1.0,
                  notes: phase.notes || '',
                  routines: (phase.phase_routines || []).map((pr: any) => ({
                    id: pr.id,
                    routine_variant_id: pr.routine_variant?.id || '',
                    // Store original variant info for mapping
                    originalVariantName: pr.routine_variant?.variant_name || '',
                    originalRoutineId: pr.routine_variant?.workout_routine?.origin_routine_id || pr.routine_variant?.workout_routine?.id || '',
                    scheduled_at: pr.scheduled_at ? new Date(pr.scheduled_at).toISOString().slice(0, 16) : '',
                    notes: pr.notes || '',
                  })),
                })),
            }));

          setBlocks(formBlocks);
          setProgramDataLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching program:', error);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el programa',
          variant: 'destructive',
        });
      } finally {
        setLoadingProgram(false);
      }
    };

    fetchProgram();
  }, [programId, toast, reset]);

  // Map program-specific variants to original variants after both are loaded
  useEffect(() => {
    if (!programId || !programDataLoaded || loadingVariants || availableVariants.length === 0 || blocks.length === 0 || mappingDoneRef.current) return;

    // Map routines to use original variant IDs
    const mappedBlocks = blocks.map(block => ({
      ...block,
      phases: block.phases.map(phase => ({
        ...phase,
        routines: phase.routines.map((routine: any) => {
          // If we have original info, try to find the original variant
          if (routine.originalRoutineId && routine.originalVariantName) {
            const originalVariant = availableVariants.find(
              (v: RoutineVariant) =>
                v.workout_routine?.id === routine.originalRoutineId &&
                v.variant_name === routine.originalVariantName
            );
            if (originalVariant) {
              return {
                ...routine,
                routine_variant_id: originalVariant.id,
              };
            }
          }
          return routine;
        }),
      })),
    }));

    setBlocks(mappedBlocks);
    mappingDoneRef.current = true;
  }, [programId, programDataLoaded, loadingVariants, availableVariants, blocks]);

  // Fetch available routine variants
  useEffect(() => {
    const fetchVariants = async () => {
      try {
        // First get all routines
        const routinesResponse = await fetch('/api/routines');
        if (!routinesResponse.ok) throw new Error('Error fetching routines');
        const { data: routines } = await routinesResponse.json();

        // Then get variants for each routine
        // The API will automatically create a default variant if none exists
        const allVariants: RoutineVariant[] = [];
        for (const routine of routines || []) {
          const variantsResponse = await fetch(`/api/routines/${routine.id}/variants`);
          if (variantsResponse.ok) {
            const { data: variants } = await variantsResponse.json();
            if (variants && variants.length > 0) {
              // Agregar todas las variantes (incluye la variante por defecto si no había ninguna)
              allVariants.push(...variants.map((v: any) => ({
                ...v,
                workout_routine: { id: routine.id, name: routine.name },
              })));
            }
          }
        }
        setAvailableVariants(allVariants);
      } catch (error) {
        console.error('Error fetching variants:', error);
      } finally {
        setLoadingVariants(false);
      }
    };

    fetchVariants();
  }, []);

  const handleAddBlock = () => {
    const newBlock: TrainingBlock = {
      name: `Bloque ${blocks.length + 1}`,
      block_type: 'hypertrophy',
      order_index: blocks.length,
      duration_weeks: 4,
          phases: [
        { week_number: 1, variant_id: null, intensity_modifier: 1.0, volume_modifier: 1.0, routines: [] },
        { week_number: 2, variant_id: null, intensity_modifier: 1.0, volume_modifier: 1.0, routines: [] },
        { week_number: 3, variant_id: null, intensity_modifier: 1.0, volume_modifier: 1.0, routines: [] },
        { week_number: 4, variant_id: null, intensity_modifier: 1.0, volume_modifier: 1.0, routines: [] },
      ],
    };
    setBlocks([...blocks, newBlock]);
  };

  const handleUpdateBlock = (index: number, updates: Partial<TrainingBlock>) => {
    const newBlocks = [...blocks];
    newBlocks[index] = { ...newBlocks[index], ...updates };
    
    // If duration changed, update phases
    if (updates.duration_weeks !== undefined) {
      const newDuration = updates.duration_weeks;
      const currentPhases = newBlocks[index].phases;
      
      if (newDuration > currentPhases.length) {
        // Add more phases
        for (let i = currentPhases.length; i < newDuration; i++) {
          currentPhases.push({
            week_number: i + 1,
            variant_id: null,
            intensity_modifier: 1.0,
            volume_modifier: 1.0,
            routines: [],
          });
        }
      } else if (newDuration < currentPhases.length) {
        // Remove phases
        currentPhases.splice(newDuration);
      }
      
      newBlocks[index].phases = currentPhases;
    }
    
    setBlocks(newBlocks);
  };

  const handleRemoveBlock = (index: number) => {
    const newBlocks = blocks.filter((_, i) => i !== index);
    newBlocks.forEach((block, i) => (block.order_index = i));
    setBlocks(newBlocks);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newBlocks.length) {
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      newBlocks.forEach((block, i) => (block.order_index = i));
      setBlocks(newBlocks);
    }
  };

  const handleUpdatePhase = (
    blockIndex: number,
    phaseIndex: number,
    updates: Partial<BlockPhase>
  ) => {
    const newBlocks = [...blocks];
    newBlocks[blockIndex].phases[phaseIndex] = {
      ...newBlocks[blockIndex].phases[phaseIndex],
      ...updates,
    };
    setBlocks(newBlocks);
  };

  const handleAddPhaseRoutine = (blockIndex: number, phaseIndex: number) => {
    const newBlocks = [...blocks];
    const phase = newBlocks[blockIndex].phases[phaseIndex];
    phase.routines.push({
      routine_variant_id: '',
      scheduled_at: '',
      notes: '',
    });
    setBlocks(newBlocks);
  };

  const handleUpdatePhaseRoutine = (
    blockIndex: number,
    phaseIndex: number,
    routineIndex: number,
    updates: Partial<PhaseRoutine>
  ) => {
    const newBlocks = [...blocks];
    newBlocks[blockIndex].phases[phaseIndex].routines[routineIndex] = {
      ...newBlocks[blockIndex].phases[phaseIndex].routines[routineIndex],
      ...updates,
    };
    setBlocks(newBlocks);
  };

  const handleRemovePhaseRoutine = (blockIndex: number, phaseIndex: number, routineIndex: number) => {
    const newBlocks = [...blocks];
    newBlocks[blockIndex].phases[phaseIndex].routines.splice(routineIndex, 1);
    setBlocks(newBlocks);
  };


  const getBlockTypeInfo = (type: string) => {
    return BLOCK_TYPES.find((t) => t.value === type) || BLOCK_TYPES[1];
  };

  const getTotalWeeks = () => {
    return blocks.reduce((sum, block) => sum + block.duration_weeks, 0);
  };

  const onSubmit = async (data: ProgramFormData) => {
    if (blocks.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes agregar al menos un bloque de entrenamiento',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const programData = {
        name: data.name,
        description: data.description,
        goal: data.goal,
        start_date: data.start_date || null,
        end_date: data.start_date
          ? new Date(
              new Date(data.start_date).getTime() + getTotalWeeks() * 7 * 24 * 60 * 60 * 1000
            ).toISOString().split('T')[0]
          : null,
        blocks: blocks.map((block, index) => ({
          name: block.name,
          block_type: block.block_type,
          order_index: index,
          duration_weeks: block.duration_weeks,
          notes: block.notes,
          phases: block.phases.map((phase) => ({
            week_number: phase.week_number,
            variant_id: phase.variant_id,
            intensity_modifier: 1.0, // Valor fijo, no editable
            volume_modifier: 1.0, // Valor fijo, no editable
            notes: phase.notes,
            routines: phase.routines.filter(r => r.routine_variant_id && r.scheduled_at), // Only include valid routines
          })),
        })),
      };

      const url = programId ? `/api/programs/${programId}` : '/api/programs';
      const method = programId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Error al ${programId ? 'actualizar' : 'crear'} el programa`);
      }

      toast({
        title: programId ? 'Programa actualizado' : 'Programa creado',
        description: `El programa "${data.name}" con ${blocks.length} bloque(s) se ha ${programId ? 'actualizado' : 'creado'} exitosamente.`,
      });

      router.push('/programs');
      router.refresh();
    } catch (error) {
      console.error(`Error ${programId ? 'updating' : 'creating'} program:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `No se pudo ${programId ? 'actualizar' : 'crear'} el programa`,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingProgram) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {programId ? 'Editar Programa de Entrenamiento' : 'Crear Programa de Entrenamiento'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información del Programa</CardTitle>
            <CardDescription>
              Define el macrociclo completo de tu periodización
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Programa</Label>
                <Input
                  id="name"
                  placeholder="Ej: Programa de Fuerza 12 Semanas"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="goal">Objetivo Principal</Label>
                <Input
                  id="goal"
                  placeholder="Ej: Aumentar fuerza en los básicos"
                  {...register('goal')}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Fecha de Inicio</Label>
                <DatePicker
                  id="start_date"
                  value={watch('start_date')}
                  onChange={(value) => setValue('start_date', value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Duración Total</Label>
                <div className="flex items-center gap-2 h-10">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-lg font-semibold">
                    {getTotalWeeks()} semanas
                  </span>
                  <span className="text-muted-foreground">
                    ({blocks.length} bloque{blocks.length !== 1 && 's'})
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe los objetivos y características del programa..."
                {...register('description')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Bloques de Entrenamiento (Mesociclos)</CardTitle>
                <CardDescription>
                  Cada bloque representa una fase con un objetivo específico
                </CardDescription>
              </div>
              <Button type="button" variant="outline" onClick={handleAddBlock}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Bloque
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {blocks.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                <p>No hay bloques definidos.</p>
                <Button type="button" variant="link" onClick={handleAddBlock}>
                  Agregar el primer bloque
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {blocks.map((block, blockIndex) => {
                  const typeInfo = getBlockTypeInfo(block.block_type);
                  return (
                    <Card key={block.id || `block-${blockIndex}`} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={blockIndex === 0}
                              onClick={() => handleMoveBlock(blockIndex, 'up')}
                              className="h-6 w-6"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <span className="text-xs text-center text-muted-foreground font-mono">
                              {blockIndex + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              disabled={blockIndex === blocks.length - 1}
                              onClick={() => handleMoveBlock(blockIndex, 'down')}
                              className="h-6 w-6"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-4 flex-wrap">
                              <Input
                                value={block.name}
                                onChange={(e) =>
                                  handleUpdateBlock(blockIndex, { name: e.target.value })
                                }
                                placeholder="Nombre del bloque"
                                className="max-w-[200px]"
                              />

                              <Select
                                value={block.block_type}
                                onValueChange={(v) =>
                                  handleUpdateBlock(blockIndex, { block_type: v })
                                }
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {BLOCK_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <div className="flex items-center gap-2">
                                <Label className="text-sm">Semanas:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="12"
                                  value={block.duration_weeks}
                                  onChange={(e) =>
                                    handleUpdateBlock(blockIndex, {
                                      duration_weeks: parseInt(e.target.value) || 1,
                                    })
                                  }
                                  className="w-20"
                                />
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                              {typeInfo.description}
                            </p>
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveBlock(blockIndex)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-2">
                          <Label className="text-sm">Fases semanales (Microciclos)</Label>
                          <div className="grid gap-2">
                            {block.phases.map((phase, phaseIndex) => (
                              <div
                                key={phase.id || `phase-${phaseIndex}`}
                                className="flex items-center gap-3 p-2 bg-muted/50 rounded-md"
                              >
                                <span className="text-sm font-medium w-20 flex-shrink-0">
                                  Semana {phase.week_number}
                                </span>

                                <div className="flex-1 space-y-2">
                                  {phase.routines.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">Sin rutinas programadas</p>
                                  ) : (
                                    phase.routines.map((routine, routineIndex) => (
                                      <div key={routineIndex} className="flex items-center gap-2 p-2 bg-background rounded border">
                                        <Select
                                          value={routine.routine_variant_id || ''}
                                          onValueChange={(v) =>
                                            handleUpdatePhaseRoutine(blockIndex, phaseIndex, routineIndex, {
                                              routine_variant_id: v || '',
                                            })
                                          }
                                        >
                                          <SelectTrigger className="flex-1 min-w-[180px]">
                                            <SelectValue placeholder="Seleccionar rutina..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {loadingVariants ? (
                                              <SelectItem value="loading" disabled>
                                                Cargando...
                                              </SelectItem>
                                            ) : availableVariants.length === 0 ? (
                                              <SelectItem value="empty" disabled>
                                                No hay variantes
                                              </SelectItem>
                                            ) : (
                                              availableVariants.map((variant) => (
                                                <SelectItem key={variant.id} value={variant.id}>
                                                  {variant.workout_routine?.name} - {variant.variant_name}
                                                </SelectItem>
                                              ))
                                            )}
                                          </SelectContent>
                                        </Select>

                                        <DateTimePicker
                                          value={routine.scheduled_at}
                                          onChange={(value) =>
                                            handleUpdatePhaseRoutine(blockIndex, phaseIndex, routineIndex, {
                                              scheduled_at: value,
                                            })
                                          }
                                          className="w-[200px]"
                                        />

                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                          onClick={() => handleRemovePhaseRoutine(blockIndex, phaseIndex, routineIndex)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))
                                  )}
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleAddPhaseRoutine(blockIndex, phaseIndex)}
                                  >
                                    <Plus className="mr-1 h-3 w-3" />
                                    Agregar Rutina
                                  </Button>
                                </div>

                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {programId ? 'Actualizar Programa' : 'Guardar Programa'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
