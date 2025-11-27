'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { TrainingsList } from './trainings-list';
import { TrainingsActionBar } from './trainings-action-bar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Grid3x3, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface Training {
  id: string;
  date: string;
  training_type: 'gym' | 'sport';
  [key: string]: any;
}

type ViewMode = 'cards' | 'list';

const VIEW_MODE_STORAGE_KEY = 'trainings-view-mode';

export function TrainingsListClient() {
  const router = useRouter();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchTrainings = useCallback(async () => {
    try {
      const response = await fetch(`/api/trainings?_=${Date.now()}`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar los entrenamientos');
      }

      const result = await response.json();
      setTrainings(result.data || []);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los entrenamientos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Cargar preferencia de vista desde localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem(VIEW_MODE_STORAGE_KEY) as ViewMode;
    if (savedViewMode === 'cards' || savedViewMode === 'list') {
      setViewMode(savedViewMode);
    }
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  // Escuchar eventos de actualización desde las tarjetas
  useEffect(() => {
    const handleRefresh = () => {
      fetchTrainings();
    };

    window.addEventListener('training-updated', handleRefresh);
    return () => window.removeEventListener('training-updated', handleRefresh);
  }, [fetchTrainings]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
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

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSelectAll = () => {
    const allIds = new Set(trainings.map(t => t.id));
    setSelectedIds(allIds);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === trainings.length) {
      handleDeselectAll();
    } else {
      handleSelectAll();
    }
  };

  const allSelected = trainings.length > 0 && selectedIds.size === trainings.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < trainings.length;
  const checkboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      (checkboxRef.current as any).indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <div className="space-y-4">
      {/* Toggle de vista y selección */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        {trainings.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              ref={checkboxRef}
              checked={allSelected}
              onCheckedChange={handleToggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedIds.size > 0 
                ? `${selectedIds.size} de ${trainings.length} seleccionado${selectedIds.size !== 1 ? 's' : ''}`
                : 'Seleccionar todos'
              }
            </span>
          </div>
        )}
        <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('cards')}
            className={cn(
              'h-8 px-3',
              viewMode === 'cards' && 'bg-background shadow-sm'
            )}
          >
            <Grid3x3 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Tarjetas</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewModeChange('list')}
            className={cn(
              'h-8 px-3',
              viewMode === 'list' && 'bg-background shadow-sm'
            )}
          >
            <List className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Lista</span>
          </Button>
        </div>
      </div>

      <TrainingsList 
        trainings={trainings} 
        loading={loading} 
        viewMode={viewMode}
        selectedIds={selectedIds}
        onSelectChange={handleSelectChange}
      />

      <TrainingsActionBar
        selectedIds={Array.from(selectedIds)}
        onDeselectAll={handleDeselectAll}
        onRefresh={fetchTrainings}
      />
    </div>
  );
}




