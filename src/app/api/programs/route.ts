import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/programs - Get all training programs for the user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');

    let query = supabase
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: programs, error } = await query;

    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json({ error: 'Error fetching programs' }, { status: 500 });
    }

    return NextResponse.json({ data: programs || [] });
  } catch (error) {
    console.error('Error in GET /api/programs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/programs - Create a new training program
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, goal, start_date, end_date, blocks } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Program name is required' }, { status: 400 });
    }

    // Create the program
    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        goal: goal?.trim() || null,
        start_date: start_date || null,
        end_date: end_date || null,
        is_active: true,
      })
      .select()
      .single();

    if (programError || !program) {
      console.error('Error creating program:', programError);
      return NextResponse.json({ error: 'Error creating program' }, { status: 500 });
    }

    // If blocks are provided, create them
    if (blocks && Array.isArray(blocks) && blocks.length > 0) {
      for (const block of blocks) {
        const { data: newBlock, error: blockError } = await supabase
          .from('training_blocks')
          .insert({
            program_id: program.id,
            name: block.name,
            block_type: block.block_type,
            order_index: block.order_index,
            duration_weeks: block.duration_weeks,
            notes: block.notes || null,
          })
          .select()
          .single();

        if (blockError || !newBlock) {
          console.error('Error creating block:', blockError);
          continue;
        }

        // Create phases for this block
        if (block.phases && Array.isArray(block.phases)) {
          const phasesToInsert = block.phases.map((phase: any) => ({
            block_id: newBlock.id,
            week_number: phase.week_number,
            variant_id: phase.variant_id || null,
            intensity_modifier: phase.intensity_modifier || 1.00,
            volume_modifier: phase.volume_modifier || 1.00,
            notes: phase.notes || null,
          }));

          const { error: phasesError } = await supabase
            .from('block_phases')
            .insert(phasesToInsert);

          if (phasesError) {
            console.error('Error creating phases:', phasesError);
          }
        }
      }
    }

    // Fetch complete program
    const { data: completeProgram, error: fetchError } = await supabase
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
      .eq('id', program.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ data: program });
    }

    return NextResponse.json({ data: completeProgram });
  } catch (error) {
    console.error('Error in POST /api/programs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
