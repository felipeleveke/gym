import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeTrainingProgress } from '@/lib/ai/anthropic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener historial de entrenamientos
    const { data: trainings, error } = await supabase
      .from('gym_trainings')
      .select(`
        date,
        training_exercises (
          exercise:exercises (name),
          exercise_sets (weight, reps)
        )
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30);

    if (error) throw error;

    const trainingHistory = trainings?.map((training) => ({
      date: training.date,
      exercises: training.training_exercises?.map((te: any) => ({
        name: te.exercise?.name || 'Unknown',
        sets: te.exercise_sets || [],
      })) || [],
    })) || [];

    const analysis = await analyzeTrainingProgress(trainingHistory);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

