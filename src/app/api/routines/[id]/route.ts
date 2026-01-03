import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// DELETE /api/routines/[id] - Eliminar rutina
export async function DELETE(
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

    // Eliminar la rutina (los ejercicios se eliminan automáticamente por CASCADE)
    const { error: deleteError } = await supabase
      .from('workout_routines')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error eliminando rutina:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar la rutina' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/routines/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/routines/[id] - Obtener rutina específica
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

    const { data: routine, error } = await supabase
      .from('workout_routines')
      .select(`
        *,
        routine_exercises (
          *,
          exercise:exercises (*)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !routine) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ data: routine });
  } catch (error) {
    console.error('Error en GET /api/routines/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT /api/routines/[id] - Actualizar rutina
export async function PUT(
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
    const body = await request.json();
    const { name, description, type, duration, exercises } = body;

    // Verificar que la rutina pertenece al usuario
    const { data: existingRoutine, error: routineError } = await supabase
      .from('workout_routines')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (routineError || !existingRoutine) {
      return NextResponse.json({ error: 'Rutina no encontrada' }, { status: 404 });
    }

    // Actualizar la rutina
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (type !== undefined) updateData.type = type;
    if (duration !== undefined) updateData.duration = duration || null;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('workout_routines')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error actualizando rutina:', updateError);
        return NextResponse.json({ error: 'Error al actualizar la rutina' }, { status: 500 });
      }
    }

    // Si se proporcionan ejercicios, reemplazarlos
    if (exercises !== undefined && Array.isArray(exercises)) {
      // Eliminar ejercicios existentes
      await supabase
        .from('routine_exercises')
        .delete()
        .eq('routine_id', id);

      // Insertar nuevos ejercicios
      if (exercises.length > 0) {
        const routineExercises = exercises.map((ex: any, index: number) => ({
          routine_id: id,
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
          console.error('Error actualizando ejercicios:', exercisesError);
          return NextResponse.json({ error: 'Error al actualizar los ejercicios' }, { status: 500 });
        }
      }
    }

    // Obtener la rutina actualizada
    const { data: updatedRoutine, error: fetchError } = await supabase
      .from('workout_routines')
      .select(`
        *,
        routine_exercises (
          *,
          exercise:exercises (*)
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Error al obtener la rutina actualizada' }, { status: 500 });
    }

    return NextResponse.json({ data: updatedRoutine });
  } catch (error) {
    console.error('Error en PUT /api/routines/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}












