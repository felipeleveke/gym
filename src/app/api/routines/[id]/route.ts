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

