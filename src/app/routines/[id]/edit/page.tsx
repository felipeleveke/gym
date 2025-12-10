import { RoutineForm } from '@/components/routines/routine-form';

interface EditRoutinePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRoutinePage({ params }: EditRoutinePageProps) {
  const { id } = await params;
  
  return (
    <div className="p-4 md:p-6">
      <RoutineForm routineId={id} />
    </div>
  );
}
