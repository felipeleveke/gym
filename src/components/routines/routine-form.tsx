'use client';

import { useState, useEffect } from 'react';
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
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, Save, ArrowLeft, Copy, Layers } from 'lucide-react';
import { ExerciseSelector } from '@/components/trainings/exercise-selector';
import { VariantEditor } from './variant-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useTrainingTypes } from '@/hooks/use-training-types';
import { 
  Dumbbell, 
  Heart, 
  Trophy, 
  Sparkles, 
  HelpCircle, 
  Flame, 
  Zap,
  Activity 
} from 'lucide-react';

// Mapeo de nombres de iconos a componentes
const ICON_MAP: Record<string, React.ReactNode> = {
  'Dumbbell': <Dumbbell className="h-4 w-4" />,
  'Heart': <Heart className="h-4 w-4" />,
  'Trophy': <Trophy className="h-4 w-4" />,
  'Sparkles': <Sparkles className="h-4 w-4" />,
  'HelpCircle': <HelpCircle className="h-4 w-4" />,
  'Flame': <Flame className="h-4 w-4" />,
  'Zap': <Zap className="h-4 w-4" />,
  'Activity': <Activity className="h-4 w-4" />,
};

const getIcon = (iconName: string | null) => {
  if (!iconName) return <HelpCircle className="h-4 w-4" />;
  return ICON_MAP[iconName] || <HelpCircle className="h-4 w-4" />;
};

interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_groups?: string[];
  equipment?: string;
}

interface VariantSet {
  set_number: number;
  target_reps: number | null;
  target_rir: number | null;
  target_rpe: number | null;
  target_weight_percent: number | null;
  target_weight: number | null;
  target_tut: number | null;
  rest_seconds: number | null;
  set_type: 'warmup' | 'approach' | 'working' | 'backoff' | 'bilbo';
  notes?: string;
}

interface VariantExercise {
  exercise: Exercise;
  order_index: number;
  notes?: string;
  rest_after_exercise?: number | null;
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

interface RoutineExerciseItem {
  id: string;
  exercise: Exercise;
  default_sets: number;
  default_reps?: number | null;
  default_weight?: number | null;
  default_rir?: number | null;
  default_rpe?: number | null;
  default_tut?: number | null; // Tiempo bajo tensión en segundos
  rest_between_sets?: number | null; // Segundos de descanso entre series
  rest_after_exercise?: number | null; // Segundos de descanso después del ejercicio
  notes?: string;
}

const routineSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  type: z.string().min(1, 'El tipo es requerido'), // Ahora es dinámico desde la BD
});

type RoutineFormData = z.infer<typeof routineSchema>;

interface RoutineFormProps {
  routineId?: string;
}

