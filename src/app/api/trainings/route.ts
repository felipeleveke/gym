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

    // Verificar y crear perfil si no existe (fallback)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Intentar crear el perfil si no existe
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || null,
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        // Si falla la creación del perfil, devolver error específico
        return NextResponse.json(
          { error: 'Error al verificar el perfil de usuario. Por favor, contacta al soporte.' },
          { status: 500 }
        );
      }
    }

    const body = await request.json();
    const { type, ...trainingData } = body;

    if (type === 'gym') {
      const { exercises, ...trainingInfo } = trainingData;
      
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

      // Crear el entrenamiento primero
      const { data: training, error: trainingError } = await supabase
        .from('gym_trainings')
        .insert({
          user_id: user.id,
          date: dateValue,
          duration: duration,
          start_time: startTimeValue,
          end_time: endTimeValue,
          routine_id: trainingInfo.routine_id || null,
          phase_routine_id: trainingInfo.phase_routine_id || null,
          notes: trainingInfo.notes || null,
          tags: trainingInfo.tags || null,
        })
        .select()
        .single();

      if (trainingError) {
        console.error('Error inserting training:', trainingError);
        return NextResponse.json(
          { error: trainingError.message || 'Error al crear el entrenamiento' },
          { status: 400 }
        );
      }

      if (!training) {
        return NextResponse.json({ error: 'No se pudo crear el entrenamiento' }, { status: 500 });
      }

      // Si hay ejercicios, crearlos junto con sus series
      if (exercises && Array.isArray(exercises) && exercises.length > 0) {
        for (const exerciseData of exercises) {
          const { exercise_id, order_index, notes, sets, start_time, end_time } = exerciseData;

          // Validar datos del ejercicio
          if (!exercise_id) {
            console.error('Exercise ID missing:', exerciseData);
            continue; // Saltar este ejercicio y continuar con el siguiente
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

          // Crear el ejercicio en el entrenamiento
          const { data: trainingExercise, error: exerciseError } = await supabase
            .from('training_exercises')
            .insert({
              training_id: training.id,
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
            // Continuar con el siguiente ejercicio en lugar de fallar completamente
            continue;
          }

          if (!trainingExercise) {
            console.error('No training exercise returned');
            continue;
          }

          // Crear las series del ejercicio
          if (sets && Array.isArray(sets) && sets.length > 0) {
            const setsToInsert = sets.map((set: any) => ({
              training_exercise_id: trainingExercise.id,
              set_number: Number(set.set_number) || 1,
              weight: set.weight !== undefined && set.weight !== null ? Number(set.weight) : null,
              reps: set.reps !== undefined && set.reps !== null ? Number(set.reps) : null,
              duration: set.duration !== undefined && set.duration !== null ? Number(set.duration) : null,
              rest_time: set.rest_time !== undefined && set.rest_time !== null ? Number(set.rest_time) : null,
              rir: set.rir !== undefined && set.rir !== null ? Number(set.rir) : null,
              rpe: set.rpe !== undefined && set.rpe !== null ? Number(set.rpe) : null,
              notes: set.notes || null,
              set_type: set.set_type || 'working',
              theoretical_one_rm: set.theoretical_one_rm !== undefined && set.theoretical_one_rm !== null ? Number(set.theoretical_one_rm) : null,
              percentage_one_rm: set.percentage_one_rm !== undefined && set.percentage_one_rm !== null ? Number(set.percentage_one_rm) : null,
            }));

            const { error: setsError } = await supabase
              .from('exercise_sets')
              .insert(setsToInsert);

            if (setsError) {
              console.error('Error inserting sets:', setsError);
              // Continuar aunque haya error en las series
            }
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

      if (fetchError) {
        console.error('Error fetching full training:', fetchError);
        // Devolver el entrenamiento básico si hay error al obtener relaciones
        return NextResponse.json({ data: training }, { status: 201 });
      }

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

      if (error) {
        console.error('Error creating sport training:', error);
        return NextResponse.json(
          { error: error.message || 'Error al crear el entrenamiento deportivo' },
          { status: 400 }
        );
      }
      return NextResponse.json({ data }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
  } catch (error) {
    console.error('Error creating training:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

