import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export async function generateWorkoutSuggestion(
  userPreferences: {
    goals: string[];
    availableEquipment: string[];
    duration: number;
    muscleGroups?: string[];
  }
): Promise<string> {
  const client = getAnthropicClient();
  
  const prompt = `Eres un entrenador personal experto. Genera una rutina de entrenamiento basada en:
- Objetivos: ${userPreferences.goals.join(', ')}
- Equipamiento disponible: ${userPreferences.availableEquipment.join(', ')}
- Duración: ${userPreferences.duration} minutos
${userPreferences.muscleGroups ? `- Grupos musculares: ${userPreferences.muscleGroups.join(', ')}` : ''}

Proporciona una rutina estructurada con ejercicios, series y repeticiones recomendadas.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return response.content[0].type === 'text' 
    ? response.content[0].text 
    : 'No se pudo generar la sugerencia';
}

export async function analyzeTrainingProgress(
  trainingHistory: Array<{
    date: string;
    exercises: Array<{ name: string; sets: Array<{ weight?: number; reps?: number }> }>;
  }>
): Promise<string> {
  const client = getAnthropicClient();
  
  const prompt = `Analiza el progreso de entrenamiento del usuario basándote en su historial:
${JSON.stringify(trainingHistory, null, 2)}

Proporciona insights sobre:
- Progreso en fuerza/resistencia
- Áreas de mejora
- Recomendaciones para continuar progresando`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  return response.content[0].type === 'text' 
    ? response.content[0].text 
    : 'No se pudo analizar el progreso';
}

/**
 * Genera un resumen automático de las notas de las series de un ejercicio
 */
export async function generateExerciseNotesSummary(
  exerciseName: string,
  setNotes: Array<{ setNumber: number; notes: string | null; setType?: string }>
): Promise<string> {
  const client = getAnthropicClient();
  
  // Filtrar solo las series que tienen notas
  const notesWithContent = setNotes
    .filter(set => set.notes && set.notes.trim().length > 0)
    .map(set => ({
      serie: set.setNumber,
      tipo: set.setType || 'efectiva',
      notas: set.notes
    }));

  if (notesWithContent.length === 0) {
    return '';
  }

  const prompt = `Eres un asistente de entrenamiento. Genera un resumen conciso y útil de las notas de las series del ejercicio "${exerciseName}".

Notas por serie:
${notesWithContent.map(n => `- Serie ${n.serie} (${n.tipo}): ${n.notas}`).join('\n')}

Genera un resumen breve (máximo 3-4 líneas) que capture los puntos más importantes de todas las notas. El resumen debe ser útil para recordar aspectos clave del ejercicio.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      return response.content[0].text.trim();
    }
    return '';
  } catch (error: any) {
    console.error('Error generando resumen de notas del ejercicio:', error);
    // Re-lanzar el error para que el endpoint pueda manejarlo
    throw error;
  }
}

/**
 * Genera un resumen automático de las notas de los ejercicios de un entrenamiento
 */
export async function generateTrainingNotesSummary(
  exerciseNotes: Array<{ exerciseName: string; notes: string | null }>
): Promise<string> {
  const client = getAnthropicClient();
  
  // Filtrar solo los ejercicios que tienen notas
  const notesWithContent = exerciseNotes
    .filter(ex => ex.notes && ex.notes.trim().length > 0)
    .map(ex => ({
      ejercicio: ex.exerciseName,
      notas: ex.notes
    }));

  if (notesWithContent.length === 0) {
    return '';
  }

  const prompt = `Eres un asistente de entrenamiento. Genera un resumen conciso y útil de las notas de los ejercicios del entrenamiento.

Notas por ejercicio:
${notesWithContent.map(n => `- ${n.ejercicio}: ${n.notas}`).join('\n')}

Genera un resumen breve (máximo 4-5 líneas) que capture los puntos más importantes de todas las notas del entrenamiento. El resumen debe ser útil para recordar aspectos clave de la sesión completa.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      return response.content[0].text.trim();
    }
    return '';
  } catch (error: any) {
    console.error('Error generando resumen de notas del entrenamiento:', error);
    // Re-lanzar el error para que el endpoint pueda manejarlo
    throw error;
  }
}

