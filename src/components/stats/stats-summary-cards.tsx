'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, Calendar, TrendingUp } from 'lucide-react';

interface StatsData {
  totalTrainings: number;
  totalDuration: number;
  thisWeek: {
    trainings: number;
    duration: number;
  };
  thisMonth: {
    trainings: number;
    duration: number;
  };
}

interface StatsSummaryCardsProps {
  stats: StatsData;
}

export function StatsSummaryCards({ stats }: StatsSummaryCardsProps) {
  const formatHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Entrenamientos</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTrainings}</div>
          <p className="text-xs text-muted-foreground">Todos los tiempos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatHours(stats.totalDuration)}</div>
          <p className="text-xs text-muted-foreground">Acumulado</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.thisWeek.trainings}</div>
          <p className="text-xs text-muted-foreground">
            {formatHours(stats.thisWeek.duration)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.thisMonth.trainings}</div>
          <p className="text-xs text-muted-foreground">
            {formatHours(stats.thisMonth.duration)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

