import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/exercises/stats - Obtener estadísticas de uso de ejercicios
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exerciseId = searchParams.get('exerciseId');

    // Si se proporciona un exerciseId específico, devolver estadísticas de ese ejercicio
    if (exerciseId) {
      // Contar cuántas veces se usa el ejercicio
      const { count: usageCount, error: countError } = await supabase
        .from('training_exercises')
        .select('*', { count: 'exact', head: true })
        .eq('exercise_id', exerciseId);

      if (countError) {
        console.error('Error counting exercise usage:', countError);
      }

      // Obtener los últimos entrenamientos donde se usó
      const { data: recentTrainings, error: trainingsError } = await supabase
        .from('training_exercises')
        .select(`
          id,
          created_at,
          training:gym_trainings!inner (
            id,
            date,
            notes
          )
        `)
        .eq('exercise_id', exerciseId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (trainingsError) {
        console.error('Error fetching recent trainings:', trainingsError);
      }

      return NextResponse.json({
        exerciseId,
        usageCount: usageCount || 0,
        recentTrainings: recentTrainings || [],
      });
    }

    // Si no se proporciona exerciseId, devolver estadísticas de todos los ejercicios
    // Contar cuántas veces se usa cada ejercicio
    const { data: exerciseUsage, error: usageError } = await supabase
      .from('training_exercises')
      .select(`
        exercise_id,
        created_at,
        training:gym_trainings!inner (
          id,
          date
        )
      `);

    if (usageError) {
      console.error('Error fetching exercise usage:', usageError);
      return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
    }

    // Agrupar por exercise_id y contar
    const statsMap = new Map<string, {
      usageCount: number;
      lastUsed: string | null;
    }>();

    (exerciseUsage || []).forEach((item: any) => {
      const exerciseId = item.exercise_id;
      const current = statsMap.get(exerciseId) || { usageCount: 0, lastUsed: null };

      statsMap.set(exerciseId, {
        usageCount: current.usageCount + 1,
        lastUsed: current.lastUsed
          ? (new Date(item.created_at) > new Date(current.lastUsed) ? item.created_at : current.lastUsed)
          : item.created_at,
      });
    });

    // Convertir Map a objeto
    const stats: Record<string, { usageCount: number; lastUsed: string | null }> = {};
    statsMap.forEach((value, key) => {
      stats[key] = value;
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching exercise stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}










