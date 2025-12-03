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
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
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

      // Validar datos requeridos
      if (!trainingInfo.date) {
        return NextResponse.json({ error: 'La fecha es requerida' }, { status: 400 });
      }

      // Validar y convertir fechas
      let dateValue: string;
      try {
        dateValue = new Date(trainingInfo.date).toISOString();
      } catch {
        return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 });
      }

      // Validar y convertir tiempos si existen
      let startTimeValue: string | null = null;
      let endTimeValue: string | null = null;
      
      if (trainingInfo.start_time) {
        try {
          startTimeValue = new Date(trainingInfo.start_time).toISOString();
        } catch {
          return NextResponse.json({ error: 'Formato de hora de inicio inválido' }, { status: 400 });
        }
      }

      if (trainingInfo.end_time) {
        try {
          endTimeValue = new Date(trainingInfo.end_time).toISOString();
        } catch {
          return NextResponse.json({ error: 'Formato de hora de fin inválido' }, { status: 400 });
        }
      }

      // Calcular duración automáticamente si no se proporciona pero hay start_time y end_time
      let duration: number;
      if (trainingInfo.duration !== undefined && trainingInfo.duration !== null) {
        duration = Number(trainingInfo.duration);
        if (isNaN(duration) || duration <= 0) {
          return NextResponse.json({ error: 'La duración debe ser un número mayor a 0' }, { status: 400 });
        }
      } else if (startTimeValue && endTimeValue) {
        // Calcular duración automáticamente desde start_time y end_time
        const start = new Date(startTimeValue);
        const end = new Date(endTimeValue);
        
        // Validar que la hora de término sea posterior a la de inicio
        if (end <= start) {
          return NextResponse.json({ error: 'La hora de término debe ser posterior a la hora de inicio' }, { status: 400 });
        }
        
        const diffInMs = end.getTime() - start.getTime();
        const diffInMinutes = Math.round(diffInMs / (1000 * 60));
        
        // Validar que la diferencia sea al menos 1 minuto
        if (diffInMinutes <= 0) {
          return NextResponse.json({ error: 'La hora de término debe ser al menos 1 minuto posterior a la hora de inicio' }, { status: 400 });
        }
        
        duration = diffInMinutes;
      } else {
        return NextResponse.json({ error: 'Debes proporcionar la duración o las horas de inicio y término' }, { status: 400 });
      }

      // Actualizar el entrenamiento
      const updateData: any = {
        date: dateValue,
        duration: duration,
        start_time: startTimeValue,
        end_time: endTimeValue,
        notes: trainingInfo.notes || null,
        tags: trainingInfo.tags || null,
        updated_at: new Date().toISOString(),
      };
      
      // Solo actualizar routine_id si se proporciona
      if (trainingInfo.routine_id !== undefined) {
        updateData.routine_id = trainingInfo.routine_id;
      }

      const { error: updateError } = await supabase
        .from('gym_trainings')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating training:', updateError);
        return NextResponse.json(
          { error: updateError.message || 'Error al actualizar el entrenamiento' },
          { status: 400 }
        );
      }

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

          // Validar datos del ejercicio
          if (!exercise_id) {
            console.error('Exercise ID missing:', exerciseData);
            continue;
          }

          if (!order_index || isNaN(Number(order_index))) {
            console.error('Order index missing or invalid:', exerciseData);
            continue;
          }

          // Validar y convertir tiempos del ejercicio si existen
          let exerciseStartTime: string | null = null;
          let exerciseEndTime: string | null = null;

          if (start_time) {
            try {
              exerciseStartTime = new Date(start_time).toISOString();
            } catch (error) {
              console.error('Invalid exercise start_time:', start_time);
            }
          }

          if (end_time) {
            try {
              exerciseEndTime = new Date(end_time).toISOString();
            } catch (error) {
              console.error('Invalid exercise end_time:', end_time);
            }
          }

          const { data: trainingExercise, error: exerciseError } = await supabase
            .from('training_exercises')
            .insert({
              training_id: id,
              exercise_id,
              order_index: Number(order_index),
              notes: notes || null,
              start_time: exerciseStartTime,
              end_time: exerciseEndTime,
            })
            .select()
            .single();

          if (exerciseError) {
            console.error('Error inserting exercise:', exerciseError);
            continue;
          }

          if (!trainingExercise) {
            console.error('No training exercise returned');
            continue;
          }

          if (sets && Array.isArray(sets) && sets.length > 0) {
            const setsToInsert = sets.map((set: any) => ({
              training_exercise_id: trainingExercise.id,
              set_number: Number(set.set_number) || 1,
              weight: set.weight !== undefined && set.weight !== null ? Number(set.weight) : null,
              reps: set.reps !== undefined && set.reps !== null ? Number(set.reps) : null,
              duration: set.duration !== undefined && set.duration !== null ? Number(set.duration) : null,
              rest_time: set.rest_time !== undefined && set.rest_time !== null ? Number(set.rest_time) : null,
              rir: set.rir !== undefined && set.rir !== null ? Number(set.rir) : null,
              notes: set.notes || null,
              set_type: set.set_type || 'working',
            }));

            const { error: setsError } = await supabase
              .from('exercise_sets')
              .insert(setsToInsert);

            if (setsError) {
              console.error('Error inserting sets:', setsError);
            }
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

      if (fetchError) {
        console.error('Error fetching updated training:', fetchError);
        // Devolver respuesta exitosa aunque haya error al obtener relaciones
        return NextResponse.json({ data: { id, ...trainingInfo } });
      }

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

      // Validar datos requeridos
      if (!trainingData.date) {
        return NextResponse.json({ error: 'La fecha es requerida' }, { status: 400 });
      }
      if (!trainingData.duration || isNaN(Number(trainingData.duration))) {
        return NextResponse.json({ error: 'La duración es requerida y debe ser un número' }, { status: 400 });
      }

      // Preparar datos de actualización con manejo explícito de campos opcionales
      const updateData: any = {
        sport_type: trainingData.sport_type || 'other',
        date: new Date(trainingData.date).toISOString(),
        duration: Number(trainingData.duration),
        notes: trainingData.notes || null,
        tags: trainingData.tags || null,
        updated_at: new Date().toISOString(),
      };

      // Agregar campos opcionales solo si están presentes
      if (trainingData.distance !== undefined) updateData.distance = trainingData.distance !== null ? Number(trainingData.distance) : null;
      if (trainingData.avg_speed !== undefined) updateData.avg_speed = trainingData.avg_speed !== null ? Number(trainingData.avg_speed) : null;
      if (trainingData.max_speed !== undefined) updateData.max_speed = trainingData.max_speed !== null ? Number(trainingData.max_speed) : null;
      if (trainingData.avg_heart_rate !== undefined) updateData.avg_heart_rate = trainingData.avg_heart_rate !== null ? Number(trainingData.avg_heart_rate) : null;
      if (trainingData.max_heart_rate !== undefined) updateData.max_heart_rate = trainingData.max_heart_rate !== null ? Number(trainingData.max_heart_rate) : null;
      if (trainingData.elevation !== undefined) updateData.elevation = trainingData.elevation !== null ? Number(trainingData.elevation) : null;
      if (trainingData.temperature !== undefined) updateData.temperature = trainingData.temperature !== null ? Number(trainingData.temperature) : null;
      if (trainingData.terrain !== undefined) updateData.terrain = trainingData.terrain || null;
      if (trainingData.weather !== undefined) updateData.weather = trainingData.weather || null;

      const { data, error } = await supabase
        .from('sport_trainings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating sport training:', error);
        return NextResponse.json(
          { error: error.message || 'Error al actualizar el entrenamiento' },
          { status: 400 }
        );
      }
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error updating training:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
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
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}




