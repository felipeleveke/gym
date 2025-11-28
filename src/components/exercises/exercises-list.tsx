'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Edit2, Trash2, Eye, LayoutGrid, List } from 'lucide-react';
import { ExerciseWithStats } from '@/hooks/use-exercises';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type ViewMode = 'table' | 'cards';

interface ExercisesListProps {
  exercises: ExerciseWithStats[];
  loading?: boolean;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onViewDetail?: (exercise: ExerciseWithStats) => void;
  onEdit?: (exercise: ExerciseWithStats) => void;
  onDelete?: (exercise: ExerciseWithStats) => void;
  selectedIds?: Set<string>;
  onSelectChange?: (id: string, selected: boolean) => void;
}

export function ExercisesList({
  exercises,
  loading = false,
  viewMode = 'cards',
  onViewModeChange,
  onViewDetail,
  onEdit,
  onDelete,
  selectedIds = new Set(),
  onSelectChange,
}: ExercisesListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No se encontraron ejercicios.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Intenta ajustar los filtros o crea un nuevo ejercicio.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getMuscleGroupsDisplay = (exercise: ExerciseWithStats) => {
    if (exercise.muscle_groups_json && Array.isArray(exercise.muscle_groups_json) && exercise.muscle_groups_json.length > 0) {
      return exercise.muscle_groups_json.map((mg: any, idx: number) => {
        const typeColors: Record<string, string> = {
          primary: 'bg-primary/20 text-primary',
          secondary: 'bg-blue-500/20 text-blue-600',
          tertiary: 'bg-purple-500/20 text-purple-600',
        };
        return (
          <Badge
            key={idx}
            variant="outline"
            className={`text-xs ${typeColors[mg.type] || 'bg-muted'}`}
          >
            {mg.name}
          </Badge>
        );
      });
    } else if (exercise.muscle_groups) {
      return exercise.muscle_groups.map((mg: string, idx: number) => (
        <Badge key={idx} variant="outline" className="text-xs">
          {mg}
        </Badge>
      ));
    }
    return null;
  };

  const formatLastUsed = (lastUsed: string | null) => {
    if (!lastUsed) return 'Nunca';
    try {
      return formatDistanceToNow(new Date(lastUsed), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return 'Nunca';
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    onSelectChange?.(id, checked);
  };

  const handleSelectAll = (checked: boolean) => {
    exercises.forEach((ex) => {
      onSelectChange?.(ex.id, checked);
    });
  };

  const allSelected = exercises.length > 0 && exercises.every((ex) => selectedIds.has(ex.id));
  const someSelected = exercises.some((ex) => selectedIds.has(ex.id));

  if (viewMode === 'table') {
    return (
      <div className="space-y-4">
        {/* Toggle de vista */}
        {onViewModeChange && (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('table')}
            >
              <List className="h-4 w-4 mr-2" />
              Tabla
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onViewModeChange('cards')}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Cards
            </Button>
          </div>
        )}

        {/* Tabla */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {onSelectChange && (
                    <th className="w-12 p-4 text-left">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Seleccionar todos"
                      />
                    </th>
                  )}
                  <th className="p-4 text-left font-semibold">Nombre</th>
                  <th className="p-4 text-left font-semibold hidden md:table-cell">Grupos Musculares</th>
                  <th className="p-4 text-left font-semibold hidden lg:table-cell">Equipo</th>
                  <th className="p-4 text-left font-semibold hidden lg:table-cell">Usos</th>
                  <th className="p-4 text-left font-semibold hidden xl:table-cell">Último uso</th>
                  <th className="w-24 p-4 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((exercise) => (
                  <tr
                    key={exercise.id}
                    className={`border-t hover:bg-muted/30 transition-colors ${
                      selectedIds.has(exercise.id) ? 'bg-muted/50' : ''
                    }`}
                    onMouseEnter={() => setHoveredId(exercise.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {onSelectChange && (
                      <td className="p-4">
                        <Checkbox
                          checked={selectedIds.has(exercise.id)}
                          onCheckedChange={(checked) => handleSelect(exercise.id, checked === true)}
                        />
                      </td>
                    )}
                    <td className="p-4">
                      <div className="font-medium">{exercise.name}</div>
                      {exercise.description && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {exercise.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {getMuscleGroupsDisplay(exercise)}
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      {exercise.equipment ? (
                        <Badge variant="secondary">{exercise.equipment}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-sm">
                        {exercise.stats?.usageCount || 0}
                      </span>
                    </td>
                    <td className="p-4 hidden xl:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {formatLastUsed(exercise.stats?.lastUsed || null)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        {onViewDetail && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewDetail(exercise)}
                            className="h-8 w-8"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(exercise)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(exercise)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Vista de cards
  return (
    <div className="space-y-4">
      {/* Toggle de vista */}
      {onViewModeChange && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('table')}
          >
            <List className="h-4 w-4 mr-2" />
            Tabla
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('cards')}
          >
            <LayoutGrid className="h-4 w-4 mr-2" />
            Cards
          </Button>
        </div>
      )}

      {/* Grid de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise) => (
          <Card
            key={exercise.id}
            className={`transition-all hover:shadow-md ${
              selectedIds.has(exercise.id) ? 'ring-2 ring-primary' : ''
            }`}
            onMouseEnter={() => setHoveredId(exercise.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {onSelectChange && (
                    <Checkbox
                      checked={selectedIds.has(exercise.id)}
                      onCheckedChange={(checked) => handleSelect(exercise.id, checked === true)}
                      className="mb-2"
                    />
                  )}
                  <CardTitle className="text-lg line-clamp-2">{exercise.name}</CardTitle>
                </div>
                {(hoveredId === exercise.id || selectedIds.has(exercise.id)) && (
                  <div className="flex gap-1 flex-shrink-0">
                    {onViewDetail && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDetail(exercise)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(exercise)}
                        className="h-8 w-8"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(exercise)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {exercise.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {exercise.description}
                </p>
              )}

              <div className="flex flex-wrap gap-1">
                {getMuscleGroupsDisplay(exercise)}
              </div>

              <div className="flex items-center justify-between text-sm pt-2 border-t">
                {exercise.equipment && (
                  <Badge variant="secondary" className="text-xs">
                    {exercise.equipment}
                  </Badge>
                )}
                <div className="flex items-center gap-4 text-muted-foreground">
                  {exercise.stats && (
                    <>
                      <span>{exercise.stats.usageCount || 0} usos</span>
                      <span className="hidden sm:inline">
                        {formatLastUsed(exercise.stats.lastUsed || null)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

