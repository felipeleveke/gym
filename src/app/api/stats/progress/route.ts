import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { subDays, startOfWeek, startOfMonth, format, parseISO } from 'date-fns';

// GET /api/stats/progress - Análisis temporal de progreso
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
        const groupBy = searchParams.get('groupBy') || 'week'; // 'day' | 'week' | 'month'

        // Fechas por defecto: últimos 90 días
        const now = new Date();
        const defaultStartDate = subDays(now, 90).toISOString();
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
            .order('date', { ascending: true });

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
            .order('date', { ascending: true });

        if (sportError) {
            console.error('Error fetching sport trainings:', sportError);
            throw sportError;
        }

        // Función para obtener la clave de agrupación según groupBy
        const getGroupKey = (date: string): string => {
            const dateObj = parseISO(date);
            switch (groupBy) {
                case 'day':
                    return format(dateObj, 'yyyy-MM-dd');
                case 'week':
                    const weekStart = startOfWeek(dateObj, { weekStartsOn: 1 });
                    return format(weekStart, 'yyyy-MM-dd');
                case 'month':
                    const monthStart = startOfMonth(dateObj);
                    return format(monthStart, 'yyyy-MM');
                default:
                    return format(dateObj, 'yyyy-MM-dd');
            }
        };

        // Agrupar datos por período
        const groupedData: Record<string, {
            period: string;
            gymTrainings: number;
            sportTrainings: number;
            totalTrainings: number;
            totalDuration: number;
            totalVolume: number;
            avgDuration: number;
            avgVolume: number;
            muscleGroupDistribution: Record<string, number>;
        }> = {};

        // Procesar entrenamientos de gimnasio
        gymTrainings?.forEach(training => {
            const groupKey = getGroupKey(training.date);
            
            if (!groupedData[groupKey]) {
                groupedData[groupKey] = {
                    period: groupKey,
                    gymTrainings: 0,
                    sportTrainings: 0,
                    totalTrainings: 0,
                    totalDuration: 0,
                    totalVolume: 0,
                    avgDuration: 0,
                    avgVolume: 0,
                    muscleGroupDistribution: {},
                };
            }

            const group = groupedData[groupKey];
            group.gymTrainings++;
            group.totalTrainings++;
            group.totalDuration += training.duration || 0;

            // Calcular volumen
            let trainingVolume = 0;
            training.training_exercises?.forEach((te: any) => {
                te.exercise_sets?.forEach((set: any) => {
                    trainingVolume += (set.weight || 0) * (set.reps || 0);
                });
            });
            group.totalVolume += trainingVolume;
        });

        // Procesar entrenamientos deportivos
        sportTrainings?.forEach(training => {
            const groupKey = getGroupKey(training.date);
            
            if (!groupedData[groupKey]) {
                groupedData[groupKey] = {
                    period: groupKey,
                    gymTrainings: 0,
                    sportTrainings: 0,
                    totalTrainings: 0,
                    totalDuration: 0,
                    totalVolume: 0,
                    avgDuration: 0,
                    avgVolume: 0,
                    muscleGroupDistribution: {},
                };
            }

            const group = groupedData[groupKey];
            group.sportTrainings++;
            group.totalTrainings++;
            group.totalDuration += training.duration || 0;
        });

        // Calcular promedios y formatear datos
        const progressData = Object.values(groupedData)
            .map(group => {
                if (group.totalTrainings > 0) {
                    group.avgDuration = Math.round(group.totalDuration / group.totalTrainings);
                    group.avgVolume = Math.round(group.totalVolume / group.totalTrainings);
                }
                return group;
            })
            .sort((a, b) => a.period.localeCompare(b.period));

        // Calcular estadísticas de frecuencia
        const totalDays = Math.ceil(
            (new Date(filterEndDate).getTime() - new Date(filterStartDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        const totalWeeks = Math.ceil(totalDays / 7);
        const totalMonths = Math.ceil(totalDays / 30);

        const totalGymTrainings = gymTrainings?.length || 0;
        const totalSportTrainings = sportTrainings?.length || 0;
        const totalTrainings = totalGymTrainings + totalSportTrainings;

        const frequencyStats = {
            trainingsPerDay: totalDays > 0 ? Math.round((totalTrainings / totalDays) * 10) / 10 : 0,
            trainingsPerWeek: totalWeeks > 0 ? Math.round((totalTrainings / totalWeeks) * 10) / 10 : 0,
            trainingsPerMonth: totalMonths > 0 ? Math.round((totalTrainings / totalMonths) * 10) / 10 : 0,
            totalDays,
            totalWeeks,
            totalMonths,
        };

        // Calcular tendencias (comparar primera mitad vs segunda mitad del período)
        const midPoint = Math.floor(progressData.length / 2);
        const firstHalf = progressData.slice(0, midPoint);
        const secondHalf = progressData.slice(midPoint);

        const calculateAverage = (data: typeof progressData, field: 'totalTrainings' | 'totalVolume' | 'totalDuration') => {
            if (data.length === 0) return 0;
            const sum = data.reduce((acc, item) => acc + item[field], 0);
            return sum / data.length;
        };

        const trends = {
            trainings: {
                firstHalf: calculateAverage(firstHalf, 'totalTrainings'),
                secondHalf: calculateAverage(secondHalf, 'totalTrainings'),
                change: secondHalf.length > 0 && firstHalf.length > 0
                    ? Math.round(((calculateAverage(secondHalf, 'totalTrainings') - calculateAverage(firstHalf, 'totalTrainings')) / calculateAverage(firstHalf, 'totalTrainings')) * 100)
                    : 0,
            },
            volume: {
                firstHalf: calculateAverage(firstHalf, 'totalVolume'),
                secondHalf: calculateAverage(secondHalf, 'totalVolume'),
                change: secondHalf.length > 0 && firstHalf.length > 0
                    ? Math.round(((calculateAverage(secondHalf, 'totalVolume') - calculateAverage(firstHalf, 'totalVolume')) / (calculateAverage(firstHalf, 'totalVolume') || 1)) * 100)
                    : 0,
            },
            duration: {
                firstHalf: calculateAverage(firstHalf, 'totalDuration'),
                secondHalf: calculateAverage(secondHalf, 'totalDuration'),
                change: secondHalf.length > 0 && firstHalf.length > 0
                    ? Math.round(((calculateAverage(secondHalf, 'totalDuration') - calculateAverage(firstHalf, 'totalDuration')) / (calculateAverage(firstHalf, 'totalDuration') || 1)) * 100)
                    : 0,
            },
        };

        return NextResponse.json({
            data: {
                progress: progressData,
                frequency: frequencyStats,
                trends,
                summary: {
                    totalTrainings,
                    totalGymTrainings,
                    totalSportTrainings,
                    totalVolume: progressData.reduce((sum, p) => sum + p.totalVolume, 0),
                    totalDuration: progressData.reduce((sum, p) => sum + p.totalDuration, 0),
                },
            },
        });
    } catch (error) {
        console.error('Error in GET /api/stats/progress:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}






