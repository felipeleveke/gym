import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/programs/[id]/trainings - Get all trainings linked to this program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: programId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns this program
    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .select('id')
      .eq('id', programId)
      .eq('user_id', user.id)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Get all phase_routine ids for this program
    const { data: phaseRoutines, error: prError } = await supabase
      .from('phase_routines')
      .select(`
        id,
        phase_id,
        block_phases!inner (
          id,
          block_id,
          training_blocks!inner (
            id,
            program_id
          )
        )
      `)
      .eq('block_phases.training_blocks.program_id', programId);

    if (prError) {
      console.error('Error fetching phase routines:', prError);
      return NextResponse.json({ error: 'Error fetching phase routines' }, { status: 500 });
    }

    const phaseRoutineIds = phaseRoutines?.map(pr => pr.id) || [];

    if (phaseRoutineIds.length === 0) {
      return NextResponse.json({ data: {} });
    }

    // Get all trainings linked to these phase_routines
    const { data: trainings, error: trainingsError } = await supabase
      .from('gym_trainings')
      .select(`
        id,
        date,
        duration,
        notes,
        phase_routine_id,
        training_exercises (
          id,
          exercise_id,
          order_index,
          notes,
          exercise:exercises (
            id,
            name,
            muscle_groups
          ),
          exercise_sets (
            id,
            set_number,
            reps,
            weight,
            rir,
            set_type,
            duration,
            rest_time,
            notes
          )
        )
      `)
      .in('phase_routine_id', phaseRoutineIds)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (trainingsError) {
      console.error('Error fetching trainings:', trainingsError);
      return NextResponse.json({ error: 'Error fetching trainings' }, { status: 500 });
    }

    // Group trainings by phase_routine_id for easier access
    const trainingsByPhaseRoutine: Record<string, typeof trainings> = {};
    trainings?.forEach(training => {
      if (training.phase_routine_id) {
        if (!trainingsByPhaseRoutine[training.phase_routine_id]) {
          trainingsByPhaseRoutine[training.phase_routine_id] = [];
        }
        trainingsByPhaseRoutine[training.phase_routine_id].push(training);
      }
    });

    return NextResponse.json({ data: trainingsByPhaseRoutine });
  } catch (error) {
    console.error('Error in GET /api/programs/[id]/trainings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
