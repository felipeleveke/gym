'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell } from 'lucide-react';

interface TopExercisesListProps {
  exercises: Array<{
    exerciseId: string;
    name: string;
    count: number;
  }>;
}

export function TopExercisesList({ exercises }: TopExercisesListProps) {
  if (exercises.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ejercicios Más Frecuentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ejercicios Más Frecuentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <div
              key={exercise.exerciseId}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                  {index + 1}
                </div>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Dumbbell className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium truncate">{exercise.name}</span>
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {exercise.count} {exercise.count === 1 ? 'vez' : 'veces'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

