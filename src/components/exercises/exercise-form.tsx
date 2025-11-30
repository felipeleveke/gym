'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { MuscleGroupSelector, MuscleGroupWithType } from '@/components/trainings/muscle-group-selector';
import { Exercise } from '@/hooks/use-exercises';

interface ExerciseFormProps {
  exercise?: Exercise | null;
  onSubmit: (data: {
    name: string;
    description?: string;
    muscle_groups?: string[];
    muscle_groups_json?: Array<{
      name: string;
      type: 'primary' | 'secondary' | 'tertiary';
      percentage: number;
    }>;
    equipment?: string;
    instructions?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ExerciseForm({ exercise, onSubmit, onCancel, isLoading = false }: ExerciseFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [equipment, setEquipment] = useState('');
  const [instructions, setInstructions] = useState('');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroupWithType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (exercise) {
      setName(exercise.name || '');
      setDescription(exercise.description || '');
      setEquipment(exercise.equipment || '');
      setInstructions(exercise.instructions || '');

      // Convertir muscle_groups_json a MuscleGroupWithType o usar muscle_groups
      let groupsToSet: MuscleGroupWithType[] = [];
      if (exercise.muscle_groups_json && Array.isArray(exercise.muscle_groups_json) && exercise.muscle_groups_json.length > 0) {
        groupsToSet = exercise.muscle_groups_json.map((mg: any) => ({
          name: mg.name,
          type: mg.type || 'primary',
          percentage: mg.percentage || 100,
        }));
      } else if (exercise.muscle_groups) {
        groupsToSet = exercise.muscle_groups.map((mg: string) => ({
          name: mg,
          type: 'primary' as const,
          percentage: 100,
        }));
      }
      setSelectedMuscleGroups(groupsToSet);
    } else {
      // Reset form
      setName('');
      setDescription('');
      setEquipment('');
      setInstructions('');
      setSelectedMuscleGroups([]);
    }
    setErrors({});
  }, [exercise]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (selectedMuscleGroups.length === 0) {
      newErrors.muscleGroups = 'Debes seleccionar al menos un grupo muscular';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const muscleGroupsJson = selectedMuscleGroups.map((mg) => ({
      name: mg.name,
      type: mg.type,
      percentage: mg.percentage,
    }));

    const muscleGroupsArray = selectedMuscleGroups.map((mg) => mg.name);

    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      muscle_groups: muscleGroupsArray,
      muscle_groups_json: muscleGroupsJson,
      equipment: equipment.trim() || undefined,
      instructions: instructions.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Nombre <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Press Banca"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción del ejercicio..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="equipment">Equipo</Label>
        <Input
          id="equipment"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          placeholder="Ej: Barra, Mancuernas, Máquina..."
        />
      </div>

      <div className="space-y-2">
        <MuscleGroupSelector
          selectedGroups={selectedMuscleGroups}
          onChange={setSelectedMuscleGroups}
        />
        {errors.muscleGroups && (
          <p className="text-sm text-destructive">{errors.muscleGroups}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instrucciones</Label>
        <Textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Instrucciones de ejecución del ejercicio..."
          rows={4}
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {exercise ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            exercise ? 'Actualizar' : 'Crear'
          )}
        </Button>
      </div>
    </form>
  );
}



