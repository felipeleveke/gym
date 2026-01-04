import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/routines/[id]/variants - Get all variants for a routine
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routineId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the routine
    const { data: routine } = await supabase
      .from('workout_routines')
      .select('id')
      .eq('id', routineId)
      .eq('user_id', user.id)
      .single();

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    // Get all variants with their exercises and sets
    const { data: variants, error } = await supabase
      .from('routine_variants')
      .select(`
        *,
        variant_exercises (
          *,
          exercise:exercises (*),
          variant_exercise_sets (*)
        )
      `)
      .eq('routine_id', routineId)
      .order('intensity_level', { ascending: false });

    if (error) {
      console.error('Error fetching variants:', error);
      return NextResponse.json({ error: 'Error fetching variants' }, { status: 500 });
    }

    // If no variants exist, create a default one
    if (!variants || variants.length === 0) {
      const { data: defaultVariant, error: createError } = await supabase
        .from('routine_variants')
        .insert({
          routine_id: routineId,
          variant_name: 'Default',
          intensity_level: 5,
          is_default: true,
        })
        .select(`
          *,
          variant_exercises (
            *,
            exercise:exercises (*),
            variant_exercise_sets (*)
          )
        `)
        .single();

      if (createError) {
        console.error('Error creating default variant:', createError);
        return NextResponse.json({ data: [] });
      }

      return NextResponse.json({ data: [defaultVariant] });
    }

    return NextResponse.json({ data: variants || [] });
  } catch (error) {
    console.error('Error in GET /api/routines/[id]/variants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/routines/[id]/variants - Create a new variant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: routineId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the routine
    const { data: routine } = await supabase
      .from('workout_routines')
      .select('id')
      .eq('id', routineId)
      .eq('user_id', user.id)
      .single();

    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    const body = await request.json();
    const { 
      variant_name, 
      intensity_level, 
      description, 
      is_default,
      exercises // Array of { exercise_id, order_index, notes, sets: [] }
    } = body;

    if (!variant_name || variant_name.trim().length === 0) {
      return NextResponse.json({ error: 'Variant name is required' }, { status: 400 });
    }

    // If this is set as default, unset other defaults first
    if (is_default) {
      await supabase
        .from('routine_variants')
        .update({ is_default: false })
        .eq('routine_id', routineId);
    }

    // Create the variant
    const { data: variant, error: variantError } = await supabase
      .from('routine_variants')
      .insert({
        routine_id: routineId,
        variant_name: variant_name.trim(),
        intensity_level: intensity_level || 5,
        description: description?.trim() || null,
        is_default: is_default || false,
      })
      .select()
      .single();

    if (variantError || !variant) {
      console.error('Error creating variant:', variantError);
      return NextResponse.json({ error: 'Error creating variant' }, { status: 500 });
    }

    // If exercises are provided, create them
    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
      for (const ex of exercises) {
        // Create variant exercise
        const { data: variantExercise, error: exError } = await supabase
          .from('variant_exercises')
          .insert({
            variant_id: variant.id,
            exercise_id: ex.exercise_id,
            order_index: ex.order_index,
            notes: ex.notes || null,
            rest_after_exercise: ex.rest_after_exercise || null,
          })
          .select()
          .single();

        if (exError || !variantExercise) {
          console.error('Error creating variant exercise:', exError);
          continue;
        }

        // Create sets for this exercise
        if (ex.sets && Array.isArray(ex.sets) && ex.sets.length > 0) {
          const setsToInsert = ex.sets.map((set: any, index: number) => ({
            variant_exercise_id: variantExercise.id,
            set_number: index + 1,
            target_reps: set.target_reps || null,
            target_rir: set.target_rir !== undefined ? set.target_rir : null,
            target_rpe: set.target_rpe !== undefined ? set.target_rpe : null,
            target_weight_percent: set.target_weight_percent || null,
            target_weight: set.target_weight || null,
            target_tut: set.target_tut || null,
            rest_seconds: set.rest_seconds || null,
            set_type: set.set_type || 'working',
            notes: set.notes || null,
          }));

          const { error: setsError } = await supabase
            .from('variant_exercise_sets')
            .insert(setsToInsert);

          if (setsError) {
            console.error('Error creating variant sets:', setsError);
          }
        }
      }
    }

    // Fetch the complete variant with exercises and sets
    const { data: completeVariant, error: fetchError } = await supabase
      .from('routine_variants')
      .select(`
        *,
        variant_exercises (
          *,
          exercise:exercises (*),
          variant_exercise_sets (*)
        )
      `)
      .eq('id', variant.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ data: variant });
    }

    return NextResponse.json({ data: completeVariant });
  } catch (error) {
    console.error('Error in POST /api/routines/[id]/variants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
