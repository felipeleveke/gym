import { RoutineOverviewClient } from '@/components/routines/routine-view';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RoutinePage(props: PageProps) {
  const params = await props.params;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <RoutineOverviewClient id={params.id} />
    </div>
  );
}
