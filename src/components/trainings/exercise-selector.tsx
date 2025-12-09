'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, Search, X, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MuscleGroupSelector, MuscleGroupWithType } from './muscle-group-selector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_groups?: string[];
  muscle_groups_json?: Array<{
    name: string;
    type: 'primary' | 'secondary' | 'tertiary';
    percentage: number;
  }>;
  equipment?: string;
}

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

export function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const [search, setSearch] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]); // Guardar todos los ejercicios para filtrado local
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroupWithType[]>([]);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editName, setEditName] = useState('');
  const [editMuscleGroups, setEditMuscleGroups] = useState<MuscleGroupWithType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0); // 0: inicial, 1: primera confirmación, 2: segunda confirmación
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  // Cargar todos los ejercicios al montar el componente
  useEffect(() => {
    fetchExercises('');
  }, []);

  // El filtrado se hace localmente con useMemo, no necesita llamar a la API

  // Filtrado local de ejercicios basado en el término de búsqueda
  const filteredExercises = useMemo(() => {
    if (!search.trim()) {
      return allExercises;
    }
    
    const searchLower = search.toLowerCase().trim();
    return allExercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(searchLower)
    );
  }, [allExercises, search]);

  const fetchExercises = async (searchTerm: string = '') => {
    setLoading(true);
    try {
      // Siempre cargar todos los ejercicios, el filtrado se hace localmente
      const url = '/api/exercises';
      
      // Agregar timestamp para evitar caché
      const response = await fetch(`${url}?_=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Error al cargar ejercicios');
      
      const result = await response.json();
      console.log('Fetched exercises:', result.data);
      
      // Asegurar que muscle_groups_json sea parseado correctamente si viene como string
      const exercisesWithParsedJson = (result.data || []).map((ex: Exercise) => {
        if (ex.muscle_groups_json) {
          if (typeof ex.muscle_groups_json === 'string') {
            try {
              ex.muscle_groups_json = JSON.parse(ex.muscle_groups_json);
            } catch (e) {
              console.error('Error parsing muscle_groups_json for exercise:', ex.id, e);
            }
          }
          console.log(`Exercise ${ex.name} - muscle_groups_json:`, JSON.stringify(ex.muscle_groups_json, null, 2));
        } else {
          console.log(`Exercise ${ex.name} - NO muscle_groups_json, using muscle_groups:`, ex.muscle_groups);
        }
        return ex;
      });
      
      // Guardar todos los ejercicios para filtrado local
      setAllExercises(exercisesWithParsedJson);
      setExercises(exercisesWithParsedJson);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los ejercicios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditExercise = (exercise: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('=== handleEditExercise ===');
    console.log('Exercise being edited:', exercise);
    console.log('exercise.muscle_groups_json:', JSON.stringify(exercise.muscle_groups_json, null, 2));
    console.log('exercise.muscle_groups:', exercise.muscle_groups);
    
    setEditingExercise(exercise);
    setEditName(exercise.name);
    
    // Convertir muscle_groups_json a MuscleGroupWithType o usar muscle_groups
    let groupsToSet: MuscleGroupWithType[] = [];
    if (exercise.muscle_groups_json && Array.isArray(exercise.muscle_groups_json) && exercise.muscle_groups_json.length > 0) {
      groupsToSet = exercise.muscle_groups_json.map((mg: any) => ({
        name: mg.name,
        type: mg.type || 'primary',
        percentage: mg.percentage || 100,
      }));
      console.log('Using muscle_groups_json, groupsToSet:', JSON.stringify(groupsToSet, null, 2));
    } else if (exercise.muscle_groups) {
      groupsToSet = exercise.muscle_groups.map((mg: string) => ({
        name: mg,
        type: 'primary' as const,
        percentage: 100,
      }));
      console.log('Using muscle_groups, groupsToSet:', JSON.stringify(groupsToSet, null, 2));
    } else {
      groupsToSet = [];
      console.log('No muscle groups found, setting empty array');
    }
    
    setEditMuscleGroups(groupsToSet);
    console.log('Final editMuscleGroups set to:', JSON.stringify(groupsToSet, null, 2));
  };

  const handleSaveEdit = async () => {
    if (!editingExercise || !editName.trim() || editMuscleGroups.length === 0) {
      toast({
        title: 'Error',
        description: 'El nombre y al menos un grupo muscular son requeridos',
        variant: 'destructive',
      });
      return;
    }

    setIsEditing(true);
    try {
      console.log('=== handleSaveEdit ===');
      console.log('editMuscleGroups:', JSON.stringify(editMuscleGroups, null, 2));
      console.log('editingExercise:', editingExercise);
      
      const muscleGroupsJson = editMuscleGroups.map((mg) => ({
        name: mg.name,
        type: mg.type,
        percentage: mg.percentage,
      }));

      const muscleGroupsArray = editMuscleGroups.map((mg) => mg.name);

      console.log('Sending update request:', {
        id: editingExercise.id,
        name: editName.trim(),
        muscle_groups: muscleGroupsArray,
        muscle_groups_json: muscleGroupsJson,
      });
      console.log('muscleGroupsJson details:', JSON.stringify(muscleGroupsJson, null, 2));

      const response = await fetch(`/api/exercises/${editingExercise.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          muscle_groups: muscleGroupsArray,
          muscle_groups_json: muscleGroupsJson,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar ejercicio');
      }

      console.log('Exercise updated successfully, result:', result.data);
      console.log('muscle_groups_json in response:', JSON.stringify(result.data?.muscle_groups_json, null, 2));
      console.log('muscle_groups_json type:', typeof result.data?.muscle_groups_json);
      console.log('muscle_groups_json is array:', Array.isArray(result.data?.muscle_groups_json));
      console.log('muscle_groups in response:', result.data?.muscle_groups);

      // Actualizar manualmente el ejercicio en la lista primero
      if (result.data) {
        // Asegurar que muscle_groups_json sea un array
        let muscleGroupsJson = result.data.muscle_groups_json;
        if (typeof muscleGroupsJson === 'string') {
          try {
            muscleGroupsJson = JSON.parse(muscleGroupsJson);
          } catch (e) {
            console.error('Error parsing muscle_groups_json:', e);
            muscleGroupsJson = undefined;
          }
        }
        
        setExercises(prevExercises => 
          prevExercises.map(ex => {
            if (ex.id === editingExercise.id) {
              const updated: Exercise = { 
                ...ex, 
                name: result.data.name,
                muscle_groups: result.data.muscle_groups,
                muscle_groups_json: Array.isArray(muscleGroupsJson) ? muscleGroupsJson : undefined,
                description: result.data.description,
                equipment: result.data.equipment,
              };
              console.log('Updated exercise in state:', updated);
              return updated;
            }
            return ex;
          })
        );
      }

      // Luego refrescar desde el servidor para asegurar que tenemos los datos más recientes
      setTimeout(async () => {
        await fetchExercises('');
      }, 500);
      
      setEditingExercise(null);
      setEditName('');
      setEditMuscleGroups([]);
      
      toast({
        title: 'Ejercicio actualizado',
        description: `"${editName}" ha sido actualizado exitosamente.`,
      });
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el ejercicio',
        variant: 'destructive',
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = (exercise: Exercise, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingExercise(exercise);
    setDeleteConfirmStep(1);
    setDeleteConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExercise) return;

    if (deleteConfirmStep === 1) {
      // Primera confirmación: pedir escribir el nombre
      setDeleteConfirmStep(2);
      return;
    }

    // Segunda confirmación: eliminar
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/exercises/${deletingExercise.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al eliminar ejercicio');
      }

      // Actualizar la lista de ejercicios
      await fetchExercises('');
      
      setDeletingExercise(null);
      setDeleteConfirmStep(0);
      setDeleteConfirmText('');
      
      toast({
        title: 'Ejercicio eliminado',
        description: `"${deletingExercise.name}" ha sido eliminado del catálogo.`,
      });
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar el ejercicio',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateExercise = async () => {
    if (!newExerciseName.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre del ejercicio es requerido',
        variant: 'destructive',
      });
      return;
    }

    if (selectedMuscleGroups.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un grupo muscular',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      // Convertir la estructura nueva a formato JSONB para la base de datos
      const muscleGroupsJson = selectedMuscleGroups.map((mg) => ({
        name: mg.name,
        type: mg.type,
        percentage: mg.percentage,
      }));

      // También mantener compatibilidad con el formato antiguo (array de strings)
      const muscleGroupsArray = selectedMuscleGroups.map((mg) => mg.name);

      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newExerciseName.trim(),
          muscle_groups: muscleGroupsArray, // Para compatibilidad
          muscle_groups_json: muscleGroupsJson, // Nueva estructura
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear ejercicio');
      }

      // Parsear muscle_groups_json si viene como string
      const parsedData = result.data;
      if (parsedData.muscle_groups_json && typeof parsedData.muscle_groups_json === 'string') {
        try {
          parsedData.muscle_groups_json = JSON.parse(parsedData.muscle_groups_json);
        } catch (e) {
          console.error('Error parsing muscle_groups_json:', e);
        }
      }
      
      // Agregar el nuevo ejercicio a la lista local
      setAllExercises(prev => [...prev, parsedData]);
      
      onSelect(parsedData);
      setNewExerciseName('');
      setSelectedMuscleGroups([]);
      setSearch(''); // Limpiar búsqueda para mostrar el nuevo ejercicio
      toast({
        title: 'Ejercicio creado',
        description: `"${parsedData.name}" ha sido agregado al catálogo.`,
      });
    } catch (error) {
      console.error('Error creating exercise:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear el ejercicio',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Seleccionar Ejercicio</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ejercicio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Crear nuevo ejercicio */}
        {search && filteredExercises.length === 0 && !loading && (
          <div className="space-y-4 p-4 border rounded-md bg-muted/50">
            <div>
              <p className="text-sm font-medium mb-1">
                No se encontró &quot;{search}&quot;. ¿Quieres crearlo?
              </p>
              <p className="text-xs text-muted-foreground">
                Completa la información del ejercicio
              </p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Nombre del ejercicio</label>
                <Input
                  placeholder="Ej: Press Banca"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && selectedMuscleGroups.length > 0) {
                      handleCreateExercise();
                    }
                  }}
                />
              </div>

              <MuscleGroupSelector
                selectedGroups={selectedMuscleGroups}
                onChange={setSelectedMuscleGroups}
              />

              <Button
                onClick={handleCreateExercise}
                disabled={
                  creating ||
                  !newExerciseName.trim() ||
                  selectedMuscleGroups.length === 0
                }
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Ejercicio
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Lista de ejercicios */}
        <div className="max-h-64 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredExercises.length === 0 && !search ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Escribe para buscar ejercicios...
            </p>
          ) : (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="group flex items-center gap-2 p-3 rounded-md hover:bg-accent transition-colors"
              >
                <button
                  onClick={() => {
                    onSelect(exercise);
                    onClose();
                  }}
                  className="flex-1 text-left"
                >
                  <div className="font-medium">{exercise.name}</div>
                  {(exercise.muscle_groups_json || exercise.muscle_groups) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {/* Priorizar muscle_groups_json si existe y tiene datos */}
                      {exercise.muscle_groups_json && 
                       Array.isArray(exercise.muscle_groups_json) && 
                       exercise.muscle_groups_json.length > 0 ? (
                        exercise.muscle_groups_json.map((mg: any, idx: number) => {
                          const typeColors: Record<string, string> = {
                            primary: 'bg-primary/20 text-primary',
                            secondary: 'bg-blue-500/20 text-blue-600',
                            tertiary: 'bg-purple-500/20 text-purple-600',
                          };
                          return (
                            <span
                              key={idx}
                              className={`text-xs px-1.5 py-0.5 rounded ${typeColors[mg.type] || 'bg-muted'}`}
                            >
                              {mg.name} ({mg.percentage}%)
                            </span>
                          );
                        })
                      ) : (
                        /* Fallback para formato antiguo */
                        exercise.muscle_groups && exercise.muscle_groups.map((mg: string, idx: number) => (
                          <span key={idx} className="text-xs text-muted-foreground">
                            {mg}
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => handleEditExercise(exercise, e)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => handleDeleteClick(exercise, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Dialog de edición */}
      <Dialog open={!!editingExercise} onOpenChange={(open) => !open && setEditingExercise(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ejercicio</DialogTitle>
            <DialogDescription>
              Modifica la información del ejercicio
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Nombre del ejercicio</Label>
              <Input
                id="edit-name"
                placeholder="Ej: Press Banca"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1"
              />
            </div>
            <MuscleGroupSelector
              selectedGroups={editMuscleGroups}
              onChange={setEditMuscleGroups}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingExercise(null);
                setEditName('');
                setEditMuscleGroups([]);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isEditing || !editName.trim() || editMuscleGroups.length === 0}>
              {isEditing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <Dialog open={!!deletingExercise} onOpenChange={(open) => {
        if (!open) {
          setDeletingExercise(null);
          setDeleteConfirmStep(0);
          setDeleteConfirmText('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deleteConfirmStep === 1 ? 'Confirmar Eliminación' : 'Confirmación Final'}
            </DialogTitle>
            <DialogDescription>
              {deleteConfirmStep === 1 ? (
                <>
                  ¿Estás seguro de que deseas eliminar el ejercicio <strong>&quot;{deletingExercise?.name}&quot;</strong>?
                  <br />
                  <br />
                  Esta acción no se puede deshacer. El ejercicio será eliminado permanentemente de la base de datos.
                </>
              ) : (
                <>
                  Para confirmar la eliminación, escribe el nombre del ejercicio:
                  <br />
                  <strong>&quot;{deletingExercise?.name}&quot;</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {deleteConfirmStep === 2 && (
            <div className="py-4">
              <Label htmlFor="delete-confirm">Escribe el nombre del ejercicio para confirmar</Label>
              <Input
                id="delete-confirm"
                placeholder={deletingExercise?.name}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mt-2"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletingExercise(null);
                setDeleteConfirmStep(0);
                setDeleteConfirmText('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={
                isDeleting || 
                (deleteConfirmStep === 2 && deleteConfirmText !== deletingExercise?.name)
              }
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : deleteConfirmStep === 1 ? (
                'Continuar'
              ) : (
                'Eliminar Permanentemente'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

