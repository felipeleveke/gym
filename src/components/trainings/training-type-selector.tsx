'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dumbbell, 
  Activity, 
  Heart, 
  StretchHorizontal, 
  Plus,
  Flame,
  Zap,
  Trophy,
  Sparkles,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { useTrainingTypes, TrainingTypeValue } from '@/hooks/use-training-types';

// Re-exportar el tipo para compatibilidad
type TrainingType = TrainingTypeValue;

interface TrainingTypeSelectorProps {
  onSelect: (type: TrainingType) => void;
}

// Mapeo de nombres de iconos a componentes (versión grande para cards)
const ICON_MAP_LARGE: Record<string, React.ReactNode> = {
  'Dumbbell': <Dumbbell className="h-6 w-6" />,
  'Heart': <Heart className="h-6 w-6" />,
  'Trophy': <Trophy className="h-6 w-6" />,
  'Sparkles': <Sparkles className="h-6 w-6" />,
  'HelpCircle': <HelpCircle className="h-6 w-6" />,
  'Flame': <Flame className="h-6 w-6" />,
  'Zap': <Zap className="h-6 w-6" />,
  'Activity': <Activity className="h-6 w-6" />,
  'StretchHorizontal': <StretchHorizontal className="h-6 w-6" />,
  'Plus': <Plus className="h-6 w-6" />,
};

const getIcon = (iconName: string | null) => {
  if (!iconName) return <HelpCircle className="h-6 w-6" />;
  return ICON_MAP_LARGE[iconName] || <HelpCircle className="h-6 w-6" />;
};

export function TrainingTypeSelector({ onSelect }: TrainingTypeSelectorProps) {
  const { trainingTypes, isLoading } = useTrainingTypes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Selecciona el tipo de entrenamiento que deseas registrar.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainingTypes.map((option) => (
          <Card
            key={option.value}
            className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
            onClick={() => onSelect(option.value as TrainingType)}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-primary/10 text-primary">
                  {getIcon(option.icon)}
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




























