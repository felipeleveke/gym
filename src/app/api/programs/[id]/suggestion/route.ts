import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/programs/[id]/suggestion - Get suggested workout based on calendar and last training
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

    // Fetch the program with all its blocks and phases
    const { data: program, error: programError } = await supabase
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
              routine_id,
              workout_routine:workout_routines (id, name)
            )
          )
        )
      `)
      .eq('id', programId)
      .eq('user_id', user.id)
      .single();

    if (programError || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    if (!program.start_date) {
      return NextResponse.json({ 
        error: 'Program has no start date', 
        suggestion: null,
        message: 'Configure una fecha de inicio para el programa.'
      }, { status: 400 });
    }

    const today = new Date();
    const startDate = new Date(program.start_date);
    
    // Calculate what week we're in
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentWeekNumber = Math.floor(daysDiff / 7) + 1;

    if (daysDiff < 0) {
      return NextResponse.json({
        suggestion: null,
        message: `El programa comienza el ${startDate.toLocaleDateString()}`,
        daysUntilStart: Math.abs(daysDiff),
      });
    }

    // Calculate total weeks in program
    let totalWeeks = 0;
    let currentBlockIndex = 0;
    let weekInBlock = 0;
    let foundPhase = null;

    // Sort blocks by order_index
    const sortedBlocks = (program.training_blocks || []).sort(
      (a: any, b: any) => a.order_index - b.order_index
    );

    for (const block of sortedBlocks) {
      const blockWeeks = block.duration_weeks || 0;
      
      if (totalWeeks + blockWeeks >= currentWeekNumber) {
        // We're in this block
        weekInBlock = currentWeekNumber - totalWeeks;
        
        // Find the phase for this week
        const phases = (block.block_phases || []).sort(
          (a: any, b: any) => a.week_number - b.week_number
        );
        
        foundPhase = phases.find((p: any) => p.week_number === weekInBlock);
        
        if (!foundPhase && phases.length > 0) {
          // If no exact match, use the last defined phase (repeat pattern)
          const cyclePosition = (weekInBlock - 1) % phases.length;
          foundPhase = phases[cyclePosition];
        }
        
        break;
      }
      
      totalWeeks += blockWeeks;
      currentBlockIndex++;
    }

    // Calculate total program weeks
    const totalProgramWeeks = sortedBlocks.reduce(
      (sum: number, block: any) => sum + (block.duration_weeks || 0), 
      0
    );

    if (currentWeekNumber > totalProgramWeeks) {
      return NextResponse.json({
        suggestion: null,
        message: 'El programa ha finalizado.',
        programCompleted: true,
        completedOn: new Date(startDate.getTime() + totalProgramWeeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });
    }

    // Get last training to provide additional context
    const { data: lastTraining } = await supabase
      .from('gym_trainings')
      .select('id, date, routine_id')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const currentBlock = sortedBlocks[currentBlockIndex];

    // Build the suggestion
    const suggestion = {
      programId: program.id,
      programName: program.name,
      currentWeek: currentWeekNumber,
      totalWeeks: totalProgramWeeks,
      currentBlock: currentBlock ? {
        id: currentBlock.id,
        name: currentBlock.name,
        type: currentBlock.block_type,
        weekInBlock,
        totalBlockWeeks: currentBlock.duration_weeks,
      } : null,
      suggestedVariant: foundPhase?.variant ? {
        id: foundPhase.variant.id,
        name: foundPhase.variant.variant_name,
        intensityLevel: foundPhase.variant.intensity_level,
        routineId: foundPhase.variant.routine_id,
        routineName: foundPhase.variant.workout_routine?.name,
        intensityModifier: foundPhase.intensity_modifier,
        volumeModifier: foundPhase.volume_modifier,
      } : null,
      phaseNotes: foundPhase?.notes || null,
      lastTraining: lastTraining ? {
        id: lastTraining.id,
        date: lastTraining.date,
        daysSinceLastTraining: Math.floor(
          (today.getTime() - new Date(lastTraining.date).getTime()) / (1000 * 60 * 60 * 24)
        ),
      } : null,
    };

    return NextResponse.json({ data: suggestion });
  } catch (error) {
    console.error('Error in GET /api/programs/[id]/suggestion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
