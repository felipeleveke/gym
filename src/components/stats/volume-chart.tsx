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
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface VolumeDataPoint {
    date: string;
    gym: number;
    sport: number;
    duration: number;
    volume: number;
}

interface VolumeChartProps {
    dateRange: { startDate: string; endDate: string };
    className?: string;
}

export function VolumeChart({ dateRange, className }: VolumeChartProps) {
    const [data, setData] = useState<VolumeDataPoint[]>([]);
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
                if (!response.ok) throw new Error('Error al cargar datos');

                const result = await response.json();
                setData(result.data?.trainingEvolution || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching volume data:', err);
                setError('Error al cargar los datos');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange]);

    const formatDate = (dateStr: string) => {
        try {
            return format(parseISO(dateStr), 'dd MMM', { locale: es });
        } catch {
            return dateStr;
        }
    };

    const chartData = data.map(item => ({
        ...item,
        dateFormatted: formatDate(item.date),
    }));

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
                    <CardTitle>Evolución del Volumen</CardTitle>
                    <CardDescription>Volumen de entrenamiento por día</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground py-8">
                        {error || 'No hay datos disponibles para el período seleccionado'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Evolución del Volumen</CardTitle>
                <CardDescription>Volumen de entrenamiento por día (kg × reps)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
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
                            label={{ value: 'Volumen (kg)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip
                            formatter={(value: number) => [`${Math.round(value)}kg`, 'Volumen']}
                            labelFormatter={(label) => `Fecha: ${label}`}
                        />
                        <Legend />
                        <Bar
                            dataKey="volume"
                            fill="hsl(var(--primary))"
                            name="Volumen Total"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}








