'use client';

import { useEffect, useState } from 'react';
import { GymTrainingCard } from './gym-training-card';
import { SportTrainingCard } from './sport-training-card';
import { formatDate, isSameDay } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Training {
  id: string;
  date: string;
  training_type: 'gym' | 'sport';
  [key: string]: any;
}

interface TrainingsListProps {
  trainings: Training[];
  loading?: boolean;
}

export function TrainingsList({ trainings, loading }: TrainingsListProps) {
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
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {dayTrainings.map((training) => {
                if (training.training_type === 'gym') {
                  return (
                    <GymTrainingCard
                      key={training.id}
                      training={training}
                      showDateHeader={false}
                    />
                  );
                } else {
                  return (
                    <SportTrainingCard
                      key={training.id}
                      training={training}
                      showDateHeader={false}
                    />
                  );
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}


