'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Dumbbell, TrendingUp } from 'lucide-react';

interface ExerciseSet {
  id: string;
  set_number: number;
  weight?: number | null;
  reps?: number | null;
  duration?: number | null;
  rest_time?: number | null;
  rir?: number | null;
  notes?: string | null;
  set_type?: string | null;
}

interface HistoryEntry {
  id: string;
  training: {
    id: string;
    date: string;
    start_time?: string | null;
    end_time?: string | null;
    duration?: number | null;
    notes?: string | null;
  };
  notes?: string | null;
  sets: ExerciseSet[];
}

interface ExerciseHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseId: string;
  exerciseName: string;
}

export function ExerciseHistoryModal({
  open,
  onOpenChange,
  exerciseId,
  exerciseName,
}: ExerciseHistoryModalProps) {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [stats, setStats] = useState<{
    totalTrainings: number;
    totalSets: number;
    totalVolume: number;
    bestWeight: number | null;
    bestReps: number | null;
  } | null>(null);

  useEffect(() => {
    if (open && exerciseId) {
      loadHistory();
    }
  }, [open, exerciseId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exercises/${exerciseId}/history?limit=15`);
      if (response.ok) {
        const { data } = await response.json();
        setHistory(data.history || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getSetTypeLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'warmup': return 'Cal.';
      case 'approach': return 'Aprox.';
      case 'working': return 'Efec.';
      case 'bilbo': return 'Bilbo';
      default: return '';
    }
  };

  const getSetTypeColor = (type: string | null | undefined) => {
    switch (type) {
      case 'warmup': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approach': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'working': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'bilbo': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="text-lg flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            <span className="truncate">{exerciseName}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
            <div className="p-4 space-y-4">
              {/* Estadísticas generales */}
              {stats && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Entrenamientos</p>
                    <p className="text-lg font-bold">{stats.totalTrainings}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Series totales</p>
                    <p className="text-lg font-bold">{stats.totalSets}</p>
                  </div>
                  {stats.bestWeight && (
                    <div className="text-center col-span-2 pt-2 border-t">
                      <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Mejor marca
                      </p>
                      <p className="text-lg font-bold text-primary">
                        {stats.bestWeight}kg × {stats.bestReps || '-'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Lista de entrenamientos */}
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay entrenamientos registrados con este ejercicio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-3 space-y-2"
                    >
                      {/* Fecha */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">{formatDate(entry.training.date)}</span>
                      </div>

                      {/* Series */}
                      <div className="space-y-1">
                        {entry.sets.map((set) => (
                          <div
                            key={set.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="text-xs text-muted-foreground w-8">
                              #{set.set_number}
                            </span>
                            {set.set_type && set.set_type !== 'working' && (
                              <Badge
                                variant="secondary"
                                className={`text-[10px] h-4 px-1 ${getSetTypeColor(set.set_type)}`}
                              >
                                {getSetTypeLabel(set.set_type)}
                              </Badge>
                            )}
                            <span className="font-medium">
                              {set.weight ? `${set.weight}kg` : '-'}
                            </span>
                            <span className="text-muted-foreground">×</span>
                            <span className="font-medium">
                              {set.reps || '-'}
                            </span>
                            {set.rir !== null && set.rir !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                @ RIR {set.rir}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Notas del ejercicio */}
                      {entry.notes && (
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
