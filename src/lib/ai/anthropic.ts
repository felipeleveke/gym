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
    model: 'claude-3-5-sonnet-20241022',
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
    model: 'claude-3-5-sonnet-20241022',
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

