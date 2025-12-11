"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Play, Dumbbell, RotateCcw, X, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface VariantSet {
  id: string
  set_number: number
  target_reps?: number
  target_rir?: number
  target_weight?: number
  target_weight_percent?: number
  set_type: string
  notes?: string
}

interface VariantExercise {
  id: string
  order_index: number
  notes?: string
  exercise: {
    id: string
    name: string
    muscle_groups?: string[]
  }
  variant_exercise_sets: VariantSet[]
}

interface RoutineVariant {
  id: string
  variant_name: string
  intensity_level: number
  description?: string
  variant_exercises: VariantExercise[]
}

interface RoutineDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variantId: string
  routineId: string
  routineName: string
  variantName: string
  phaseRoutineId?: string      // For linking to program schedule
  scheduledAt?: string          // For display
}

export function RoutineDetailModal({
  open,
  onOpenChange,
  variantId,
  routineId,
  routineName,
  variantName,
  phaseRoutineId,
  scheduledAt,
}: RoutineDetailModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [variant, setVariant] = useState<RoutineVariant | null>(null)

  useEffect(() => {
    if (open && variantId) {
      fetchVariantDetails()
    }
  }, [open, variantId])

  const fetchVariantDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/routines/${routineId}/variants`)
      if (!response.ok) throw new Error("Error fetching variant")
      const { data } = await response.json()
      const found = data.find((v: RoutineVariant) => v.id === variantId)
      setVariant(found || null)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = () => {
    // Navigate to training with context
    const params = new URLSearchParams({
      routineId: routineId,
      variantId: variantId,
    })
    if (phaseRoutineId) {
      params.set("phaseRoutineId", phaseRoutineId)
    }
    router.push(`/trainings/new?${params.toString()}`)
  }

  const handleEditRoutine = () => {
    router.push(`/routines/${routineId}/edit`)
  }

  const SET_TYPE_LABELS: Record<string, { label: string; color: string }> = {
    warmup: { label: "Calentamiento", color: "bg-orange-500/20 text-orange-600" },
    approach: { label: "Aproximación", color: "bg-blue-500/20 text-blue-600" },
    working: { label: "Trabajo", color: "bg-green-500/20 text-green-600" },
    backoff: { label: "Backoff", color: "bg-purple-500/20 text-purple-600" },
    bilbo: { label: "Bilbo", color: "bg-pink-500/20 text-pink-600" },
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            {routineName}
          </DialogTitle>
          <DialogDescription>
            {variantName}
            {scheduledAt && (
              <span className="ml-2 text-primary">
                • Programado para {new Date(scheduledAt).toLocaleDateString()}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !variant ? (
          <div className="text-center py-8 text-muted-foreground">
            No se encontró la variante
          </div>
        ) : (
          <div className="space-y-4">
            {variant.variant_exercises
              ?.sort((a, b) => a.order_index - b.order_index)
              .map((ex, index) => (
                <div key={ex.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <h4 className="font-semibold">{ex.exercise.name}</h4>
                      </div>
                      {ex.exercise.muscle_groups && ex.exercise.muscle_groups.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {ex.exercise.muscle_groups.map((mg) => (
                            <Badge key={mg} variant="outline" className="text-[10px] h-5">
                              {mg}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {ex.notes && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">
                      📝 {ex.notes}
                    </p>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground text-left">
                          <th className="py-1 pr-3">Serie</th>
                          <th className="py-1 pr-3">Tipo</th>
                          <th className="py-1 pr-3">Reps</th>
                          <th className="py-1 pr-3">Peso</th>
                          <th className="py-1">RIR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ex.variant_exercise_sets
                          ?.sort((a, b) => a.set_number - b.set_number)
                          .map((set) => {
                            const typeInfo = SET_TYPE_LABELS[set.set_type] || {
                              label: set.set_type,
                              color: "bg-gray-500/20 text-gray-600",
                            }
                            return (
                              <tr key={set.id} className="border-t">
                                <td className="py-2 pr-3 font-mono">{set.set_number}</td>
                                <td className="py-2 pr-3">
                                  <Badge className={`${typeInfo.color} text-[10px] border-0`}>
                                    {typeInfo.label}
                                  </Badge>
                                </td>
                                <td className="py-2 pr-3">
                                  {set.target_reps ? `${set.target_reps}` : "-"}
                                </td>
                                <td className="py-2 pr-3">
                                  {set.target_weight
                                    ? `${set.target_weight}kg`
                                    : set.target_weight_percent
                                    ? `${set.target_weight_percent}%`
                                    : "-"}
                                </td>
                                <td className="py-2">
                                  {set.target_rir !== null && set.target_rir !== undefined
                                    ? set.target_rir
                                    : "-"}
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
        )}

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button variant="secondary" onClick={handleEditRoutine} disabled={loading || !variant}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button onClick={handleStartSession} disabled={loading || !variant}>
            <Play className="mr-2 h-4 w-4" />
            Comenzar Sesión
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
