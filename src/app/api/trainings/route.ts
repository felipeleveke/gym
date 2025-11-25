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
    const type = searchParams.get('type'); // 'gym' | 'sport' | null (all)
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Si no se especifica tipo, devolver todos los entrenamientos combinados
    if (!type) {
      const [gymResult, sportResult] = await Promise.all([
        supabase
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
          .order('date', { ascending: false }),
        supabase
          .from('sport_trainings')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
      ]);

      if (gymResult.error) throw gymResult.error;
      if (sportResult.error) throw sportResult.error;

      // Combinar y ordenar por fecha
      const allTrainings = [
        ...(gymResult.data || []).map((t) => ({ ...t, training_type: 'gym' })),
        ...(sportResult.data || []).map((t) => ({ ...t, training_type: 'sport' })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return NextResponse.json({ data: allTrainings });
    }

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
      const { exercises, ...trainingInfo } = trainingData;
      
      // Crear el entrenamiento primero
      const { data: training, error: trainingError } = await supabase
        .from('gym_trainings')
        .insert({
          user_id: user.id,
          date: trainingInfo.date,
          duration: trainingInfo.duration,
          start_time: trainingInfo.start_time || null,
          end_time: trainingInfo.end_time || null,
          notes: trainingInfo.notes || null,
          tags: trainingInfo.tags || null,
        })
        .select()
        .single();

      if (trainingError) throw trainingError;

      // Si hay ejercicios, crearlos junto con sus series
      if (exercises && Array.isArray(exercises) && exercises.length > 0) {
        for (const exerciseData of exercises) {
          const { exercise_id, order_index, notes, sets, start_time, end_time } = exerciseData;

          // Crear el ejercicio en el entrenamiento
          const { data: trainingExercise, error: exerciseError } = await supabase
            .from('training_exercises')
            .insert({
              training_id: training.id,
              exercise_id,
              order_index,
              notes: notes || null,
              start_time: start_time || null,
              end_time: end_time || null,
            })
            .select()
            .single();

          if (exerciseError) throw exerciseError;

          // Crear las series del ejercicio
          if (sets && Array.isArray(sets) && sets.length > 0) {
            const setsToInsert = sets.map((set: any) => ({
              training_exercise_id: trainingExercise.id,
              set_number: set.set_number,
              weight: set.weight || null,
              reps: set.reps || null,
              duration: set.duration || null,
              rest_time: set.rest_time || null,
              rir: set.rir || null,
              notes: set.notes || null,
            }));

            const { error: setsError } = await supabase
              .from('exercise_sets')
              .insert(setsToInsert);

            if (setsError) throw setsError;
          }
        }
      }

      // Obtener el entrenamiento completo con relaciones
      const { data: fullTraining, error: fetchError } = await supabase
        .from('gym_trainings')
        .select(`
          *,
          training_exercises (
            *,
            exercise:exercises (*),
            exercise_sets (*)
          )
        `)
        .eq('id', training.id)
        .single();

      if (fetchError) throw fetchError;

      return NextResponse.json({ data: fullTraining }, { status: 201 });
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