export function RoutineForm({ routineId }: RoutineFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { trainingTypes, isLoading: isLoadingTypes } = useTrainingTypes();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!routineId);
  
  // Simple mode: basic exercises
  const [exercises, setExercises] = useState<RoutineExerciseItem[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  
  // Advanced mode: variants with detailed set configuration
  const [useAdvancedMode, setUseAdvancedMode] = useState(false);
  const [variants, setVariants] = useState<RoutineVariant[]>([]);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);

  // Track original variants for deletion handling
  const [originalVariantIds, setOriginalVariantIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RoutineFormData>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      type: 'gym',
      name: '',
      description: '',
    },
  });

  // Load routine data if editing
  useEffect(() => {
    if (routineId) {
      const loadData = async () => {
        try {
          // 1. Load routine basics and simple exercises
          const routineRes = await fetch(`/api/routines/${routineId}`);
          if (!routineRes.ok) throw new Error('Error cargando rutina');
          const { data: routine } = await routineRes.json();
          
          reset({
            name: routine.name,
            description: routine.description || '',
            type: routine.type,
          });

          // Check for variants
          const variantsRes = await fetch(`/api/routines/${routineId}/variants`);
          if (!variantsRes.ok) throw new Error('Error cargando variantes');
          const { data: loadedVariants } = await variantsRes.json();

          if (loadedVariants && loadedVariants.length > 0) {
            // ADVANCED MODE
            setUseAdvancedMode(true);
            
            const mappedVariants: RoutineVariant[] = loadedVariants.map((v: any) => ({
              id: v.id,
              variant_name: v.variant_name,
              intensity_level: v.intensity_level,
              description: v.description,
              is_default: v.is_default,
              exercises: v.variant_exercises?.sort((a: any, b: any) => a.order_index - b.order_index).map((ve: any) => ({
                exercise: ve.exercise,
                order_index: ve.order_index,
                notes: ve.notes,
                rest_after_exercise: ve.rest_after_exercise ?? null,
                sets: ve.variant_exercise_sets?.sort((a: any, b: any) => a.set_number - b.set_number).map((s: any) => ({
                  set_number: s.set_number,
                  target_reps: s.target_reps,
                  target_rir: s.target_rir,
                  target_rpe: s.target_rpe ?? null,
                  target_weight_percent: s.target_weight_percent,
                  target_weight: s.target_weight,
                  target_tut: s.target_tut ?? null,
                  rest_seconds: s.rest_seconds ?? null,
                  set_type: s.set_type,
                  notes: s.notes,
                })) || [],
              })) || [],
            }));

            setVariants(mappedVariants);
            setOriginalVariantIds(mappedVariants.map(v => v.id!).filter(Boolean));
          } else if (routine.routine_exercises && routine.routine_exercises.length > 0) {
            // SIMPLE MODE
            setUseAdvancedMode(false);
            const loadedExercises = routine.routine_exercises
              .sort((a: any, b: any) => a.order_index - b.order_index)
              .map((re: any) => ({
                id: re.id,
                exercise: re.exercise,
                default_sets: re.default_sets || 3,
                default_reps: re.default_reps,
                default_weight: re.default_weight,
                default_rir: re.default_rir ?? null,
                default_rpe: re.default_rpe ?? null,
                default_tut: re.default_tut ?? null,
                rest_between_sets: re.rest_between_sets ?? null,
                rest_after_exercise: re.rest_after_exercise ?? null,
                notes: re.notes || '',
              }));
            setExercises(loadedExercises);
          }
        } catch (error) {
          console.error('Error loading routine data:', error);
          toast({
            title: 'Error',
            description: 'No se pudo cargar la rutina para editar',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [routineId, reset, toast]);

  const selectedType = watch('type');

  // Simple mode handlers
  const handleAddExercise = (exercise: Exercise) => {
    // ... existing implementation
    const newExercise: RoutineExerciseItem = {
      id: `temp-${Date.now()}`,
      exercise,
      default_sets: 3,
      default_reps: 10,
      default_weight: null,
      default_rir: 2,
      default_rpe: null,
      default_tut: null,
      rest_between_sets: 90,
      rest_after_exercise: 120,
      notes: '',
    };
    setExercises([...exercises, newExercise]);
    setShowExerciseSelector(false);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newExercises.length) {
      [newExercises[index], newExercises[targetIndex]] = [
        newExercises[targetIndex],
        newExercises[index],
      ];
      setExercises(newExercises);
    }
  };

  const updateExerciseField = (id: string, field: keyof RoutineExerciseItem, value: any) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  // Advanced mode handlers
  const handleAddVariant = () => {
    const variantLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextLetter = variantLetters[variants.length] || `V${variants.length + 1}`;
    
    const newVariant: RoutineVariant = {
      variant_name: nextLetter,
      intensity_level: Math.max(5 - variants.length, 1),
      description: '',
      is_default: variants.length === 0,
      exercises: [],
    };
    
    setVariants([...variants, newVariant]);
    setActiveVariantIndex(variants.length);
  };

  const handleUpdateVariant = (index: number, variant: RoutineVariant) => {
    const newVariants = [...variants];
    newVariants[index] = variant;
    setVariants(newVariants);
  };

  const handleDeleteVariant = (index: number) => {
    if (variants.length <= 1) {
      toast({
        title: 'Error',
        description: 'Debe haber al menos una variante',
        variant: 'destructive',
      });
      return;
    }
    
    const newVariants = variants.filter((_, i) => i !== index);
    // If we deleted the default, make the first one default
    if (variants[index].is_default && newVariants.length > 0) {
      newVariants[0].is_default = true;
    }
    setVariants(newVariants);
    setActiveVariantIndex(Math.max(0, activeVariantIndex - 1));
  };

  const handleCloneVariant = (index: number) => {
    const sourceVariant = variants[index];
    const variantLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const nextLetter = variantLetters[variants.length] || `V${variants.length + 1}`;
    
    const clonedVariant: RoutineVariant = {
      ...JSON.parse(JSON.stringify(sourceVariant)),
      variant_name: nextLetter,
      is_default: false,
      intensity_level: Math.max(sourceVariant.intensity_level - 1, 1),
      id: undefined, // Clear ID for clone
    };
    
    setVariants([...variants, clonedVariant]);
    setActiveVariantIndex(variants.length);
    
    toast({
      title: 'Variante duplicada',
      description: `Se creó la variante "${nextLetter}" basada en "${sourceVariant.variant_name}".`,
    });
  };

  // Convert simple exercises to variant format when switching modes
  const handleModeSwitch = (advanced: boolean) => {
    if (advanced && exercises.length > 0 && variants.length === 0) {
      // Convert existing exercises to a default variant
      const defaultVariant: RoutineVariant = {
        variant_name: 'A',
        intensity_level: 7,
        description: 'Variante principal',
        is_default: true,
        exercises: exercises.map((ex, index) => ({
          exercise: ex.exercise,
          order_index: index,
          notes: ex.notes,
          rest_after_exercise: ex.rest_after_exercise ?? 120,
          sets: Array.from({ length: ex.default_sets }, (_, i) => ({
            set_number: i + 1,
            target_reps: ex.default_reps || 10,
            target_rir: ex.default_rir ?? 2,
            target_rpe: ex.default_rpe ?? null,
            target_weight_percent: null,
            target_weight: ex.default_weight ?? null,
            target_tut: ex.default_tut ?? null,
            rest_seconds: ex.rest_between_sets ?? 90,
            set_type: 'working' as const,
          })),
        })),
      };
      setVariants([defaultVariant]);
    }
    setUseAdvancedMode(advanced);
  };

  const onSubmit = async (data: RoutineFormData) => {
    // Validation based on mode
    if (useAdvancedMode) {
      if (variants.length === 0) {
        toast({
          title: 'Error',
          description: 'Debes agregar al menos una variante',
          variant: 'destructive',
        });
        return;
      }
      
      const emptyVariants = variants.filter((v) => v.exercises.length === 0);
      if (emptyVariants.length > 0) {
        toast({
          title: 'Error',
          description: `La variante "${emptyVariants[0].variant_name}" no tiene ejercicios`,
          variant: 'destructive',
        });
        return;
      }
    } else {
      if (exercises.length === 0) {
        toast({
          title: 'Error',
          description: 'Debes agregar al menos un ejercicio a la rutina',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let currentRoutineId = routineId;

      // 1. Create or Update Routine
      const url = routineId ? `/api/routines/${routineId}` : '/api/routines';
      const method = routineId ? 'PUT' : 'POST';

      const routineResponse = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          type: data.type,
          exercises: useAdvancedMode ? [] : exercises.map((ex, index) => ({
            exercise_id: ex.exercise.id,
            order_index: index,
            default_sets: ex.default_sets,
            default_reps: ex.default_reps || null,
            default_weight: ex.default_weight || null,
            default_rir: ex.default_rir ?? null,
            default_rpe: ex.default_rpe ?? null,
            default_tut: ex.default_tut || null,
            rest_between_sets: ex.rest_between_sets || null,
            rest_after_exercise: ex.rest_after_exercise || null,
            notes: ex.notes || null,
          })),
        }),
      });

      if (!routineResponse.ok) {
        const error = await routineResponse.json();
        throw new Error(error.error || `Error al ${routineId ? 'actualizar' : 'crear'} la rutina`);
      }

      const { data: routine } = await routineResponse.json();
      currentRoutineId = routine.id;

      // 2. Handle Variants (Only in Advanced Mode)
      if (useAdvancedMode) {
        // If editing, handle deletions first
        if (routineId && originalVariantIds.length > 0) {
          const currentVariantIds = variants.map(v => v.id).filter(Boolean);
          const idsToDelete = originalVariantIds.filter(id => !currentVariantIds.includes(id));
          
          for (const idToDelete of idsToDelete) {
             await fetch(`/api/variants/${idToDelete}`, { method: 'DELETE' });
          }
        }

        // Create or Update variants
        for (const variant of variants) {
          const variantPayload = {
            variant_name: variant.variant_name,
            intensity_level: variant.intensity_level,
            description: variant.description,
            is_default: variant.is_default,
            exercises: variant.exercises.map((ex, index) => ({
              exercise_id: ex.exercise.id,
              order_index: index,
              notes: ex.notes,
              rest_after_exercise: ex.rest_after_exercise || null,
              sets: ex.sets.map((set, setIndex) => ({
                set_number: setIndex + 1,
                target_reps: set.target_reps,
                target_rir: set.target_rir,
                target_rpe: set.target_rpe,
                target_weight_percent: set.target_weight_percent,
                target_weight: set.target_weight,
                target_tut: set.target_tut,
                rest_seconds: set.rest_seconds,
                set_type: set.set_type,
                notes: set.notes,
              })),
            })),
          };

          let variantResponse;
          if (variant.id) {
             // Update existing variant
             variantResponse = await fetch(`/api/variants/${variant.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(variantPayload),
            });
          } else {
             // Create new variant
             variantResponse = await fetch(`/api/routines/${currentRoutineId}/variants`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(variantPayload),
            });
          }

          if (!variantResponse.ok) {
            console.error(`Error saving variant ${variant.variant_name}:`, await variantResponse.text());
            toast({
              title: 'Error al guardar variante',
              description: `Hubo un problema guardando la variante ${variant.variant_name}`,
              variant: 'destructive',
            });
          }
        }
      }

      toast({
        title: routineId ? 'Rutina actualizada' : 'Rutina creada',
        description: 'Los cambios se han guardado exitosamente.',
      });

      router.push('/routines');
      router.refresh();
    } catch (error) {
      console.error('Error submitting routine:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Ocurrió un error inesperado',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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
        <h1 className="text-2xl font-bold">{routineId ? 'Editar Rutina' : 'Crear Nueva Rutina'}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre de la Rutina</Label>
              <Input
                id="name"
                placeholder="Ej: Rutina de Pecho y Tríceps"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Entrenamiento</Label>
              <Select
                onValueChange={(value) => setValue('type', value)}
                defaultValue={selectedType}
                value={selectedType}
                disabled={isLoadingTypes && trainingTypes.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {trainingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {getIcon(type.icon)}
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe el objetivo de esta rutina..."
                {...register('description')}
              />
            </div>
          </CardContent>
        </Card>

        {selectedType === 'gym' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Modo de Configuración
                  </CardTitle>

                  <CardDescription>
                    {useAdvancedMode 
                      ? 'Crea múltiples variantes (A/B/C) con configuración detallada de series'
                      : 'Configuración básica de ejercicios'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="advanced-mode" className="text-sm">
                    Modo Avanzado
                  </Label>
                  <Switch
                    id="advanced-mode"
                    checked={useAdvancedMode}
                    onCheckedChange={handleModeSwitch}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {selectedType === 'gym' && !useAdvancedMode && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Ejercicios</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowExerciseSelector(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Ejercicio
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {exercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No hay ejercicios en esta rutina.</p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowExerciseSelector(true)}
                  >
                    Agregar el primero
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {exercises.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 border rounded-lg bg-card items-start"
                    >
                      <div className="flex flex-col gap-1 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === 0}
                          onClick={() => handleMoveExercise(index, 'up')}
                          className="h-6 w-6"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-center text-muted-foreground font-mono">
                          {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={index === exercises.length - 1}
                          onClick={() => handleMoveExercise(index, 'down')}
                          className="h-6 w-6"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{item.exercise.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.exercise.muscle_groups?.join(', ')}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveExercise(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs">Series</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.default_sets}
                              onChange={(e) =>
                                updateExerciseField(
                                  item.id,
                                  'default_sets',
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Reps (Objetivo)</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.default_reps || ''}
                              onChange={(e) =>
                                updateExerciseField(
                                  item.id,
                                  'default_reps',
                                  e.target.value ? parseInt(e.target.value) : null
                                )
                              }
                              placeholder="Ej: 10"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Peso (kg)</Label>
                            <Input
                              type="number"
                              step="0.5"
                              value={item.default_weight || ''}
                              onChange={(e) =>
                                updateExerciseField(
                                  item.id,
                                  'default_weight',
                                  e.target.value ? parseFloat(e.target.value) : null
                                )
                              }
                              placeholder="Opcional"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">RIR</Label>
                            <Select
                              value={item.default_rir?.toString() || ''}
                              onValueChange={(v) =>
                                updateExerciseField(
                                  item.id,
                                  'default_rir',
                                  v ? parseInt(v) : null
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {[0, 1, 2, 3, 4, 5].map((rir) => (
                                  <SelectItem key={rir} value={rir.toString()}>
                                    {rir}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-xs">RPE</Label>
                            <Select
                              value={item.default_rpe?.toString() || ''}
                              onValueChange={(v) =>
                                updateExerciseField(
                                  item.id,
                                  'default_rpe',
                                  v ? parseInt(v) : null
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
                                  <SelectItem key={rpe} value={rpe.toString()}>
                                    {rpe}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-xs">TUT (segundos)</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.default_tut || ''}
                              onChange={(e) =>
                                updateExerciseField(item.id, 'default_tut', e.target.value ? parseInt(e.target.value) : null)
                              }
                              placeholder="Ej: 4"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Descanso Serie (seg)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="5"
                              value={item.rest_between_sets || ''}
                              onChange={(e) =>
                                updateExerciseField(
                                  item.id,
                                  'rest_between_sets',
                                  e.target.value ? parseInt(e.target.value) : null
                                )
                              }
                              placeholder="Ej: 90"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Descanso Ejercicio (seg)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="5"
                              value={item.rest_after_exercise || ''}
                              onChange={(e) =>
                                updateExerciseField(
                                  item.id,
                                  'rest_after_exercise',
                                  e.target.value ? parseInt(e.target.value) : null
                                )
                              }
                              placeholder="Ej: 120"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs">Notas</Label>
                          <Input
                            value={item.notes || ''}
                            onChange={(e) =>
                              updateExerciseField(item.id, 'notes', e.target.value)
                            }
                            placeholder="Notas especiales para este ejercicio..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedType === 'gym' && useAdvancedMode && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Variantes de la Rutina</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariant}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Variante
                </Button>
              </div>
              <CardDescription>
                Cada variante puede tener diferente intensidad y configuración de series.
                Por ejemplo: A (pesado), B (medio), C (ligero).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {variants.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                  <p>No hay variantes definidas.</p>
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleAddVariant}
                  >
                    Crear la primera variante
                  </Button>
                </div>
              ) : (
                <Tabs 
                  value={activeVariantIndex.toString()} 
                  onValueChange={(v) => setActiveVariantIndex(parseInt(v))}
                >
                  <TabsList className="mb-4">
                    {variants.map((variant, index) => (
                      <TabsTrigger key={index} value={index.toString()}>
                        Variante {variant.variant_name}
                        {variant.is_default && ' ★'}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {variants.map((variant, index) => (
                    <TabsContent key={index} value={index.toString()}>
                      <VariantEditor
                        variant={variant}
                        onChange={(updated) => handleUpdateVariant(index, updated)}
                        onDelete={() => handleDeleteVariant(index)}
                        onClone={() => handleCloneVariant(index)}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </CardContent>
          </Card>
        )}

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
                Guardar Rutina
              </>
            )}
          </Button>
        </div>
      </form>

      {showExerciseSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <ExerciseSelector
            onSelect={handleAddExercise}
            onClose={() => setShowExerciseSelector(false)}
          />
        </div>
      )}
    </div>
  );
}
