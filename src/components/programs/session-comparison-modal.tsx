"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Check, X, Minus, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlannedSet {
  id: string
  set_number: number
  target_reps?: number
  target_weight?: number
  target_weight_percent?: number
  target_rir?: number
  set_type: string
}

interface PlannedExercise {
  id: string
  order_index: number
  notes?: string
  exercise: {
    id: string
    name: string
    muscle_groups?: string[]
  }
  variant_exercise_sets: PlannedSet[]
}

interface ActualSet {
  id: string
  set_number: number
  reps?: number
  weight?: number
  rir?: number
  set_type?: string
  duration?: number
  rest_time?: number
  notes?: string
}

interface ActualExercise {
  id: string
  exercise_id: string
  order_index: number
  notes?: string
  exercise: {
    id: string
    name: string
    muscle_groups?: string[]
  }
  exercise_sets: ActualSet[]
}

interface ActualTraining {
  id: string
  date: string
  duration: number
  notes?: string
  training_exercises: ActualExercise[]
}

interface SessionComparisonModalProps {
  open: boolean
  onClose: () => void
  plannedExercises: PlannedExercise[]
  actualTraining: ActualTraining
  routineName: string
  scheduledAt: string
}

const SET_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  warmup: { label: "Calent.", color: "bg-orange-500/20 text-orange-600" },
  approach: { label: "Aprox.", color: "bg-blue-500/20 text-blue-600" },
  working: { label: "Trabajo", color: "bg-green-500/20 text-green-600" },
  backoff: { label: "Backoff", color: "bg-purple-500/20 text-purple-600" },
  bilbo: { label: "Bilbo", color: "bg-pink-500/20 text-pink-600" },
}

function ComparisonIndicator({ planned, actual, unit = "", higherIsBetter = true }: { 
  planned?: number | null
  actual?: number | null  
  unit?: string
  higherIsBetter?: boolean
}) {
  if (planned === null || planned === undefined) {
    return <span className="text-muted-foreground">-</span>
  }
  
  if (actual === null || actual === undefined) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground line-through">{planned}{unit}</span>
        <X className="h-3 w-3 text-red-500" />
      </div>
    )
  }

  const diff = actual - planned
  const isExact = diff === 0
  const isPositive = diff > 0
  const isBetter = higherIsBetter ? isPositive : !isPositive

  if (isExact) {
    return (
      <div className="flex items-center gap-1">
        <span className="font-medium">{actual}{unit}</span>
        <Check className="h-3 w-3 text-green-500" />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className={cn(
        "font-medium",
        isBetter ? "text-green-600" : "text-amber-600"
      )}>
        {actual}{unit}
      </span>
      {isBetter ? (
        <TrendingUp className="h-3 w-3 text-green-500" />
      ) : (
        <TrendingDown className="h-3 w-3 text-amber-500" />
      )}
      <span className={cn(
        "text-[10px]",
        isBetter ? "text-green-600" : "text-amber-600"
      )}>
        ({diff > 0 ? "+" : ""}{diff})
      </span>
    </div>
  )
}

