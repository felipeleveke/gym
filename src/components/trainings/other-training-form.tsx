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

const otherTrainingSchema = z.object({
  date: z.string().min(1, 'La fecha es requerida'),
  duration: z.coerce.number().min(1, 'La duración debe ser mayor a 0').max(600, 'La duración no puede ser mayor a 600 minutos'),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

type OtherTrainingFormData = z.infer<typeof otherTrainingSchema>;

interface OtherTrainingFormProps {
  onBack: () => void;
}

export function OtherTrainingForm({ onBack }: OtherTrainingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtherTrainingFormData>({
    resolver: zodResolver(otherTrainingSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      duration: 30,
    },
  });

  const onSubmit = async (data: OtherTrainingFormData) => {
    setIsSubmitting(true);
    try {
      const tagsArray = data.tags
        ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];

      // Para "other", usamos sport_trainings con sport_type 'other'
      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'sport',
          sport_type: 'other',
          date: new Date(data.date).toISOString(),
          duration: data.duration,
          notes: data.notes || null,
          tags: tagsArray.length > 0 ? tagsArray : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el entrenamiento');
      }

      const result = await response.json();
      
      toast({
        title: 'Entrenamiento creado',
        description: 'Tu entrenamiento ha sido registrado exitosamente.',
      });

      router.push('/trainings');
    } catch (error) {
      console.error('Error creating other training:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo crear el entrenamiento',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Nuevo Entrenamiento</CardTitle>
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

          <div className="space-y-2">
            <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
            <Input
              id="tags"
              type="text"
              placeholder="personalizado, entrenamiento"
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
              placeholder="Describe tu entrenamiento..."
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
  );
}

