import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { startOfWeek, startOfMonth, subDays } from 'date-fns';

// GET /api/stats/overview - Obtener estadísticas generales del usuario
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Fechas por defecto: últimos 30 días
        const now = new Date();
        const defaultStartDate = subDays(now, 30).toISOString();
        const defaultEndDate = now.toISOString();

        const filterStartDate = startDate || defaultStartDate;
        const filterEndDate = endDate || defaultEndDate;

        // Obtener entrenamientos de gimnasio
        const { data: gymTrainings, error: gymError } = await supabase
            .from('gym_trainings')
            .select(`
        id,
        date,
        duration,
        training_exercises (
          id,
          exercise_id,
          exercise:exercises (
            id,
            name,
            muscle_groups,
            muscle_groups_json
          ),
          exercise_sets (
            id,
            weight,
            reps,
            rir,
            rpe,
            duration
          )
        )
      `)
            .eq('user_id', user.id)
            .gte('date', filterStartDate)
            .lte('date', filterEndDate)
            .order('date', { ascending: false });

        if (gymError) {
            console.error('Error fetching gym trainings:', gymError);
            throw gymError;
        }

        // Obtener entrenamientos deportivos
        const { data: sportTrainings, error: sportError } = await supabase
            .from('sport_trainings')
            .select('id, date, duration, sport_type, distance')
            .eq('user_id', user.id)
            .gte('date', filterStartDate)
            .lte('date', filterEndDate)
            .order('date', { ascending: false });

        if (sportError) {
            console.error('Error fetching sport trainings:', sportError);
            throw sportError;
        }

        // Calcular estadísticas generales
        const totalGymTrainings = gymTrainings?.length || 0;
        const totalSportTrainings = sportTrainings?.length || 0;
        const totalTrainings = totalGymTrainings + totalSportTrainings;

        // Duración total en minutos
        const totalGymDuration = gymTrainings?.reduce((sum, t) => sum + (t.duration || 0), 0) || 0;
        const totalSportDuration = sportTrainings?.reduce((sum, t) => sum + (t.duration || 0), 0) || 0;
        const totalDuration = totalGymDuration + totalSportDuration;

        // Duración promedio
        const avgDuration = totalTrainings > 0 ? Math.round(totalDuration / totalTrainings) : 0;

        // Estadísticas de esta semana
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();
        const thisWeekGym = gymTrainings?.filter(t => new Date(t.date) >= new Date(weekStart)).length || 0;
        const thisWeekSport = sportTrainings?.filter(t => new Date(t.date) >= new Date(weekStart)).length || 0;
        const thisWeekDuration =
            (gymTrainings?.filter(t => new Date(t.date) >= new Date(weekStart)).reduce((sum, t) => sum + (t.duration || 0), 0) || 0) +
            (sportTrainings?.filter(t => new Date(t.date) >= new Date(weekStart)).reduce((sum, t) => sum + (t.duration || 0), 0) || 0);

        // Estadísticas de este mes
        const monthStart = startOfMonth(now).toISOString();
        const thisMonthGym = gymTrainings?.filter(t => new Date(t.date) >= new Date(monthStart)).length || 0;
        const thisMonthSport = sportTrainings?.filter(t => new Date(t.date) >= new Date(monthStart)).length || 0;
        const thisMonthDuration =
            (gymTrainings?.filter(t => new Date(t.date) >= new Date(monthStart)).reduce((sum, t) => sum + (t.duration || 0), 0) || 0) +
            (sportTrainings?.filter(t => new Date(t.date) >= new Date(monthStart)).reduce((sum, t) => sum + (t.duration || 0), 0) || 0);

        // Calcular volumen total (suma de peso * repeticiones) y tiempo de trabajo efectivo
        let totalVolume = 0;
        let totalWorkingTime = 0; // en segundos
        let totalRpe = 0;
        let rpeCount = 0;
        const exerciseCount: Record<string, { 
            name: string; 
            count: number; 
            totalVolume: number;
            totalWorkingTime: number;
            totalDuration: number;
        }> = {};
        const muscleGroupCount: Record<string, number> = {};
        const personalRecords: Record<string, { exerciseName: string; weight: number; reps: number; date: string }> = {};

        gymTrainings?.forEach(training => {
            const trainingDuration = training.duration || 0; // en minutos
            
            training.training_exercises?.forEach((te: any) => {
                const exerciseId = te.exercise_id;
                const exerciseName = te.exercise?.name || 'Desconocido';
                const muscleGroups = te.exercise?.muscle_groups_json || te.exercise?.muscle_groups || [];

                // Contar ejercicios
                if (!exerciseCount[exerciseId]) {
                    exerciseCount[exerciseId] = { 
                        name: exerciseName, 
                        count: 0, 
                        totalVolume: 0,
                        totalWorkingTime: 0,
                        totalDuration: 0
                    };
                }
                exerciseCount[exerciseId].count++;

                // Contar grupos musculares
                const groups = Array.isArray(muscleGroups)
                    ? muscleGroups.map((mg: any) => typeof mg === 'string' ? mg : mg.name)
                    : [];
                groups.forEach((mg: string) => {
                    const normalizedMg = mg.toLowerCase();
                    muscleGroupCount[normalizedMg] = (muscleGroupCount[normalizedMg] || 0) + 1;
                });

                // Procesar series
                let exerciseWorkingTime = 0;
                te.exercise_sets?.forEach((set: any) => {
                    const weight = set.weight || 0;
                    const reps = set.reps || 0;
                    const volume = weight * reps;
                    const setDuration = set.duration || 0; // en segundos
                    const rpe = set.rpe;

                    totalVolume += volume;
                    exerciseCount[exerciseId].totalVolume += volume;
                    
                    totalWorkingTime += setDuration;
                    exerciseWorkingTime += setDuration;

                    // Acumular RPE si tiene valor válido
                    if (rpe !== null && rpe !== undefined && rpe > 0) {
                        totalRpe += rpe;
                        rpeCount++;
                    }

                    // Actualizar récord personal si es necesario
                    if (weight > 0) {
                        if (!personalRecords[exerciseId] || weight > personalRecords[exerciseId].weight) {
                            personalRecords[exerciseId] = {
                                exerciseName,
                                weight,
                                reps,
                                date: training.date,
                            };
                        }
                    }
                });
                
                // Acumular duración total del ejercicio (duración del entrenamiento / número de ejercicios)
                exerciseCount[exerciseId].totalWorkingTime += exerciseWorkingTime;
                exerciseCount[exerciseId].totalDuration += trainingDuration;
            });
        });

        // Calcular densidades totales
        const totalDurationSeconds = totalGymDuration * 60; // convertir minutos a segundos
        const relativeDensity = totalDurationSeconds > 0
            ? Math.round((totalWorkingTime / totalDurationSeconds) * 100)
            : 0;
        const absoluteDensity = totalGymDuration > 0
            ? totalVolume / totalGymDuration
            : 0;
        
        // Calcular RPE promedio
        const avgRpe = rpeCount > 0
            ? Math.round((totalRpe / rpeCount) * 10) / 10 // Redondear a 1 decimal
            : null;

        // Top 5 ejercicios más usados
        const topExercises = Object.entries(exerciseCount)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([id, data]) => {
                // Calcular densidades por ejercicio
                const exerciseDurationSeconds = data.totalDuration * 60;
                const exerciseRelativeDensity = exerciseDurationSeconds > 0
                    ? Math.round((data.totalWorkingTime / exerciseDurationSeconds) * 100)
                    : 0;
                const exerciseAbsoluteDensity = data.totalDuration > 0
                    ? data.totalVolume / data.totalDuration
                    : 0;

                return {
                    exerciseId: id,
                    name: data.name,
                    count: data.count,
                    totalVolume: Math.round(data.totalVolume),
                    relativeDensity: exerciseRelativeDensity,
                    absoluteDensity: Math.round(exerciseAbsoluteDensity),
                };
            });

        // Distribución de grupos musculares
        const muscleGroupDistribution = Object.entries(muscleGroupCount)
            .sort((a, b) => b[1] - a[1])
            .map(([name, count]) => ({ name, count }));

        // Top 5 récords personales (por peso)
        const topPersonalRecords = Object.entries(personalRecords)
            .sort((a, b) => b[1].weight - a[1].weight)
            .slice(0, 5)
            .map(([exerciseId, record]) => ({
                exerciseId,
                ...record,
            }));

        // Entrenamientos por día (para gráfico de evolución)
        const trainingsByDate: Record<string, { gym: number; sport: number; duration: number; volume: number }> = {};

        gymTrainings?.forEach(training => {
            const dateKey = new Date(training.date).toISOString().split('T')[0];
            if (!trainingsByDate[dateKey]) {
                trainingsByDate[dateKey] = { gym: 0, sport: 0, duration: 0, volume: 0 };
            }
            trainingsByDate[dateKey].gym++;
            trainingsByDate[dateKey].duration += training.duration || 0;

            // Calcular volumen para este entrenamiento
            let dayVolume = 0;
            training.training_exercises?.forEach((te: any) => {
                te.exercise_sets?.forEach((set: any) => {
                    dayVolume += (set.weight || 0) * (set.reps || 0);
                });
            });
            trainingsByDate[dateKey].volume += dayVolume;
        });

        sportTrainings?.forEach(training => {
            const dateKey = new Date(training.date).toISOString().split('T')[0];
            if (!trainingsByDate[dateKey]) {
                trainingsByDate[dateKey] = { gym: 0, sport: 0, duration: 0, volume: 0 };
            }
            trainingsByDate[dateKey].sport++;
            trainingsByDate[dateKey].duration += training.duration || 0;
        });

        // Convertir a array ordenado por fecha
        const trainingEvolution = Object.entries(trainingsByDate)
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return NextResponse.json({
            data: {
                summary: {
                    totalTrainings,
                    totalGymTrainings,
                    totalSportTrainings,
                    totalDuration,
                    avgDuration,
                    totalVolume: Math.round(totalVolume),
                    totalWorkingTime: Math.round(totalWorkingTime),
                    relativeDensity,
                    absoluteDensity: Math.round(absoluteDensity),
                    avgRpe,
                },
                thisWeek: {
                    trainings: thisWeekGym + thisWeekSport,
                    gymTrainings: thisWeekGym,
                    sportTrainings: thisWeekSport,
                    duration: thisWeekDuration,
                },
                thisMonth: {
                    trainings: thisMonthGym + thisMonthSport,
                    gymTrainings: thisMonthGym,
                    sportTrainings: thisMonthSport,
                    duration: thisMonthDuration,
                },
                topExercises,
                muscleGroupDistribution,
                personalRecords: topPersonalRecords,
                trainingEvolution,
            },
        });
    } catch (error) {
        console.error('Error in GET /api/stats/overview:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
