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
import { getExistingMuscleGroups, COMMON_MUSCLE_GROUPS, MuscleGroupDB } from '@/lib/muscle-groups';
import { Badge } from '@/components/ui/badge';
import { SortOption } from '@/hooks/use-exercises';
import { SelectGroup, SelectLabel } from '@/components/ui/select';
import { EQUIPMENT_CATEGORIES } from './equipment-selector';

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
  const [availableMuscleGroups, setAvailableMuscleGroups] = useState<MuscleGroupDB[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);

  useEffect(() => {
    async function loadMuscleGroups() {
      setLoadingGroups(true);
      try {
        const groups = await getExistingMuscleGroups();
        setAvailableMuscleGroups(groups);
      } catch (error) {
        console.error('Error loading muscle groups:', error);
        setAvailableMuscleGroups(COMMON_MUSCLE_GROUPS.map((mg) => ({
          name: mg.toLowerCase(),
          category: 'Tren Superior'
        })));
      } finally {
        setLoadingGroups(false);
      }
    }
    loadMuscleGroups();
  }, []);



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
                    <>
                      {(['Tren Superior', 'Tren Inferior', 'Zona Media'] as const).map((cat) => {
                        const groupsInCat = availableMuscleGroups.filter(g => g.category === cat);
                        if (groupsInCat.length === 0) return null;

                        return (
                          <SelectGroup key={cat}>
                            <SelectLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
                              {cat}
                            </SelectLabel>
                            {groupsInCat.map((group) => (
                              <SelectItem key={group.name} value={group.name}>
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        );
                      })}
                    </>
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
                <SelectContent className="max-h-[80vh]">
                  <SelectItem value="">Todos los equipos</SelectItem>
                  {EQUIPMENT_CATEGORIES.map((category) => (
                    <SelectGroup key={category.name}>
                      <SelectLabel>{category.name}</SelectLabel>
                      {category.items.map((item) => (
                        <SelectItem key={item.name} value={item.name}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
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

