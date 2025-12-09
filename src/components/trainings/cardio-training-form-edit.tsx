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
import { ArrowLeft, Loader2 } from 'lucide-react';

const cardioTrainingSchema = z.object({
  date: z.string().min(1, 'La fecha es requerida'),
  duration: z.coerce.number().min(1, 'La duración debe ser mayor a 0').max(600, 'La duración no puede ser mayor a 600 minutos'),
  avg_heart_rate: z.coerce.number().min(0).max(300).optional(),
  max_heart_rate: z.coerce.number().min(0).max(300).optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type CardioTrainingFormData = z.infer<typeof cardioTrainingSchema>;

interface CardioTrainingFormEditProps {
  training: any;
}

export function CardioTrainingFormEdit({ training }: CardioTrainingFormEditProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preparar valores por defecto desde training
  const defaultDate = training?.date 
    ? new Date(training.date).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);
  const defaultTags = training?.tags 
    ? (Array.isArray(training.tags) ? training.tags.join(', ') : training.tags)
    : '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CardioTrainingFormData>({
    resolver: zodResolver(cardioTrainingSchema),
    defaultValues: {
      date: defaultDate,
      duration: training?.duration || 30,
      avg_heart_rate: training?.avg_heart_rate || undefined,
      max_heart_rate: training?.max_heart_rate || undefined,
      notes: training?.notes || '',
      tags: defaultTags,
    },
  });

  const onSubmit = async (data: CardioTrainingFormData) => {
    setIsSubmitting(true);
    try {
      const tagsArray = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      const response = await fetch(`/api/trainings/${training.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'sport',
          sport_type: 'other',
          date: new Date(data.date).toISOString(),
          duration: data.duration,
          avg_heart_rate: data.avg_heart_rate || null,
          max_heart_rate: data.max_heart_rate || null,
          notes: data.notes || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar el entrenamiento');
      }

      const result = await response.json();
      
      toast({
        title: 'Entrenamiento actualizado',
        description: 'Tu entrenamiento cardiovascular ha sido actualizado exitosamente.',
      });

      router.push('/trainings');
    } catch (error) {
      console.error('Error updating cardio training:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar el entrenamiento',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.push('/trainings');
  };

  return (
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
          <CardTitle>Editar Entrenamiento Cardiovascular</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
            <Input
              id="tags"
              type="text"
              placeholder="cardio, intenso, mañana"
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
            <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Entrenamiento
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
















