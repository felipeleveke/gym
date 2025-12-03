import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/routines/from-training - Convertir entrenamiento en rutina
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { trainingId, name, description } = body;

    if (!trainingId) {
      return NextResponse.json({ error: 'trainingId es requerido' }, { status: 400 });
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre de la rutina es requerido' }, { status: 400 });
    }

    // Obtener el entrenamiento con sus ejercicios y series
    const { data: training, error: trainingError } = await supabase
      .from('gym_trainings')
      .select(`
        *,
        training_exercises (
          *,
          exercise:exercises (*),
          exercise_sets (*)
        )
      `)
      .eq('id', trainingId)
      .eq('user_id', user.id)
      .single();

    if (trainingError || !training) {
      return NextResponse.json({ error: 'Entrenamiento no encontrado' }, { status: 404 });
    }

    // Crear la rutina
    const { data: routine, error: routineError } = await supabase
      .from('workout_routines')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        type: 'gym',
        duration: training.duration || null,
        is_active: true,
      })
      .select()
      .single();

    if (routineError || !routine) {
      console.error('Error creando rutina:', routineError);
      return NextResponse.json({ error: 'Error al crear la rutina' }, { status: 500 });
    }

    // Obtener ejercicios ordenados
    const sortedExercises = (training.training_exercises || [])
      .sort((a: any, b: any) => a.order_index - b.order_index);

    // Crear los ejercicios de la rutina con los pesos (sin repeticiones)
    const routineExercises = sortedExercises.map((te: any, index: number) => {
      // Obtener el peso de la primera serie de tipo 'working' o la primera serie disponible
      const workingSet = (te.exercise_sets || []).find((set: any) => set.set_type === 'working') 
        || (te.exercise_sets || [])[0];
      
      return {
        routine_id: routine.id,
        exercise_id: te.exercise_id,
        order_index: index + 1,
        default_weight: workingSet?.weight || null,
        default_sets: (te.exercise_sets || []).length,
        default_reps: null, // No guardamos reps según las especificaciones
        notes: te.notes || null,
      };
    });

    if (routineExercises.length > 0) {
      const { error: exercisesError } = await supabase
        .from('routine_exercises')
        .insert(routineExercises);

      if (exercisesError) {
        console.error('Error creando ejercicios de rutina:', exercisesError);
        // Intentar eliminar la rutina creada
        await supabase.from('workout_routines').delete().eq('id', routine.id);
        return NextResponse.json({ error: 'Error al crear los ejercicios de la rutina' }, { status: 500 });
      }
    }

    // Obtener la rutina completa con ejercicios
    const { data: completeRoutine, error: fetchError } = await supabase
      .from('workout_routines')
      .select(`
        *,
        routine_exercises (
          *,
          exercise:exercises (*)
        )
      `)
      .eq('id', routine.id)
      .single();

    if (fetchError || !completeRoutine) {
      return NextResponse.json({ error: 'Error al obtener la rutina creada' }, { status: 500 });
    }

    return NextResponse.json({ data: completeRoutine });
  } catch (error) {
    console.error('Error en from-training:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

