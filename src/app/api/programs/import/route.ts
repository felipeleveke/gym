import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseTrainingProgram } from '@/lib/ai/openai';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text || text.length < 50) {
      return NextResponse.json({ error: 'Text is too short or empty' }, { status: 400 });
    }

    // 1. Parse text with AI
    const programData = await parseTrainingProgram(text);

    if (!programData) {
      return NextResponse.json({ error: 'Failed to parse program' }, { status: 500 });
    }

    // 2. Start Database Transaction (simulated via sequential inserts with error handling)
    // Create Program
    const { data: program, error: programError } = await supabase
      .from('training_programs')
      .insert({
        user_id: user.id,
        name: programData.n || 'Imported Program',
        description: programData.d,
        goal: programData.g,
        is_active: true,
      })
      .select()
      .single();

    if (programError || !program) {
      console.error('Error creating program:', programError);
      return NextResponse.json({ error: 'Error creating program' }, { status: 500 });
    }

    // Fetch exercises for fuzzy matching map
    const { data: existingExercises } = await supabase
      .from('exercises')
      .select('id, name');

    // Helper to find exercise
    const findExerciseId = (name: string): string | null => {
      if (!existingExercises) return null;
      // Exact match first (case insensitive)
      const exact = existingExercises.find(e => e.name.toLowerCase() === name.toLowerCase());
      if (exact) return exact.id;
      
      // Simple inclusion match
      const loose = existingExercises.find(e => e.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(e.name.toLowerCase()));
      if (loose) return loose.id;

      return null;
    };

    let orderIndexBlock = 0;
    // Extract templates (globally defined unique routines)
    const templates = programData.t || {};
    
    // Map minified structure back to logic
    for (const blockData of programData.b) {
      orderIndexBlock++;
      
      // Create Block
      const { data: block, error: blockError } = await supabase
        .from('training_blocks')
        .insert({
          program_id: program.id,
          name: blockData.n,
          block_type: mapBlockType(blockData.n),
          order_index: orderIndexBlock,
          duration_weeks: blockData.w || (blockData.s?.length * 2) || 4,
        })
        .select()
        .single();

      if (blockError) {
        console.error('Error creating block:', blockError);
        continue; 
      }


      // Process schedule: iterate over schedule entries
      for (const scheduleEntry of blockData.s || []) {
        // scheduleEntry: {w: [1, 2], r: ["t1", "t2"]}
        for (const weekNum of scheduleEntry.w) {
            // Create Phase (Week)
            const { data: phase, error: phaseError } = await supabase
              .from('block_phases')
              .insert({
                block_id: block.id,
                week_number: weekNum,
              })
              .select()
              .single();

            if (phaseError) {
               console.error('Error creating phase:', phaseError);
               continue;
            }

            // Process template IDs for this week
            for (const templateId of scheduleEntry.r) {
              const template = templates[templateId];
              if (!template) {
                console.warn(`Template ${templateId} not found`);
                continue;
              }
              
              // 1. Create a new Routine for this program
              const { data: routine, error: routineError } = await supabase
                .from('workout_routines')
                .insert({
                  user_id: user.id,
                  name: template.n,
                  program_id: program.id,
                  type: 'gym',
                  is_active: true,
                  is_template: false,
                })
                .select()
                .single();

               if (routineError) {
                 console.error('Error creating routine:', routineError);
                 continue;
               }

               // 2. Create Default Variant
               const { data: variant, error: variantError } = await supabase
                 .from('routine_variants')
                 .insert({
                   routine_id: routine.id,
                   variant_name: 'Default',
                   is_default: true,
                 })
                 .select()
                 .single();
               
               if (variantError) continue;

               // 3. Add Exercises
               let exerciseOrder = 0;
               for (const exerciseData of template.e || []) {
                 // exerciseData is array: [Name, Sets, RepsMin, RepsMax, Weight%, RPE]
                 exerciseOrder++;
                 const exName = exerciseData[0];
                 const exerciseId = findExerciseId(exName);
                 
                 if (!exerciseId) {
                    continue;
                 }

                 const { data: variantExercise, error: veError } = await supabase
                   .from('variant_exercises')
                   .insert({
                     variant_id: variant.id,
                     exercise_id: exerciseId,
                     order_index: exerciseOrder,
                     notes: exerciseData[6] || null,
                   })
                   .select()
                   .single();

                 if (veError) continue;

                 // 4. Add Sets
                 const sets = exerciseData[1] || 3;
                 const setsToInsert = [];
                 for (let i = 1; i <= sets; i++) {
                   setsToInsert.push({
                     variant_exercise_id: variantExercise.id,
                     set_number: i,
                     target_reps: exerciseData[2], // RepsMin
                     target_weight_percent: exerciseData[4], // Weight%
                     target_rir: exerciseData[5] ? (10 - exerciseData[5]) : null,
                   });
                 }

                 if (setsToInsert.length > 0) {
                   await supabase.from('variant_exercise_sets').insert(setsToInsert);
                 }
               }

               // 5. Schedule it
               const dayMap: Record<string, number> = {
                 'Mon': 0, 'Tue': 1, 'Wed': 2, 'Thu': 3, 'Fri': 4, 'Sat': 5, 'Sun': 6,
               };
               const dayStr = template.d;
               const dayOffset = dayMap[dayStr] ?? 0;
               
               const weekOffset = (weekNum - 1) * 7;
               const today = new Date();
               const daysUntilMonday = (1 + 7 - today.getDay()) % 7;
               const startOfProgram = new Date(today);
               startOfProgram.setDate(today.getDate() + daysUntilMonday);
               startOfProgram.setHours(0, 0, 0, 0);

               const scheduledDate = new Date(startOfProgram);
               scheduledDate.setDate(startOfProgram.getDate() + weekOffset + dayOffset);
               
               await supabase.from('phase_routines').insert({
                 phase_id: phase.id,
                 routine_variant_id: variant.id,
                 scheduled_at: scheduledDate.toISOString(),
               });
            }
        }
      }
    }

    return NextResponse.json({ success: true, programId: program.id });

  } catch (error) {
    console.error('Error in import:', error);
    return NextResponse.json({ error: 'Internal User Error' }, { status: 500 });
  }
}

function mapBlockType(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('hypertrophy') || n.includes('hipertrofia')) return 'hypertrophy';
    if (n.includes('strength') || n.includes('fuerza')) return 'strength';
    if (n.includes('adaptation') || n.includes('adaptacion')) return 'endurance';
    if (n.includes('peak') || n.includes('pico')) return 'peaking';
    return 'hypertrophy'; // Default
}
