import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/exercises/[id]/history - Obtener historial de entrenamientos de un ejercicio
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

    const { id: exerciseId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Obtener todos los entrenamientos donde se usó este ejercicio
    const { data: trainingExercises, error: trainingsError } = await supabase
      .from('training_exercises')
      .select(`
        id,
        order_index,
        notes,
        gym_trainings!inner (
          id,
          date,
          start_time,
          end_time,
          duration,
          notes
        ),
        exercise_sets (
          id,
          set_number,
          weight,
          reps,
          duration,
          rest_time,
          rir,
          notes,
          set_type
        )
      `)
      .eq('exercise_id', exerciseId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (trainingsError) {
      console.error('Error obteniendo historial:', trainingsError);
      return NextResponse.json({ error: 'Error al obtener el historial' }, { status: 500 });
    }

    // Formatear los datos para la respuesta
    const history = (trainingExercises || []).map((te: any) => ({
      id: te.id,
      training: te.gym_trainings,
      notes: te.notes,
      sets: (te.exercise_sets || []).sort((a: any, b: any) => a.set_number - b.set_number),
    }));

    // Calcular estadísticas generales del ejercicio
    let bestWeight: number | null = null;
    let bestReps: number | null = null;
    let totalSets = 0;
    let totalVolume = 0;

    history.forEach((h: any) => {
      h.sets.forEach((set: any) => {
        totalSets++;
        if (set.weight && set.reps) {
          totalVolume += set.weight * set.reps;
        }
        if (set.weight && (!bestWeight || set.weight > bestWeight)) {
          bestWeight = set.weight;
          bestReps = set.reps;
        }
      });
    });

    return NextResponse.json({ 
      data: {
        history,
        stats: {
          totalTrainings: history.length,
          totalSets,
          totalVolume,
          bestWeight,
          bestReps,
        }
      }
    });
  } catch (error) {
    console.error('Error en GET /api/exercises/[id]/history:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
