'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dumbbell, Heart, Trophy, Sparkles, HelpCircle } from 'lucide-react';

export type TrainingType = 'gym' | 'sport' | 'cardio' | 'flexibility' | 'other';

interface TrainingTypeSelectorProps {
  value?: TrainingType;
  onChange: (value: TrainingType) => void;
  error?: string;
}

const TRAINING_TYPES: { value: TrainingType; label: string; icon: React.ReactNode }[] = [
  { value: 'gym', label: 'Gimnasio / Pesas', icon: <Dumbbell className="h-4 w-4" /> },
  { value: 'cardio', label: 'Cardio', icon: <Heart className="h-4 w-4" /> },
  { value: 'sport', label: 'Deporte', icon: <Trophy className="h-4 w-4" /> },
  { value: 'flexibility', label: 'Flexibilidad', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'other', label: 'Otro', icon: <HelpCircle className="h-4 w-4" /> },
];

export function TrainingTypeSelector({ value, onChange, error }: TrainingTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="training-type">
        Tipo de Entrenamiento <span className="text-destructive">*</span>
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v as TrainingType)}>
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder="Selecciona el tipo de entrenamiento" />
        </SelectTrigger>
        <SelectContent>
          {TRAINING_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex items-center gap-2">
                {type.icon}
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

export { TRAINING_TYPES };
