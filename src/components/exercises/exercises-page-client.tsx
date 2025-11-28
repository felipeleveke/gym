'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useExercises, ExerciseWithStats, SortOption } from '@/hooks/use-exercises';
import { ExercisesFilters } from './exercises-filters';
import { ExercisesList } from './exercises-list';
import { ExerciseDetailModal } from './exercise-detail-modal';
import { ExerciseForm } from './exercise-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'table' | 'cards';

export function ExercisesPageClient() {
  const [search, setSearch] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseWithStats | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseWithStats | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<ExerciseWithStats | null>(null);
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Filtrar ejercicios localmente por equipo (ya que la API no lo soporta aún)
  const { exercises, loading, createExercise, updateExercise, deleteExercise, fetchExerciseStats } = useExercises({
    search,
    muscleGroup: selectedMuscleGroup || undefined,
    sortBy,
  });

  // Filtrar por equipo localmente
  const filteredExercises = useMemo(() => {
    let filtered = exercises;
    
    if (selectedEquipment) {
      filtered = filtered.filter((ex) => 
        ex.equipment?.toLowerCase().includes(selectedEquipment.toLowerCase())
      );
    }

    return filtered;
  }, [exercises, selectedEquipment]);

  const handleViewDetail = (exercise: ExerciseWithStats) => {
    setSelectedExercise(exercise);
    setShowDetailModal(true);
  };

  const handleEdit = (exercise: ExerciseWithStats) => {
    setEditingExercise(exercise);
    setShowFormModal(true);
    setShowDetailModal(false);
  };

  const handleDeleteClick = (exercise: ExerciseWithStats) => {
    setDeletingExercise(exercise);
    setDeleteConfirmStep(1);
    setDeleteConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExercise) return;

    if (deleteConfirmStep === 1) {
      setDeleteConfirmStep(2);
      return;
    }

    if (deleteConfirmStep === 2) {
      if (deleteConfirmText !== deletingExercise.name) {
        toast({
          title: 'Error',
          description: 'El nombre no coincide. Por favor, escribe el nombre exacto del ejercicio.',
          variant: 'destructive',
        });
        return;
      }

      try {
        await deleteExercise(deletingExercise.id);
        setDeletingExercise(null);
        setDeleteConfirmStep(0);
        setDeleteConfirmText('');
        setShowDetailModal(false);
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  };

  const handleCreate = () => {
    setEditingExercise(null);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (data: {
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
  }) => {
    try {
      if (editingExercise) {
        await updateExercise(editingExercise.id, data);
      } else {
        await createExercise(data);
      }
      setShowFormModal(false);
      setEditingExercise(null);
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleSelectChange = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Barra de acciones */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <ExercisesFilters
          search={search}
          onSearchChange={setSearch}
          selectedMuscleGroup={selectedMuscleGroup}
          onMuscleGroupChange={setSelectedMuscleGroup}
          selectedEquipment={selectedEquipment}
          onEquipmentChange={setSelectedEquipment}
          sortBy={sortBy}
          onSortChange={setSortBy}
          exercises={filteredExercises}
        />
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Ejercicio
        </Button>
      </div>

      {/* Lista de ejercicios */}
      <ExercisesList
        exercises={filteredExercises}
        loading={loading}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onViewDetail={handleViewDetail}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        selectedIds={selectedIds}
        onSelectChange={handleSelectChange}
      />

      {/* Modal de detalle */}
      <ExerciseDetailModal
        exercise={selectedExercise}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onFetchStats={fetchExerciseStats}
      />

      {/* Modal de formulario */}
      <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
            </DialogTitle>
            <DialogDescription>
              {editingExercise
                ? 'Modifica la información del ejercicio'
                : 'Completa la información para crear un nuevo ejercicio'}
            </DialogDescription>
          </DialogHeader>
          <ExerciseForm
            exercise={editingExercise}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowFormModal(false);
              setEditingExercise(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog
        open={deletingExercise !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingExercise(null);
            setDeleteConfirmStep(0);
            setDeleteConfirmText('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirmStep === 1
                ? '¿Eliminar ejercicio?'
                : 'Confirmar eliminación'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmStep === 1 ? (
                <>
                  Estás a punto de eliminar el ejercicio{' '}
                  <strong>"{deletingExercise?.name}"</strong>. Esta acción no se puede deshacer.
                  <br />
                  <br />
                  Para confirmar, escribe el nombre del ejercicio:
                </>
              ) : (
                <>
                  Escribe <strong>"{deletingExercise?.name}"</strong> para confirmar la eliminación:
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteConfirmStep === 2 && (
            <div className="py-4">
              <Input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={deletingExercise?.name}
                autoFocus
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeletingExercise(null);
                setDeleteConfirmStep(0);
                setDeleteConfirmText('');
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteConfirmStep === 1 ? 'Continuar' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

