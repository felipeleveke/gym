import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/routines/[id]/history - Obtener historial de entrenamientos de una rutina
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que la rutina pertenece al usuario
    const { data: routine, error: routineError } = await supabase
      .from('workout_routines')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (routineError || !routine) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    // Obtener todos los entrenamientos que usaron esta rutina
    const { data: trainings, error: trainingsError } = await supabase
      .from('gym_trainings')
      .select(`
        id,
        date,
        training_exercises (
          id,
          exercise_id,
          order_index,
          exercise_sets (
            id,
            set_number,
            weight,
            reps,
            set_type
          )
        )
      `)
      .eq('routine_id', id)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (trainingsError) {
      console.error('Error obteniendo historial:', trainingsError);
      return NextResponse.json({ error: 'Error al obtener el historial' }, { status: 500 });
    }

    // Procesar los datos para obtener las mejores marcas y último entrenamiento por ejercicio
    const exerciseStats: Record<string, {
      lastWeight?: number | null;
      lastReps?: number | null;
      bestWeight?: number | null;
      bestReps?: number | null;
      lastDate?: string;
    }> = {};

    trainings?.forEach((training) => {
      training.training_exercises?.forEach((te: any) => {
        const exerciseId = te.exercise_id;
        
        if (!exerciseStats[exerciseId]) {
          exerciseStats[exerciseId] = {};
        }

        // Obtener la primera serie de tipo 'working' o la primera serie disponible
        const workingSet = (te.exercise_sets || []).find((set: any) => set.set_type === 'working')
          || (te.exercise_sets || [])[0];

        if (workingSet) {
          // Si es el primer entrenamiento o es más reciente, actualizar último
          if (!exerciseStats[exerciseId].lastDate || 
              new Date(training.date) > new Date(exerciseStats[exerciseId].lastDate!)) {
            exerciseStats[exerciseId].lastWeight = workingSet.weight;
            exerciseStats[exerciseId].lastReps = workingSet.reps;
            exerciseStats[exerciseId].lastDate = training.date;
          }

          // Actualizar mejor marca
          if (workingSet.weight) {
            if (!exerciseStats[exerciseId].bestWeight || 
                workingSet.weight > exerciseStats[exerciseId].bestWeight!) {
              exerciseStats[exerciseId].bestWeight = workingSet.weight;
              exerciseStats[exerciseId].bestReps = workingSet.reps;
            }
          }
        }
      });
    });

    return NextResponse.json({ 
      data: {
        trainings: trainings || [],
        exerciseStats
      }
    });
  } catch (error) {
    console.error('Error en GET /api/routines/[id]/history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

