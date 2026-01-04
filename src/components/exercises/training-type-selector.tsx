'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dumbbell, 
  Heart, 
  Trophy, 
  Sparkles, 
  HelpCircle, 
  Flame, 
  Zap,
  Activity,
  Loader2 
} from 'lucide-react';
import { useTrainingTypes, TrainingTypeValue } from '@/hooks/use-training-types';

// Re-exportar el tipo para compatibilidad
export type TrainingType = TrainingTypeValue;

interface TrainingTypeSelectorProps {
  value?: TrainingType;
  onChange: (value: TrainingType) => void;
  error?: string;
}

// Mapeo de nombres de iconos a componentes
const ICON_MAP: Record<string, React.ReactNode> = {
  'Dumbbell': <Dumbbell className="h-4 w-4" />,
  'Heart': <Heart className="h-4 w-4" />,
  'Trophy': <Trophy className="h-4 w-4" />,
  'Sparkles': <Sparkles className="h-4 w-4" />,
  'HelpCircle': <HelpCircle className="h-4 w-4" />,
  'Flame': <Flame className="h-4 w-4" />,
  'Zap': <Zap className="h-4 w-4" />,
  'Activity': <Activity className="h-4 w-4" />,
};

const getIcon = (iconName: string | null) => {
  if (!iconName) return <HelpCircle className="h-4 w-4" />;
  return ICON_MAP[iconName] || <HelpCircle className="h-4 w-4" />;
};

export function TrainingTypeSelector({ value, onChange, error }: TrainingTypeSelectorProps) {
  const { trainingTypes, isLoading } = useTrainingTypes();

  return (
    <div className="space-y-2">
      <Label htmlFor="training-type">
        Tipo de Entrenamiento <span className="text-destructive">*</span>
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as TrainingType)} disabled={isLoading}>
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando...</span>
            </div>
          ) : (
            <SelectValue placeholder="Selecciona el tipo de entrenamiento" />
          )}
        </SelectTrigger>
        <SelectContent>
          {trainingTypes.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex items-center gap-2">
                {getIcon(type.icon)}
                <span>{type.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// Exportar hook y tipos para uso en otros componentes
export { useTrainingTypes } from '@/hooks/use-training-types';
