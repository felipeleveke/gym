import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function generateExerciseDescription(exerciseName: string): Promise<string> {
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en fitness y entrenamiento. Proporciona descripciones claras y técnicas de ejercicios.',
      },
      {
        role: 'user',
        content: `Proporciona una descripción detallada de cómo realizar el ejercicio: ${exerciseName}. Incluye técnica correcta, músculos trabajados y precauciones.`,
      },
    ],
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content || 'No se pudo generar la descripción';
}

export async function suggestExerciseVariations(exerciseName: string): Promise<string[]> {
  const client = getOpenAIClient();
  
  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Eres un experto en fitness. Proporciona variaciones de ejercicios en formato JSON array.',
      },
      {
        role: 'user',
        content: `Proporciona 5 variaciones del ejercicio ${exerciseName} en formato JSON array de strings.`,
      },
    ],
    max_tokens: 200,
    response_format: { type: 'json_object' },
  });

  try {
    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return parsed.variations || parsed.exercises || [];
    }
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
  }

  return [];
}

