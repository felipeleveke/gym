'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { StatTooltip } from './stat-tooltip';

interface RoutineComparison {
    routineId: string;
    routineName: string;
    routineType: string;
    totalTrainings: number;
    totalVolume: number;
    avgVolume: number;
    totalDuration: number;
    avgDuration: number;
}

interface RoutineComparisonChartProps {
    routineIds: string[];
    dateRange: { startDate: string; endDate: string };
    className?: string;
}

type ComparisonMetric = 'volume' | 'trainings' | 'duration';

export function RoutineComparisonChart({
    routineIds,
    dateRange,
    className,
}: RoutineComparisonChartProps) {
    const [data, setData] = useState<RoutineComparison[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<ComparisonMetric>('volume');

    useEffect(() => {
        if (routineIds.length === 0) {
            setData([]);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    routineIds: routineIds.join(','),
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                });

                const response = await fetch(`/api/stats/routines?${params}`);
                if (!response.ok) throw new Error('Error al cargar datos');

                const result = await response.json();
                setData(result.data?.comparisons || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching routine comparison:', err);
                setError('Error al cargar los datos de comparación');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [routineIds, dateRange]);

    const getMetricKey = (): keyof RoutineComparison => {
        switch (selectedMetric) {
            case 'volume':
                return 'totalVolume';
            case 'trainings':
                return 'totalTrainings';
            case 'duration':
                return 'totalDuration';
            default:
                return 'totalVolume';
        }
    };

    const getMetricLabel = () => {
        switch (selectedMetric) {
            case 'volume':
                return 'Volumen Total (kg)';
            case 'trainings':
                return 'Número de Entrenamientos';
            case 'duration':
                return 'Duración Total (min)';
            default:
                return '';
        }
    };

    const formatValue = (value: number) => {
        if (selectedMetric === 'volume') {
            if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}t`;
            }
            return `${Math.round(value)}kg`;
        }
        if (selectedMetric === 'duration') {
            const hours = Math.floor(value / 60);
            const mins = value % 60;
            if (hours > 0) {
                return `${hours}h ${mins}m`;
            }
            return `${mins}m`;
        }
        return value.toString();
    };

    const chartData = data.map(routine => ({
        name: routine.routineName,
        value: routine[getMetricKey()] as number,
        type: routine.routineType,
    }));

    if (routineIds.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        Selecciona al menos una rutina para comparar
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[300px] w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error || chartData.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Comparación de Rutinas</CardTitle>
                    <CardDescription>Compara el rendimiento entre rutinas</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        {error || 'No hay datos disponibles para las rutinas seleccionadas'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <CardTitle>Comparación de Rutinas</CardTitle>
                    <StatTooltip description="Compara el rendimiento entre diferentes rutinas de entrenamiento. Los datos provienen de gym_trainings que tienen asociada una routine_id. Puedes comparar volumen total, número de entrenamientos o duración total. Útil para evaluar qué rutinas te dan mejores resultados." />
                </div>
                <CardDescription>Compara el rendimiento entre rutinas seleccionadas</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {(['volume', 'trainings', 'duration'] as ComparisonMetric[]).map((metric) => (
                            <button
                                key={metric}
                                onClick={() => setSelectedMetric(metric)}
                                className={`
                                    px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1
                                    ${
                                        selectedMetric === metric
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }
                                `}
                            >
                                {metric === 'volume' && 'Volumen'}
                                {metric === 'trainings' && 'Entrenamientos'}
                                {metric === 'duration' && 'Duración'}
                                {metric === 'volume' && (
                                    <StatTooltip description="Volumen Total: Suma de peso × repeticiones de todas las series realizadas con esta rutina. Se calcula desde exercise_sets de los entrenamientos asociados a la rutina." className="ml-1" />
                                )}
                                {metric === 'trainings' && (
                                    <StatTooltip description="Número de Entrenamientos: Cantidad de sesiones de entrenamiento realizadas con esta rutina en el período seleccionado. Se cuenta desde gym_trainings donde routine_id coincide." className="ml-1" />
                                )}
                                {metric === 'duration' && (
                                    <StatTooltip description="Duración Total: Suma de minutos de entrenamiento con esta rutina. Se obtiene sumando el campo 'duration' de todos los gym_trainings asociados a la rutina." className="ml-1" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            label={{ value: getMetricLabel(), angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                            formatter={(value: number) => [formatValue(value), getMetricLabel()]}
                            labelFormatter={(label) => `Rutina: ${label}`}
                        />
                        <Legend />
                        <Bar
                            dataKey="value"
                            fill="hsl(var(--primary))"
                            name={getMetricLabel()}
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}








