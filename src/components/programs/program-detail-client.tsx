"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Calendar,
  Target,
  ArrowLeft,
  Dumbbell,
  Clock,
  ChevronDown,
  ChevronUp,
  Play,
  CalendarDays
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { differenceInDays, differenceInWeeks, addDays, format } from "date-fns"
import { RoutineDetailModal } from "./routine-detail-modal"

interface PhaseRoutine {
  id: string
  scheduled_at: string
  notes?: string
  routine_variant: {
    id: string
    variant_name: string
    intensity_level: number
    workout_routine?: {
      id: string
      name: string
    }
  }
}

interface BlockPhase {
  id: string
  week_number: number
  intensity_modifier: number
  volume_modifier: number
  variant?: {
    id: string
    variant_name: string
    intensity_level: number
    workout_routine?: {
      id: string
      name: string
    }
  }
  phase_routines?: PhaseRoutine[]
}

interface TrainingBlock {
  id: string
  name: string
  block_type: string
  order_index: number
  duration_weeks: number
  block_phases: BlockPhase[]
}

interface TrainingProgram {
  id: string
  name: string
  description?: string
  goal?: string
  start_date?: string
  end_date?: string
  is_active: boolean
  created_at: string
  training_blocks: TrainingBlock[]
}

const BLOCK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  strength: { label: 'Fuerza', color: 'bg-red-500/20 text-red-600' },
  hypertrophy: { label: 'Hipertrofia', color: 'bg-blue-500/20 text-blue-600' },
  power: { label: 'Potencia', color: 'bg-purple-500/20 text-purple-600' },
  endurance: { label: 'Resistencia', color: 'bg-green-500/20 text-green-600' },
  deload: { label: 'Descarga', color: 'bg-yellow-500/20 text-yellow-600' },
  peaking: { label: 'Peaking', color: 'bg-orange-500/20 text-orange-600' },
  transition: { label: 'Transición', color: 'bg-gray-500/20 text-gray-600' },
}

