'use client';

import { Button } from '@/components/ui/button';
import { Edit, Trash2, Copy, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TrainingsActionBarProps {
  selectedIds: string[];
  onDeselectAll: () => void;
  onRefresh: () => void;
}

export function TrainingsActionBar({ 
  selectedIds,
  onDeselectAll,
  onRefresh 
}: TrainingsActionBarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const selectedCount = selectedIds.length;

  const handleEdit = () => {
    if (selectedIds.length === 1) {
      router.push(`/trainings/${selectedIds[0]}/edit`);
    } else {
      toast({
        title: 'Selecciona un solo entrenamiento',
        description: 'Solo puedes editar un entrenamiento a la vez.',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicate = async () => {
    if (selectedIds.length === 0) return;

    setIsDeleting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedIds) {
        try {
          const response = await fetch(`/api/trainings/${id}/duplicate`, {
            method: 'POST',
          });
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Entrenamientos duplicados',
          description: `${successCount} entrenamiento${successCount !== 1 ? 's' : ''} duplicado${successCount !== 1 ? 's' : ''} correctamente.`,
        });
        onDeselectAll();
        onRefresh();
      }

      if (errorCount > 0) {
        toast({
          title: 'Error',
          description: `No se pudieron duplicar ${errorCount} entrenamiento${errorCount !== 1 ? 's' : ''}.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al duplicar los entrenamientos',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedIds) {
        try {
          const response = await fetch(`/api/trainings/${id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Entrenamientos eliminados',
          description: `${successCount} entrenamiento${successCount !== 1 ? 's' : ''} eliminado${successCount !== 1 ? 's' : ''} correctamente.`,
        });
        onDeselectAll();
        onRefresh();
      }

      if (errorCount > 0) {
        toast({
          title: 'Error',
          description: `No se pudieron eliminar ${errorCount} entrenamiento${errorCount !== 1 ? 's' : ''}.`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al eliminar los entrenamientos',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-lg shadow-lg p-3 md:p-4 max-w-[calc(100vw-2rem)] md:max-w-none">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
          <div className="text-sm font-medium text-center md:text-left">
            {selectedCount} entrenamiento{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              disabled={selectedCount !== 1 || isDeleting}
              className="text-xs md:text-sm"
            >
              <Edit className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Editar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDuplicate}
              disabled={isDeleting}
              className="text-xs md:text-sm"
            >
              <Copy className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Duplicar</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="text-xs md:text-sm"
            >
              <Trash2 className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Eliminar</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeselectAll}
              disabled={isDeleting}
              className="text-xs md:text-sm"
            >
              <X className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Cancelar</span>
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar entrenamientos?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar {selectedCount} entrenamiento{selectedCount !== 1 ? 's' : ''}.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

