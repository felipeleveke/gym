import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ProgramsListClient } from '@/components/programs/programs-list-client';

export default function ProgramsPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Programas de Entrenamiento</h1>
          <p className="text-muted-foreground mt-1">
            Planifica tu periodización con macrociclos, mesociclos y microciclos.
          </p>
        </div>
        <Link href="/programs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Programa
          </Button>
        </Link>
      </div>
      <ProgramsListClient />
    </div>
  );
}
