'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StatTooltip } from './stat-tooltip';

interface ProgressDataPoint {
    period: string;
    gymTrainings: number;
    sportTrainings: number;
    totalTrainings: number;
    totalDuration: number;
    totalVolume: number;
    avgDuration: number;
    avgVolume: number;
}

interface ProgressChartProps {
    dateRange: { startDate: string; endDate: string };
    className?: string;
}

type GroupBy = 'day' | 'week' | 'month';
type ChartType = 'frequency' | 'volume' | 'duration';

export function ProgressChart({ dateRange, className }: ProgressChartProps) {
    const [data, setData] = useState<ProgressDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [groupBy, setGroupBy] = useState<GroupBy>('week');
    const [chartType, setChartType] = useState<ChartType>('frequency');
    const [trends, setTrends] = useState<any>(null);
    const [frequency, setFrequency] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams({
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                    groupBy,
                });

                const response = await fetch(`/api/stats/progress?${params}`);
                if (!response.ok) throw new Error('Error al cargar datos');

                const result = await response.json();
                setData(result.data?.progress || []);
                setTrends(result.data?.trends || null);
                setFrequency(result.data?.frequency || null);
                setError(null);
            } catch (err) {
                console.error('Error fetching progress data:', err);
                setError('Error al cargar los datos de progreso');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange, groupBy]);

    const formatPeriod = (period: string) => {
        try {
            if (groupBy === 'month') {
                return format(parseISO(period + '-01'), 'MMM yyyy', { locale: es });
            }
            return format(parseISO(period), 'dd MMM', { locale: es });
        } catch {
            return period;
        }
    };

    const getChartData = () => {
        return data.map(item => ({
            ...item,
            periodFormatted: formatPeriod(item.period),
        }));
    };

    const getChartValue = () => {
        switch (chartType) {
            case 'frequency':
                return 'totalTrainings';
            case 'volume':
                return 'totalVolume';
            case 'duration':
                return 'totalDuration';
            default:
                return 'totalTrainings';
        }
    };

    const getChartLabel = () => {
        switch (chartType) {
            case 'frequency':
                return 'Entrenamientos';
            case 'volume':
                return 'Volumen (kg)';
            case 'duration':
                return 'Duración (min)';
            default:
                return '';
        }
    };

    const formatValue = (value: number) => {
        if (chartType === 'volume') {
            if (value >= 1000) {
                return `${(value / 1000).toFixed(1)}t`;
            }
            return `${Math.round(value)}kg`;
        }
        if (chartType === 'duration') {
            const hours = Math.floor(value / 60);
            const mins = value % 60;
            if (hours > 0) {
                return `${hours}h ${mins}m`;
            }
            return `${mins}m`;
        }
        return value.toString();
    };

    const getTrendIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
        if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    };

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

    if (error || data.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Análisis de Progreso</CardTitle>
                    <CardDescription>Evolución temporal de tus entrenamientos</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        {error || 'No hay datos disponibles para el período seleccionado'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    const chartData = getChartData();

    return (
        <div className={className + ' space-y-4'}>
            {/* Estadísticas de frecuencia */}
            {frequency && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-medium">Frecuencia Diaria</CardTitle>
                                <StatTooltip description="Promedio de entrenamientos por día en el período seleccionado. Se calcula como: total de entrenamientos / número de días del período. Incluye entrenamientos de gimnasio y deportivos." />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {frequency.trainingsPerDay.toFixed(1)}
                            </div>
                            <p className="text-xs text-muted-foreground">entrenamientos/día</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-medium">Frecuencia Semanal</CardTitle>
                                <StatTooltip description="Promedio de entrenamientos por semana. Se calcula como: total de entrenamientos / número de semanas del período. Útil para evaluar la consistencia del entrenamiento." />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {frequency.trainingsPerWeek.toFixed(1)}
                            </div>
                            <p className="text-xs text-muted-foreground">entrenamientos/semana</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-sm font-medium">Frecuencia Mensual</CardTitle>
                                <StatTooltip description="Promedio de entrenamientos por mes. Se calcula como: total de entrenamientos / número de meses del período. Ayuda a planificar objetivos mensuales." />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {frequency.trainingsPerMonth.toFixed(1)}
                            </div>
                            <p className="text-xs text-muted-foreground">entrenamientos/mes</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Tendencias */}
            {trends && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(['trainings', 'volume', 'duration'] as const).map((metric) => {
                        const trend = trends[metric];
                        const change = trend?.change || 0;
                        return (
                            <Card key={metric}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                                            {getTrendIcon(change)}
                                            {metric === 'trainings' && 'Entrenamientos'}
                                            {metric === 'volume' && 'Volumen'}
                                            {metric === 'duration' && 'Duración'}
                                        </CardTitle>
                                        {metric === 'trainings' && (
                                            <StatTooltip description="Cambio porcentual en la frecuencia de entrenamientos comparando la primera mitad del período con la segunda mitad. Un valor positivo indica que entrenaste más en la segunda mitad." />
                                        )}
                                        {metric === 'volume' && (
                                            <StatTooltip description="Cambio porcentual en el volumen total (peso × reps) comparando la primera mitad del período con la segunda mitad. Indica si estás progresando en intensidad." />
                                        )}
                                        {metric === 'duration' && (
                                            <StatTooltip description="Cambio porcentual en la duración total de entrenamientos comparando la primera mitad con la segunda mitad. Muestra si pasas más o menos tiempo entrenando." />
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {change > 0 ? '+' : ''}{change}%
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Cambio en el período
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Gráfico principal */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <CardTitle>Análisis de Progreso</CardTitle>
                                <StatTooltip description="Gráfico que muestra la evolución de tus entrenamientos agrupados por día, semana o mes según selecciones. Los datos provienen de gym_trainings y sport_trainings, agrupados y sumados por período. Puedes ver frecuencia (número de entrenamientos), volumen total o duración total." />
                            </div>
                            <CardDescription>Evolución temporal de tus entrenamientos</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Por día</SelectItem>
                                    <SelectItem value="week">Por semana</SelectItem>
                                    <SelectItem value="month">Por mes</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="frequency">Frecuencia</SelectItem>
                                    <SelectItem value="volume">Volumen</SelectItem>
                                    <SelectItem value="duration">Duración</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        {chartType === 'frequency' ? (
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="periodFormatted"
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    label={{ value: getChartLabel(), angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    formatter={(value: number) => [formatValue(value), getChartLabel()]}
                                    labelFormatter={(label) => `Período: ${label}`}
                                />
                                <Legend />
                                <Bar
                                    dataKey="gymTrainings"
                                    fill="hsl(var(--primary))"
                                    name="Gimnasio"
                                    radius={[4, 4, 0, 0]}
                                />
                                <Bar
                                    dataKey="sportTrainings"
                                    fill="hsl(var(--secondary))"
                                    name="Deporte"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        ) : (
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="periodFormatted"
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis
                                    tick={{ fontSize: 12 }}
                                    label={{ value: getChartLabel(), angle: -90, position: 'insideLeft' }}
                                />
                                <Tooltip
                                    formatter={(value: number) => [formatValue(value), getChartLabel()]}
                                    labelFormatter={(label) => `Período: ${label}`}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey={getChartValue()}
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                    name={getChartLabel()}
                                />
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}








