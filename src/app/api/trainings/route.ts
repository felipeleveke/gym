import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/trainings - Obtener entrenamientos del usuario
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'gym' | 'sport'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (type === 'gym') {
      let query = supabase
        .from('gym_trainings')
        .select(`
          *,
          training_exercises (
            *,
            exercise:exercises (*),
            exercise_sets (*)
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (type === 'sport') {
      let query = supabase
        .from('sport_trainings')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching trainings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/trainings - Crear nuevo entrenamiento
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, ...trainingData } = body;

    if (type === 'gym') {
      const { data, error } = await supabase
        .from('gym_trainings')
        .insert({
          user_id: user.id,
          ...trainingData,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }

    if (type === 'sport') {
      const { data, error } = await supabase
        .from('sport_trainings')
        .insert({
          user_id: user.id,
          ...trainingData,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error creating training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

