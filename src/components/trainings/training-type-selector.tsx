'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dumbbell, Activity, Heart, StretchHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrainingType = 'gym' | 'sport' | 'cardio' | 'flexibility' | 'other';

interface TrainingTypeOption {
  type: TrainingType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const trainingTypes: TrainingTypeOption[] = [
  {
    type: 'gym',
    label: 'Gimnasio',
    description: 'Entrenamiento con pesas y máquinas',
    icon: <Dumbbell className="h-6 w-6" />,
  },
  {
    type: 'sport',
    label: 'Deporte',
    description: 'Running, ciclismo, natación, etc.',
    icon: <Activity className="h-6 w-6" />,
  },
  {
    type: 'cardio',
    label: 'Cardio',
    description: 'Ejercicios cardiovasculares',
    icon: <Heart className="h-6 w-6" />,
  },
  {
    type: 'flexibility',
    label: 'Flexibilidad',
    description: 'Yoga, estiramientos, pilates',
    icon: <StretchHorizontal className="h-6 w-6" />,
  },
  {
    type: 'other',
    label: 'Otro',
    description: 'Otro tipo de entrenamiento',
    icon: <Plus className="h-6 w-6" />,
  },
];

interface TrainingTypeSelectorProps {
  onSelect: (type: TrainingType) => void;
}

export function TrainingTypeSelector({ onSelect }: TrainingTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Selecciona el tipo de entrenamiento que deseas registrar.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainingTypes.map((option) => (
          <Card
            key={option.type}
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
            onClick={() => onSelect(option.type)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  {option.icon}
                </div>
                <CardTitle className="text-lg">{option.label}</CardTitle>
              </div>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

















