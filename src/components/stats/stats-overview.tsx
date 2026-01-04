'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, Trophy, Activity, Clock, Dumbbell, Target, Zap, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatTooltip } from './stat-tooltip';

interface OverviewData {
    summary: {
        totalTrainings: number;
        totalGymTrainings: number;
        totalSportTrainings: number;
        totalDuration: number;
        avgDuration: number;
        totalVolume: number;
        totalWorkingTime?: number;
        relativeDensity?: number;
        absoluteDensity?: number;
        avgRpe?: number | null;
    };
    thisWeek: {
        trainings: number;
        gymTrainings: number;
        sportTrainings: number;
        duration: number;
    };
    thisMonth: {
        trainings: number;
        gymTrainings: number;
        sportTrainings: number;
        duration: number;
    };
    topExercises: Array<{
        exerciseId: string;
        name: string;
        count: number;
        totalVolume: number;
        relativeDensity?: number;
        absoluteDensity?: number;
    }>;
    personalRecords: Array<{
        exerciseId: string;
        exerciseName: string;
        weight: number;
        reps: number;
        date: string;
    }>;
}

interface StatsOverviewProps {
    dateRange: { startDate: string; endDate: string };
    className?: string;
}

export function StatsOverview({ dateRange, className }: StatsOverviewProps) {
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                });

                const response = await fetch(`/api/stats/overview?${params}`);
                if (!response.ok) throw new Error('Error al cargar estadísticas');

                const result = await response.json();
                setData(result.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching overview:', err);
                setError('Error al cargar las estadísticas');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange]);

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    const formatVolume = (kg: number) => {
        if (kg >= 1000) {
            return `${(kg / 1000).toFixed(1)}t`;
        }
        return `${Math.round(kg)}kg`;
    };

    if (loading) {
        return (
            <div className={cn('space-y-4', className)}>
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error || !data) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        {error || 'No se pudieron cargar las estadísticas'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const weekChange = data.thisWeek.trainings > 0 ? 100 : 0;
    const monthChange = data.thisMonth.trainings > 0 ? 100 : 0;

    return (
        <div className={cn('space-y-4', className)}>
            {/* Tarjetas principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">Total Entrenamientos</CardTitle>
                            <StatTooltip description="Suma total de entrenamientos de gimnasio y deportivos registrados en el período seleccionado. Se obtiene de las tablas gym_trainings y sport_trainings filtradas por fecha y usuario." />
                        </div>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.summary.totalTrainings}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.summary.totalGymTrainings} gym + {data.summary.totalSportTrainings} deporte
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">Tiempo Total</CardTitle>
                            <StatTooltip description="Suma de la duración de todos los entrenamientos (gimnasio y deportivos) en minutos. El promedio se calcula dividiendo el tiempo total entre el número de entrenamientos. Los datos provienen del campo 'duration' de gym_trainings y sport_trainings." />
                        </div>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatDuration(data.summary.totalDuration)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Promedio: {formatDuration(data.summary.avgDuration)} por sesión
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">Volumen Total</CardTitle>
                            <StatTooltip description="Suma del volumen de entrenamiento calculado como peso × repeticiones de todas las series realizadas. Se obtiene de exercise_sets (weight × reps) de todos los entrenamientos de gimnasio en el período. Fórmula: Σ(peso × reps) por cada serie." />
                        </div>
                        <Dumbbell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatVolume(data.summary.totalVolume)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Peso total levantado
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
                            <StatTooltip description="Estadísticas de la semana actual (desde el lunes hasta hoy). Cuenta entrenamientos y suma la duración de todos los entrenamientos realizados esta semana. Se calcula filtrando por fecha desde el inicio de la semana actual." />
                        </div>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.thisWeek.trainings}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatDuration(data.thisWeek.duration)} de entrenamiento
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tarjetas de Densidad y RPE */}
            {(data.summary.relativeDensity !== undefined || data.summary.absoluteDensity !== undefined || (data.summary.avgRpe !== null && data.summary.avgRpe !== undefined)) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.summary.relativeDensity !== undefined && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm font-medium">Densidad Relativa</CardTitle>
                                    <StatTooltip description="Porcentaje del tiempo total de entrenamiento que corresponde a trabajo efectivo (series). Se calcula como: (tiempo de trabajo efectivo en segundos / tiempo total en segundos) × 100. El tiempo de trabajo proviene del campo 'duration' de exercise_sets, y el tiempo total de 'duration' de gym_trainings." />
                                </div>
                                <Target className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.summary.relativeDensity}%
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    % tiempo de trabajo efectivo
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    {data.summary.absoluteDensity !== undefined && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm font-medium">Densidad Absoluta</CardTitle>
                                    <StatTooltip description="Volumen de entrenamiento por minuto de sesión. Indica la intensidad del entrenamiento. Se calcula como: volumen total (kg) / tiempo total de entrenamiento (minutos). Mide cuánto peso se levanta por cada minuto que pasas entrenando." />
                                </div>
                                <Zap className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {Math.round(data.summary.absoluteDensity)} kg/min
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Volumen por minuto
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    {data.summary.avgRpe !== null && data.summary.avgRpe !== undefined && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm font-medium">RPE Promedio</CardTitle>
                                    <StatTooltip description="Promedio del RPE (Rate of Perceived Exertion) de todas las series registradas en el período. El RPE es una escala del 1 al 10 que mide la percepción subjetiva del esfuerzo durante el ejercicio. Se calcula como el promedio de todos los valores de RPE registrados en exercise_sets." />
                                </div>
                                <Gauge className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {data.summary.avgRpe}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Esfuerzo percibido promedio
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Top Ejercicios y Récords Personales */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle>Top 5 Ejercicios</CardTitle>
                            <StatTooltip description="Los 5 ejercicios que más veces has realizado en el período seleccionado. Se ordenan por número de sesiones donde aparecen. El volumen mostrado es la suma de peso × reps de todas las series de ese ejercicio. Las densidades se calculan igual que las generales pero solo para ese ejercicio específico." />
                        </div>
                        <CardDescription>Más utilizados en el período</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.topExercises.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No hay ejercicios registrados
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {data.topExercises.map((exercise, index) => (
                                    <div
                                        key={exercise.exerciseId}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm">{exercise.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {exercise.count} sesiones
                                                    {exercise.relativeDensity !== undefined && exercise.absoluteDensity !== undefined && (
                                                        <span className="ml-2">
                                                            • {exercise.relativeDensity}% densidad • {Math.round(exercise.absoluteDensity)} kg/min
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm font-semibold shrink-0 ml-2">
                                            {formatVolume(exercise.totalVolume)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Récords Personales
                            </CardTitle>
                            <StatTooltip description="El mayor peso levantado para cada ejercicio en el período seleccionado. Se obtiene buscando el máximo valor de 'weight' en exercise_sets por cada ejercicio. Muestra el peso, repeticiones y fecha en que se logró ese récord." />
                        </div>
                        <CardDescription>Mayor peso levantado por ejercicio</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {data.personalRecords.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No hay récords registrados
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {data.personalRecords.map((record) => (
                                    <div
                                        key={record.exerciseId}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <div className="font-medium text-sm">{record.exerciseName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(record.date).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-lg">
                                                {record.weight}kg
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {record.reps} reps
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}








