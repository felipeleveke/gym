'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatsSummaryCards } from './stats-summary-cards';
import { ActivityChart } from './activity-chart';
import { TrainingTypeChart } from './training-type-chart';
import { MuscleGroupsChart } from './muscle-groups-chart';
import { TopExercisesList } from './top-exercises-list';
import { useToast } from '@/hooks/use-toast';

interface TrainingData {
  id: string;
  date: string;
  duration: number;
  training_type: 'gym' | 'sport';
  training_exercises?: Array<{
    exercise_id: string;
    exercise?: {
      id: string;
      name: string;
      muscle_groups?: string[];
      muscle_groups_json?: Array<{ name: string }>;
    };
  }>;
}

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
  weeklyActivity: Array<{
    week: string;
    count: number;
  }>;
  trainingTypeDistribution: Array<{
    type: string;
    count: number;
  }>;
  muscleGroupsFrequency: Array<{
    name: string;
    count: number;
  }>;
  topExercises: Array<{
    exerciseId: string;
    name: string;
    count: number;
  }>;
}

export function StatsPageClient() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        // Obtener todos los entrenamientos
        const [gymResult, sportResult] = await Promise.all([
          supabase
            .from('gym_trainings')
            .select(`
              id,
              date,
              duration,
              training_exercises (
                exercise_id,
                exercise:exercises (
                  id,
                  name,
                  muscle_groups,
                  muscle_groups_json
                )
              )
            `)
            .eq('user_id', user.id)
            .order('date', { ascending: false }),
          supabase
            .from('sport_trainings')
            .select('id, date, duration')
            .eq('user_id', user.id)
            .order('date', { ascending: false }),
        ]);

        if (gymResult.error) throw gymResult.error;
        if (sportResult.error) throw sportResult.error;

        const gymTrainings: TrainingData[] = (gymResult.data || []).map((t) => ({
          ...t,
          training_type: 'gym' as const,
        }));

        const sportTrainings: TrainingData[] = (sportResult.data || []).map((t) => ({
          ...t,
          training_type: 'sport' as const,
        }));

        const allTrainings = [...gymTrainings, ...sportTrainings];

        // Calcular estadísticas
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const thisWeekTrainings = allTrainings.filter(
          (t) => new Date(t.date) >= startOfWeek
        );
        const thisMonthTrainings = allTrainings.filter(
          (t) => new Date(t.date) >= startOfMonth
        );

        const totalDuration = allTrainings.reduce((sum, t) => sum + (t.duration || 0), 0);
        const thisWeekDuration = thisWeekTrainings.reduce((sum, t) => sum + (t.duration || 0), 0);
        const thisMonthDuration = thisMonthTrainings.reduce((sum, t) => sum + (t.duration || 0), 0);

        // Actividad semanal (últimas 8 semanas)
        const weeklyActivity: Array<{ week: string; count: number }> = [];
        const startOfCurrentWeek = new Date(now);
        startOfCurrentWeek.setDate(now.getDate() - now.getDay());
        startOfCurrentWeek.setHours(0, 0, 0, 0);

        for (let i = 7; i >= 0; i--) {
          const weekStart = new Date(startOfCurrentWeek);
          weekStart.setDate(startOfCurrentWeek.getDate() - i * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          weekEnd.setHours(23, 59, 59, 999);

          const weekTrainings = allTrainings.filter(
            (t) => {
              const trainingDate = new Date(t.date);
              return trainingDate >= weekStart && trainingDate <= weekEnd;
            }
          );

          const weekLabel = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
          weeklyActivity.push({
            week: weekLabel,
            count: weekTrainings.length,
          });
        }

        // Distribución por tipo
        const typeCounts = new Map<string, number>();
        allTrainings.forEach((t) => {
          const type = t.training_type;
          typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
        });

        const trainingTypeDistribution = Array.from(typeCounts.entries()).map(([type, count]) => ({
          type: type === 'gym' ? 'Gimnasio' : type === 'sport' ? 'Deportivo' : type,
          count,
        }));

        // Frecuencia de grupos musculares
        const muscleGroupsMap = new Map<string, number>();
        gymTrainings.forEach((training) => {
          training.training_exercises?.forEach((te) => {
            const exercise = te.exercise;
            if (exercise) {
              // Priorizar muscle_groups_json
              if (exercise.muscle_groups_json && Array.isArray(exercise.muscle_groups_json)) {
                exercise.muscle_groups_json.forEach((mg) => {
                  if (mg.name) {
                    const name = mg.name.toLowerCase();
                    muscleGroupsMap.set(name, (muscleGroupsMap.get(name) || 0) + 1);
                  }
                });
              } else if (exercise.muscle_groups && Array.isArray(exercise.muscle_groups)) {
                exercise.muscle_groups.forEach((mg) => {
                  const name = mg.toLowerCase();
                  muscleGroupsMap.set(name, (muscleGroupsMap.get(name) || 0) + 1);
                });
              }
            }
          });
        });

        const muscleGroupsFrequency = Array.from(muscleGroupsMap.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Top ejercicios
        const exerciseCounts = new Map<string, { name: string; count: number }>();
        gymTrainings.forEach((training) => {
          training.training_exercises?.forEach((te) => {
            const exercise = te.exercise;
            if (exercise) {
              const current = exerciseCounts.get(exercise.id) || { name: exercise.name, count: 0 };
              exerciseCounts.set(exercise.id, {
                name: exercise.name,
                count: current.count + 1,
              });
            }
          });
        });

        const topExercises = Array.from(exerciseCounts.entries())
          .map(([exerciseId, data]) => ({
            exerciseId,
            name: data.name,
            count: data.count,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setStats({
          totalTrainings: allTrainings.length,
          totalDuration,
          thisWeek: {
            trainings: thisWeekTrainings.length,
            duration: thisWeekDuration,
          },
          thisMonth: {
            trainings: thisMonthTrainings.length,
            duration: thisMonthDuration,
          },
          weeklyActivity,
          trainingTypeDistribution,
          muscleGroupsFrequency,
          topExercises,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las estadísticas',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Cargando estadísticas...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">No hay datos disponibles</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatsSummaryCards stats={stats} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityChart data={stats.weeklyActivity} />
        <TrainingTypeChart data={stats.trainingTypeDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MuscleGroupsChart data={stats.muscleGroupsFrequency} />
        <TopExercisesList exercises={stats.topExercises} />
      </div>
    </div>
  );
}

