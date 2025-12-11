'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Calendar, 
  Target, 
  Trash2, 
  Copy, 
  Play, 
  MoreVertical,
  Layers,
  ChevronRight,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BlockPhase {
  id: string;
  week_number: number;
  intensity_modifier: number;
  volume_modifier: number;
  variant?: {
    id: string;
    variant_name: string;
    intensity_level: number;
    workout_routine?: {
      id: string;
      name: string;
    };
  };
}

interface TrainingBlock {
  id: string;
  name: string;
  block_type: string;
  order_index: number;
  duration_weeks: number;
  block_phases: BlockPhase[];
}

interface TrainingProgram {
  id: string;
  name: string;
  description?: string;
  goal?: string;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  training_blocks: TrainingBlock[];
}

const BLOCK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  strength: { label: 'Fuerza', color: 'bg-red-500/20 text-red-600' },
  hypertrophy: { label: 'Hipertrofia', color: 'bg-blue-500/20 text-blue-600' },
  power: { label: 'Potencia', color: 'bg-purple-500/20 text-purple-600' },
  endurance: { label: 'Resistencia', color: 'bg-green-500/20 text-green-600' },
  deload: { label: 'Descarga', color: 'bg-yellow-500/20 text-yellow-600' },
  peaking: { label: 'Peaking', color: 'bg-orange-500/20 text-orange-600' },
  transition: { label: 'Transición', color: 'bg-gray-500/20 text-gray-600' },
};

export function ProgramsListClient() {
  const router = useRouter();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [programToClone, setProgramToClone] = useState<TrainingProgram | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [cloning, setCloning] = useState(false);

  const fetchPrograms = useCallback(async () => {
    try {
      const response = await fetch(`/api/programs?_=${Date.now()}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Error al cargar los programas');
      }

      const result = await response.json();
      setPrograms(result.data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los programas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const handleDeleteProgram = async (programId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este programa?')) {
      return;
    }

    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el programa');
      }

      toast({
        title: 'Programa eliminado',
        description: 'El programa ha sido eliminado exitosamente.',
      });

      fetchPrograms();
    } catch (error) {
      console.error('Error deleting program:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el programa',
        variant: 'destructive',
      });
    }
  };

  const handleCloneProgram = async () => {
    if (!programToClone || !cloneName.trim()) return;

    setCloning(true);
    try {
      const response = await fetch(`/api/programs/${programToClone.id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: cloneName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Error al duplicar el programa');
      }

      toast({
        title: 'Programa duplicado',
        description: `Se creó "${cloneName}" basado en "${programToClone.name}".`,
      });

      setCloneDialogOpen(false);
      setProgramToClone(null);
      setCloneName('');
      fetchPrograms();
    } catch (error) {
      console.error('Error cloning program:', error);
      toast({
        title: 'Error',
        description: 'No se pudo duplicar el programa',
        variant: 'destructive',
      });
    } finally {
      setCloning(false);
    }
  };

  const getTotalWeeks = (program: TrainingProgram) => {
    return program.training_blocks.reduce((sum, block) => sum + block.duration_weeks, 0);
  };

  const getBlockTypeInfo = (type: string) => {
    return BLOCK_TYPE_LABELS[type] || { label: type, color: 'bg-gray-500/20 text-gray-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-2">
            No tienes programas de entrenamiento aún.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Crea un programa para planificar tu periodización con macrociclos, mesociclos y microciclos.
          </p>
          <Button onClick={() => router.push('/programs/new')}>
            Crear Primer Programa
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <Card 
            key={program.id} 
            className={`hover:border-primary/50 transition-colors ${
              program.is_active ? 'ring-2 ring-primary/20' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {program.name}
                    {program.is_active && (
                      <Badge variant="default" className="text-xs">
                        Activo
                      </Badge>
                    )}
                  </CardTitle>
                  {program.description && (
                    <CardDescription className="mt-1 line-clamp-2">
                      {program.description}
                    </CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => router.push(`/programs/${program.id}/edit`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onSelect={() => {
                        setProgramToClone(program);
                        setCloneName(`${program.name} (copia)`);
                        setCloneDialogOpen(true);
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onSelect={() => handleDeleteProgram(program.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {program.goal && (
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>{program.goal}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{getTotalWeeks(program)} semanas</span>
                </div>
              </div>

              {program.training_blocks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    Bloques ({program.training_blocks.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {program.training_blocks
                      .sort((a, b) => a.order_index - b.order_index)
                      .slice(0, 4)
                      .map((block) => {
                        const typeInfo = getBlockTypeInfo(block.block_type);
                        return (
                          <Badge 
                            key={block.id} 
                            variant="outline"
                            className={typeInfo.color}
                          >
                            {block.name} ({block.duration_weeks}s)
                          </Badge>
                        );
                      })}
                    {program.training_blocks.length > 4 && (
                      <Badge variant="outline">
                        +{program.training_blocks.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {program.start_date && (
                <div className="text-xs text-muted-foreground">
                  Inicio: {new Date(program.start_date).toLocaleDateString()}
                  {program.end_date && (
                    <> - Fin: {new Date(program.end_date).toLocaleDateString()}</>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary"
                  onClick={() => router.push(`/programs/${program.id}`)}
                >
                  Ver detalles
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Programa</DialogTitle>
            <DialogDescription>
              Se creará una copia de &quot;{programToClone?.name}&quot; con todos sus bloques y fases.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="clone-name">Nombre del nuevo programa</Label>
              <Input
                id="clone-name"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="Nombre del programa"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setCloneDialogOpen(false)}
              disabled={cloning}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCloneProgram}
              disabled={cloning || !cloneName.trim()}
            >
              {cloning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Duplicando...
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
