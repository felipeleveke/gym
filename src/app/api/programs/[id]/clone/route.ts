import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/programs/[id]/clone - Clone a program
export async function POST(
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

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'New program name is required' }, { status: 400 });
    }

    // Call the clone function
    const { data: newProgramId, error: cloneError } = await supabase
      .rpc('clone_training_program', {
        source_program_id: programId,
        new_program_name: name.trim(),
      });

    if (cloneError) {
      console.error('Error cloning program:', cloneError);
      return NextResponse.json({ error: 'Error cloning program' }, { status: 500 });
    }

    // Fetch the new program
    const { data: newProgram, error: fetchError } = await supabase
      .from('training_programs')
      .select(`
        *,
        training_blocks (
          *,
          block_phases (
            *,
            variant:routine_variants (
              id,
              variant_name,
              intensity_level,
              workout_routine:workout_routines (id, name)
            )
          )
        )
      `)
      .eq('id', newProgramId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Program cloned but error fetching details' }, { status: 500 });
    }

    return NextResponse.json({ data: newProgram });
  } catch (error) {
    console.error('Error in POST /api/programs/[id]/clone:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
