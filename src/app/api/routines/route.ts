import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/routines - Obtener rutinas del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'gym' | 'sport' | null (all)
    const isActive = searchParams.get('isActive'); // 'true' | 'false' | null (all)

    let query = supabase
      .from('workout_routines')
      .select(`
        *,
        routine_exercises (
          *,
          exercise:exercises (*)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: routines, error } = await query;

    if (error) {
      console.error('Error obteniendo rutinas:', error);
      return NextResponse.json({ error: 'Error al obtener las rutinas' }, { status: 500 });
    }

    return NextResponse.json({ data: routines || [] });
  } catch (error) {
    console.error('Error en GET /api/routines:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/routines - Crear nueva rutina
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, duration, exercises } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre de la rutina es requerido' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'El tipo de rutina es requerido' }, { status: 400 });
    }

    // Crear la rutina
    const { data: routine, error: routineError } = await supabase
      .from('workout_routines')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        type,
        duration: duration || null,
        is_active: true,
      })
      .select()
      .single();

    if (routineError || !routine) {
      console.error('Error creando rutina:', routineError);
      return NextResponse.json({ error: 'Error al crear la rutina' }, { status: 500 });
    }

    // Si hay ejercicios, crearlos
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      const routineExercises = exercises.map((ex: any, index: number) => ({
        routine_id: routine.id,
        exercise_id: ex.exercise_id,
        order_index: index + 1,
        default_weight: ex.default_weight || null,
        default_sets: ex.default_sets || null,
        default_reps: ex.default_reps || null,
        notes: ex.notes || null,
      }));

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
    console.error('Error en POST /api/routines:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}





