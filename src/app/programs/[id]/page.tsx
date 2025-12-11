
import { ProgramDetailClient } from "@/components/programs/program-detail-client"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProgramPageComponent({ params }: PageProps) {
  const { id } = await params
  return (
    <div className="container mx-auto py-6">
      <ProgramDetailClient id={id} />
    </div>
  )
}
