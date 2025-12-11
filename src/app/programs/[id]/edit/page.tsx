import { ProgramForm } from '@/components/programs/program-form';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProgramPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="p-4 md:p-6">
      <ProgramForm programId={id} />
    </div>
  );
}
