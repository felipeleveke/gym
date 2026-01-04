'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { ProgramsListClient } from '@/components/programs/programs-list-client';
import { ImportProgramDialog } from '@/components/programs/import-program-dialog';

export default function ProgramsPage() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Programas de Entrenamiento</h1>
          <p className="text-muted-foreground mt-1">
            Planifica tu periodización con macrociclos, mesociclos y microciclos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
            Importar con IA
          </Button>
          <Link href="/programs/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Programa
            </Button>
          </Link>
        </div>
      </div>
      <ProgramsListClient 
        importDialogOpen={importDialogOpen}
        onImportDialogChange={setImportDialogOpen}
      />
      <ImportProgramDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen} 
        onSuccess={() => {
          setImportDialogOpen(false);
          window.location.reload();
        }} 
      />
    </div>
  );
}
