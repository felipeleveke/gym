import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subDays } from 'date-fns';

// GET /api/stats/routines - Comparación de rendimiento entre rutinas
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const routineIdsParam = searchParams.get('routineIds');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Fechas por defecto: últimos 90 días
        const now = new Date();
        const defaultStartDate = subDays(now, 90).toISOString();
        const defaultEndDate = now.toISOString();

        const filterStartDate = startDate || defaultStartDate;
        const filterEndDate = endDate || defaultEndDate;

        // Parsear routineIds (puede venir como array en query string)
        let routineIds: string[] = [];
        if (routineIdsParam) {
            routineIds = Array.isArray(routineIdsParam) 
                ? routineIdsParam 
                : routineIdsParam.split(',').filter(id => id.trim());
        }

        // Obtener todas las rutinas del usuario si no se especifican IDs
        let routinesQuery = supabase
            .from('workout_routines')
            .select('id, name, type, created_at')
            .eq('user_id', user.id);

        if (routineIds.length > 0) {
            routinesQuery = routinesQuery.in('id', routineIds);
        }

        const { data: routines, error: routinesError } = await routinesQuery.order('created_at', { ascending: false });

        if (routinesError) {
            console.error('Error fetching routines:', routinesError);
            throw routinesError;
        }

        if (!routines || routines.length === 0) {
            return NextResponse.json({
                data: {
                    routines: [],
                    comparisons: [],
                },
            });
        }

        // Obtener entrenamientos de gimnasio que usan estas rutinas
        let trainingsQuery = supabase
            .from('gym_trainings')
            .select(`
                id,
                date,
                duration,
                routine_id,
                training_exercises (
                    id,
                    exercise_id,
                    exercise_sets (
                        id,
                        weight,
                        reps
                    )
                )
            `)
            .eq('user_id', user.id)
            .gte('date', filterStartDate)
            .lte('date', filterEndDate)
            .not('routine_id', 'is', null);

        if (routineIds.length > 0) {
            trainingsQuery = trainingsQuery.in('routine_id', routineIds);
        }

        const { data: trainings, error: trainingsError } = await trainingsQuery.order('date', { ascending: true });

        if (trainingsError) {
            console.error('Error fetching trainings:', trainingsError);
            throw trainingsError;
        }

        // Procesar datos por rutina
        const routineStats: Record<string, {
            routineId: string;
            routineName: string;
            routineType: string;
            totalTrainings: number;
            totalVolume: number;
            avgVolume: number;
            totalDuration: number;
            avgDuration: number;
            exerciseStats: Record<string, {
                exerciseId: string;
                exerciseName: string;
                avgWeight: number;
                maxWeight: number;
                totalSets: number;
                totalVolume: number;
            }>;
            evolution: Array<{
                date: string;
                volume: number;
                duration: number;
                trainingCount: number;
            }>;
        }> = {};

        // Inicializar estadísticas por rutina
        routines.forEach(routine => {
            routineStats[routine.id] = {
                routineId: routine.id,
                routineName: routine.name,
                routineType: routine.type,
                totalTrainings: 0,
                totalVolume: 0,
                avgVolume: 0,
                totalDuration: 0,
                avgDuration: 0,
                exerciseStats: {},
                evolution: [],
            };
        });

        // Agrupar entrenamientos por fecha y rutina
        const trainingsByDateAndRoutine: Record<string, Record<string, typeof trainings>> = {};

        trainings?.forEach(training => {
            if (!training.routine_id) return;

            const dateKey = new Date(training.date).toISOString().split('T')[0];
            if (!trainingsByDateAndRoutine[dateKey]) {
                trainingsByDateAndRoutine[dateKey] = {};
            }
            if (!trainingsByDateAndRoutine[dateKey][training.routine_id]) {
                trainingsByDateAndRoutine[dateKey][training.routine_id] = [];
            }
            trainingsByDateAndRoutine[dateKey][training.routine_id].push(training);
        });

        // Procesar cada entrenamiento
        trainings?.forEach(training => {
            if (!training.routine_id || !routineStats[training.routine_id]) return;

            const stats = routineStats[training.routine_id];
            stats.totalTrainings++;
            stats.totalDuration += training.duration || 0;

            // Calcular volumen del entrenamiento
            let trainingVolume = 0;
            const exerciseWeights: Record<string, { total: number; count: number; max: number }> = {};

            training.training_exercises?.forEach((te: any) => {
                const exerciseId = te.exercise_id;
                te.exercise_sets?.forEach((set: any) => {
                    const weight = set.weight || 0;
                    const reps = set.reps || 0;
                    const volume = weight * reps;
                    trainingVolume += volume;

                    if (!exerciseWeights[exerciseId]) {
                        exerciseWeights[exerciseId] = { total: 0, count: 0, max: 0 };
                    }
                    if (weight > 0) {
                        exerciseWeights[exerciseId].total += weight;
                        exerciseWeights[exerciseId].count++;
                        if (weight > exerciseWeights[exerciseId].max) {
                            exerciseWeights[exerciseId].max = weight;
                        }
                    }
                });
            });

            stats.totalVolume += trainingVolume;
        });

        // Obtener nombres de ejercicios para las estadísticas
        const exerciseIds = new Set<string>();
        trainings?.forEach(training => {
            training.training_exercises?.forEach((te: any) => {
                exerciseIds.add(te.exercise_id);
            });
        });

        const exercisesMap: Record<string, string> = {};
        if (exerciseIds.size > 0) {
            const { data: exercises } = await supabase
                .from('exercises')
                .select('id, name')
                .in('id', Array.from(exerciseIds));

            exercises?.forEach(ex => {
                exercisesMap[ex.id] = ex.name;
            });
        }

        // Procesar estadísticas de ejercicios por rutina
        trainings?.forEach(training => {
            if (!training.routine_id || !routineStats[training.routine_id]) return;

            const stats = routineStats[training.routine_id];
            training.training_exercises?.forEach((te: any) => {
                const exerciseId = te.exercise_id;
                const exerciseName = exercisesMap[exerciseId] || 'Desconocido';

                if (!stats.exerciseStats[exerciseId]) {
                    stats.exerciseStats[exerciseId] = {
                        exerciseId,
                        exerciseName,
                        avgWeight: 0,
                        maxWeight: 0,
                        totalSets: 0,
                        totalVolume: 0,
                    };
                }

                const exerciseStat = stats.exerciseStats[exerciseId];
                let exerciseTotalWeight = 0;
                let exerciseWeightCount = 0;

                te.exercise_sets?.forEach((set: any) => {
                    const weight = set.weight || 0;
                    const reps = set.reps || 0;
                    exerciseStat.totalSets++;
                    exerciseStat.totalVolume += weight * reps;

                    if (weight > 0) {
                        exerciseTotalWeight += weight;
                        exerciseWeightCount++;
                        if (weight > exerciseStat.maxWeight) {
                            exerciseStat.maxWeight = weight;
                        }
                    }
                });

                if (exerciseWeightCount > 0) {
                    exerciseStat.avgWeight = Math.round((exerciseTotalWeight / exerciseWeightCount) * 10) / 10;
                }
            });
        });

        // Calcular promedios y evolución
        Object.values(routineStats).forEach(stats => {
            if (stats.totalTrainings > 0) {
                stats.avgVolume = Math.round(stats.totalVolume / stats.totalTrainings);
                stats.avgDuration = Math.round(stats.totalDuration / stats.totalTrainings);
            }

            // Construir evolución por fecha
            Object.entries(trainingsByDateAndRoutine).forEach(([date, routinesForDate]) => {
                const routineTraining = routinesForDate[stats.routineId];
                if (routineTraining && routineTraining.length > 0) {
                    let dayVolume = 0;
                    let dayDuration = 0;

                    routineTraining.forEach(t => {
                        dayDuration += t.duration || 0;
                        t.training_exercises?.forEach((te: any) => {
                            te.exercise_sets?.forEach((set: any) => {
                                dayVolume += (set.weight || 0) * (set.reps || 0);
                            });
                        });
                    });

                    stats.evolution.push({
                        date,
                        volume: dayVolume,
                        duration: dayDuration,
                        trainingCount: routineTraining.length,
                    });
                }
            });

            // Ordenar evolución por fecha
            stats.evolution.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });

        // Convertir exerciseStats a array
        const comparisons = Object.values(routineStats).map(stats => ({
            ...stats,
            exerciseStats: Object.values(stats.exerciseStats),
        }));

        return NextResponse.json({
            data: {
                routines: routines.map(r => ({
                    id: r.id,
                    name: r.name,
                    type: r.type,
                })),
                comparisons,
            },
        });
    } catch (error) {
        console.error('Error in GET /api/stats/routines:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}


