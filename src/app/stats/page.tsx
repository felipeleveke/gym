'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsOverview } from '@/components/stats/stats-overview';
import { VolumeChart } from '@/components/stats/volume-chart';
import { ExerciseSelector } from '@/components/stats/exercise-selector';
import { ExerciseProgressChart } from '@/components/stats/exercise-progress-chart';
import { RoutineSelector } from '@/components/stats/routine-selector';
import { RoutineComparisonChart } from '@/components/stats/routine-comparison-chart';
import { DateRangeFilter, DateRangePreset } from '@/components/stats/date-range-filter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProgressChart } from '@/components/stats/progress-chart';
import { subDays, startOfDay, endOfDay } from 'date-fns';

interface DateRange {
    startDate: string;
    endDate: string;
}

export default function StatsPage() {
    const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30d');
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const endDate = endOfDay(new Date());
        const startDate = startOfDay(subDays(new Date(), 30));
        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        };
    });
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
    const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);

    const handleDateRangeChange = (preset: DateRangePreset, range: DateRange) => {
        setDateRangePreset(preset);
        setDateRange(range);
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Estadísticas</h1>
                <p className="text-muted-foreground">
                    Analiza tu progreso y rendimiento de entrenamiento
                </p>
            </div>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Filtro de Fechas</CardTitle>
                        <CardDescription>
                            Selecciona el período de tiempo para analizar
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DateRangeFilter
                            value={dateRangePreset}
                            onChange={handleDateRangeChange}
                        />
                    </CardContent>
                </Card>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                        <TabsTrigger value="exercises">Ejercicios</TabsTrigger>
                        <TabsTrigger value="routines">Rutinas</TabsTrigger>
                        <TabsTrigger value="progress">Progreso</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-4">
                        <StatsOverview dateRange={dateRange} />
                        <VolumeChart dateRange={dateRange} />
                    </TabsContent>

                    <TabsContent value="exercises" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Evolución por Ejercicio</CardTitle>
                                <CardDescription>
                                    Selecciona un ejercicio para ver su evolución detallada
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ExerciseSelector
                                    value={selectedExerciseId}
                                    onChange={setSelectedExerciseId}
                                />
                            </CardContent>
                        </Card>
                        <ExerciseProgressChart
                            exerciseId={selectedExerciseId}
                            dateRange={dateRange}
                        />
                    </TabsContent>

                    <TabsContent value="routines" className="space-y-4 mt-4">
                        <RoutineSelector
                            value={selectedRoutineIds}
                            onChange={setSelectedRoutineIds}
                        />
                        <RoutineComparisonChart
                            routineIds={selectedRoutineIds}
                            dateRange={dateRange}
                        />
                    </TabsContent>

                    <TabsContent value="progress" className="space-y-4 mt-4">
                        <ProgressChart dateRange={dateRange} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