export function SessionComparisonModal({
  open,
  onClose,
  plannedExercises,
  actualTraining,
  routineName,
  scheduledAt
}: SessionComparisonModalProps) {
  // Create a map of actual exercises by exercise_id for easy lookup
  const actualExercisesMap = new Map<string, ActualExercise>()
  actualTraining.training_exercises.forEach(ex => {
    actualExercisesMap.set(ex.exercise_id, ex)
  })

  // Calculate summary stats
  const totalPlannedSets = plannedExercises.reduce(
    (acc, ex) => acc + ex.variant_exercise_sets.length, 0
  )
  const totalActualSets = actualTraining.training_exercises.reduce(
    (acc, ex) => acc + ex.exercise_sets.length, 0
  )
  
  // Calculate volume (weight * reps)
  let totalPlannedVolume = 0
  let totalActualVolume = 0
  
  plannedExercises.forEach(ex => {
    ex.variant_exercise_sets.forEach(set => {
      if (set.target_weight && set.target_reps) {
        totalPlannedVolume += set.target_weight * set.target_reps
      }
    })
  })
  
  actualTraining.training_exercises.forEach(ex => {
    ex.exercise_sets.forEach(set => {
      if (set.weight && set.reps) {
        totalActualVolume += set.weight * set.reps
      }
    })
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Comparación de Sesión
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <p><strong>{routineName}</strong></p>
            <div className="flex items-center gap-2 mt-1">
              <span>Planificado: {format(new Date(scheduledAt), "dd/MM/yyyy", { locale: es })}</span>
              <ArrowRight className="h-3 w-3" />
              <span>Realizado: {format(new Date(actualTraining.date), "dd/MM/yyyy HH:mm", { locale: es })}</span>
            </div>
          </div>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Series</p>
            <div className="flex items-center justify-center gap-1">
              <span className="text-sm text-muted-foreground">{totalPlannedSets}</span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className={cn(
                "font-medium",
                totalActualSets >= totalPlannedSets ? "text-green-600" : "text-amber-600"
              )}>
                {totalActualSets}
              </span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Duración</p>
            <span className="font-medium">{actualTraining.duration} min</span>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Volumen</p>
            <div className="flex items-center justify-center gap-1">
              {totalPlannedVolume > 0 ? (
                <>
                  <span className="text-sm text-muted-foreground">{Math.round(totalPlannedVolume)}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </>
              ) : null}
              <span className={cn(
                "font-medium",
                totalActualVolume >= totalPlannedVolume ? "text-green-600" : "text-amber-600"
              )}>
                {Math.round(totalActualVolume)} kg
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Exercises Comparison */}
        <div className="space-y-4">
          {plannedExercises
            .sort((a, b) => a.order_index - b.order_index)
            .map((plannedEx, exIndex) => {
              const actualEx = actualExercisesMap.get(plannedEx.exercise.id)
              const wasPerformed = !!actualEx
              
              return (
                <div 
                  key={plannedEx.id} 
                  className={cn(
                    "rounded-lg border p-3",
                    wasPerformed ? "bg-background" : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                  )}
                >
                  {/* Exercise Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      {exIndex + 1}
                    </span>
                    <h4 className="font-medium text-sm flex-1">{plannedEx.exercise.name}</h4>
                    {wasPerformed ? (
                      <Badge variant="outline" className="text-[10px] h-5 border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30">
                        <Check className="h-3 w-3 mr-1" />
                        Realizado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 border-red-500 text-red-600 bg-red-50 dark:bg-red-950/30">
                        <X className="h-3 w-3 mr-1" />
                        No realizado
                      </Badge>
                    )}
                  </div>

                  {/* Sets Comparison Table */}
                  <div className="overflow-x-auto -mx-1">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground text-left border-b">
                          <th className="py-1.5 px-1 w-8">#</th>
                          <th className="py-1.5 px-1">Tipo</th>
                          <th className="py-1.5 px-1 text-center">Reps</th>
                          <th className="py-1.5 px-1 text-center">Peso</th>
                          <th className="py-1.5 px-1 text-center">RIR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {plannedEx.variant_exercise_sets
                          .sort((a, b) => a.set_number - b.set_number)
                          .map((plannedSet) => {
                            // Find matching actual set by set_number
                            const actualSet = actualEx?.exercise_sets.find(
                              s => s.set_number === plannedSet.set_number
                            )
                            const typeInfo = SET_TYPE_LABELS[plannedSet.set_type] || {
                              label: plannedSet.set_type,
                              color: "bg-gray-500/20 text-gray-600"
                            }

                            return (
                              <tr key={plannedSet.id} className="border-b border-dashed last:border-0">
                                <td className="py-1.5 px-1 font-mono text-muted-foreground">
                                  {plannedSet.set_number}
                                </td>
                                <td className="py-1.5 px-1">
                                  <Badge className={`${typeInfo.color} text-[10px] border-0 px-1.5`}>
                                    {typeInfo.label}
                                  </Badge>
                                </td>
                                <td className="py-1.5 px-1 text-center">
                                  <ComparisonIndicator 
                                    planned={plannedSet.target_reps} 
                                    actual={actualSet?.reps}
                                    higherIsBetter={true}
                                  />
                                </td>
                                <td className="py-1.5 px-1 text-center">
                                  <ComparisonIndicator 
                                    planned={plannedSet.target_weight} 
                                    actual={actualSet?.weight}
                                    unit="kg"
                                    higherIsBetter={true}
                                  />
                                </td>
                                <td className="py-1.5 px-1 text-center">
                                  <ComparisonIndicator 
                                    planned={plannedSet.target_rir} 
                                    actual={actualSet?.rir}
                                    higherIsBetter={false}
                                  />
                                </td>
                              </tr>
                            )
                          })}
                        
                        {/* Show extra sets that weren't planned */}
                        {actualEx?.exercise_sets
                          .filter(s => s.set_number > plannedEx.variant_exercise_sets.length)
                          .sort((a, b) => a.set_number - b.set_number)
                          .map((extraSet) => {
                            const typeInfo = SET_TYPE_LABELS[extraSet.set_type || 'working'] || {
                              label: extraSet.set_type || 'working',
                              color: "bg-gray-500/20 text-gray-600"
                            }

                            return (
                              <tr key={extraSet.id} className="border-b border-dashed last:border-0 bg-blue-50/50 dark:bg-blue-950/20">
                                <td className="py-1.5 px-1 font-mono text-blue-600">
                                  +{extraSet.set_number}
                                </td>
                                <td className="py-1.5 px-1">
                                  <Badge className={`${typeInfo.color} text-[10px] border-0 px-1.5`}>
                                    {typeInfo.label}
                                  </Badge>
                                </td>
                                <td className="py-1.5 px-1 text-center font-medium text-blue-600">
                                  {extraSet.reps || "-"}
                                </td>
                                <td className="py-1.5 px-1 text-center font-medium text-blue-600">
                                  {extraSet.weight ? `${extraSet.weight}kg` : "-"}
                                </td>
                                <td className="py-1.5 px-1 text-center font-medium text-blue-600">
                                  {extraSet.rir ?? "-"}
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}

          {/* Show exercises that were done but not planned */}
          {actualTraining.training_exercises
            .filter(actualEx => !plannedExercises.some(p => p.exercise.id === actualEx.exercise_id))
            .map((extraEx, idx) => (
              <div 
                key={extraEx.id}
                className="rounded-lg border p-3 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded">
                    +
                  </span>
                  <h4 className="font-medium text-sm flex-1">{extraEx.exercise?.name || "Ejercicio extra"}</h4>
                  <Badge variant="outline" className="text-[10px] h-5 border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30">
                    Extra
                  </Badge>
                </div>

                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-muted-foreground text-left border-b">
                        <th className="py-1.5 px-1 w-8">#</th>
                        <th className="py-1.5 px-1">Tipo</th>
                        <th className="py-1.5 px-1 text-center">Reps</th>
                        <th className="py-1.5 px-1 text-center">Peso</th>
                        <th className="py-1.5 px-1 text-center">RIR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extraEx.exercise_sets
                        .sort((a, b) => a.set_number - b.set_number)
                        .map((set) => {
                          const typeInfo = SET_TYPE_LABELS[set.set_type || 'working'] || {
                            label: set.set_type || 'working',
                            color: "bg-gray-500/20 text-gray-600"
                          }

                          return (
                            <tr key={set.id} className="border-b border-dashed last:border-0">
                              <td className="py-1.5 px-1 font-mono text-muted-foreground">
                                {set.set_number}
                              </td>
                              <td className="py-1.5 px-1">
                                <Badge className={`${typeInfo.color} text-[10px] border-0 px-1.5`}>
                                  {typeInfo.label}
                                </Badge>
                              </td>
                              <td className="py-1.5 px-1 text-center font-medium">
                                {set.reps || "-"}
                              </td>
                              <td className="py-1.5 px-1 text-center font-medium">
                                {set.weight ? `${set.weight}kg` : "-"}
                              </td>
                              <td className="py-1.5 px-1 text-center font-medium">
                                {set.rir ?? "-"}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>

        {actualTraining.notes && (
          <>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Notas de la sesión</p>
              <p className="text-sm">{actualTraining.notes}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}


