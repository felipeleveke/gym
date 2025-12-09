'use client';

import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Routine {
    id: string;
    name: string;
    type: string;
}

interface RoutineSelectorProps {
    value: string[];
    onChange: (routineIds: string[]) => void;
    className?: string;
    maxSelection?: number;
}

export function RoutineSelector({ 
    value, 
    onChange, 
    className,
    maxSelection = 5 
}: RoutineSelectorProps) {
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRoutines = async () => {
            try {
                const response = await fetch('/api/routines');
                if (!response.ok) throw new Error('Error al cargar rutinas');
                
                const data = await response.json();
                setRoutines(data.data || []);
            } catch (error) {
                console.error('Error fetching routines:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoutines();
    }, []);

    const handleToggle = (routineId: string) => {
        if (value.includes(routineId)) {
            onChange(value.filter(id => id !== routineId));
        } else {
            if (value.length < maxSelection) {
                onChange([...value, routineId]);
            }
        }
    };

    const handleSelectAll = () => {
        if (value.length === routines.length) {
            onChange([]);
        } else {
            onChange(routines.slice(0, maxSelection).map(r => r.id));
        }
    };

    if (loading) {
        return (
            <div className={className}>
                <Label>Cargando rutinas...</Label>
            </div>
        );
    }

    if (routines.length === 0) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Rutinas</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No hay rutinas disponibles. Crea rutinas para compararlas.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Seleccionar Rutinas</CardTitle>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                    >
                        {value.length === routines.length ? 'Deseleccionar' : 'Seleccionar todas'}
                    </Button>
                </div>
                {value.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                        {value.length} de {routines.length} seleccionadas (máximo {maxSelection})
                    </p>
                )}
            </CardHeader>
            <CardContent>
                <div className="max-h-[300px] overflow-y-auto space-y-3">
                    {routines.map((routine) => {
                        const isSelected = value.includes(routine.id);
                        const isDisabled = !isSelected && value.length >= maxSelection;

                        return (
                            <div
                                key={routine.id}
                                className={`
                                    flex items-center space-x-3 p-3 rounded-lg border
                                    ${isSelected ? 'bg-accent' : ''}
                                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-muted/50'}
                                `}
                                onClick={() => !isDisabled && handleToggle(routine.id)}
                            >
                                <Checkbox
                                    id={routine.id}
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onCheckedChange={() => !isDisabled && handleToggle(routine.id)}
                                />
                                <Label
                                    htmlFor={routine.id}
                                    className="flex-1 cursor-pointer"
                                >
                                    <div className="font-medium">{routine.name}</div>
                                    <div className="text-xs text-muted-foreground capitalize">
                                        {routine.type}
                                    </div>
                                </Label>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