export function ProgramDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [program, setProgram] = useState<TrainingProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, boolean>>({})
  const [currentProgress, setCurrentProgress] = useState<{
    week: number;
    day: number;
    totalDays: number;
  } | null>(null);
  
  // Modal state for routine details
  const [selectedRoutine, setSelectedRoutine] = useState<{
    variantId: string;
    routineId: string;
    routineName: string;
    variantName: string;
    phaseRoutineId?: string;
    scheduledAt?: string;
  } | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      try {
        const response = await fetch(`/api/programs/${id}`)
        if (!response.ok) throw new Error("Error al cargar el programa")
        
        const result = await response.json()
        const programData = result.data;
        setProgram(programData)
        
        // Calculate progress if active
        let currentBlockId = null;
        
        if (programData.start_date) {
            const startDate = new Date(programData.start_date);
            const today = new Date();
            const daysDiff = differenceInDays(today, startDate);
            const weeksDiff = Math.floor(daysDiff / 7) + 1; // 1-based week
            const dayOfWeek = (daysDiff % 7) + 1; // 1-based day
            
            if (daysDiff >= 0) {
               setCurrentProgress({
                   week: weeksDiff,
                   day: dayOfWeek,
                   totalDays: daysDiff
               });

               // Determine which block contains the current week
               let accumulatedWeeks = 0;
               const sortedBlocks = [...programData.training_blocks].sort((a: TrainingBlock, b: TrainingBlock) => a.order_index - b.order_index);
               
               for (const block of sortedBlocks) {
                   if (weeksDiff > accumulatedWeeks && weeksDiff <= accumulatedWeeks + block.duration_weeks) {
                       currentBlockId = block.id;
                       break;
                   }
                   accumulatedWeeks += block.duration_weeks;
               }
            }
        }
        
        // Expand relevant block
        if (currentBlockId) {
            setExpandedBlocks({ [currentBlockId]: true })
        } else if (programData.training_blocks?.length > 0) {
          const firstBlock = programData.training_blocks.sort((a: TrainingBlock, b: TrainingBlock) => a.order_index - b.order_index)[0]
          setExpandedBlocks({ [firstBlock.id]: true })
        }
      } catch (error) {
        console.error("Error fetching program:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el programa",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchProgram()
  }, [id, toast])

  const toggleBlock = (blockId: string) => {
    setExpandedBlocks(prev => ({
      ...prev,
      [blockId]: !prev[blockId]
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground">Programa no encontrado</p>
        <Button variant="outline" onClick={() => router.push("/programs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Programas
        </Button>
      </div>
    )
  }

  const sortedBlocks = [...program.training_blocks].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/programs")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            {program.goal && (
              <Badge variant="secondary" className="text-xs">
                <Target className="mr-1 h-3 w-3" />
                {program.goal}
              </Badge>
            )}
            {program.is_active && (
              <Badge variant="default" className="text-xs">
                Activo
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Current Progress Alert */}
      {currentProgress && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                      <CalendarDays className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                      <h3 className="font-semibold text-lg text-primary">Estás en la Semana {currentProgress.week}</h3>
                      <p className="text-sm text-muted-foreground">Día {currentProgress.day} del programa</p>
                  </div>
              </div>
              <div className="text-right hidden sm:block">
                  <span className="text-xs font-mono bg-background px-2 py-1 rounded border">
                      Día Total: {currentProgress.totalDays + 1}
                  </span>
              </div>
          </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - Blocks */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Estructura del Programa</h2>
          
          {sortedBlocks.map((block) => {
            const isExpanded = expandedBlocks[block.id]
            const typeInfo = BLOCK_TYPE_LABELS[block.block_type] || { label: block.block_type, color: 'bg-gray-100' }
            
            // Calculate global week offset for this block to check if current
            let accumulatedWeeks = 0;
            for (const b of sortedBlocks) {
                if (b.id === block.id) break;
                accumulatedWeeks += b.duration_weeks;
            }
            const isCurrentBlock = currentProgress && 
                currentProgress.week > accumulatedWeeks && 
                currentProgress.week <= accumulatedWeeks + block.duration_weeks;

            return (
              <Card key={block.id} className={`overflow-hidden transition-all ${isCurrentBlock ? 'ring-2 ring-primary border-primary' : ''}`}>
                <Collapsible open={isExpanded} onOpenChange={() => toggleBlock(block.id)}>
                  <CollapsibleTrigger asChild>
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <Badge className={`${typeInfo.color} border-0`}>
                          {typeInfo.label}
                        </Badge>
                        <div>
                          <div className="flex items-center gap-2">
                             <h3 className="font-semibold text-lg">{block.name}</h3>
                             {isCurrentBlock && <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary text-primary">Actual</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {block.duration_weeks} semanas
                          </p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <Separator />
                    <div className="p-4 space-y-4">
                      {block.block_phases
                        .sort((a, b) => a.week_number - b.week_number)
                        .map((phase) => {
                          // Check if this is the current week
                          const globalWeek = accumulatedWeeks + phase.week_number;
                          const isCurrentWeek = currentProgress?.week === globalWeek;

                          return (
                          <div key={phase.id} className={`flex items-start gap-4 p-3 rounded-lg border ${isCurrentWeek ? 'bg-primary/5 border-primary/30' : 'bg-card/50'}`}>
                            <div className={`flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded font-bold ${isCurrentWeek ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                              <span className="text-xs uppercase">Sem</span>
                              <span className="text-lg">{phase.week_number}</span>
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              {/* Show phase_routines if available, fallback to legacy variant */}
                              {phase.phase_routines && phase.phase_routines.length > 0 ? (
                                <div className="space-y-2">
                                  {phase.phase_routines
                                    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                                    .map((routine) => (
                                      <div key={routine.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                        <div>
                                          <h4 className="font-medium text-sm">
                                            {routine.routine_variant?.workout_routine?.name || "Rutina"} - {routine.routine_variant?.variant_name}
                                          </h4>
                                          <p className="text-xs text-muted-foreground">
                                            {format(new Date(routine.scheduled_at), "EEEE dd/MM 'a las' HH:mm")}
                                          </p>
                                        </div>
                                        <Button 
                                          size="sm" 
                                          variant={isCurrentWeek ? "default" : "ghost"} 
                                          className={`h-8 gap-1 ${!isCurrentWeek ? 'text-primary' : ''}`}
                                          onClick={() => setSelectedRoutine({
                                            variantId: routine.routine_variant?.id || '',
                                            routineId: routine.routine_variant?.workout_routine?.id || '',
                                            routineName: routine.routine_variant?.workout_routine?.name || 'Rutina',
                                            variantName: routine.routine_variant?.variant_name || '',
                                            phaseRoutineId: routine.id,
                                            scheduledAt: routine.scheduled_at,
                                          })}
                                        >
                                          <Play className="h-3 w-3" />
                                          Ver Detalles
                                        </Button>
                                      </div>
                                    ))}
                                </div>
                              ) : phase.variant?.workout_routine ? (
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium">
                                    {phase.variant.workout_routine.name}
                                  </h4>
                                  <Button 
                                    size="sm" 
                                    variant={isCurrentWeek ? "default" : "ghost"} 
                                    className={`h-8 gap-1 ${!isCurrentWeek ? 'text-primary' : ''}`}
                                    onClick={() => setSelectedRoutine({
                                      variantId: phase.variant?.id || '',
                                      routineId: phase.variant?.workout_routine?.id || '',
                                      routineName: phase.variant?.workout_routine?.name || 'Rutina',
                                      variantName: phase.variant?.variant_name || '',
                                    })}
                                  >
                                    <Play className="h-3 w-3" />
                                    Ver Detalles
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">Sin rutinas programadas</p>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Dumbbell className="h-3 w-3" />
                                  <span>Vol: {(phase.volume_modifier * 100).toFixed(0)}%</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>Int: {(phase.intensity_modifier * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )})}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {program.description && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Descripción</h4>
                  <p className="text-sm text-muted-foreground">{program.description}</p>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h4 className="font-medium text-sm mb-1">Duración Total</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {program.training_blocks.reduce((acc, curr) => acc + curr.duration_weeks, 0)} semanas
                  </span>
                </div>
              </div>

              {program.start_date && (
                <div>
                  <h4 className="font-medium text-sm mb-1">Fechas</h4>
                  <div className="text-sm text-muted-foreground">
                    <p>Inicio: {new Date(program.start_date).toLocaleDateString()}</p>
                    {program.end_date && (
                      <p>Fin: {new Date(program.end_date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Routine Detail Modal */}
      <RoutineDetailModal
        open={!!selectedRoutine}
        onOpenChange={(open) => !open && setSelectedRoutine(null)}
        variantId={selectedRoutine?.variantId || ''}
        routineId={selectedRoutine?.routineId || ''}
        routineName={selectedRoutine?.routineName || ''}
        variantName={selectedRoutine?.variantName || ''}
        phaseRoutineId={selectedRoutine?.phaseRoutineId}
        scheduledAt={selectedRoutine?.scheduledAt}
      />
    </div>
  )
}
