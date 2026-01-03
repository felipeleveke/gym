'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MarkdownNotes } from '@/components/ui/markdown-notes';
import { Loader2, Edit2, Trash2, Activity, Calendar, Play } from 'lucide-react';
import { ExerciseWithStats, ExerciseStats } from '@/hooks/use-exercises';
import { VideoPlayer } from './video-player';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ExerciseDetailModalProps {
  exercise: ExerciseWithStats | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (exercise: ExerciseWithStats) => void;
  onDelete?: (exercise: ExerciseWithStats) => void;
  onFetchStats?: (exerciseId: string) => Promise<ExerciseStats | null>;
}

export function ExerciseDetailModal({
  exercise,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  onFetchStats,
}: ExerciseDetailModalProps) {
  const [stats, setStats] = useState<ExerciseStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (exercise && open && onFetchStats) {
      setLoadingStats(true);
      onFetchStats(exercise.id)
        .then((fetchedStats) => {
          setStats(fetchedStats);
        })
        .catch((error) => {
          console.error('Error fetching stats:', error);
        })
        .finally(() => {
          setLoadingStats(false);
        });
    } else if (exercise?.stats) {
      setStats(exercise.stats);
    } else {
      setStats(null);
    }
  }, [exercise, open, onFetchStats]);

  if (!exercise) return null;

  const getMuscleGroupsDisplay = () => {
    if (exercise.muscle_groups_json && Array.isArray(exercise.muscle_groups_json) && exercise.muscle_groups_json.length > 0) {
      return exercise.muscle_groups_json.map((mg: any, idx: number) => {
        const typeColors: Record<string, string> = {
          primary: 'bg-primary/20 text-primary',
          secondary: 'bg-blue-500/20 text-blue-600',
          tertiary: 'bg-purple-500/20 text-purple-600',
        };
        return (
          <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
            <Badge className={`${typeColors[mg.type] || 'bg-muted'}`}>
              {mg.name}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="capitalize">
                {mg.type === 'primary' ? 'Primario' : mg.type === 'secondary' ? 'Secundario' : 'Terciario'}
              </span>
              <span>{mg.percentage}%</span>
            </div>
          </div>
        );
      });
    } else if (exercise.muscle_groups) {
      return exercise.muscle_groups.map((mg: string, idx: number) => (
        <Badge key={idx} variant="outline">
          {mg}
        </Badge>
      ));
    }
    return null;
  };

  const formatLastUsed = (lastUsed: string | null) => {
    if (!lastUsed) return 'Nunca usado';
    try {
      return formatDistanceToNow(new Date(lastUsed), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return 'Nunca usado';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{exercise.name}</DialogTitle>
          <DialogDescription>
            Información detallada del ejercicio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Descripción */}
          {exercise.description && (
            <div>
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-sm text-muted-foreground">{exercise.description}</p>
            </div>
          )}

          {/* Grupos Musculares */}
          <div>
            <h3 className="font-semibold mb-3">Grupos Musculares</h3>
            <div className="space-y-2">
              {getMuscleGroupsDisplay() || (
                <p className="text-sm text-muted-foreground">No especificado</p>
              )}
            </div>
          </div>

          {/* Equipo */}
          {exercise.equipment && (
            <div>
              <h3 className="font-semibold mb-2">Equipo</h3>
              <Badge variant="secondary">{exercise.equipment}</Badge>
            </div>
          )}

          {/* Instrucciones */}
          {exercise.instructions && (
            <div>
              <h3 className="font-semibold mb-2">Instrucciones</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {exercise.instructions}
              </p>
            </div>
          )}

          {/* Video de guía */}
          {exercise.video_url && (
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Play className="h-4 w-4" />
                Video de guía
              </h3>
              <VideoPlayer url={exercise.video_url} />
            </div>
          )}

          <Separator />

          {/* Estadísticas */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Estadísticas de Uso
            </h3>
            {loadingStats ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : stats ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-md bg-muted/30">
                    <div className="text-2xl font-bold">{stats.usageCount || 0}</div>
                    <div className="text-sm text-muted-foreground">Veces usado</div>
                  </div>
                  <div className="p-3 rounded-md bg-muted/30">
                    <div className="text-sm font-medium">
                      {formatLastUsed(stats.lastUsed || null)}
                    </div>
                    <div className="text-sm text-muted-foreground">Último uso</div>
                  </div>
                </div>

                {/* Entrenamientos recientes */}
                {stats.recentTrainings && stats.recentTrainings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Entrenamientos Recientes
                    </h4>
                    <div className="space-y-2">
                      {stats.recentTrainings.map((training: any) => (
                        <div
                          key={training.id}
                          className="p-3 rounded-md bg-muted/30"
                        >
                          <div className="font-medium text-sm mb-2">
                            {formatDate(training.training?.date || training.created_at)}
                          </div>
                          {training.training?.notes && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <MarkdownNotes 
                                content={training.training.notes} 
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay estadísticas disponibles
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full sm:w-auto">
            {onEdit && (
              <Button variant="outline" onClick={() => onEdit(exercise)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                onClick={() => onDelete(exercise)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

