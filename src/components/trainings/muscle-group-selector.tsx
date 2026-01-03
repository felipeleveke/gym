'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { COMMON_MUSCLE_GROUPS, getExistingMuscleGroups, MuscleGroupDB } from '@/lib/muscle-groups';
import { X, Plus, Edit2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface MuscleGroupWithType {
  name: string;
  type: 'primary' | 'secondary' | 'tertiary';
  percentage: number;
}

interface MuscleGroupSelectorProps {
  selectedGroups: MuscleGroupWithType[];
  onChange: (groups: MuscleGroupWithType[]) => void;
}

const DEFAULT_PERCENTAGES = {
  primary: 100,
  secondary: 50,
  tertiary: 20,
};

export function MuscleGroupSelector({ selectedGroups, onChange }: MuscleGroupSelectorProps) {
  const [availableGroups, setAvailableGroups] = useState<MuscleGroupDB[]>([]);
  const [newGroup, setNewGroup] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState<'Tren Superior' | 'Tren Inferior' | 'Zona Media'>('Tren Superior');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      setLoading(true);
      try {
        const groups = await getExistingMuscleGroups();
        setAvailableGroups(groups);
      } catch (error) {
        console.error('Error loading muscle groups:', error);
        // Fallback mínimo si falla la API
        setAvailableGroups(COMMON_MUSCLE_GROUPS.map((mg) => ({
          name: mg.toLowerCase(),
          category: 'Tren Superior' // Categoría por defecto para el fallback
        })));
      } finally {
        setLoading(false);
      }
    }
    loadGroups();
  }, []);

  const toggleGroup = (group: string) => {
    const normalizedGroup = group.toLowerCase().trim();
    const existingIndex = selectedGroups.findIndex((g) => g.name === normalizedGroup);
    
    if (existingIndex >= 0) {
      // Si ya existe, removerlo
      onChange(selectedGroups.filter((g) => g.name !== normalizedGroup));
    } else {
      // Si no existe, agregarlo como primario por defecto
      const newGroup: MuscleGroupWithType = {
        name: normalizedGroup,
        type: 'primary',
        percentage: DEFAULT_PERCENTAGES.primary,
      };
      onChange([...selectedGroups, newGroup]);
    }
  };

  const addNewGroup = async () => {
    const trimmed = newGroup.trim();
    if (trimmed && !selectedGroups.find((g) => g.name === trimmed)) {
      try {
        // Persistir en la base de datos
        await fetch('/api/muscle-groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed, category: newGroupCategory }),
        });

        const newGroupData: MuscleGroupWithType = {
          name: trimmed,
          type: 'primary',
          percentage: DEFAULT_PERCENTAGES.primary,
        };
        onChange([...selectedGroups, newGroupData]);
        setNewGroup('');
        
        if (!availableGroups.find(g => g.name === trimmed)) {
          setAvailableGroups([...availableGroups, { name: trimmed, category: newGroupCategory }].sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (error) {
        console.error('Error adding new muscle group:', error);
      }
    }
  };

  const removeGroup = (groupName: string) => {
    onChange(selectedGroups.filter((g) => g.name !== groupName));
  };

  const updateGroupType = (groupName: string, type: 'primary' | 'secondary' | 'tertiary') => {
    onChange(
      selectedGroups.map((g) =>
        g.name === groupName
          ? { ...g, type, percentage: DEFAULT_PERCENTAGES[type] }
          : g
      )
    );
  };

  const updateGroupPercentage = (groupName: string, percentage: number) => {
    onChange(
      selectedGroups.map((g) =>
        g.name === groupName ? { ...g, percentage: Math.max(0, Math.min(100, percentage)) } : g
      )
    );
  };

  const getTypeColor = (type: 'primary' | 'secondary' | 'tertiary') => {
    switch (type) {
      case 'primary':
        return 'bg-primary text-primary-foreground';
      case 'secondary':
        return 'bg-blue-600 text-white';
      case 'tertiary':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-default';
    }
  };

  const getTypeLabel = (type: 'primary' | 'secondary' | 'tertiary') => {
    switch (type) {
      case 'primary':
        return 'Primario';
      case 'secondary':
        return 'Secundario';
      case 'tertiary':
        return 'Terciario';
    }
  };

  return (
    <div className="space-y-3">
      <Label>Grupos Musculares</Label>
      
      {/* Grupos seleccionados */}
      {selectedGroups.length > 0 && (
        <div className="space-y-2">
          {selectedGroups.map((group) => (
            <div
              key={group.name}
              className="flex items-center gap-2 p-2 border rounded-md bg-muted/30"
            >
              <Badge className={`${getTypeColor(group.type)} capitalize flex-shrink-0`}>
                {group.name}
              </Badge>
              
              <div className="flex items-center gap-2 flex-1">
                <Select
                  value={group.type}
                  onValueChange={(value: 'primary' | 'secondary' | 'tertiary') =>
                    updateGroupType(group.name, value)
                  }
                >
                  <SelectTrigger className="h-8 w-32 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primario</SelectItem>
                    <SelectItem value="secondary">Secundario</SelectItem>
                    <SelectItem value="tertiary">Terciario</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={group.percentage}
                    onChange={(e) =>
                      updateGroupPercentage(group.name, parseInt(e.target.value) || 0)
                    }
                    className="h-8 w-20 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeGroup(group.name)}
                className="h-8 w-8 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Crear nuevo grupo */}
      <div className="space-y-2 p-3 border rounded-md bg-muted/20">
        <Label className="text-xs">Añadir grupo personalizado</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Nombre del grupo..."
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            className="flex-1 h-8 text-xs"
          />
          <Select
            value={newGroupCategory}
            onValueChange={(value: any) => setNewGroupCategory(value)}
          >
            <SelectTrigger className="h-8 w-full sm:w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Tren Superior">Tren Superior</SelectItem>
              <SelectItem value="Tren Inferior">Tren Inferior</SelectItem>
              <SelectItem value="Zona Media">Zona Media</SelectItem>
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addNewGroup}
            className="h-8"
            disabled={!newGroup.trim() || selectedGroups.some((g) => g.name === newGroup.trim())}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Grupos disponibles agrupados */}
      {!loading && availableGroups.length > 0 && (
        <div className="space-y-4">
          <Label className="text-xs text-muted-foreground">Grupos disponibles:</Label>
          
          {(['Tren Superior', 'Tren Inferior', 'Zona Media'] as const).map((cat) => {
            const groupsInCat = availableGroups.filter(g => g.category === cat);
            if (groupsInCat.length === 0) return null;

            return (
              <div key={cat} className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  {cat}
                </p>
                <div className="flex flex-wrap gap-2">
                  {groupsInCat.map((group) => {
                    const isSelected = selectedGroups.some((g) => g.name === group.name);
                    return (
                      <Badge
                        key={group.name}
                        variant={isSelected ? 'default' : 'outline'}
                        className={`cursor-pointer capitalize text-[11px] py-0 h-6 ${
                          isSelected ? getTypeColor(selectedGroups.find((g) => g.name === group.name)!.type) : ''
                        }`}
                        onClick={() => toggleGroup(group.name)}
                      >
                        {group.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedGroups.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Selecciona al menos un grupo muscular o crea uno nuevo
        </p>
      )}
    </div>
  );
}
