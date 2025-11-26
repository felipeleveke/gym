import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/trainings/[id] - Obtener un entrenamiento específico
export async function GET(
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
      return NextResponse.json({ data: { ...gymTraining, training_type: 'gym' } });
    }

    // Si no es gym, intentar como sport training
    const { data: sportTraining, error: sportError } = await supabase
      .from('sport_trainings')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!sportError && sportTraining) {
      return NextResponse.json({ data: { ...sportTraining, training_type: 'sport' } });
    }

    return NextResponse.json({ error: 'Training not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/trainings/[id] - Actualizar un entrenamiento
export async function PUT(
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

    const body = await request.json();
    const { type, ...trainingData } = body;

    if (type === 'gym') {
      const { exercises, ...trainingInfo } = trainingData;

      // Verificar que el entrenamiento pertenece al usuario
      const { data: existingTraining, error: checkError } = await supabase
        .from('gym_trainings')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (checkError || !existingTraining) {
        return NextResponse.json({ error: 'Training not found' }, { status: 404 });
      }

      // Actualizar el entrenamiento
      const { error: updateError } = await supabase
        .from('gym_trainings')
        .update({
          date: trainingInfo.date,
          duration: trainingInfo.duration,
          start_time: trainingInfo.start_time || null,
          end_time: trainingInfo.end_time || null,
          notes: trainingInfo.notes || null,
          tags: trainingInfo.tags || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Eliminar ejercicios y series existentes
      const { data: existingExercises } = await supabase
        .from('training_exercises')
        .select('id')
        .eq('training_id', id);

      if (existingExercises && existingExercises.length > 0) {
        const exerciseIds = existingExercises.map(ex => ex.id);
        
        // Eliminar series primero
        await supabase
          .from('exercise_sets')
          .delete()
          .in('training_exercise_id', exerciseIds);

        // Eliminar ejercicios
        await supabase
          .from('training_exercises')
          .delete()
          .eq('training_id', id);
      }

      // Crear nuevos ejercicios y series si se proporcionan
      if (exercises && Array.isArray(exercises) && exercises.length > 0) {
        for (const exerciseData of exercises) {
          const { exercise_id, order_index, notes, sets, start_time, end_time } = exerciseData;

          const { data: trainingExercise, error: exerciseError } = await supabase
            .from('training_exercises')
            .insert({
              training_id: id,
              exercise_id,
              order_index,
              notes: notes || null,
              start_time: start_time || null,
              end_time: end_time || null,
            })
            .select()
            .single();

          if (exerciseError) throw exerciseError;

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

      // Obtener el entrenamiento actualizado
      const { data: updatedTraining, error: fetchError } = await supabase
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
        .single();

      if (fetchError) throw fetchError;

      return NextResponse.json({ data: updatedTraining });
    }

    if (type === 'sport') {
      // Verificar que el entrenamiento pertenece al usuario
      const { data: existingTraining, error: checkError } = await supabase
        .from('sport_trainings')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (checkError || !existingTraining) {
        return NextResponse.json({ error: 'Training not found' }, { status: 404 });
      }

      const { data, error } = await supabase
        .from('sport_trainings')
        .update({
          ...trainingData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error updating training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/trainings/[id] - Eliminar un entrenamiento
export async function DELETE(
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

    // Intentar eliminar como gym training primero
    const { data: gymTraining, error: gymCheckError } = await supabase
      .from('gym_trainings')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!gymCheckError && gymTraining) {
      // Las series y ejercicios se eliminan automáticamente por CASCADE
      const { error: deleteError } = await supabase
        .from('gym_trainings')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return NextResponse.json({ success: true });
    }

    // Intentar eliminar como sport training
    const { data: sportTraining, error: sportCheckError } = await supabase
      .from('sport_trainings')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!sportCheckError && sportTraining) {
      const { error: deleteError } = await supabase
        .from('sport_trainings')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Training not found' }, { status: 404 });
  } catch (error) {
    console.error('Error deleting training:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

