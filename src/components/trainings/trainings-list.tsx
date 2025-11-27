'use client';

import { useEffect, useState } from 'react';
import { GymTrainingCard } from './gym-training-card';
import { SportTrainingCard } from './sport-training-card';
import { GymTrainingListItem } from './gym-training-list-item';
import { SportTrainingListItem } from './sport-training-list-item';
import { formatDate, isSameDay } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Training {
  id: string;
  date: string;
  training_type: 'gym' | 'sport';
  [key: string]: any;
}

type ViewMode = 'cards' | 'list';

interface TrainingsListProps {
  trainings: Training[];
  loading?: boolean;
  viewMode?: ViewMode;
  selectedIds?: Set<string>;
  onSelectChange?: (id: string, selected: boolean) => void;
}

export function TrainingsList({ 
  trainings, 
  loading, 
  viewMode = 'cards',
  selectedIds = new Set(),
  onSelectChange
}: TrainingsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (trainings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No tienes entrenamientos registrados aún.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            ¡Crea tu primer entrenamiento para comenzar!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar entrenamientos por fecha
  const groupedTrainings: { [key: string]: Training[] } = {};
  
  trainings.forEach((training) => {
    const dateKey = training.date.split('T')[0]; // YYYY-MM-DD
    if (!groupedTrainings[dateKey]) {
      groupedTrainings[dateKey] = [];
    }
    groupedTrainings[dateKey].push(training);
  });

  // Ordenar las fechas (más recientes primero)
  const sortedDates = Object.keys(groupedTrainings).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedDates.map((dateKey) => {
        const dayTrainings = groupedTrainings[dateKey];
        const date = new Date(dateKey);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        let dateLabel: string;
        if (isSameDay(date, today)) {
          dateLabel = 'Hoy';
        } else if (isSameDay(date, yesterday)) {
          dateLabel = 'Ayer';
        } else {
          dateLabel = formatDate(date);
        }

        return (
          <div key={dateKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{dateLabel}</h2>
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">
                {dayTrainings.length} entrenamiento{dayTrainings.length !== 1 ? 's' : ''}
              </span>
            </div>
            {viewMode === 'cards' ? (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {dayTrainings.map((training) => {
                  const isSelected = selectedIds.has(training.id);
                  const handleSelectChange = (selected: boolean) => {
                    onSelectChange?.(training.id, selected);
                  };
                  
                  if (training.training_type === 'gym') {
                    return (
                      <GymTrainingCard
                        key={training.id}
                        training={training}
                        showDateHeader={false}
                        isSelected={isSelected}
                        onSelectChange={onSelectChange ? handleSelectChange : undefined}
                      />
                    );
                  } else {
                    return (
                      <SportTrainingCard
                        key={training.id}
                        training={training}
                        showDateHeader={false}
                        isSelected={isSelected}
                        onSelectChange={onSelectChange ? handleSelectChange : undefined}
                      />
                    );
                  }
                })}
              </div>
            ) : (
              <div className="space-y-0 border border-border rounded-lg bg-card">
                {dayTrainings.map((training, index) => {
                  const isLast = index === dayTrainings.length - 1;
                  const isSelected = selectedIds.has(training.id);
                  const handleSelectChange = (selected: boolean) => {
                    onSelectChange?.(training.id, selected);
                  };
                  
                  if (training.training_type === 'gym') {
                    return (
                      <GymTrainingListItem
                        key={training.id}
                        training={training}
                        isLast={isLast}
                        isSelected={isSelected}
                        onSelectChange={onSelectChange ? handleSelectChange : undefined}
                      />
                    );
                  } else {
                    return (
                      <SportTrainingListItem
                        key={training.id}
                        training={training}
                        isLast={isLast}
                        isSelected={isSelected}
                        onSelectChange={onSelectChange ? handleSelectChange : undefined}
                      />
                    );
                  }
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}







