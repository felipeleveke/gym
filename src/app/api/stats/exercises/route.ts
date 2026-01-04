import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subDays } from 'date-fns';

// GET /api/stats/exercises - Obtener estadísticas detalladas por ejercicio
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const exerciseId = searchParams.get('exerciseId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Fechas por defecto: últimos 90 días para ver evolución
        const now = new Date();
        const defaultStartDate = subDays(now, 90).toISOString();
        const defaultEndDate = now.toISOString();

        const filterStartDate = startDate || defaultStartDate;
        const filterEndDate = endDate || defaultEndDate;

        // Si se proporciona un exerciseId, obtener estadísticas detalladas de ese ejercicio
        if (exerciseId) {
            // Obtener información del ejercicio
            const { data: exercise, error: exerciseError } = await supabase
                .from('exercises')
                .select('id, name, muscle_groups, muscle_groups_json')
                .eq('id', exerciseId)
                .single();

            if (exerciseError || !exercise) {
                return NextResponse.json({ error: 'Ejercicio no encontrado' }, { status: 404 });
            }

            // Obtener todos los entrenamientos que incluyen este ejercicio
            const { data: trainingExercises, error: teError } = await supabase
                .from('training_exercises')
                .select(`
          id,
          order_index,
          notes,
          training:gym_trainings!inner (
            id,
            date,
            duration,
            user_id
          ),
          exercise_sets (
            id,
            set_number,
            weight,
            reps,
            rir,
            set_type,
            notes
          )
        `)
                .eq('exercise_id', exerciseId)
                .eq('training.user_id', user.id)
                .gte('training.date', filterStartDate)
                .lte('training.date', filterEndDate);

            if (teError) {
                console.error('Error fetching training exercises:', teError);
                return NextResponse.json(
                    { error: 'Error al obtener datos del ejercicio' },
                    { status: 500 }
                );
            }

            // Ordenar por fecha del entrenamiento en JavaScript
            const sortedTrainingExercises = trainingExercises?.sort((a: any, b: any) => {
                const dateA = new Date(a.training?.date || 0).getTime();
                const dateB = new Date(b.training?.date || 0).getTime();
                return dateA - dateB;
            }) || [];

            // Procesar datos para gráficos de evolución
            const evolutionData: Array<{
                date: string;
                trainingId: string;
                maxWeight: number;
                avgWeight: number;
                totalReps: number;
                avgReps: number;
                avgRir: number | null;
                totalSets: number;
                volume: number;
                sets: Array<{
                    setNumber: number;
                    weight: number | null;
                    reps: number | null;
                    rir: number | null;
                    setType: string | null;
                }>;
            }> = [];

            let allTimeMaxWeight = 0;
            let allTimeMaxVolume = 0;
            let totalTrainingSessions = 0;

            sortedTrainingExercises.forEach((te: any) => {
                const training = te.training;
                if (!training) return;

                totalTrainingSessions++;
                const sets = te.exercise_sets || [];

                // Calcular estadísticas por sesión
                let maxWeight = 0;
                let totalWeight = 0;
                let totalReps = 0;
                let totalRir = 0;
                let rirCount = 0;
                let weightCount = 0;

                const processedSets = sets.map((set: any) => {
                    const weight = set.weight || 0;
                    const reps = set.reps || 0;

                    if (weight > maxWeight) maxWeight = weight;
                    if (weight > 0) {
                        totalWeight += weight;
                        weightCount++;
                    }
                    totalReps += reps;

                    if (set.rir !== null && set.rir !== undefined) {
                        totalRir += set.rir;
                        rirCount++;
                    }

                    return {
                        setNumber: set.set_number,
                        weight: set.weight,
                        reps: set.reps,
                        rir: set.rir,
                        setType: set.set_type,
                    };
                });

                const sessionVolume = sets.reduce((sum: number, set: any) => {
                    return sum + ((set.weight || 0) * (set.reps || 0));
                }, 0);

                if (maxWeight > allTimeMaxWeight) allTimeMaxWeight = maxWeight;
                if (sessionVolume > allTimeMaxVolume) allTimeMaxVolume = sessionVolume;

                evolutionData.push({
                    date: training.date,
                    trainingId: training.id,
                    maxWeight,
                    avgWeight: weightCount > 0 ? Math.round(totalWeight / weightCount * 10) / 10 : 0,
                    totalReps,
                    avgReps: sets.length > 0 ? Math.round(totalReps / sets.length * 10) / 10 : 0,
                    avgRir: rirCount > 0 ? Math.round(totalRir / rirCount * 10) / 10 : null,
                    totalSets: sets.length,
                    volume: sessionVolume,
                    sets: processedSets,
                });
            });

            // Calcular estadísticas por número de serie (para ver progresión en cada serie)
            const setProgression: Record<number, Array<{
                date: string;
                weight: number | null;
                reps: number | null;
                rir: number | null;
            }>> = {};

            evolutionData.forEach(session => {
                session.sets.forEach(set => {
                    if (!setProgression[set.setNumber]) {
                        setProgression[set.setNumber] = [];
                    }
                    setProgression[set.setNumber].push({
                        date: session.date,
                        weight: set.weight,
                        reps: set.reps,
                        rir: set.rir,
                    });
                });
            });

            return NextResponse.json({
                data: {
                    exercise: {
                        id: exercise.id,
                        name: exercise.name,
                        muscleGroups: exercise.muscle_groups_json || exercise.muscle_groups,
                    },
                    summary: {
                        totalSessions: totalTrainingSessions,
                        allTimeMaxWeight,
                        allTimeMaxVolume,
                    },
                    evolution: evolutionData,
                    setProgression,
                },
            });
        }

        // Si no se proporciona exerciseId, devolver lista de ejercicios con estadísticas básicas
        const { data: exercises, error: exercisesError } = await supabase
            .from('exercises')
            .select('id, name, muscle_groups, muscle_groups_json')
            .order('name');

        if (exercisesError) {
            console.error('Error fetching exercises:', exercisesError);
            throw exercisesError;
        }

        // Obtener conteo de uso de cada ejercicio por el usuario
        const { data: trainingExercises, error: teError } = await supabase
            .from('training_exercises')
            .select(`
        exercise_id,
        training:gym_trainings!inner (
          user_id,
          date
        )
      `)
            .eq('training.user_id', user.id)
            .gte('training.date', filterStartDate)
            .lte('training.date', filterEndDate);

        if (teError) {
            console.error('Error fetching training exercises:', teError);
            throw teError;
        }

        // Contar uso de cada ejercicio
        const exerciseUsage: Record<string, { count: number; lastUsed: string | null }> = {};
        trainingExercises?.forEach((te: any) => {
            const exerciseId = te.exercise_id;
            if (!exerciseUsage[exerciseId]) {
                exerciseUsage[exerciseId] = { count: 0, lastUsed: null };
            }
            exerciseUsage[exerciseId].count++;
            const trainingDate = te.training?.date;
            if (trainingDate && (!exerciseUsage[exerciseId].lastUsed ||
                new Date(trainingDate) > new Date(exerciseUsage[exerciseId].lastUsed!))) {
                exerciseUsage[exerciseId].lastUsed = trainingDate;
            }
        });

        // Combinar ejercicios con su uso
        const exercisesWithStats = exercises?.map(ex => ({
            id: ex.id,
            name: ex.name,
            muscleGroups: ex.muscle_groups_json || ex.muscle_groups,
            usageCount: exerciseUsage[ex.id]?.count || 0,
            lastUsed: exerciseUsage[ex.id]?.lastUsed || null,
        }))
            .filter(ex => ex.usageCount > 0) // Solo mostrar ejercicios usados
            .sort((a, b) => b.usageCount - a.usageCount);

        return NextResponse.json({
            data: {
                exercises: exercisesWithStats,
            },
        });
    } catch (error) {
        console.error('Error in GET /api/stats/exercises:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
