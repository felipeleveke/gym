import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/trainings/[id]/duplicate - Duplicar un entrenamiento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Intentar obtener como gym training primero
    const { data: gymTraining, error: gymError } = await supabase
      .from('gym_trainings')
      .select(`
        *,
        training_exercises (
          *,
          exercise:exercises (*),
          exercise_sets (*)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!gymError && gymTraining) {
      // Crear nuevo entrenamiento con fecha actual
      const { data: newTraining, error: createError } = await supabase
        .from('gym_trainings')
        .insert({
          user_id: user.id,
          date: new Date().toISOString(),
          duration: gymTraining.duration,
          start_time: null, // Resetear tiempos
          end_time: null,
          notes: gymTraining.notes,
          tags: gymTraining.tags,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Duplicar ejercicios y series
      if (gymTraining.training_exercises && Array.isArray(gymTraining.training_exercises)) {
        for (const exerciseData of gymTraining.training_exercises) {
          const { data: newExercise, error: exerciseError } = await supabase
            .from('training_exercises')
            .insert({
              training_id: newTraining.id,
              exercise_id: exerciseData.exercise_id,
              order_index: exerciseData.order_index,
              notes: exerciseData.notes,
              start_time: null, // Resetear tiempos
              end_time: null,
            })
            .select()
            .single();

          if (exerciseError) throw exerciseError;

          // Duplicar series
          if (exerciseData.exercise_sets && Array.isArray(exerciseData.exercise_sets)) {
            const setsToInsert = exerciseData.exercise_sets.map((set: any) => ({
              training_exercise_id: newExercise.id,
              set_number: set.set_number,
              weight: set.weight,
              reps: set.reps,
              duration: set.duration,
              rest_time: set.rest_time,
              rir: set.rir,
              notes: set.notes,
            }));

            const { error: setsError } = await supabase
              .from('exercise_sets')
              .insert(setsToInsert);

            if (setsError) throw setsError;
          }
        }
      }

      // Obtener el entrenamiento duplicado completo
      const { data: duplicatedTraining, error: fetchError } = await supabase
        .from('gym_trainings')
        .select(`
          *,
          training_exercises (
            *,
            exercise:exercises (*),
            exercise_sets (*)
          )
        `)
        .eq('id', newTraining.id)
        .single();

      if (fetchError) throw fetchError;

      return NextResponse.json({ data: duplicatedTraining }, { status: 201 });
    }

    // Intentar como sport training
    const { data: sportTraining, error: sportError } = await supabase
      .from('sport_trainings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!sportError && sportTraining) {
      const { data: newTraining, error: createError } = await supabase
        .from('sport_trainings')
        .insert({
          user_id: user.id,
          date: new Date().toISOString(),
          sport_type: sportTraining.sport_type,
          duration: sportTraining.duration,
          distance: sportTraining.distance,
          avg_speed: sportTraining.avg_speed,
          max_speed: sportTraining.max_speed,
          avg_heart_rate: sportTraining.avg_heart_rate,
          max_heart_rate: sportTraining.max_heart_rate,
          elevation: sportTraining.elevation,
          terrain: sportTraining.terrain,
          weather: sportTraining.weather,
          temperature: sportTraining.temperature,
          notes: sportTraining.notes,
          tags: sportTraining.tags,
        })
        .select()
        .single();

      if (createError) throw createError;
      return NextResponse.json({ data: newTraining }, { status: 201 });
    }

    return NextResponse.json({ error: 'Training not found' }, { status: 404 });
  } catch (error) {
    console.error('Error duplicating training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}




