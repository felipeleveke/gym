'use client';

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
import { TrainingDraft } from '@/hooks/use-training-draft';
import { Clock, Dumbbell } from 'lucide-react';

interface ContinueTrainingDialogProps {
  open: boolean;
  draft: TrainingDraft | null;
  onContinue: () => void;
  onStartNew: () => void;
}

export function ContinueTrainingDialog({
  open,
  draft,
  onContinue,
  onStartNew,
}: ContinueTrainingDialogProps) {
  if (!draft) return null;

  const exerciseCount = draft.exercises.length;
  const totalSets = draft.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  
  // Formatear tiempo transcurrido
  const getTimeAgo = () => {
    const diffMs = Date.now() - draft.lastUpdated;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMins < 1) return 'hace menos de un minuto';
    if (diffMins < 60) return `hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `hace más de un día`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Entrenamiento en progreso
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Tienes un entrenamiento sin terminar guardado. ¿Deseas continuar donde lo dejaste?
              </p>
              
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Guardado {getTimeAgo()}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  <span>{exerciseCount} ejercicio{exerciseCount !== 1 ? 's' : ''} con {totalSets} serie{totalSets !== 1 ? 's' : ''}</span>
                </div>
                {draft.startTime && (
                  <div className="text-muted-foreground">
                    Iniciado: {new Date(draft.startTime).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={onStartNew} className="w-full sm:w-auto">
            Empezar de nuevo
          </AlertDialogCancel>
          <AlertDialogAction onClick={onContinue} className="w-full sm:w-auto">
            Continuar entrenamiento
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

