'use client';

import { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api';

interface Exercise {
    id: string;
    name: string;
    usageCount: number;
    lastUsed: string | null;
}

interface ExerciseSelectorProps {
    value?: string;
    onChange: (exerciseId: string) => void;
    className?: string;
}

export function ExerciseSelector({ value, onChange, className }: ExerciseSelectorProps) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchExercises = async () => {
            try {
                const response = await apiFetch('/api/stats/exercises');
                if (!response.ok) throw new Error('Error al cargar ejercicios');
                
                const data = await response.json();
                setExercises(data.data?.exercises || []);
            } catch (error) {
                console.error('Error fetching exercises:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchExercises();
    }, []);

    const filteredExercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={className}>
                <Label>Cargando ejercicios...</Label>
            </div>
        );
    }

    if (exercises.length === 0) {
        return (
            <div className={className}>
                <Label>No hay ejercicios disponibles</Label>
            </div>
        );
    }

    return (
        <div className={className}>
            <Label htmlFor="exercise-select">Ejercicio</Label>
            <div className="space-y-2">
                <Input
                    id="exercise-search"
                    placeholder="Buscar ejercicio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mb-2"
                />
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger id="exercise-select">
                        <SelectValue placeholder="Selecciona un ejercicio" />
                    </SelectTrigger>
                    <SelectContent>
                        {filteredExercises.length === 0 ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                No se encontraron ejercicios
                            </div>
                        ) : (
                            filteredExercises.map((exercise) => (
                                <SelectItem key={exercise.id} value={exercise.id}>
                                    {exercise.name}
                                    {exercise.usageCount > 0 && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            ({exercise.usageCount} sesiones)
                                        </span>
                                    )}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}








