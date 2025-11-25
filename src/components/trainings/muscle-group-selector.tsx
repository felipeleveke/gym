'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { COMMON_MUSCLE_GROUPS, getExistingMuscleGroups } from '@/lib/muscle-groups';
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
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [newGroup, setNewGroup] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGroups() {
      setLoading(true);
      try {
        const existing = await getExistingMuscleGroups();
        const allGroups = [
          ...COMMON_MUSCLE_GROUPS.map((mg) => mg.toLowerCase()),
          ...existing,
        ];
        const uniqueGroups = Array.from(new Set(allGroups)).sort();
        setAvailableGroups(uniqueGroups);
      } catch (error) {
        console.error('Error loading muscle groups:', error);
        setAvailableGroups(COMMON_MUSCLE_GROUPS.map((mg) => mg.toLowerCase()));
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

  const addNewGroup = () => {
    const trimmed = newGroup.trim().toLowerCase();
    if (trimmed && !selectedGroups.find((g) => g.name === trimmed)) {
      const newGroupData: MuscleGroupWithType = {
        name: trimmed,
        type: 'primary',
        percentage: DEFAULT_PERCENTAGES.primary,
      };
      onChange([...selectedGroups, newGroupData]);
      setNewGroup('');
      
      if (!availableGroups.includes(trimmed)) {
        setAvailableGroups([...availableGroups, trimmed].sort());
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
      <div className="flex gap-2">
        <Input
          placeholder="Crear nuevo grupo muscular..."
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addNewGroup();
            }
          }}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addNewGroup}
          disabled={!newGroup.trim() || selectedGroups.some((g) => g.name === newGroup.trim().toLowerCase())}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Grupos disponibles */}
      {!loading && availableGroups.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Grupos disponibles:</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableGroups.map((group) => {
              const isSelected = selectedGroups.some((g) => g.name === group);
              return (
                <Badge
                  key={group}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`cursor-pointer capitalize ${
                    isSelected ? getTypeColor(selectedGroups.find((g) => g.name === group)!.type) : ''
                  }`}
                  onClick={() => toggleGroup(group)}
                >
                  {group}
                </Badge>
              );
            })}
          </div>
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
