'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';
import { getExistingMuscleGroups, COMMON_MUSCLE_GROUPS } from '@/lib/muscle-groups';
import { Badge } from '@/components/ui/badge';
import { SortOption } from '@/hooks/use-exercises';

interface ExercisesFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  selectedMuscleGroup: string;
  onMuscleGroupChange: (muscleGroup: string) => void;
  selectedEquipment: string;
  onEquipmentChange: (equipment: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  exercises: Array<{
    equipment?: string;
  }>;
}

export function ExercisesFilters({
  search,
  onSearchChange,
  selectedMuscleGroup,
  onMuscleGroupChange,
  selectedEquipment,
  onEquipmentChange,
  sortBy,
  onSortChange,
  exercises,
}: ExercisesFiltersProps) {
  const [availableMuscleGroups, setAvailableMuscleGroups] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    async function loadMuscleGroups() {
      setLoadingGroups(true);
      try {
        const existing = await getExistingMuscleGroups();
        const allGroups = [
          ...COMMON_MUSCLE_GROUPS.map((mg) => mg.toLowerCase()),
          ...existing,
        ];
        const uniqueGroups = Array.from(new Set(allGroups)).sort();
        setAvailableMuscleGroups(uniqueGroups);
      } catch (error) {
        console.error('Error loading muscle groups:', error);
        setAvailableMuscleGroups(COMMON_MUSCLE_GROUPS.map((mg) => mg.toLowerCase()));
      } finally {
        setLoadingGroups(false);
      }
    }
    loadMuscleGroups();
  }, []);

  useEffect(() => {
    // Extraer equipos únicos de los ejercicios
    const equipmentSet = new Set<string>();
    exercises.forEach((ex) => {
      if (ex.equipment && ex.equipment.trim()) {
        equipmentSet.add(ex.equipment.trim());
      }
    });
    setAvailableEquipment(Array.from(equipmentSet).sort());
  }, [exercises]);

  const hasActiveFilters = selectedMuscleGroup !== '' || selectedEquipment !== '' || sortBy !== 'name';

  const clearFilters = () => {
    onMuscleGroupChange('');
    onEquipmentChange('');
    onSortChange('name');
  };

  return (
    <div className="space-y-4">
      {/* Búsqueda y toggle de filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ejercicios..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              onClick={() => onSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          onClick={() => setShowFilters(!showFilters)}
          className="sm:w-auto"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-2 h-5 w-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center">
              !
            </span>
          )}
        </Button>
      </div>

      {/* Filtros expandibles */}
      {showFilters && (
        <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Filtros</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por grupo muscular */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Grupo Muscular</label>
              <Select value={selectedMuscleGroup} onValueChange={onMuscleGroupChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los grupos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los grupos</SelectItem>
                  {loadingGroups ? (
                    <SelectItem value="loading" disabled>
                      Cargando...
                    </SelectItem>
                  ) : (
                    availableMuscleGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group.charAt(0).toUpperCase() + group.slice(1)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por equipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipo</label>
              <Select value={selectedEquipment} onValueChange={onEquipmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los equipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los equipos</SelectItem>
                  {availableEquipment.map((equipment) => (
                    <SelectItem key={equipment} value={equipment}>
                      {equipment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ordenamiento */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ordenar por</label>
              <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nombre (A-Z)</SelectItem>
                  <SelectItem value="usage">Más usado</SelectItem>
                  <SelectItem value="recent">Recientemente usado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Badges de filtros activos */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedMuscleGroup && (
                <Badge variant="secondary" className="gap-1">
                  Grupo: {selectedMuscleGroup}
                  <button
                    onClick={() => onMuscleGroupChange('')}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedEquipment && (
                <Badge variant="secondary" className="gap-1">
                  Equipo: {selectedEquipment}
                  <button
                    onClick={() => onEquipmentChange('')}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {sortBy !== 'name' && (
                <Badge variant="secondary" className="gap-1">
                  Orden: {sortBy === 'usage' ? 'Más usado' : 'Reciente'}
                  <button
                    onClick={() => onSortChange('name')}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

