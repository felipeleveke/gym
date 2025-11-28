import { NextRequest, NextResponse } from 'next/server';
import { generateExerciseNotesSummary } from '@/lib/ai/anthropic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exerciseName, setNotes } = body;

    if (!exerciseName || !Array.isArray(setNotes)) {
      return NextResponse.json(
        { error: 'exerciseName y setNotes son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que ANTHROPIC_API_KEY esté configurada
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    const summary = await generateExerciseNotesSummary(exerciseName, setNotes);

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error: any) {
    console.error('Error en summarize-exercise-notes:', error);
    
    // Si el error es sobre el modelo, devolver un mensaje más claro
    if (error?.error?.message?.includes('model')) {
      return NextResponse.json(
        { error: 'Modelo de IA no disponible. Verifica la configuración de Anthropic API.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar resumen' },
      { status: 500 }
    );
  }
}

