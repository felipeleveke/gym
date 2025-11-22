import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWorkoutSuggestion } from '@/lib/ai/anthropic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { goals, availableEquipment, duration, muscleGroups } = body;

    if (!goals || !availableEquipment || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const suggestion = await generateWorkoutSuggestion({
      goals,
      availableEquipment,
      duration,
      muscleGroups,
    });

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('Error generating workout suggestion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

