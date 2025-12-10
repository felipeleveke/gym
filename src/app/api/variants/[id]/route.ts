import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/variants/[id] - Get a specific variant with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: variantId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: variant, error } = await supabase
      .from('routine_variants')
      .select(`
        *,
        workout_routine:workout_routines (*),
        variant_exercises (
          *,
          exercise:exercises (*),
          variant_exercise_sets (*)
        )
      `)
      .eq('id', variantId)
      .single();

    if (error || !variant) {
      console.error('Error fetching variant:', error);
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    // Verify user owns the routine
    if (variant.workout_routine.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({ data: variant });
  } catch (error) {
    console.error('Error in GET /api/variants/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/variants/[id] - Update a variant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: variantId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existingVariant } = await supabase
      .from('routine_variants')
      .select(`
        *,
        workout_routine:workout_routines (user_id)
      `)
      .eq('id', variantId)
      .single();

    if (!existingVariant || existingVariant.workout_routine.user_id !== user.id) {
      return NextResponse.json({ error: 'Variant not found or unauthorized' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      variant_name, 
      intensity_level, 
      description, 
      is_default,
      exercises // Full replacement of exercises and sets
    } = body;

    // Update variant metadata
    const updateData: any = {};
    if (variant_name !== undefined) updateData.variant_name = variant_name.trim();
    if (intensity_level !== undefined) updateData.intensity_level = intensity_level;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (is_default !== undefined) updateData.is_default = is_default;

    // If setting as default, unset others first
    if (is_default) {
      await supabase
        .from('routine_variants')
        .update({ is_default: false })
        .eq('routine_id', existingVariant.routine_id)
        .neq('id', variantId);
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('routine_variants')
        .update(updateData)
        .eq('id', variantId);

      if (updateError) {
        console.error('Error updating variant:', updateError);
        return NextResponse.json({ error: 'Error updating variant' }, { status: 500 });
      }
    }

    // If exercises provided, replace all exercises and sets
    if (exercises !== undefined && Array.isArray(exercises)) {
      // Delete existing exercises (cascade deletes sets)
      await supabase
        .from('variant_exercises')
        .delete()
        .eq('variant_id', variantId);

      // Insert new exercises and sets
      for (const ex of exercises) {
        const { data: variantExercise, error: exError } = await supabase
          .from('variant_exercises')
          .insert({
            variant_id: variantId,
            exercise_id: ex.exercise_id,
            order_index: ex.order_index,
            notes: ex.notes || null,
          })
          .select()
          .single();

        if (exError || !variantExercise) {
          console.error('Error creating variant exercise:', exError);
          continue;
        }

        if (ex.sets && Array.isArray(ex.sets) && ex.sets.length > 0) {
          const setsToInsert = ex.sets.map((set: any, index: number) => ({
            variant_exercise_id: variantExercise.id,
            set_number: index + 1,
            target_reps: set.target_reps || null,
            target_rir: set.target_rir !== undefined ? set.target_rir : null,
            target_weight_percent: set.target_weight_percent || null,
            target_weight: set.target_weight || null,
            set_type: set.set_type || 'working',
            notes: set.notes || null,
          }));

          await supabase
            .from('variant_exercise_sets')
            .insert(setsToInsert);
        }
      }
    }

    // Fetch updated variant
    const { data: updatedVariant, error: fetchError } = await supabase
      .from('routine_variants')
      .select(`
        *,
        variant_exercises (
          *,
          exercise:exercises (*),
          variant_exercise_sets (*)
        )
      `)
      .eq('id', variantId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Error fetching updated variant' }, { status: 500 });
    }

    return NextResponse.json({ data: updatedVariant });
  } catch (error) {
    console.error('Error in PUT /api/variants/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/variants/[id] - Delete a variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: variantId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existingVariant } = await supabase
      .from('routine_variants')
      .select(`
        *,
        workout_routine:workout_routines (user_id)
      `)
      .eq('id', variantId)
      .single();

    if (!existingVariant || existingVariant.workout_routine.user_id !== user.id) {
      return NextResponse.json({ error: 'Variant not found or unauthorized' }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from('routine_variants')
      .delete()
      .eq('id', variantId);

    if (deleteError) {
      console.error('Error deleting variant:', deleteError);
      return NextResponse.json({ error: 'Error deleting variant' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/variants/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/variants/[id]/clone - Clone a variant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: variantId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { variant_name, intensity_level } = body;

    if (!variant_name || variant_name.trim().length === 0) {
      return NextResponse.json({ error: 'New variant name is required' }, { status: 400 });
    }

    // Call the clone function
    const { data: newVariantId, error: cloneError } = await supabase
      .rpc('clone_routine_variant', {
        source_variant_id: variantId,
        new_variant_name: variant_name.trim(),
        new_intensity_level: intensity_level || null,
      });

    if (cloneError) {
      console.error('Error cloning variant:', cloneError);
      return NextResponse.json({ error: 'Error cloning variant' }, { status: 500 });
    }

    // Fetch the new variant
    const { data: newVariant, error: fetchError } = await supabase
      .from('routine_variants')
      .select(`
        *,
        variant_exercises (
          *,
          exercise:exercises (*),
          variant_exercise_sets (*)
        )
      `)
      .eq('id', newVariantId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Variant cloned but error fetching details' }, { status: 500 });
    }

    return NextResponse.json({ data: newVariant });
  } catch (error) {
    console.error('Error in POST /api/variants/[id] (clone):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
