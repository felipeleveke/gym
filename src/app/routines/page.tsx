import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { RoutinesListClient } from '@/components/routines/routines-list-client';

export default function RoutinesPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mis Rutinas</h1>
        <Link href="/routines/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Rutina
          </Button>
        </Link>
      </div>
      <RoutinesListClient />
    </div>
  );
}
















