'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trophy } from 'lucide-react';
import { StatTooltip } from './stat-tooltip';

interface EvolutionDataPoint {
    date: string;
    trainingId: string;
    maxWeight: number;
    avgWeight: number;
    totalReps: number;
    avgReps: number;
    avgRir: number | null;
    totalSets: number;
    volume: number;
}

interface ExerciseProgressChartProps {
    exerciseId: string;
    dateRange: { startDate: string; endDate: string };
    className?: string;
}

type MetricType = 'weight' | 'reps' | 'volume' | 'rir';

export function ExerciseProgressChart({
    exerciseId,
    dateRange,
    className,
}: ExerciseProgressChartProps) {
    const [data, setData] = useState<EvolutionDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exerciseName, setExerciseName] = useState<string>('');
    const [selectedMetric, setSelectedMetric] = useState<MetricType>('weight');
    const [maxWeight, setMaxWeight] = useState(0);

    useEffect(() => {
        if (!exerciseId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    exerciseId,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                });

                const response = await fetch(`/api/stats/exercises?${params}`);
                if (!response.ok) throw new Error('Error al cargar datos');

                const result = await response.json();
                const evolution = result.data?.evolution || [];
                setData(evolution);
                setExerciseName(result.data?.exercise?.name || '');
                setMaxWeight(result.data?.summary?.allTimeMaxWeight || 0);
                setError(null);
            } catch (err) {
                console.error('Error fetching exercise data:', err);
                setError('Error al cargar los datos del ejercicio');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [exerciseId, dateRange]);

    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'dd MMM', { locale: es });
        } catch {
            return dateStr;
        }
    };

    const getMetricKey = () => {
        switch (selectedMetric) {
            case 'weight':
                return 'maxWeight';
            case 'reps':
                return 'avgReps';
            case 'volume':
                return 'volume';
            case 'rir':
                return 'avgRir';
            default:
                return 'maxWeight';
        }
    };

    const getMetricLabel = () => {
        switch (selectedMetric) {
            case 'weight':
                return 'Peso Máximo (kg)';
            case 'reps':
                return 'Repeticiones Promedio';
            case 'volume':
                return 'Volumen (kg × reps)';
            case 'rir':
                return 'RIR Promedio';
            default:
                return '';
        }
    };

    const chartData = data.map(item => ({
        ...item,
        dateFormatted: formatDate(item.date),
        value: item[getMetricKey() as keyof EvolutionDataPoint] as number,
    }));

    if (!exerciseId) {
        return (
            <Card className={className}>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        Selecciona un ejercicio para ver su evolución
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
                    <CardTitle>Evolución del Ejercicio</CardTitle>
                    <CardDescription>{exerciseName || 'Ejercicio'}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        {error || 'No hay datos disponibles para este ejercicio'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <CardTitle>Evolución del Ejercicio</CardTitle>
                            <StatTooltip description="Muestra la evolución de diferentes métricas del ejercicio seleccionado a lo largo del tiempo. Los datos provienen de exercise_sets agrupados por sesión de entrenamiento (gym_trainings). Cada punto representa una sesión donde realizaste este ejercicio." />
                        </div>
                        <CardDescription>{exerciseName}</CardDescription>
                    </div>
                    {maxWeight > 0 && (
                        <div className="flex items-center gap-1 text-yellow-500">
                            <Trophy className="h-4 w-4" />
                            <span className="text-sm font-semibold">{maxWeight}kg PR</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4 space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {(['weight', 'reps', 'volume', 'rir'] as MetricType[]).map((metric) => (
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
                                {metric === 'weight' && 'Peso'}
                                {metric === 'reps' && 'Reps'}
                                {metric === 'volume' && 'Volumen'}
                                {metric === 'rir' && 'RIR'}
                                {metric === 'weight' && (
                                    <StatTooltip description="Peso Máximo: El mayor peso utilizado en una serie de esta sesión. Se obtiene del campo 'weight' de exercise_sets, tomando el máximo por cada entrenamiento." className="ml-1" />
                                )}
                                {metric === 'reps' && (
                                    <StatTooltip description="Repeticiones Promedio: Promedio de repeticiones por serie en esta sesión. Se calcula como: suma de reps / número de series. Datos del campo 'reps' de exercise_sets." className="ml-1" />
                                )}
                                {metric === 'volume' && (
                                    <StatTooltip description="Volumen: Suma de peso × repeticiones de todas las series de esta sesión. Fórmula: Σ(weight × reps) por cada serie del ejercicio en el entrenamiento." className="ml-1" />
                                )}
                                {metric === 'rir' && (
                                    <StatTooltip description="RIR Promedio: Reps In Reserve promedio. Indica cuántas repeticiones te quedaban en reserva. Se calcula como promedio del campo 'rir' de exercise_sets donde está registrado." className="ml-1" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="dateFormatted"
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            label={{ value: getMetricLabel(), angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                            formatter={(value: number) => [
                                selectedMetric === 'weight'
                                    ? `${value}kg`
                                    : selectedMetric === 'volume'
                                    ? `${Math.round(value)}kg`
                                    : selectedMetric === 'rir'
                                    ? value.toFixed(1)
                                    : value.toFixed(1),
                                getMetricLabel(),
                            ]}
                            labelFormatter={(label) => `Fecha: ${label}`}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                            name={getMetricLabel()}
                        />
                        {selectedMetric === 'weight' && maxWeight > 0 && (
                            <ReferenceLine
                                y={maxWeight}
                                stroke="#eab308"
                                strokeDasharray="5 5"
                                label={{ value: 'PR', position: 'right' }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

