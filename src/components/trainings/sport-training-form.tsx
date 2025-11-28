'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes-dialog';
import { ArrowLeft, Loader2 } from 'lucide-react';

const sportTypeOptions = [
  { value: 'running', label: 'Running' },
  { value: 'cycling', label: 'Ciclismo' },
  { value: 'swimming', label: 'Natación' },
  { value: 'football', label: 'Fútbol' },
  { value: 'basketball', label: 'Baloncesto' },
  { value: 'tennis', label: 'Tenis' },
  { value: 'other', label: 'Otro' },
];

const sportTrainingSchema = z.object({
  sport_type: z.enum(['running', 'cycling', 'swimming', 'football', 'basketball', 'tennis', 'other'], {
    required_error: 'Selecciona un tipo de deporte',
  }),
  date: z.string().min(1, 'La fecha es requerida'),
  duration: z.coerce.number().min(1, 'La duración debe ser mayor a 0').max(600, 'La duración no puede ser mayor a 600 minutos'),
  distance: z.coerce.number().min(0).optional(),
  avg_speed: z.coerce.number().min(0).optional(),
  max_speed: z.coerce.number().min(0).optional(),
  avg_heart_rate: z.coerce.number().min(0).max(300).optional(),
  max_heart_rate: z.coerce.number().min(0).max(300).optional(),
  elevation: z.coerce.number().min(0).optional(),
  terrain: z.string().optional(),
  weather: z.string().optional(),
  temperature: z.coerce.number().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type SportTrainingFormData = z.infer<typeof sportTrainingSchema>;

interface SportTrainingFormProps {
  onBack: () => void;
}

export function SportTrainingForm({ onBack }: SportTrainingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SportTrainingFormData>({
    resolver: zodResolver(sportTrainingSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      duration: 30,
      sport_type: 'running',
    },
  });

  const onSubmit = async (data: SportTrainingFormData) => {
    setIsSubmitting(true);
    try {
      const tagsArray = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      const trainingData: any = {
        type: 'sport',
        sport_type: data.sport_type,
        date: new Date(data.date).toISOString(),
        duration: data.duration,
        notes: data.notes || null,
        tags: tagsArray.length > 0 ? tagsArray : null,
      };

      // Solo agregar campos si tienen valor
      if (data.distance) trainingData.distance = data.distance;
      if (data.avg_speed) trainingData.avg_speed = data.avg_speed;
      if (data.max_speed) trainingData.max_speed = data.max_speed;
      if (data.avg_heart_rate) trainingData.avg_heart_rate = data.avg_heart_rate;
      if (data.max_heart_rate) trainingData.max_heart_rate = data.max_heart_rate;
      if (data.elevation) trainingData.elevation = data.elevation;
      if (data.terrain) trainingData.terrain = data.terrain;
      if (data.weather) trainingData.weather = data.weather;
      if (data.temperature) trainingData.temperature = data.temperature;

      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trainingData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el entrenamiento');
      }

      const result = await response.json();
      
      toast({
        title: 'Entrenamiento creado',
        description: 'Tu entrenamiento deportivo ha sido registrado exitosamente.',
      });

      router.push('/trainings');
    } catch (error) {
      console.error('Error creating sport training:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear el entrenamiento',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hook para manejar cambios sin guardar
  const {
    showDialog,
    confirmLeave,
    cancelLeave,
    handleNavigation,
  } = useUnsavedChanges({
    hasUnsavedChanges: isDirty,
    message: '¿Estás seguro de que quieres salir? Tienes cambios sin guardar que se perderán.',
  });

  // Wrapper para onBack que verifica cambios
  const handleBack = () => {
    if (isDirty) {
      handleNavigation('/trainings');
    } else {
      onBack();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          <CardTitle>Nuevo Entrenamiento Deportivo</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sport_type">Tipo de Deporte</Label>
            <select
              id="sport_type"
              {...register('sport_type')}
              disabled={isSubmitting}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sportTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.sport_type && (
              <p className="text-sm text-destructive">{errors.sport_type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Fecha y Hora</Label>
            <Input
              id="date"
              type="datetime-local"
              {...register('date')}
              disabled={isSubmitting}
            />
            {errors.date && (
              <p className="text-sm text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duración (minutos)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="600"
                {...register('duration')}
                disabled={isSubmitting}
              />
              {errors.duration && (
                <p className="text-sm text-destructive">{errors.duration.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="distance">Distancia (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                min="0"
                {...register('distance')}
                disabled={isSubmitting}
              />
              {errors.distance && (
                <p className="text-sm text-destructive">{errors.distance.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avg_speed">Velocidad Promedio (km/h)</Label>
              <Input
                id="avg_speed"
                type="number"
                step="0.1"
                min="0"
                {...register('avg_speed')}
                disabled={isSubmitting}
              />
              {errors.avg_speed && (
                <p className="text-sm text-destructive">{errors.avg_speed.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_speed">Velocidad Máxima (km/h)</Label>
              <Input
                id="max_speed"
                type="number"
                step="0.1"
                min="0"
                {...register('max_speed')}
                disabled={isSubmitting}
              />
              {errors.max_speed && (
                <p className="text-sm text-destructive">{errors.max_speed.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="avg_heart_rate">Frecuencia Cardíaca Promedio (bpm)</Label>
              <Input
                id="avg_heart_rate"
                type="number"
                min="0"
                max="300"
                {...register('avg_heart_rate')}
                disabled={isSubmitting}
              />
              {errors.avg_heart_rate && (
                <p className="text-sm text-destructive">{errors.avg_heart_rate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_heart_rate">Frecuencia Cardíaca Máxima (bpm)</Label>
              <Input
                id="max_heart_rate"
                type="number"
                min="0"
                max="300"
                {...register('max_heart_rate')}
                disabled={isSubmitting}
              />
              {errors.max_heart_rate && (
                <p className="text-sm text-destructive">{errors.max_heart_rate.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="elevation">Elevación (metros)</Label>
              <Input
                id="elevation"
                type="number"
                min="0"
                {...register('elevation')}
                disabled={isSubmitting}
              />
              {errors.elevation && (
                <p className="text-sm text-destructive">{errors.elevation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperatura (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                {...register('temperature')}
                disabled={isSubmitting}
              />
              {errors.temperature && (
                <p className="text-sm text-destructive">{errors.temperature.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="terrain">Terreno</Label>
              <Input
                id="terrain"
                type="text"
                placeholder="asfalto, tierra, pista"
                {...register('terrain')}
                disabled={isSubmitting}
              />
              {errors.terrain && (
                <p className="text-sm text-destructive">{errors.terrain.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="weather">Clima</Label>
              <Input
                id="weather"
                type="text"
                placeholder="soleado, nublado, lluvia"
                {...register('weather')}
                disabled={isSubmitting}
              />
              {errors.weather && (
                <p className="text-sm text-destructive">{errors.weather.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
            <Input
              id="tags"
              type="text"
              placeholder="mañana, intenso, carrera"
              {...register('tags')}
              disabled={isSubmitting}
            />
            {errors.tags && (
              <p className="text-sm text-destructive">{errors.tags.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Anota cualquier observación sobre tu entrenamiento..."
              rows={4}
              {...register('notes')}
              disabled={isSubmitting}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Entrenamiento
            </Button>
          </div>
        </form>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para cambios sin guardar */}
      <UnsavedChangesDialog
        open={showDialog}
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </>
  );
}

