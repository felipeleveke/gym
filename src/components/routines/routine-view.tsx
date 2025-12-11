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
  Dumbbell,
  ArrowLeft,
  Play,
  RotateCcw,
  Timer
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Interfaces equivalent to those used in RoutineForm but for display
interface Exercise {
  id: string
  name: string
  description?: string
  muscle_groups?: string[]
}

interface RoutineVariant {
  id: string
  variant_name: string
  intensity_level: number
  description?: string
  variant_exercises: VariantExercise[]
}

interface VariantExercise {
  id: string
  order_index: number
  notes?: string
  exercise: Exercise
  variant_exercise_sets: VariantSet[]
}

interface VariantSet {
  id: string
  set_number: number
  target_reps?: number
  target_rir?: number
  target_weight_percent?: number
  target_weight?: number
  set_type: string
  notes?: string
}

interface Routine {
  id: string
  name: string
  description?: string
  type: string
}

export function RoutineOverviewClient({ id }: { id: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [routine, setRoutine] = useState<Routine | null>(null)
  const [variants, setVariants] = useState<RoutineVariant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Routine Basic Info
        const routineRes = await fetch(`/api/routines/${id}`)
        if (!routineRes.ok) throw new Error("Error cargando rutina")
        const routineData = await routineRes.json()
        setRoutine(routineData.data)

        // Fetch Variants
        const variantsRes = await fetch(`/api/routines/${id}/variants`)
        if (variantsRes.ok) {
           const variantsData = await variantsRes.json()
           if (variantsData.data) {
             setVariants(variantsData.data)
           }
        }
        
      } catch (error) {
        console.error("Error fetching routine:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la rutina",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id, toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!routine) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground">Rutina no encontrada</p>
        <Button variant="outline" onClick={() => router.push("/routines")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Mis Rutinas
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{routine.name}</h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <Badge variant="secondary" className="text-xs uppercase">
              {routine.type}
            </Badge>
          </div>
        </div>
        <Button onClick={() => router.push(`/routines/${id}/edit`)} variant="outline">
          Editar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {routine.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{routine.description}</p>
              </CardContent>
            </Card>
          )}

          {variants.length > 0 ? (
            <Tabs defaultValue={variants[0]?.id} className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                {variants.map((variant) => (
                  <TabsTrigger key={variant.id} value={variant.id}>
                    {variant.variant_name}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {variants.map((variant) => (
                <TabsContent key={variant.id} value={variant.id} className="space-y-4 mt-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                       <div className="space-y-1">
                          <CardTitle>{variant.variant_name}</CardTitle>
                          <CardDescription>{variant.description || "Sin descripción"}</CardDescription>
                       </div>
                       <Button size="sm">
                         <Play className="mr-2 h-4 w-4" />
                         Iniciar Sesión
                       </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6 mt-4">
                        {variant.variant_exercises
                          ?.sort((a, b) => a.order_index - b.order_index)
                          .map((ex) => (
                          <div key={ex.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-lg">{ex.exercise.name}</h4>
                                {ex.notes && (
                                  <p className="text-sm text-yellow-600/90 dark:text-yellow-500/90 mt-1">
                                    Nota: {ex.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                               {ex.variant_exercise_sets
                                  ?.sort((a, b) => a.set_number - b.set_number)
                                  .map((set) => (
                                    <div key={set.id} className="flex items-center gap-2">
                                       <span className="font-mono bg-background px-1.5 rounded border text-xs">#{set.set_number}</span>
                                       <span>
                                          {set.target_reps ? `${set.target_reps} reps` : ''}
                                          {set.target_reps && set.target_weight ? ' @ ' : ''}
                                          {set.target_weight ? `${set.target_weight}kg` : ''}
                                          {set.target_rir !== null ? ` (RIR ${set.target_rir})` : ''}
                                       </span>
                                    </div>
                                  ))
                               }
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
             <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                   No hay ejercicios configurados para esta rutina.
                </CardContent>
             </Card>
          )}
        </div>

        <div className="space-y-6">
           <Card>
              <CardHeader>
                 <CardTitle>Opciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                  <Button className="w-full" variant="secondary">
                     <Timer className="mr-2 h-4 w-4" />
                     Historial
                  </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}
