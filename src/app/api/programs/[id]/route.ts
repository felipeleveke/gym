import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/programs/[id] - Get a specific program with full details
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

    const { data: program, error } = await supabase
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
            ),
            phase_routines (
              id,
              scheduled_at,
              notes,
              routine_variant:routine_variants (
                id,
                variant_name,
                intensity_level,
                workout_routine:workout_routines (id, name)
              )
            )
          )
        )
      `)
      .eq('id', programId)
      .eq('user_id', user.id)
      .order('order_index', { referencedTable: 'training_blocks', ascending: true })
      .single();

    if (error || !program) {
      console.error('Error fetching program:', error);
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json({ data: program });
  } catch (error) {
    console.error('Error in GET /api/programs/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/programs/[id] - Update a program
export async function PUT(
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

    // Verify ownership
    const { data: existingProgram } = await supabase
      .from('training_programs')
      .select('id')
      .eq('id', programId)
      .eq('user_id', user.id)
      .single();

    if (!existingProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, goal, start_date, end_date, is_active, blocks } = body;

    // Update program metadata
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (goal !== undefined) updateData.goal = goal?.trim() || null;
    if (start_date !== undefined) updateData.start_date = start_date || null;
    if (end_date !== undefined) updateData.end_date = end_date || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('training_programs')
        .update(updateData)
        .eq('id', programId);

      if (updateError) {
        console.error('Error updating program:', updateError);
        return NextResponse.json({ error: 'Error updating program' }, { status: 500 });
      }
    }

    // If blocks provided, replace them
    if (blocks !== undefined && Array.isArray(blocks)) {
      // Delete existing blocks (cascade deletes phases)
      await supabase
        .from('training_blocks')
        .delete()
        .eq('program_id', programId);

      // Insert new blocks and phases
      for (const block of blocks) {
        const { data: newBlock, error: blockError } = await supabase
          .from('training_blocks')
          .insert({
            program_id: programId,
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

        if (block.phases && Array.isArray(block.phases)) {
          const phasesToInsert = block.phases.map((phase: any) => ({
            block_id: newBlock.id,
            week_number: phase.week_number,
            variant_id: phase.variant_id || null,
            intensity_modifier: phase.intensity_modifier || 1.00,
            volume_modifier: phase.volume_modifier || 1.00,
            notes: phase.notes || null,
          }));

          await supabase
            .from('block_phases')
            .insert(phasesToInsert);
        }
      }
    }

    // Fetch updated program
    const { data: updatedProgram } = await supabase
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
            ),
            phase_routines (
              id,
              scheduled_at,
              notes,
              routine_variant:routine_variants (
                id,
                variant_name,
                intensity_level,
                workout_routine:workout_routines (id, name)
              )
            )
          )
        )
      `)
      .eq('id', programId)
      .order('order_index', { referencedTable: 'training_blocks', ascending: true })
      .single();

    return NextResponse.json({ data: updatedProgram });
  } catch (error) {
    console.error('Error in PUT /api/programs/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/programs/[id] - Delete a program
export async function DELETE(
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

    const { error: deleteError } = await supabase
      .from('training_programs')
      .delete()
      .eq('id', programId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting program:', deleteError);
      return NextResponse.json({ error: 'Error deleting program' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/programs/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
